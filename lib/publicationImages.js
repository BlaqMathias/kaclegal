/**
 * Client-safe helpers/constants for publication cover images.
 */

/** Public storage bucket that holds optimized publication cover images. */
export const PUBLICATION_IMAGES_BUCKET = 'publication-images';

/** Private temporary bucket used while source images are being optimized. */
export const PUBLICATION_IMAGE_STAGING_BUCKET = 'publication-image-staging';

/**
 * Return the public URL for a stored image path.
 *
 * @param {string|null|undefined} path
 * @returns {string}
 */
export function resolvePublicationImageUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;

  // Preserve legacy covers that still live inside this app's public/ folder.
  if (String(path).startsWith('/')) return path;

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return path;

  const encodedPath = String(path)
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');

  return `${base}/storage/v1/object/public/${PUBLICATION_IMAGES_BUCKET}/${encodedPath}`;
}
