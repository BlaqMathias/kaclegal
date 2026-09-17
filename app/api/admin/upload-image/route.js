import { NextResponse } from 'next/server';
import { requireAdminApi, unauthorizedBody } from '@/lib/auth';
import {
  downloadStagedPublicationImage,
  optimizePublicationImage,
  removeStagedPublicationImage,
  removeUnreferencedImage,
  uploadPublicationImage,
  validateImageUpload,
} from '@/lib/imageStorage';
import { formatBytes } from '@/lib/publications';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FINAL_IMAGE_PATH_PATTERN = /^\d{4}\/[a-f0-9-]{36}\.webp$/i;
const STAGING_IMAGE_PATH_PATTERN =
  /^\d{4}\/[a-f0-9-]{36}\.(jpg|png|webp|avif|tif)$/i;

/**
 * POST /api/admin/upload-image — process a source image that the browser already
 * uploaded directly to the private staging bucket.
 *
 * The source never passes through this route's request body. The server downloads
 * it from Supabase, validates the bytes, converts it to a resized WebP, stores the
 * optimized public cover and then removes the private temporary source.
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
      { ok: false, error: 'Could not read the image processing request.' },
      { status: 400 },
    );
  }

  const stagingPath =
    typeof body?.stagingPath === 'string' ? body.stagingPath.trim() : '';
  const fileName = typeof body?.name === 'string' ? body.name : '';
  const fileType = typeof body?.type === 'string' ? body.type : '';

  if (!STAGING_IMAGE_PATH_PATTERN.test(stagingPath)) {
    return NextResponse.json(
      { ok: false, error: 'Invalid temporary image reference.' },
      { status: 400 },
    );
  }

  const staged = await downloadStagedPublicationImage(stagingPath);
  if (!staged.ok) {
    return NextResponse.json(
      { ok: false, error: staged.error },
      { status: 502 },
    );
  }

  const cleanupStaging = () => removeStagedPublicationImage(stagingPath);

  const validation = validateImageUpload(
    {
      size: staged.buffer.length,
      type: fileType,
      name: fileName,
    },
    staged.buffer,
  );

  if (!validation.ok) {
    await cleanupStaging();
    return NextResponse.json(
      { ok: false, error: validation.error },
      { status: 400 },
    );
  }

  const optimized = await optimizePublicationImage(staged.buffer);
  if (!optimized.ok) {
    await cleanupStaging();
    return NextResponse.json(
      { ok: false, error: optimized.error },
      { status: 400 },
    );
  }

  const stored = await uploadPublicationImage({
    buffer: optimized.buffer,
    ext: optimized.ext,
    contentType: optimized.contentType,
  });

  await cleanupStaging();

  if (!stored.ok) {
    return NextResponse.json(
      { ok: false, error: stored.error },
      { status: 502 },
    );
  }

  const originalBytes = staged.buffer.length;
  const savedBytes = Math.max(0, originalBytes - optimized.buffer.length);
  const savedPercent =
    originalBytes > 0 ? Math.round((savedBytes / originalBytes) * 100) : 0;

  return NextResponse.json({
    ok: true,
    path: stored.path,
    url: stored.publicUrl,
    originalSize: originalBytes,
    originalSizeLabel: formatBytes(originalBytes),
    size: optimized.buffer.length,
    sizeLabel: formatBytes(optimized.buffer.length),
    savedBytes,
    savedPercent,
    width: optimized.width,
    height: optimized.height,
    ext: 'webp',
  });
}

/**
 * DELETE /api/admin/upload-image?path=... or ?stagingPath=...
 *
 * Final images are only removed when no publication row points at them. A
 * temporary staging object may be removed directly because it is never stored in
 * the database.
 */
export async function DELETE(request) {
  const user = await requireAdminApi();
  if (!user) {
    return NextResponse.json(unauthorizedBody(), { status: 401 });
  }

  const searchParams = new URL(request.url).searchParams;
  const finalPath = searchParams.get('path');
  const stagingPath = searchParams.get('stagingPath');

  if (stagingPath) {
    if (!STAGING_IMAGE_PATH_PATTERN.test(stagingPath)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid temporary image reference.' },
        { status: 400 },
      );
    }

    const removed = await removeStagedPublicationImage(stagingPath);
    return NextResponse.json({ ok: true, removed });
  }

  if (!finalPath || !FINAL_IMAGE_PATH_PATTERN.test(finalPath)) {
    return NextResponse.json(
      { ok: false, error: 'Invalid image reference.' },
      { status: 400 },
    );
  }

  const removed = await removeUnreferencedImage(finalPath);
  return NextResponse.json({ ok: true, removed });
}
