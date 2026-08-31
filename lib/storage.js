import { randomUUID } from 'node:crypto';
import { getSupabaseAdmin } from '@/lib/supabase';
import {
  ALLOWED_UPLOAD_TYPES,
  MAX_UPLOAD_BYTES,
  UNKNOWN_UPLOAD_TYPES,
  extensionFromFilename,
  formatBytes,
} from '@/lib/publications';

/**
 * Publication file storage — SERVER ONLY.
 *
 * This module imports `getSupabaseAdmin()`, which holds the service-role key.
 * Never import it from a Client Component; the shared constants a client needs
 * (size limit, accepted types) live in the client-safe `lib/publications.js`.
 *
 * The bucket is PRIVATE. Files are never served from a public URL — reads go
 * through a short-lived signed URL minted server-side, which is what makes paid
 * gating possible in Phase 7.
 */

/** Name of the private Supabase Storage bucket holding publication files. */
export const PUBLICATIONS_BUCKET = 'publications';

/**
 * Leading bytes each accepted format must start with.
 *
 * The browser-reported MIME type is client-controlled, so it is a hint, not
 * proof. Checking the real leading bytes means a renamed executable can't land
 * in the bucket labelled as a PDF.
 *
 * - pdf       → `%PDF`
 * - docx/epub → `PK\x03\x04` (both are ZIP containers)
 * - doc       → OLE2 compound file header
 */
const MAGIC_BYTES = {
  pdf: [[0x25, 0x50, 0x44, 0x46]],
  epub: [[0x50, 0x4b, 0x03, 0x04]],
  docx: [[0x50, 0x4b, 0x03, 0x04]],
  doc: [[0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]],
};

/**
 * Check a file's leading bytes against the signature expected for its extension.
 *
 * @param {Buffer} buffer - The full uploaded file.
 * @param {string} ext - Extension resolved from the MIME allowlist.
 * @returns {boolean} True if the content matches the claimed format.
 */
export function hasExpectedMagicBytes(buffer, ext) {
  const signatures = MAGIC_BYTES[ext];
  if (!signatures) return false;

  return signatures.some((signature) =>
    signature.every((byte, index) => buffer[index] === byte),
  );
}

/**
 * Validate an uploaded file server-side: size, MIME allowlist, and real content
 * signature.
 *
 * The reported MIME type is only a routing hint. Browsers frequently report `''`
 * or `application/octet-stream` for `.epub` and `.doc` when the operating system
 * has no application registered for them, so in that case the extension is taken
 * from the filename — still constrained to the allowlist — and the magic-byte
 * check becomes the sole arbiter of what the file actually is. That check is the
 * one that matters: it is the only signal an uploader cannot forge by renaming.
 *
 * @param {{size: number, type: string, name?: string}} file - The uploaded File/Blob.
 * @param {Buffer} buffer - Its bytes.
 * @returns {{ok: true, ext: string, contentType: string} | {ok: false, error: string}}
 */
export function validateUpload(file, buffer) {
  if (!file || typeof file.size !== 'number' || file.size === 0) {
    return { ok: false, error: 'No file was received.' };
  }

  // Measured on the bytes actually received, not on the metadata: this is the
  // last of the three size checks and the only one looking at real content.
  if (buffer.length > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      error: `File is too large. The limit is ${formatBytes(MAX_UPLOAD_BYTES)}.`,
    };
  }

  const reportedType = String(file.type || '').toLowerCase();
  // hasOwn, not a bare index: a part claiming `Content-Type: __proto__` would
  // otherwise pick up an inherited property as though it were an extension.
  let ext = Object.prototype.hasOwnProperty.call(ALLOWED_UPLOAD_TYPES, reportedType)
    ? ALLOWED_UPLOAD_TYPES[reportedType]
    : undefined;

  // No usable MIME type from the browser: fall back to the filename's extension,
  // which extensionFromFilename() only returns if it is on the allowlist.
  if (!ext && UNKNOWN_UPLOAD_TYPES.includes(reportedType)) {
    ext = extensionFromFilename(file.name);
  }

  if (!ext) {
    return {
      ok: false,
      error: 'Unsupported file type. Upload a PDF, EPUB, DOC or DOCX file.',
    };
  }

  if (!hasExpectedMagicBytes(buffer, ext)) {
    return {
      ok: false,
      error: `This file does not look like a valid ${ext.toUpperCase()} file.`,
    };
  }

  // Store the canonical type for the extension, not whatever the browser said, so
  // the object is served with a sensible Content-Type later.
  const canonicalType =
    Object.keys(ALLOWED_UPLOAD_TYPES).find((key) => ALLOWED_UPLOAD_TYPES[key] === ext) ??
    'application/octet-stream';

  return { ok: true, ext, contentType: canonicalType };
}

/**
 * Build an opaque storage key for a new upload.
 *
 * The client's filename is discarded entirely. Keys are `YYYY/<uuid>.<ext>`,
 * which keeps titles and internal naming out of any URL, sidesteps path
 * traversal and unicode filename issues, and gives the bucket a usable shape as
 * it grows.
 *
 * @param {string} ext - Extension from the MIME allowlist.
 * @returns {string} Storage object key.
 */
export function buildStorageKey(ext) {
  const year = new Date().getUTCFullYear();
  return `${year}/${randomUUID()}.${ext}`;
}

/**
 * Upload bytes to the private publications bucket.
 *
 * @param {object} params
 * @param {Buffer} params.buffer - File bytes.
 * @param {string} params.ext - Extension from the MIME allowlist.
 * @param {string} params.contentType - Validated MIME type.
 * @returns {Promise<{ok: true, path: string} | {ok: false, error: string}>}
 */
export async function uploadPublicationFile({ buffer, ext, contentType }) {
  const supabase = getSupabaseAdmin();
  const path = buildStorageKey(ext);

  const { error } = await supabase.storage
    .from(PUBLICATIONS_BUCKET)
    .upload(path, buffer, { contentType, upsert: false });

  if (error) {
    console.error('[storage] Upload failed:', error);
    return { ok: false, error: 'Could not store the file. Please try again.' };
  }

  return { ok: true, path };
}

/**
 * Delete a publication file from Storage, unconditionally.
 *
 * Deliberately NOT exported. Every caller outside this module should go through
 * `removeUnreferencedFile()` instead, so there is exactly one door and it has the
 * reference check on it. An unconditional delete reachable from a route handler is
 * how a live publication loses its file.
 *
 * Best-effort by design: it's called after a database row has already been
 * updated or deleted, and a leftover file in a private bucket is a tidiness
 * problem, not a correctness one. Failing here must not fail the request.
 *
 * @param {string|null|undefined} path - Storage object key.
 * @returns {Promise<boolean>} True if a delete was attempted and succeeded.
 */
async function removePublicationFile(path) {
  if (!path) return false;

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.storage.from(PUBLICATIONS_BUCKET).remove([path]);

    if (error) {
      console.error('[storage] Could not remove file', path, error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[storage] Could not remove file', path, error);
    return false;
  }
}

/**
 * Delete a file only if no publication row still points at it.
 *
 * Every cleanup path in the admin routes is trying to remove an *orphan* — a file
 * uploaded for a row that was never saved. None of them should ever be capable of
 * removing a file a live publication depends on, but each one infers "orphan"
 * from the shape of the request it happens to be handling. That inference is fine
 * for requests the admin form makes and wrong for a hand-crafted one carrying
 * another publication's storage key, which would delete that publication's file.
 *
 * This check closes the whole class rather than each instance: the database, not
 * the request, decides whether a key is still in use. It costs one indexed
 * lookup, and it fails closed — if the reference check itself errors, nothing is
 * deleted.
 *
 * @param {string|null|undefined} path - Storage object key.
 * @returns {Promise<boolean>} True if the file was unreferenced and was removed.
 */
export async function removeUnreferencedFile(path) {
  if (!path) return false;

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('publications')
      .select('id')
      .eq('file_path', path)
      .limit(1);

    if (error) {
      console.error('[storage] Could not check references for', path, error);
      return false;
    }

    if (data && data.length > 0) {
      console.warn(
        `[storage] Refused to delete ${path}: publication ${data[0].id} still references it.`,
      );
      return false;
    }
  } catch (error) {
    console.error('[storage] Could not check references for', path, error);
    return false;
  }

  return removePublicationFile(path);
}

/**
 * Mint a short-lived signed URL for a stored file.
 *
 * @param {string} path - Storage object key.
 * @param {object} [options]
 * @param {number} [options.expiresIn=300] - Lifetime in seconds.
 * @param {string} [options.downloadAs] - Filename the browser should save as.
 * @returns {Promise<string|null>} The signed URL, or null on failure.
 */
export async function createSignedDownloadUrl(path, options = {}) {
  const { expiresIn = 300, downloadAs } = options;

  if (!path) return null;

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.storage
      .from(PUBLICATIONS_BUCKET)
      .createSignedUrl(path, expiresIn, downloadAs ? { download: downloadAs } : undefined);

    if (error || !data?.signedUrl) {
      console.error('[storage] Could not sign URL for', path, error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('[storage] Could not sign URL for', path, error);
    return null;
  }
}
