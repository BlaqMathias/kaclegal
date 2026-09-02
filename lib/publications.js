/**
 * Shared publication constants and pure helpers.
 *
 * This module is deliberately CLIENT-SAFE: it imports nothing, touches no
 * environment variables, and never reaches for a Supabase client. That means
 * both server code (API routes, Server Components) and Client Components can
 * import it without dragging server-only code into the browser bundle.
 *
 * Anything that needs the service-role key belongs in `lib/storage.js` or
 * `lib/supabase.js` instead.
 */

/** Publication formats offered in the admin dropdown. */
export const PUBLICATION_TYPES = ['Book', 'Research Paper', 'Guide', 'Article'];

/** Publication lifecycle states. Drafts are invisible on the public site. */
export const PUBLICATION_STATUSES = ['draft', 'published'];

/** Hard ceiling on uploaded publication files: 25 MB. */
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

/**
 * Accepted upload MIME types mapped to the extension we store the file under.
 * The extension comes from THIS map, never from the client-supplied filename,
 * so a file called `invoice.pdf.exe` can't smuggle an extension into Storage.
 */
export const ALLOWED_UPLOAD_TYPES = {
  'application/pdf': 'pdf',
  'application/epub+zip': 'epub',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
};

/** `accept` attribute for the admin file input — a convenience hint only. */
export const UPLOAD_ACCEPT = '.pdf,.epub,.doc,.docx';

/** Hard ceiling on an uploaded publication cover image: 5 MB. */
export const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;

/**
 * Accepted cover-image MIME types mapped to the extension we store the file
 * under. Mirrors `ALLOWED_UPLOAD_TYPES` above — the extension comes from THIS
 * map, never from the client-supplied filename.
 */
export const ALLOWED_IMAGE_UPLOAD_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

/** `accept` attribute for the admin cover-image input — a convenience hint only. */
export const IMAGE_UPLOAD_ACCEPT = '.jpg,.jpeg,.png,.webp,.gif';

/**
 * MIME types browsers report when they have no idea what a file is. Windows in
 * particular reports `''` for `.epub` unless a reader is installed, so treating
 * these as "unsupported" would reject perfectly valid files. When one of these
 * shows up, the extension is resolved from the filename instead and the magic-byte
 * check in `lib/storage.js` does the real work of proving what the file is.
 */
export const UNKNOWN_UPLOAD_TYPES = ['', 'application/octet-stream'];

/**
 * Resolve the extension a filename implies, but only if it is on the allowlist.
 *
 * This never widens what is accepted: the returned value always comes from
 * `ALLOWED_UPLOAD_TYPES`, so an attacker renaming `payload.exe` to `payload.pdf`
 * gets `pdf` here and is then caught by the signature check.
 *
 * @param {string|null|undefined} filename - Client-supplied name.
 * @returns {string|null} An allowlisted extension, or null.
 */
export function extensionFromFilename(filename) {
  const match = /\.([a-z0-9]{2,5})$/i.exec(String(filename ?? '').trim());
  if (!match) return null;

  const ext = match[1].toLowerCase();
  return Object.values(ALLOWED_UPLOAD_TYPES).includes(ext) ? ext : null;
}

/**
 * Convert a title into a URL-safe slug.
 *
 * @param {string} value - Raw text (usually the publication title).
 * @returns {string} Lowercase hyphenated slug, or '' if nothing usable remains.
 */
export function slugify(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip combining accent marks
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');
}

/**
 * Format a whole-Naira amount for display.
 *
 * Prices are stored as whole Naira integers (no kobo), so this only ever needs
 * thousands separators. Grouped by hand rather than with `toLocaleString`, for
 * the same reason `formatDateUTC` below is hand-built: this renders on the server
 * and again during hydration, and ICU differences between the Node build and the
 * browser would show up as a React hydration mismatch.
 *
 * @param {number|string|null|undefined} amount - Whole Naira.
 * @returns {string} e.g. `₦15,000`, or '' when there is no amount.
 */
export function formatNaira(amount) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return '';

  const grouped = String(Math.abs(Math.round(value))).replace(
    /\B(?=(\d{3})+(?!\d))/g,
    ',',
  );

  return `${value < 0 ? '-' : ''}₦${grouped}`;
}

/**
 * Format a timestamp as a fixed UTC date string.
 *
 * Deliberately UTC and hand-built rather than `toLocaleDateString`: this runs in
 * both the server render and the browser hydration of the admin table, and any
 * timezone-dependent output would produce a React hydration mismatch.
 *
 * @param {string|Date|null|undefined} input - ISO timestamp or Date.
 * @returns {string} e.g. `28 Aug 2026`, or '—' when unparseable.
 */
export function formatDateUTC(input) {
  if (!input) return '—';
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return '—';

  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  return `${date.getUTCDate()} ${months[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/**
 * Human-readable file size, used in the admin upload confirmation.
 *
 * @param {number} bytes - Size in bytes.
 * @returns {string} e.g. `2.4 MB`.
 */
export function formatBytes(bytes) {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value <= 0) return '';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(0)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}
