import { requireAdminApi, unauthorizedBody } from "@/lib/auth";
import { removeUnreferencedImage } from "@/lib/imageStorage";
import { normalizePublicationPayload } from "@/lib/publicationsAdmin";
import { removeUnreferencedFile } from "@/lib/storage";
import { getSupabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";

// Node runtime: this route uses the service-role Supabase client and Node crypto
// via lib/storage. force-dynamic because the response depends on the session
// cookie and must never be cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Columns returned to the admin UI. */
const ADMIN_COLUMNS =
  "id, slug, title, type, description, is_paid, price_naira, file_path, image_path, status, download_count, archived_at, created_at, updated_at";

/**
 * GET /api/admin/publications — list every publication, drafts included.
 *
 * Uses the service-role client, which bypasses the published-only RLS policy.
 * That's exactly why the session is verified first.
 *
 * @returns {Promise<NextResponse>}
 */
export async function GET() {
  const user = await requireAdminApi();
  if (!user) {
    return NextResponse.json(unauthorizedBody(), { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("publications")
    .select(ADMIN_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[api/admin/publications] List failed:", error);
    return NextResponse.json(
      { ok: false, error: "Could not load publications." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, publications: data ?? [] });
}

/**
 * POST /api/admin/publications — create a publication.
 *
 * Expects the JSON shape produced by `PublicationForm`. The file itself is
 * uploaded separately via /api/admin/upload, which returns the `file_path`
 * string included here.
 *
 * @param {Request} request
 * @returns {Promise<NextResponse>}
 */
export async function POST(request) {
  const user = await requireAdminApi();
  if (!user) {
    return NextResponse.json(unauthorizedBody(), { status: 401 });
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

  const normalized = normalizePublicationPayload(body, { mode: "create" });
  if (!normalized.ok) {
    return NextResponse.json(
      { ok: false, fieldErrors: normalized.fieldErrors },
      { status: 400 },
    );
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("publications")
    .insert(normalized.data)
    .select(ADMIN_COLUMNS)
    .single();

  if (error) {
    // 23505 = unique_violation, which here can only be the slug.
    if (error.code === "23505") {
      return NextResponse.json(
        {
          ok: false,
          fieldErrors: {
            slug: "That URL slug is already in use. Choose a different one.",
          },
        },
        { status: 409 },
      );
    }

    console.error("[api/admin/publications] Create failed:", error);

    // The row was rejected, so the already-uploaded file/image would be orphaned.
    // Clean both up rather than leaving them behind — and tell the form, because
    // it is still holding those now-dead references. Without the flags the admin
    // retries, the second insert succeeds, and the row points at files that no
    // longer exist.
    //
    // `removeUnreferencedFile`/`removeUnreferencedImage` rather than a plain
    // delete: if either submitted path happened to belong to an existing
    // publication, that row's file/image must survive.
    const discarded = await removeUnreferencedFile(normalized.data.file_path);
    const imageDiscarded = await removeUnreferencedImage(
      normalized.data.image_path,
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          discarded || imageDiscarded
            ? "Could not save the publication. The uploaded file/image was discarded — please attach it again."
            : "Could not save the publication.",
        fileDiscarded: discarded,
        imageDiscarded,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, publication: data }, { status: 201 });
}
