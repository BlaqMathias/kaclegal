import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { createSignedDownloadUrl } from '@/lib/storage';
import { consumeDownloadToken } from '@/lib/tokens';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** How long a purchased-item signed link stays valid. Long enough to start a download. */
const SIGNED_URL_TTL_SECONDS = 300;

/**
 * GET /api/download/[token] — deliver a purchased file.
 *
 * This is the ONLY route that actually spends a download: `/download/[token]`
 * (the page) only ever peeks at a token's status to decide what to show,
 * because merely viewing that page should not use up one of the buyer's
 * downloads. Clicking through to here is what counts.
 *
 * Re-validates independently every time it is hit, exactly like the free-item
 * read route in Phase 6 — a bookmarked or reused link must fail here even if
 * the page that originally linked to it is long gone from the buyer's browser.
 *
 * @param {Request} _request
 * @param {{params: {token: string}}} context
 */
export async function GET(_request, { params }) {
  const token = String(params?.token ?? '').trim();

  if (!token) {
    return NextResponse.json({ ok: false, error: 'Not found.' }, { status: 404 });
  }

  const result = await consumeDownloadToken(token);

  if (!result.ok) {
    // Send the buyer back to the page itself, which will independently peek
    // the same token and show the right "expired" / "already used" state —
    // rather than returning a bare JSON error for what should be a page view.
    return NextResponse.redirect(new URL(`/download/${token}`, _request.url), {
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  const supabase = getSupabaseAdmin();
  const { data: publication, error } = await supabase
    .from('publications')
    .select('slug, file_path')
    .eq('id', result.publicationId)
    .maybeSingle();

  if (error || !publication?.file_path) {
    console.error('[api/download] Publication or file_path missing:', result.publicationId, error);
    return NextResponse.json(
      { ok: false, error: 'Could not open this download.' },
      { status: 500 },
    );
  }

  const extension = publication.file_path.split('.').pop() || 'pdf';
  const signedUrl = await createSignedDownloadUrl(publication.file_path, {
    expiresIn: SIGNED_URL_TTL_SECONDS,
    downloadAs: `${publication.slug}.${extension}`,
  });

  if (!signedUrl) {
    return NextResponse.json(
      { ok: false, error: 'Could not open this download.' },
      { status: 502 },
    );
  }

  return NextResponse.redirect(signedUrl, {
    // The signed URL expires and the download count has already been spent —
    // nothing about this response may be cached or replayed.
    headers: { 'Cache-Control': 'no-store' },
  });
}
