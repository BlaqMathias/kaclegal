import { NextResponse } from 'next/server';
import { requireAdminApi, unauthorizedBody } from '@/lib/auth';
import {
  buildStorageKey,
  PUBLICATIONS_BUCKET,
  removeUnreferencedFile,
  verifyStoredPublicationFile,
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

/** New keys are `<auth-user-uuid>/YYYY/<uuid>.<ext>`; legacy `YYYY/<uuid>.<ext>` keys remain deletable. */
const STORAGE_KEY_PATTERN = /^(?:[a-f0-9-]{36}\/)?\d{4}\/[a-f0-9-]{36}\.[a-z0-9]{2,5}$/i;

function resolveAllowedFile({ name, type, size }) {
  const reportedType = typeof type === 'string' ? type.toLowerCase().trim() : '';
  const numericSize = Number(size);

  if (!Number.isFinite(numericSize) || numericSize <= 0) {
    return { ok: false, status: 400, error: 'No file was received.' };
  }

  if (numericSize > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      status: 413,
      error: `That file is ${formatBytes(numericSize)}. The current limit is ${formatBytes(MAX_UPLOAD_BYTES)}.`,
    };
  }

  const filenameExt = extensionFromFilename(name);
  const mimeExt = Object.prototype.hasOwnProperty.call(ALLOWED_UPLOAD_TYPES, reportedType)
    ? ALLOWED_UPLOAD_TYPES[reportedType]
    : null;

  let ext = mimeExt;
  if (!ext && UNKNOWN_UPLOAD_TYPES.includes(reportedType)) ext = filenameExt;

  if (!ext) {
    return {
      ok: false,
      status: 400,
      error: 'Unsupported file type. Upload a PDF, EPUB, DOC or DOCX file.',
    };
  }

  if (filenameExt && filenameExt !== ext) {
    return {
      ok: false,
      status: 400,
      error: 'The file extension does not match the file type.',
    };
  }

  const contentType =
    Object.keys(ALLOWED_UPLOAD_TYPES).find((candidate) => ALLOWED_UPLOAD_TYPES[candidate] === ext) ||
    'application/octet-stream';

  return { ok: true, ext, contentType, size: numericSize };
}

function getTusEndpoint() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!rawUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured.');
  }

  const url = new URL(rawUrl);
  const suffix = '.supabase.co';

  // Supabase recommends the direct Storage hostname for large/resumable uploads.
  if (url.hostname.endsWith(suffix)) {
    const projectRef = url.hostname.slice(0, -suffix.length);
    return `https://${projectRef}.storage.supabase.co/storage/v1/upload/resumable`;
  }

  // Custom/self-hosted URL fallback.
  return `${url.origin}/storage/v1/upload/resumable`;
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

/**
 * POST /api/admin/upload
 *
 * action=prepare -> validates metadata and returns a user-scoped object path for
 *                   a TUS resumable upload. The browser authenticates directly
 *                   to Storage with the current Supabase session token, so file
 *                   bytes go browser -> Supabase and never through Vercel.
 * action=verify  -> checks the object that actually landed in Storage: path,
 *                   byte size and leading file signature.
 */
export async function POST(request) {
  const user = await requireAdminApi();
  if (!user) return NextResponse.json(unauthorizedBody(), { status: 401 });

  const body = await readJson(request);
  if (!body) {
    return NextResponse.json(
      { ok: false, error: 'Could not read the upload details.' },
      { status: 400 },
    );
  }

  const action = typeof body.action === 'string' ? body.action : 'prepare';

  if (action === 'prepare') {
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const validation = resolveAllowedFile({
      name,
      type: body.type,
      size: body.size,
    });

    if (!validation.ok) {
      return NextResponse.json(
        { ok: false, error: validation.error },
        { status: validation.status },
      );
    }

    // Prefix new browser-uploaded objects with the verified Supabase user id.
    // Storage RLS uses this first folder to ensure a signed-in user can only
    // upload into their own namespace. Existing legacy paths remain supported.
    const path = buildStorageKey(validation.ext, user.id);

    try {
      return NextResponse.json({
        ok: true,
        provider: 'supabase-tus-session',
        endpoint: getTusEndpoint(),
        bucketName: PUBLICATIONS_BUCKET,
        path,
        contentType: validation.contentType,
        size: validation.size,
        sizeLabel: formatBytes(validation.size),
        ext: validation.ext,
      });
    } catch (error) {
      console.error('[admin/upload] Prepare failed:', error);
      return NextResponse.json(
        {
          ok: false,
          error:
            error instanceof Error && error.message
              ? `Could not prepare the upload: ${error.message}`
              : 'Could not prepare the upload. Please try again.',
        },
        { status: 502 },
      );
    }
  }

  if (action === 'verify') {
    const path = typeof body.path === 'string' ? body.path.trim() : '';
    const expectedSize = Number(body.size);
    const ext = typeof body.ext === 'string' ? body.ext.toLowerCase().trim() : '';

    if (!STORAGE_KEY_PATTERN.test(path)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid uploaded-file reference.' },
        { status: 400 },
      );
    }

    if (!Number.isFinite(expectedSize) || expectedSize <= 0 || expectedSize > MAX_UPLOAD_BYTES) {
      await removeUnreferencedFile(path);
      return NextResponse.json(
        { ok: false, error: `The publication must be ${formatBytes(MAX_UPLOAD_BYTES)} or smaller.` },
        { status: 413 },
      );
    }

    const verified = await verifyStoredPublicationFile({
      path,
      expectedSize,
      expectedExt: ext,
    });

    if (!verified.ok) {
      await removeUnreferencedFile(path);
      return NextResponse.json(
        { ok: false, error: verified.error },
        { status: verified.status || 400 },
      );
    }

    return NextResponse.json({
      ok: true,
      path,
      size: verified.size,
      sizeLabel: formatBytes(verified.size),
    });
  }

  return NextResponse.json(
    { ok: false, error: 'Unsupported upload action.' },
    { status: 400 },
  );
}

/** DELETE /api/admin/upload?path=... — discard an unreferenced uploaded file. */
export async function DELETE(request) {
  const user = await requireAdminApi();
  if (!user) return NextResponse.json(unauthorizedBody(), { status: 401 });

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
