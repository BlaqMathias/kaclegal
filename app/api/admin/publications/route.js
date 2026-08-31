import { NextResponse } from 'next/server';
import { requireAdminApi, unauthorizedBody } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase';
import { normalizePublicationPayload } from '@/lib/publicationsAdmin';
import { removeUnreferencedFile } from '@/lib/storage';

// Node runtime: this route uses the service-role Supabase client and Node crypto
// via lib/storage. force-dynamic because the response depends on the session
// cookie and must never be cached.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Columns returned to the admin UI. */
const ADMIN_COLUMNS =
  'id, slug, title, type, description, is_paid, price_naira, file_path, status, created_at, updated_at';

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
    .from('publications')
    .select(ADMIN_COLUMNS)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[api/admin/publications] List failed:', error);
    return NextResponse.json(
      { ok: false, error: 'Could not load publications.' },
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
      { ok: false, error: 'Invalid request body.' },
      { status: 400 },
    );
  }

  const normalized = normalizePublicationPayload(body, { mode: 'create' });
  if (!normalized.ok) {
    return NextResponse.json(
      { ok: false, fieldErrors: normalized.fieldErrors },
      { status: 400 },
    );
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('publications')
    .insert(normalized.data)
    .select(ADMIN_COLUMNS)
    .single();

  if (error) {
    // 23505 = unique_violation, which here can only be the slug.
    if (error.code === '23505') {
      return NextResponse.json(
        {
          ok: false,
          fieldErrors: {
            slug: 'That URL slug is already in use. Choose a different one.',
          },
        },
        { status: 409 },
      );
    }

    console.error('[api/admin/publications] Create failed:', error);

    // The row was rejected, so the already-uploaded file would be orphaned in
    // the bucket. Clean it up rather than leaving it behind — and tell the form,
    // because it is still holding that now-dead storage key. Without the flag the
    // admin retries, the second insert succeeds, and the row points at a file
    // that no longer exists.
    //
    // `removeUnreferencedFile` rather than a plain delete: if the submitted path
    // happened to belong to an existing publication, that row's file must survive.
    const discarded = await removeUnreferencedFile(normalized.data.file_path);

    return NextResponse.json(
      {
        ok: false,
        error: discarded
          ? 'Could not save the publication. The uploaded file was discarded — please attach it again.'
          : 'Could not save the publication.',
        fileDiscarded: discarded,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, publication: data }, { status: 201 });
}
