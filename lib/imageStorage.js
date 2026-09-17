import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { getSupabaseAdmin } from '@/lib/supabase';
import {
  PUBLICATION_IMAGES_BUCKET,
  PUBLICATION_IMAGE_STAGING_BUCKET,
} from '@/lib/publicationImages';
import {
  ALLOWED_IMAGE_UPLOAD_TYPES,
  MAX_IMAGE_UPLOAD_BYTES,
  UNKNOWN_UPLOAD_TYPES,
  formatBytes,
  imageExtensionFromFilename,
} from '@/lib/publications';

/**
 * Publication cover-image storage — SERVER ONLY.
 *
 * Cover images are stored in the public `publication-images` Supabase bucket.
 * Accepted source files are validated, resized when necessary and converted to
 * WebP before Storage sees them. This keeps public pages fast and prevents a
 * 20 MB source image from becoming a 20 MB page asset.
 */

/** Maximum output dimensions for a publication card/cover image. */
const MAX_OUTPUT_WIDTH = 1920;
const MAX_OUTPUT_HEIGHT = 1920;

/** Guard against decompression bombs / absurd image dimensions. */
const MAX_INPUT_PIXELS = 40_000_000;

/** WebP quality chosen to retain text/detail while materially reducing size. */
const WEBP_QUALITY = 82;

/**
 * Build an opaque storage key for a new image upload.
 *
 * @param {string} [ext='webp']
 * @returns {string}
 */
export function buildPublicationImageKey(ext = 'webp') {
  const year = new Date().getUTCFullYear();
  return `${year}/${randomUUID()}.${ext}`;
}


/**
 * Build an opaque temporary path for a source image before optimization.
 *
 * @param {string} ext
 * @returns {string}
 */
export function buildPublicationImageStagingKey(ext) {
  const year = new Date().getUTCFullYear();
  return `${year}/${randomUUID()}.${ext}`;
}

/**
 * Return the public URL for an image key in the cover-image bucket.
 *
 * @param {string|null|undefined} path
 * @returns {string|null}
 */
export function getPublicationImagePublicUrl(path) {
  if (!path) return null;

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const supabase = getSupabaseAdmin();
  const { data } = supabase.storage
    .from(PUBLICATION_IMAGES_BUCKET)
    .getPublicUrl(path);

  return data?.publicUrl ?? null;
}

/** Leading bytes each accepted source image format must match. */
const MAGIC_BYTES = {
  jpg: [{ type: 'prefix', bytes: [0xff, 0xd8, 0xff] }],
  png: [
    {
      type: 'prefix',
      bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
    },
  ],
  webp: [
    { type: 'prefix', bytes: [0x52, 0x49, 0x46, 0x46] },
    { type: 'offset', offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] },
  ],
  avif: [
    {
      type: 'offset',
      offset: 4,
      bytes: [0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66],
    },
    {
      type: 'offset',
      offset: 4,
      bytes: [0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x73],
    },
  ],
  tif: [
    { type: 'prefix', bytes: [0x49, 0x49, 0x2a, 0x00] },
    { type: 'prefix', bytes: [0x4d, 0x4d, 0x00, 0x2a] },
  ],
};

/**
 * @param {Buffer} buffer
 * @param {{type: string, bytes: number[], offset?: number}} signature
 * @returns {boolean}
 */
function signatureMatches(buffer, signature) {
  const offset = signature.type === 'offset' ? signature.offset ?? 0 : 0;
  return signature.bytes.every((byte, index) => buffer[offset + index] === byte);
}

/**
 * @param {Buffer} buffer
 * @param {string} ext
 * @returns {boolean}
 */
function hasExpectedImageMagicBytes(buffer, ext) {
  const signatures = MAGIC_BYTES[ext];
  if (!signatures) return false;

  // WebP needs both RIFF and WEBP markers. The remaining formats have alternate
  // valid signatures, so any match is sufficient.
  if (ext === 'webp') {
    return signatures.every((signature) => signatureMatches(buffer, signature));
  }

  return signatures.some((signature) => signatureMatches(buffer, signature));
}

/**
 * Validate an uploaded cover image server-side: size, allowlisted format, and
 * real content signature.
 *
 * @param {{size: number, type: string, name?: string}} file
 * @param {Buffer} buffer
 * @returns {{ok: true, ext: string, contentType: string} | {ok: false, error: string}}
 */
export function validateImageUpload(file, buffer) {
  if (!file || typeof file.size !== 'number' || file.size === 0) {
    return { ok: false, error: 'No image was received.' };
  }

  if (file.size > MAX_IMAGE_UPLOAD_BYTES || buffer.length > MAX_IMAGE_UPLOAD_BYTES) {
    return {
      ok: false,
      error: `Image is too large. The limit is ${formatBytes(MAX_IMAGE_UPLOAD_BYTES)}.`,
    };
  }

  const reportedType = String(file.type || '').toLowerCase();
  let ext = Object.prototype.hasOwnProperty.call(
    ALLOWED_IMAGE_UPLOAD_TYPES,
    reportedType,
  )
    ? ALLOWED_IMAGE_UPLOAD_TYPES[reportedType]
    : undefined;

  // Some browsers/OSes report TIFF and AVIF as generic binary data. In that
  // case the filename can select an allowlisted format, but the magic-byte check
  // below still proves the actual bytes match it.
  if (!ext && UNKNOWN_UPLOAD_TYPES.includes(reportedType)) {
    ext = imageExtensionFromFilename(file.name);
  }

  if (!ext) {
    return {
      ok: false,
      error: 'Unsupported image type. Upload JPEG, PNG, WEBP, AVIF or TIFF.',
    };
  }

  if (!hasExpectedImageMagicBytes(buffer, ext)) {
    return {
      ok: false,
      error: `This file does not look like a valid ${ext.toUpperCase()} image.`,
    };
  }

  const canonicalType =
    Object.keys(ALLOWED_IMAGE_UPLOAD_TYPES).find(
      (key) => ALLOWED_IMAGE_UPLOAD_TYPES[key] === ext,
    ) || 'application/octet-stream';

  return { ok: true, ext, contentType: canonicalType };
}

/**
 * Resize and compress a validated source image to a browser-friendly WebP.
 * EXIF orientation is applied before resizing.
 *
 * @param {Buffer} sourceBuffer
 * @returns {Promise<{ok: true, buffer: Buffer, ext: 'webp', contentType: 'image/webp', width: number|null, height: number|null} | {ok: false, error: string}>}
 */
export async function optimizePublicationImage(sourceBuffer) {
  try {
    const pipeline = sharp(sourceBuffer, {
      failOn: 'error',
      limitInputPixels: MAX_INPUT_PIXELS,
    })
      .rotate()
      .resize({
        width: MAX_OUTPUT_WIDTH,
        height: MAX_OUTPUT_HEIGHT,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({
        quality: WEBP_QUALITY,
        effort: 4,
        smartSubsample: true,
      });

    const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });

    return {
      ok: true,
      buffer: data,
      ext: 'webp',
      contentType: 'image/webp',
      width: info.width ?? null,
      height: info.height ?? null,
    };
  } catch (error) {
    console.error('[imageStorage] Optimization failed:', error);
    return {
      ok: false,
      error:
        'Could not process that image. Make sure it is a valid JPEG, PNG, WEBP, AVIF or TIFF file.',
    };
  }
}

/**
 * Upload an already-optimized cover image to the public storage bucket.
 *
 * @param {object} params
 * @param {Buffer} params.buffer
 * @param {string} [params.ext='webp']
 * @param {string} [params.contentType='image/webp']
 * @returns {Promise<{ok: true, path: string, publicUrl: string|null} | {ok: false, error: string}>}
 */
export async function uploadPublicationImage({
  buffer,
  ext = 'webp',
  contentType = 'image/webp',
}) {
  try {
    const supabase = getSupabaseAdmin();
    const path = buildPublicationImageKey(ext);

    const { error } = await supabase.storage
      .from(PUBLICATION_IMAGES_BUCKET)
      .upload(path, buffer, {
        contentType,
        cacheControl: '31536000',
        upsert: false,
      });

    if (error) {
      console.error('[imageStorage] Upload failed:', error);
      return {
        ok: false,
        error:
          error.message?.includes('Bucket not found')
            ? 'The publication-images storage bucket is missing. Create it in Supabase Storage and make it public.'
            : 'Could not store the image. Please try again.',
      };
    }

    return {
      ok: true,
      path,
      publicUrl: getPublicationImagePublicUrl(path),
    };
  } catch (error) {
    console.error('[imageStorage] Upload failed:', error);
    return { ok: false, error: 'Could not store the image. Please try again.' };
  }
}


/**
 * Download a staged source image for validation/optimization.
 *
 * @param {string} path
 * @returns {Promise<{ok: true, buffer: Buffer} | {ok: false, error: string}>}
 */
export async function downloadStagedPublicationImage(path) {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.storage
      .from(PUBLICATION_IMAGE_STAGING_BUCKET)
      .download(path);

    if (error || !data) {
      console.error('[imageStorage] Could not download staged image', path, error);
      return { ok: false, error: 'Could not read the uploaded image. Please try again.' };
    }

    return { ok: true, buffer: Buffer.from(await data.arrayBuffer()) };
  } catch (error) {
    console.error('[imageStorage] Could not download staged image', path, error);
    return { ok: false, error: 'Could not read the uploaded image. Please try again.' };
  }
}

/**
 * Remove a temporary staged source image.
 *
 * @param {string|null|undefined} path
 * @returns {Promise<boolean>}
 */
export async function removeStagedPublicationImage(path) {
  if (!path) return false;

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.storage
      .from(PUBLICATION_IMAGE_STAGING_BUCKET)
      .remove([path]);

    if (error) {
      console.error('[imageStorage] Could not remove staged image', path, error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[imageStorage] Could not remove staged image', path, error);
    return false;
  }
}

/**
 * Delete an image file, unconditionally. Not exported — every caller outside
 * this module goes through `removeUnreferencedImage()` instead.
 *
 * @param {string|null|undefined} storagePath
 * @returns {Promise<boolean>}
 */
async function removePublicationImage(storagePath) {
  if (!storagePath) return false;

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.storage
      .from(PUBLICATION_IMAGES_BUCKET)
      .remove([storagePath]);

    if (error) {
      console.error('[imageStorage] Could not remove image', storagePath, error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[imageStorage] Could not remove image', storagePath, error);
    return false;
  }
}

/**
 * Delete an image only if no publication row still points at it.
 *
 * @param {string|null|undefined} storagePath
 * @returns {Promise<boolean>}
 */
export async function removeUnreferencedImage(storagePath) {
  if (!storagePath) return false;

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('publications')
      .select('id')
      .eq('image_path', storagePath)
      .limit(1);

    if (error) {
      console.error('[imageStorage] Could not check references for', storagePath, error);
      return false;
    }

    if (data && data.length > 0) {
      console.warn(
        `[imageStorage] Refused to delete ${storagePath}: publication ${data[0].id} still references it.`,
      );
      return false;
    }
  } catch (error) {
    console.error('[imageStorage] Could not check references for', storagePath, error);
    return false;
  }

  return removePublicationImage(storagePath);
}
