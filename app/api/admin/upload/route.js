import { NextResponse } from 'next/server';
import { requireAdminApi, unauthorizedBody } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase';
import {
  buildStorageKey,
  PUBLICATIONS_BUCKET,
  removeUnreferencedFile,
} from '@/lib/storage';
import {
  ALLOWED_UPLOAD_TYPES,
  MAX_UPLOAD_BYTES,
  UNKNOWN_UPLOAD_TYPES,
  extensionFromFilename,
  formatBytes,
} from '@/lib/publications';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Storage keys are minted by this route as `YYYY/<uuid>.<ext>` — nothing else is deletable. */
const STORAGE_KEY_PATTERN = /^\d{4}\/[a-f0-9-]{36}\.[a-z0-9]{2,5}$/i;

/**
 * POST /api/admin/upload — mint a signed upload URL for a publication file.
 *
 * The browser uploads straight to the private Supabase `publications` bucket.
 * That means a large PDF never has to pass through the Next.js request body,
 * which is both more memory-efficient and safer on serverless hosts with body
 * limits. The admin UI gets true browser upload progress from the direct upload.
 */
export async function POST(request) {
  const user = await requireAdminApi();
  if (!user) {
    return NextResponse.json(unauthorizedBody(), { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Could not read the file details.' },
      { status: 400 },
    );
  }

  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const reportedType =
    typeof body?.type === 'string' ? body.type.toLowerCase().trim() : '';
  const size = Number(body?.size);

  if (!Number.isFinite(size) || size <= 0) {
    return NextResponse.json(
      { ok: false, error: 'No file was received.' },
      { status: 400 },
    );
  }

  if (size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      {
        ok: false,
        error: `That file is ${formatBytes(size)}. The app limit is ${formatBytes(MAX_UPLOAD_BYTES)}.`,
      },
      { status: 413 },
    );
  }

  const filenameExt = extensionFromFilename(name);
  const mimeExt = Object.prototype.hasOwnProperty.call(
    ALLOWED_UPLOAD_TYPES,
    reportedType,
  )
    ? ALLOWED_UPLOAD_TYPES[reportedType]
    : null;

  let ext = mimeExt;
  if (!ext && UNKNOWN_UPLOAD_TYPES.includes(reportedType)) {
    ext = filenameExt;
  }

  if (!ext) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Unsupported file type. Upload a PDF, EPUB, DOC or DOCX file.',
      },
      { status: 400 },
    );
  }

  if (filenameExt && filenameExt !== ext) {
    return NextResponse.json(
      {
        ok: false,
        error: 'The file extension does not match the file type.',
      },
      { status: 400 },
    );
  }

  const path = buildStorageKey(ext);

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.storage
      .from(PUBLICATIONS_BUCKET)
      .createSignedUploadUrl(path);

    if (error || !data?.signedUrl) {
      console.error('[admin/upload] Could not create signed upload URL:', error);
      return NextResponse.json(
        {
          ok: false,
          error:
            error?.message?.includes('Bucket not found')
              ? 'The private publications bucket is missing. Run the Supabase storage setup first.'
              : 'Could not prepare the upload. Please try again.',
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      path,
      signedUrl: data.signedUrl,
      size,
      sizeLabel: formatBytes(size),
      ext,
    });
  } catch (error) {
    console.error('[admin/upload] Failed:', error);
    return NextResponse.json(
      { ok: false, error: 'Could not prepare the upload. Please try again.' },
      { status: 502 },
    );
  }
}

/**
 * DELETE /api/admin/upload?path=... — discard an uploaded file.
 */
export async function DELETE(request) {
  const user = await requireAdminApi();
  if (!user) {
    return NextResponse.json(unauthorizedBody(), { status: 401 });
  }

  const path = new URL(request.url).searchParams.get('path');

  if (!path || !STORAGE_KEY_PATTERN.test(path)) {
    return NextResponse.json(
      { ok: false, error: 'Invalid file reference.' },
      { status: 400 },
    );
  }

  const removed = await removeUnreferencedFile(path);
  return NextResponse.json({ ok: true, removed });
}
