import { requireAdminApi, unauthorizedBody } from "@/lib/auth";
import { removeUnreferencedImage } from "@/lib/imageStorage";
import { normalizePublicationPayload } from "@/lib/publicationsAdmin";
import { removeUnreferencedFile } from "@/lib/storage";
import { getSupabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Columns returned to the admin UI. */
const ADMIN_COLUMNS =
  "id, slug, title, type, description, is_paid, price_naira, file_path, image_path, status, created_at, updated_at";

/** Matches a canonical UUID, so a junk id fails fast instead of hitting Postgres. */
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Fetch the row being modified.
 *
 * @param {string} id - Publication uuid.
 * @returns {Promise<Record<string, any>|null>}
 */
async function findPublication(id) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("publications")
    .select(ADMIN_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[api/admin/publications/:id] Lookup failed:", error);
    return null;
  }

  return data ?? null;
}

/**
 * Remove a replacement file that an abandoned update left behind.
 *
 * Only acts when the payload carried a `file_path` that differs from the one the
 * row still points at. That guard is the whole point: deleting
 * `existing.file_path` here would destroy the file belonging to a row that was
 * never modified.
 *
 * The delete itself goes through `removeUnreferencedFile`, so even a body that
 * names some *other* publication's storage key cannot destroy it — the database
 * has the final say on whether a key is still in use.
 *
 * @param {unknown} payload - The submitted (or normalised) body.
 * @param {Record<string, any>} existing - The row as it stands in the database.
 * @returns {Promise<boolean>} True if a replacement was discarded.
 */
async function discardUnusedReplacement(payload, existing) {
  const candidate =
    payload && typeof payload === "object" ? payload.file_path : undefined;

  if (typeof candidate !== "string" || !candidate) return false;
  if (candidate === existing.file_path) return false;

  return removeUnreferencedFile(candidate);
}

/**
 * Same as `discardUnusedReplacement`, but for the cover image. Kept as a
 * separate function (rather than a shared helper) because the two go through
 * different storage backends — private Supabase bucket vs. local `public/`
 * folder — with different removal functions.
 *
 * @param {unknown} payload
 * @param {Record<string, any>} existing
 * @returns {Promise<boolean>} True if a replacement image was discarded.
 */
async function discardUnusedImageReplacement(payload, existing) {
  const candidate =
    payload && typeof payload === "object" ? payload.image_path : undefined;

  if (typeof candidate !== "string" || !candidate) return false;
  if (candidate === existing.image_path) return false;

  return removeUnreferencedImage(candidate);
}

/**
 * PUT /api/admin/publications/[id] — update a publication.
 *
 * The slug is never changed here: public URLs stay stable for the life of the
 * publication. If `file_path`/`image_path` is omitted from the body the existing
 * one is kept; if a new path is supplied, the row is updated first and only then
 * is the old file/image removed, so a failed update can't destroy what the row
 * still points at.
 *
 * @param {Request} request
 * @param {{params: {id: string}}} context
 * @returns {Promise<NextResponse>}
 */
export async function PUT(request, { params }) {
  const user = await requireAdminApi();
  if (!user) {
    return NextResponse.json(unauthorizedBody(), { status: 401 });
  }

  const { id } = params;
  if (!UUID_PATTERN.test(id ?? "")) {
    return NextResponse.json(
      { ok: false, error: "Not found." },
      { status: 404 },
    );
  }

  /** @type {unknown} */
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request body." },
      { status: 400 },
    );
  }

  const existing = await findPublication(id);
  if (!existing) {
    return NextResponse.json(
      { ok: false, error: "Not found." },
      { status: 404 },
    );
  }

  const normalized = normalizePublicationPayload(body, {
    mode: "update",
    existing,
  });
  if (!normalized.ok) {
    // A rejected payload may still have brought a freshly uploaded replacement
    // file and/or image with it. Those now belong to no row, so discard them —
    // but never touch `existing.file_path`/`existing.image_path`, which the
    // unchanged row still points at.
    const discarded = await discardUnusedReplacement(body, existing);
    const imageDiscarded = await discardUnusedImageReplacement(body, existing);

    return NextResponse.json(
      {
        ok: false,
        fieldErrors: normalized.fieldErrors,
        fileDiscarded: discarded,
        imageDiscarded,
      },
      { status: 400 },
    );
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("publications")
    .update({ ...normalized.data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select(ADMIN_COLUMNS)
    .single();

  if (error) {
    console.error("[api/admin/publications/:id] Update failed:", error);

    // Same reasoning as the validation branch above: the update did not happen,
    // so a new upload attached to it is now orphaned.
    const discarded = await discardUnusedReplacement(normalized.data, existing);
    const imageDiscarded = await discardUnusedImageReplacement(
      normalized.data,
      existing,
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          discarded || imageDiscarded
            ? "Could not save your changes. The newly uploaded file/image was discarded — please attach it again."
            : "Could not save your changes.",
        fileDiscarded: discarded,
        imageDiscarded,
      },
      { status: 500 },
    );
  }

  // The row now points at the new file/image, so the superseded ones are safe
  // to remove. `data` is the row as the database returned it, which is the
  // authoritative answer to "what does this publication point at now".
  const replacedFile = existing.file_path;
  if (replacedFile && replacedFile !== data.file_path) {
    await removeUnreferencedFile(replacedFile);
  }

  const replacedImage = existing.image_path;
  if (replacedImage && replacedImage !== data.image_path) {
    await removeUnreferencedImage(replacedImage);
  }

  return NextResponse.json({ ok: true, publication: data });
}

/**
 * DELETE /api/admin/publications/[id] — delete a publication, its file, and its
 * cover image.
 *
 * The row goes first, then the file/image. Deleting them first would risk a
 * published row pointing at nothing if the row delete then failed.
 *
 * @param {Request} _request
 * @param {{params: {id: string}}} context
 * @returns {Promise<NextResponse>}
 */
export async function DELETE(_request, { params }) {
  const user = await requireAdminApi();
  if (!user) {
    return NextResponse.json(unauthorizedBody(), { status: 401 });
  }

  const { id } = params;
  if (!UUID_PATTERN.test(id ?? "")) {
    return NextResponse.json(
      { ok: false, error: "Not found." },
      { status: 404 },
    );
  }

  const existing = await findPublication(id);
  if (!existing) {
    return NextResponse.json(
      { ok: false, error: "Not found." },
      { status: 404 },
    );
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("publications").delete().eq("id", id);

  if (error) {
    console.error("[api/admin/publications/:id] Delete failed:", error);
    return NextResponse.json(
      { ok: false, error: "Could not delete the publication." },
      { status: 500 },
    );
  }

  // Best-effort: a leftover file is untidy, not unsafe, and must not turn a
  // successful delete into an error for the admin. The reference check is what
  // makes this safe if two rows ever shared a file/image.
  await removeUnreferencedFile(existing.file_path);
  await removeUnreferencedImage(existing.image_path);

  return NextResponse.json({ ok: true });
}
