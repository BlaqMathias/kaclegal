import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { getSupabaseAdmin } from '@/lib/supabase';
import {
  ALLOWED_IMAGE_UPLOAD_TYPES,
  MAX_IMAGE_UPLOAD_BYTES,
  formatBytes,
} from '@/lib/publications';

/**
 * Publication cover-image storage — SERVER ONLY, Node runtime only.
 *
 * Unlike the publication *files* in `lib/storage.js` (private Supabase bucket,
 * served through short-lived signed URLs), cover images are public by design —
 * they're shown directly on the publications grid — so they're written straight
 * into the app's own `public/` folder, next to every other locally-hosted image
 * on the site (`/images/team/...`, `/images/practice-areas/...`).
 *
 * That does mean this module needs a writable, persistent filesystem at
 * runtime. It works on a traditional Node server (`next start`) or any host
 * that keeps `public/` on disk between requests. It will NOT work on a
 * serverless/edge platform with a read-only or ephemeral filesystem (Vercel's
 * default Node functions, for example) — a write there either fails outright
 * or vanishes on the next deploy/cold start. If this ever moves to that kind
 * of host, cover images need to move to Supabase Storage's public bucket
 * instead, the same way the private one already works for documents.
 */

/** Folder (under `public/`) that uploaded cover images are written to. */
const IMAGE_DIR = path.join(process.cwd(), 'public', 'images', 'publicationUploads');

/** Public URL prefix corresponding to `IMAGE_DIR`. */
export const IMAGE_URL_PREFIX = '/images/publicationUploads';

/** Leading bytes each accepted image format must start with. */
const MAGIC_BYTES = {
  jpg: [[0xff, 0xd8, 0xff]],
  png: [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  gif: [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61],
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61],
  ],
  // WebP is a RIFF container: bytes 0-3 are "RIFF", bytes 8-11 are "WEBP". The
  // 4-byte file-size field in between varies per file, so it's checked as two
  // separate anchored signatures rather than one contiguous one.
  webp: [[0x52, 0x49, 0x46, 0x46]],
};

/**
 * @param {Buffer} buffer
 * @param {string} ext
 * @returns {boolean}
 */
function hasExpectedImageMagicBytes(buffer, ext) {
  const signatures = MAGIC_BYTES[ext];
  if (!signatures) return false;

  const leadingMatch = signatures.some((signature) =>
    signature.every((byte, index) => buffer[index] === byte),
  );

  if (ext !== 'webp') return leadingMatch;

  // WebP additionally needs "WEBP" at offset 8.
  const webpTag = [0x57, 0x45, 0x42, 0x50];
  const hasWebpTag = webpTag.every((byte, index) => buffer[8 + index] === byte);
  return leadingMatch && hasWebpTag;
}

/**
 * Validate an uploaded cover image server-side: size, MIME allowlist, and real
 * content signature. Mirrors `validateUpload()` in `lib/storage.js`.
 *
 * @param {{size: number, type: string}} file
 * @param {Buffer} buffer
 * @returns {{ok: true, ext: string, contentType: string} | {ok: false, error: string}}
 */
export function validateImageUpload(file, buffer) {
  if (!file || typeof file.size !== 'number' || file.size === 0) {
    return { ok: false, error: 'No image was received.' };
  }

  if (buffer.length > MAX_IMAGE_UPLOAD_BYTES) {
    return {
      ok: false,
      error: `Image is too large. The limit is ${formatBytes(MAX_IMAGE_UPLOAD_BYTES)}.`,
    };
  }

  const reportedType = String(file.type || '').toLowerCase();
  const ext = Object.prototype.hasOwnProperty.call(ALLOWED_IMAGE_UPLOAD_TYPES, reportedType)
    ? ALLOWED_IMAGE_UPLOAD_TYPES[reportedType]
    : undefined;

  if (!ext) {
    return {
      ok: false,
      error: 'Unsupported image type. Upload a JPG, PNG, WEBP or GIF file.',
    };
  }

  if (!hasExpectedImageMagicBytes(buffer, ext)) {
    return {
      ok: false,
      error: `This file does not look like a valid ${ext.toUpperCase()} image.`,
    };
  }

  return { ok: true, ext, contentType: reportedType };
}

/**
 * Write validated image bytes into `public/images/publicationUploads/`.
 *
 * The client's filename is discarded entirely — the stored name is always
 * `<uuid>.<ext>`, same reasoning as `buildStorageKey()` in `lib/storage.js`.
 *
 * @param {object} params
 * @param {Buffer} params.buffer
 * @param {string} params.ext
 * @returns {Promise<{ok: true, path: string} | {ok: false, error: string}>}
 */
export async function uploadPublicationImage({ buffer, ext }) {
  try {
    await mkdir(IMAGE_DIR, { recursive: true });
    const filename = `${randomUUID()}.${ext}`;
    await writeFile(path.join(IMAGE_DIR, filename), buffer);
    return { ok: true, path: `${IMAGE_URL_PREFIX}/${filename}` };
  } catch (error) {
    console.error('[imageStorage] Write failed:', error);
    return { ok: false, error: 'Could not store the image. Please try again.' };
  }
}

/**
 * Delete an image file, unconditionally. Not exported — every caller outside
 * this module goes through `removeUnreferencedImage()` instead, which is what
 * makes it safe to call from a route handler. Mirrors `removePublicationFile()`
 * in `lib/storage.js`.
 *
 * @param {string|null|undefined} publicPath - e.g. `/images/publicationUploads/<uuid>.jpg`.
 * @returns {Promise<boolean>}
 */
async function removePublicationImage(publicPath) {
  if (!publicPath) return false;

  try {
    const filename = publicPath.slice(IMAGE_URL_PREFIX.length + 1);
    await unlink(path.join(IMAGE_DIR, filename));
    return true;
  } catch (error) {
    // ENOENT (already gone) is not worth logging as an error.
    if (error?.code !== 'ENOENT') {
      console.error('[imageStorage] Could not remove image', publicPath, error);
    }
    return false;
  }
}

/**
 * Delete an image only if no publication row still points at it. Same
 * reasoning as `removeUnreferencedFile()` in `lib/storage.js`: the database,
 * not the request, decides whether a key is still in use.
 *
 * @param {string|null|undefined} publicPath
 * @returns {Promise<boolean>}
 */
export async function removeUnreferencedImage(publicPath) {
  if (!publicPath) return false;

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('publications')
      .select('id')
      .eq('image_path', publicPath)
      .limit(1);

    if (error) {
      console.error('[imageStorage] Could not check references for', publicPath, error);
      return false;
    }

    if (data && data.length > 0) {
      console.warn(
        `[imageStorage] Refused to delete ${publicPath}: publication ${data[0].id} still references it.`,
      );
      return false;
    }
  } catch (error) {
    console.error('[imageStorage] Could not check references for', publicPath, error);
    return false;
  }

  return removePublicationImage(publicPath);
}
