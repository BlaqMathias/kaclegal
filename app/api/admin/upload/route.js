import { NextResponse } from 'next/server';
import { requireAdminApi, unauthorizedBody } from '@/lib/auth';
import {
  removeUnreferencedFile,
  uploadPublicationFile,
  validateUpload,
} from '@/lib/storage';
import { formatBytes, MAX_UPLOAD_BYTES } from '@/lib/publications';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Storage keys are minted by this route as `YYYY/<uuid>.<ext>` — nothing else is deletable. */
const STORAGE_KEY_PATTERN = /^\d{4}\/[a-f0-9-]{36}\.[a-z0-9]{2,5}$/i;

/**
 * Slack above MAX_UPLOAD_BYTES for multipart framing (boundaries, headers) so a
 * file that is legitimately just under the limit isn't rejected by the envelope.
 */
const MULTIPART_OVERHEAD_BYTES = 64 * 1024;

/**
 * POST /api/admin/upload — accept a publication file into the private bucket.
 *
 * Everything the browser claims about the file is re-checked here: size against
 * the 25 MB ceiling, MIME type against an allowlist, and the leading bytes
 * against the signature that type implies. The stored extension comes from the
 * allowlist and the filename is discarded entirely, so nothing user-supplied
 * reaches the storage key.
 *
 * Size is checked three times, at decreasing cost: `Content-Length` before the
 * body is read at all (a missing header is rejected outright, not skipped),
 * `file.size` before the bytes are pulled into a Buffer, and `buffer.length` — the
 * bytes actually received — inside `validateUpload`. Route handlers have no
 * default body-size cap, so without the first check a large POST would be
 * buffered into memory in full before anything got the chance to reject it.
 *
 * Returns the resulting `path`, which the admin form submits as `file_path` when
 * it saves the publication.
 *
 * @param {Request} request
 * @returns {Promise<NextResponse>}
 */
export async function POST(request) {
  const user = await requireAdminApi();
  if (!user) {
    return NextResponse.json(unauthorizedBody(), { status: 401 });
  }

  // A missing or unparseable Content-Length is rejected rather than waved through.
  // `Number(null)` is 0 and `Number('abc')` is NaN, so a "> limit" test alone lets
  // both past — and then `request.formData()` buffers the whole body before
  // anything can object. Every browser and fetch() sends this header for a
  // multipart upload, so requiring it costs a legitimate admin nothing.
  const declaredLength = Number(request.headers.get('content-length'));
  if (!Number.isFinite(declaredLength) || declaredLength <= 0) {
    return NextResponse.json(
      { ok: false, error: 'Could not read the upload. Please try again.' },
      { status: 411 },
    );
  }

  if (declaredLength > MAX_UPLOAD_BYTES + MULTIPART_OVERHEAD_BYTES) {
    return NextResponse.json(
      {
        ok: false,
        error: `That file is too large. The limit is ${formatBytes(MAX_UPLOAD_BYTES)}.`,
      },
      { status: 413 },
    );
  }

  /** @type {FormData} */
  let formData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Could not read the upload.' },
      { status: 400 },
    );
  }

  const file = formData.get('file');

  if (!file || typeof file === 'string' || typeof file.arrayBuffer !== 'function') {
    return NextResponse.json(
      { ok: false, error: 'No file was received.' },
      { status: 400 },
    );
  }

  // Check the declared size before materialising the bytes.
  if (typeof file.size === 'number' && file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      {
        ok: false,
        error: `That file is ${formatBytes(file.size)}. The limit is ${formatBytes(MAX_UPLOAD_BYTES)}.`,
      },
      { status: 413 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Validate against the real bytes, not the reported metadata.
  const validation = validateUpload(file, buffer);
  if (!validation.ok) {
    return NextResponse.json({ ok: false, error: validation.error }, { status: 400 });
  }

  const stored = await uploadPublicationFile({
    buffer,
    ext: validation.ext,
    contentType: validation.contentType,
  });

  if (!stored.ok) {
    return NextResponse.json({ ok: false, error: stored.error }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    path: stored.path,
    size: buffer.length,
    sizeLabel: formatBytes(buffer.length),
    ext: validation.ext,
  });
}

/**
 * DELETE /api/admin/upload?path=... — discard an uploaded file.
 *
 * The admin form uploads as soon as a file is chosen, so replacing the file
 * before saving would leave the first upload stranded in the bucket. This lets
 * the form clean up after itself.
 *
 * Only accepts keys in this route's own `YYYY/<uuid>.<ext>` format, and only
 * deletes keys no publication row points at. The format check alone would not be
 * enough: every saved publication's file matches that same format, so without the
 * reference check this endpoint could be pointed at a live publication's file.
 *
 * @param {Request} request
 * @returns {Promise<NextResponse>}
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
