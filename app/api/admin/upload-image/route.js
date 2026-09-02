import { NextResponse } from 'next/server';
import { requireAdminApi, unauthorizedBody } from '@/lib/auth';
import {
  IMAGE_URL_PREFIX,
  removeUnreferencedImage,
  uploadPublicationImage,
  validateImageUpload,
} from '@/lib/imageStorage';
import { formatBytes, MAX_IMAGE_UPLOAD_BYTES } from '@/lib/publications';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Cover-image filenames are minted by this route as `<uuid>.<ext>` — nothing else is deletable. */
const IMAGE_PATH_PATTERN = new RegExp(
  `^${IMAGE_URL_PREFIX}/[a-f0-9-]{36}\\.[a-z0-9]{2,5}$`,
  'i',
);

/**
 * Slack above MAX_IMAGE_UPLOAD_BYTES for multipart framing (boundaries, headers) so a
 * file that is legitimately just under the limit isn't rejected by the envelope.
 */
const MULTIPART_OVERHEAD_BYTES = 16 * 1024;

/**
 * POST /api/admin/upload-image — accept a publication cover image.
 *
 * Same shape as /api/admin/upload (the document-file route), including the
 * three-stage size check and re-validating the real bytes rather than trusting
 * the browser's reported type — see that route's docstring for the reasoning.
 * The one structural difference: this writes into `public/images/publicationUploads/`
 * on disk (see `lib/imageStorage.js`) rather than a private Supabase bucket,
 * because cover images are public — they render directly on the publications grid.
 *
 * Returns the resulting `path`, which the admin form submits as `image_path`
 * when it saves the publication.
 *
 * @param {Request} request
 * @returns {Promise<NextResponse>}
 */
export async function POST(request) {
  const user = await requireAdminApi();
  if (!user) {
    return NextResponse.json(unauthorizedBody(), { status: 401 });
  }

  const declaredLength = Number(request.headers.get('content-length'));
  if (!Number.isFinite(declaredLength) || declaredLength <= 0) {
    return NextResponse.json(
      { ok: false, error: 'Could not read the upload. Please try again.' },
      { status: 411 },
    );
  }

  if (declaredLength > MAX_IMAGE_UPLOAD_BYTES + MULTIPART_OVERHEAD_BYTES) {
    return NextResponse.json(
      {
        ok: false,
        error: `That image is too large. The limit is ${formatBytes(MAX_IMAGE_UPLOAD_BYTES)}.`,
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
      { ok: false, error: 'No image was received.' },
      { status: 400 },
    );
  }

  if (typeof file.size === 'number' && file.size > MAX_IMAGE_UPLOAD_BYTES) {
    return NextResponse.json(
      {
        ok: false,
        error: `That image is ${formatBytes(file.size)}. The limit is ${formatBytes(MAX_IMAGE_UPLOAD_BYTES)}.`,
      },
      { status: 413 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const validation = validateImageUpload(file, buffer);
  if (!validation.ok) {
    return NextResponse.json({ ok: false, error: validation.error }, { status: 400 });
  }

  const stored = await uploadPublicationImage({ buffer, ext: validation.ext });

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
 * DELETE /api/admin/upload-image?path=... — discard an uploaded cover image.
 *
 * The admin form uploads as soon as an image is chosen, so replacing it before
 * saving would leave the first upload stranded on disk. This lets the form
 * clean up after itself. Only accepts paths in this route's own
 * `/images/publicationUploads/<uuid>.<ext>` format, and only deletes files no
 * publication row still points at.
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

  if (!path || !IMAGE_PATH_PATTERN.test(path)) {
    return NextResponse.json(
      { ok: false, error: 'Invalid image reference.' },
      { status: 400 },
    );
  }

  const removed = await removeUnreferencedImage(path);

  return NextResponse.json({ ok: true, removed });
}
