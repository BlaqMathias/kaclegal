import { createSignedDownloadUrl } from "@/lib/storage";
import { getSupabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * How long a free-item link stays valid. Long enough to start a download,
 * with headroom for minor clock skew between this server and Supabase
 * Storage (which is what an "exp claim timestamp check failed" error
 * usually means — see lib/storage.js).
 */
const SIGNED_URL_TTL_SECONDS = 600;

/**
 * GET /api/publications/[slug]/read — open a FREE publication.
 *
 * Free items need no payment ledger, so this simply mints a short-lived signed
 * URL for the private object and redirects to it. The bucket itself stays
 * private: there is no permanent public URL for any publication file.
 *
 * Three conditions are re-checked server-side on every request, because the
 * request only carries a slug and nothing else can be trusted:
 *
 * - the publication exists,
 * - its status is `published`,
 * - and `is_paid` is false.
 *
 * A paid item returns 404, not 403 — a distinct error would confirm that a paid
 * publication exists at that slug and is merely gated. Paid delivery arrives in
 * Phase 7 with its own verified, single-use token flow.
 *
 * @param {Request} _request
 * @param {{params: {slug: string}}} context
 * @returns {Promise<NextResponse>}
 */
export async function GET(_request, { params }) {
  const slug = String(params?.slug ?? "").trim();

  if (!slug) {
    return NextResponse.json(
      { ok: false, error: "Not found." },
      { status: 404 },
    );
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("publications")
    .select("slug, title, is_paid, status, file_path")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("[api/publications/read] Lookup failed:", error);
    return NextResponse.json(
      { ok: false, error: "Could not open that publication." },
      { status: 500 },
    );
  }

  if (!data || data.status !== "published" || data.is_paid || !data.file_path) {
    return NextResponse.json(
      { ok: false, error: "Not found." },
      { status: 404 },
    );
  }

  const extension = data.file_path.split(".").pop() || "pdf";
  const signedUrl = await createSignedDownloadUrl(data.file_path, {
    expiresIn: SIGNED_URL_TTL_SECONDS,
    downloadAs: `${data.slug}.${extension}`,
  });

  if (!signedUrl) {
    return NextResponse.json(
      { ok: false, error: "Could not open that publication." },
      { status: 502 },
    );
  }

  // Best-effort, fire-and-forget: a missed count is untidy, not unsafe, and
  // must never turn a working download into an error for the reader. Runs as
  // a single atomic UPDATE in Postgres (see supabase/publications.sql) rather
  // than a read-then-write here, so concurrent downloads can't clobber each
  // other's count.
  supabase
    .rpc("increment_publication_downloads", { p_slug: slug })
    .then(({ error: incrementError }) => {
      if (incrementError) {
        console.error(
          "[api/publications/read] Could not record download:",
          incrementError,
        );
      }
    });

  return NextResponse.redirect(signedUrl, {
    // The signed URL expires, so nothing about this response may be cached.
    headers: { "Cache-Control": "no-store" },
  });
}
