/**
 * Who counts as an administrator.
 *
 * This module is deliberately dependency-free so that BOTH `middleware.js` (Edge
 * runtime) and `lib/auth.js` (Node runtime) can import it. Anything that reaches
 * for `next/headers` or the Supabase SDK cannot be used from middleware, which is
 * why this check lives on its own.
 *
 * Why an allowlist is necessary rather than paranoid: a valid Supabase session
 * only proves "this is *a* user of the project". It does not prove "this is the
 * firm's administrator". Supabase Auth exposes its own signup endpoint at
 * `/auth/v1/signup`, reachable by anyone holding the anon key — and the anon key
 * ships in the public JavaScript bundle by design. So unless email sign-ups are
 * switched off in the Supabase dashboard AND the identity is checked here, a
 * stranger could register an account and be treated as the admin.
 *
 * Both defences are applied. This file is the one that cannot be undone by a
 * misclick in a dashboard.
 */

/**
 * Read the configured admin addresses.
 *
 * `ADMIN_EMAILS` is a comma-separated list; in practice it holds exactly one
 * address. It has no `NEXT_PUBLIC_` prefix, so it is never sent to the browser.
 *
 * @returns {string[]} Lower-cased, trimmed addresses. Empty if unconfigured.
 */
export function getAdminEmails() {
  const raw = process.env.ADMIN_EMAILS ?? process.env.ADMIN_EMAIL ?? '';

  return raw
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Is this address the administrator?
 *
 * Fails CLOSED when `ADMIN_EMAILS` is unset: an empty allowlist admits nobody.
 * The alternative — treating "unconfigured" as "allow everyone" — would turn a
 * forgotten environment variable into an open door, which is exactly the failure
 * mode this check exists to prevent.
 *
 * @param {string | null | undefined} email - Address from the verified session.
 * @returns {boolean} True only if the address is on the allowlist.
 */
export function isAdminEmail(email) {
  if (!email) return false;

  const allowed = getAdminEmails();
  if (allowed.length === 0) {
    console.error(
      '[adminAccess] ADMIN_EMAILS is not set, so no account can be treated as an administrator. Set it in .env.local to the admin address.',
    );
    return false;
  }

  return allowed.includes(email.trim().toLowerCase());
}

/**
 * Is this verified Supabase user the administrator?
 *
 * @param {{email?: string | null} | null | undefined} user - A user object from `auth.getUser()`.
 * @returns {boolean}
 */
export function isAdminUser(user) {
  return isAdminEmail(user?.email);
}
