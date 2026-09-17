import { getSupabaseAdmin } from '@/lib/supabase';

/**
 * Read just enough of an upload stream to validate its leading bytes, then
 * rebuild a stream that still contains those sniffed bytes for onward upload.
 *
 * @param {ReadableStream<Uint8Array>|null|undefined} body
 * @param {number} [maxBytes=65536]
 * @returns {Promise<{ok: true, headBuffer: Buffer, stream: ReadableStream<Uint8Array>} | {ok: false, error: string}>}
 */
export async function sniffUploadStream(body, maxBytes = 65536) {
  if (!body || typeof body.getReader !== 'function') {
    return { ok: false, error: 'No upload body was received.' };
  }

  const reader = body.getReader();
  const headChunks = [];
  let headSize = 0;
  let reachedEnd = false;

  while (headSize < maxBytes) {
    const { value, done } = await reader.read();

    if (done) {
      reachedEnd = true;
      break;
    }

    if (value && value.length > 0) {
      headChunks.push(value);
      headSize += value.length;
    }
  }

  const headBuffer = Buffer.concat(headChunks.map((chunk) => Buffer.from(chunk)));

  const stream = new ReadableStream({
    start(controller) {
      headChunks.forEach((chunk) => controller.enqueue(chunk));

      if (reachedEnd) {
        controller.close();
        return;
      }

      const pump = () => {
        reader
          .read()
          .then(({ value, done }) => {
            if (done) {
              controller.close();
              return;
            }

            if (value && value.length > 0) {
              controller.enqueue(value);
            }

            pump();
          })
          .catch((error) => controller.error(error));
      };

      pump();
    },
    cancel(reason) {
      return reader.cancel(reason);
    },
  });

  return { ok: true, headBuffer, stream };
}

/**
 * Stream bytes straight into a Supabase Storage bucket through the REST API.
 *
 * This avoids buffering the whole upload into the app server's memory.
 *
 * @param {object} params
 * @param {string} params.bucket
 * @param {string} params.path
 * @param {ReadableStream<Uint8Array>} params.stream
 * @param {string} params.contentType
 * @param {number} params.contentLength
 * @param {boolean} [params.upsert=false]
 * @returns {Promise<{ok: true} | {ok: false, status: number, error: string, details: string}>}
 */
export async function uploadStreamToStorage({
  bucket,
  path,
  stream,
  contentType,
  contentLength,
  upsert = false,
}) {
  // Reuse the existing env validation in the shared admin client helper.
  getSupabaseAdmin();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const encodedPath = String(path)
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');

  const endpoint = `${url}/storage/v1/object/${bucket}/${encodedPath}`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
        'content-type': contentType,
        'content-length': String(contentLength),
        'x-upsert': upsert ? 'true' : 'false',
      },
      body: stream,
      duplex: 'half',
    });

    if (!response.ok) {
      const details = await response.text().catch(() => '');
      return {
        ok: false,
        status: response.status,
        error: 'Could not store the upload. Please try again.',
        details,
      };
    }

    return { ok: true };
  } catch (error) {
    console.error('[uploadProxy] Storage upload failed:', error);
    return {
      ok: false,
      status: 502,
      error: 'Could not store the upload. Please try again.',
      details: String(error?.message || error),
    };
  }
}
