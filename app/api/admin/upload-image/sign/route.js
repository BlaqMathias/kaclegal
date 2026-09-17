import { NextResponse } from 'next/server';
import { requireAdminApi, unauthorizedBody } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase';
import { buildPublicationImageStagingKey } from '@/lib/imageStorage';
import { PUBLICATION_IMAGE_STAGING_BUCKET } from '@/lib/publicationImages';
import {
  ALLOWED_IMAGE_UPLOAD_TYPES,
  MAX_IMAGE_UPLOAD_BYTES,
  UNKNOWN_UPLOAD_TYPES,
  formatBytes,
  imageExtensionFromFilename,
} from '@/lib/publications';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/upload-image/sign — mint a temporary signed Storage upload.
 *
 * The browser uploads the original image straight to Supabase rather than
 * pushing a 20 MB body through the Next.js server. That keeps this reliable on
 * serverless hosts with request-body limits while preserving real upload
 * progress in the admin UI.
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
      { ok: false, error: 'Could not read the image details.' },
      { status: 400 },
    );
  }

  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const reportedType =
    typeof body?.type === 'string' ? body.type.toLowerCase().trim() : '';
  const size = Number(body?.size);

  if (!Number.isFinite(size) || size <= 0) {
    return NextResponse.json(
      { ok: false, error: 'No image was received.' },
      { status: 400 },
    );
  }

  if (size > MAX_IMAGE_UPLOAD_BYTES) {
    return NextResponse.json(
      {
        ok: false,
        error: `That image is ${formatBytes(size)}. The limit is ${formatBytes(MAX_IMAGE_UPLOAD_BYTES)}.`,
      },
      { status: 413 },
    );
  }

  const filenameExt = imageExtensionFromFilename(name);
  const mimeExt = Object.prototype.hasOwnProperty.call(
    ALLOWED_IMAGE_UPLOAD_TYPES,
    reportedType,
  )
    ? ALLOWED_IMAGE_UPLOAD_TYPES[reportedType]
    : null;

  let ext = mimeExt;
  if (!ext && UNKNOWN_UPLOAD_TYPES.includes(reportedType)) {
    ext = filenameExt;
  }

  if (!ext) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Unsupported image type. Upload JPEG, PNG, WEBP, AVIF or TIFF.',
      },
      { status: 400 },
    );
  }

  if (filenameExt && filenameExt !== ext) {
    return NextResponse.json(
      {
        ok: false,
        error: 'The image extension does not match the image type.',
      },
      { status: 400 },
    );
  }

  const stagingPath = buildPublicationImageStagingKey(ext);

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.storage
      .from(PUBLICATION_IMAGE_STAGING_BUCKET)
      .createSignedUploadUrl(stagingPath);

    if (error || !data?.signedUrl) {
      console.error('[upload-image/sign] Could not create signed upload URL:', error);
      return NextResponse.json(
        {
          ok: false,
          error:
            error?.message?.includes('Bucket not found')
              ? 'The publication-image-staging bucket is missing. Run the Supabase storage setup first.'
              : 'Could not prepare the image upload. Please try again.',
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      signedUrl: data.signedUrl,
      stagingPath,
    });
  } catch (error) {
    console.error('[upload-image/sign] Failed:', error);
    return NextResponse.json(
      { ok: false, error: 'Could not prepare the image upload. Please try again.' },
      { status: 502 },
    );
  }
}
