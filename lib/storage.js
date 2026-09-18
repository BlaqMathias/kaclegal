import { randomUUID } from 'node:crypto';
import { getSupabaseAdmin } from '@/lib/supabase';
import {
  ALLOWED_UPLOAD_TYPES,
  MAX_UPLOAD_BYTES,
  UNKNOWN_UPLOAD_TYPES,
  extensionFromFilename,
  formatBytes,
} from '@/lib/publications';

/** Private Supabase Storage bucket holding publication documents. */
export const PUBLICATIONS_BUCKET = 'publications';

const STORAGE_KEY_PATTERN = /^(?:[a-f0-9-]{36}\/)?\d{4}\/[a-f0-9-]{36}\.[a-z0-9]{2,5}$/i;

const MAGIC_BYTES = {
  pdf: [[0x25, 0x50, 0x44, 0x46]],
  epub: [[0x50, 0x4b, 0x03, 0x04]],
  docx: [[0x50, 0x4b, 0x03, 0x04]],
  doc: [[0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]],
};

export function hasExpectedMagicBytes(buffer, ext) {
  const signatures = MAGIC_BYTES[ext];
  if (!signatures) return false;
  return signatures.some((signature) =>
    signature.every((byte, index) => buffer[index] === byte),
  );
}

export function validateUpload(file, buffer) {
  if (!file || typeof file.size !== 'number' || file.size === 0) {
    return { ok: false, error: 'No file was received.' };
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      error: `File is too large. The limit is ${formatBytes(MAX_UPLOAD_BYTES)}.`,
    };
  }

  const reportedType = String(file.type || '').toLowerCase();
  let ext = Object.prototype.hasOwnProperty.call(ALLOWED_UPLOAD_TYPES, reportedType)
    ? ALLOWED_UPLOAD_TYPES[reportedType]
    : undefined;

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

  const canonicalType =
    Object.keys(ALLOWED_UPLOAD_TYPES).find(
      (key) => ALLOWED_UPLOAD_TYPES[key] === ext,
    ) ?? 'application/octet-stream';

  return { ok: true, ext, contentType: canonicalType };
}

export function buildStorageKey(ext, ownerId = null) {
  const year = new Date().getUTCFullYear();
  const leaf = `${year}/${randomUUID()}.${ext}`;
  return ownerId ? `${ownerId}/${leaf}` : leaf;
}

/**
 * Verify a file after a direct browser -> Supabase standard upload.
 *
 * The Vercel route never receives the file body. The browser performs the
 * initial magic-byte check before upload; the server then confirms that the
 * expected object actually exists in the private bucket and that Supabase
 * stored the exact byte count under the prepared extension.
 *
 * Keeping verification metadata-only avoids a second network read of the file
 * after upload, which previously caused the UI to sit at 97% while the server
 * waited on a signed ranged download.
 */
export async function verifyStoredPublicationFile({
  path,
  expectedSize,
  expectedExt,
}) {
  if (!STORAGE_KEY_PATTERN.test(String(path || ''))) {
    return { ok: false, status: 400, error: 'Invalid publication file reference.' };
  }

  const pathExt = path.split('.').pop()?.toLowerCase() || '';
  if (!MAGIC_BYTES[pathExt] || (expectedExt && pathExt !== expectedExt)) {
    return { ok: false, status: 400, error: 'The uploaded file type did not match the prepared upload.' };
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data: info, error: infoError } = await supabase.storage
      .from(PUBLICATIONS_BUCKET)
      .info(path);

    if (infoError || !info) {
      console.error('[storage] Could not read uploaded file info:', infoError);
      return {
        ok: false,
        status: 502,
        error:
          infoError?.message?.includes('not found')
            ? 'Supabase did not finish storing that file. Please upload it again.'
            : 'Could not verify the uploaded file in Supabase Storage.',
      };
    }

    const storedSize = Number(info.size);
    if (!Number.isFinite(storedSize) || storedSize <= 0) {
      return { ok: false, status: 502, error: 'Supabase returned an invalid size for the uploaded file.' };
    }

    if (storedSize !== expectedSize) {
      return {
        ok: false,
        status: 400,
        error: `The stored file size (${formatBytes(storedSize)}) did not match the selected file (${formatBytes(expectedSize)}). Please upload it again.`,
      };
    }

    if (storedSize > MAX_UPLOAD_BYTES) {
      return {
        ok: false,
        status: 413,
        error: `The stored file exceeds the ${formatBytes(MAX_UPLOAD_BYTES)} limit.`,
      };
    }

    // The browser already checked the leading file signature before it received
    // a signed upload URL. At this point, verify the server-controlled path and
    // exact stored size only; do not fetch the object back through Vercel.

    return { ok: true, size: storedSize, ext: pathExt };
  } catch (error) {
    console.error('[storage] Verification failed:', error);
    return {
      ok: false,
      status: 502,
      error:
        error instanceof Error && error.message
          ? `Could not verify the uploaded file: ${error.message}`
          : 'Could not verify the uploaded file.',
    };
  }
}

async function removePublicationFile(path) {
  if (!path) return false;

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.storage
      .from(PUBLICATIONS_BUCKET)
      .remove([path]);

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

export async function downloadPublicationFile(path) {
  if (!path) return { ok: false, error: 'No file path given.' };

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.storage
      .from(PUBLICATIONS_BUCKET)
      .download(path);

    if (error || !data) {
      console.error('[storage] Could not download file', path, error);
      return { ok: false, error: 'Could not open this download.' };
    }

    return { ok: true, blob: data };
  } catch (error) {
    console.error('[storage] Could not download file', path, error);
    return { ok: false, error: 'Could not open this download.' };
  }
}

export async function createSignedDownloadUrl(path, options = {}) {
  const { expiresIn = 600, downloadAs } = options;
  if (!path) return null;

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.storage
      .from(PUBLICATIONS_BUCKET)
      .createSignedUrl(
        path,
        expiresIn,
        downloadAs ? { download: downloadAs } : undefined,
      );

    if (error || !data?.signedUrl) {
      console.error('[storage] Could not sign Supabase URL for', path, error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('[storage] Could not sign Supabase URL for', path, error);
    return null;
  }
}
