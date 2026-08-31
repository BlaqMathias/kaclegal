import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { isAdminUser } from '@/lib/adminAccess';

/**
 * Admin authentication helpers.
 *
 * Three deliberately different shapes, because a Server Component and a Route
 * Handler need to fail in different ways:
 *
 * - `getAdminUser()`   — returns the user or null. Never throws, never redirects.
 * - `requireAdminPage()` — redirects to /admin/login. For Server Components.
 * - `requireAdminApi()`  — returns the user or null so the caller can return a
 *                          JSON 401. NEVER redirects: an HTML redirect is a
 *                          useless response to a `fetch()`.
 *
 * Every one of these calls `auth.getUser()`, not `auth.getSession()`.
 * `getSession()` decodes whatever JWT is sitting in the cookie and trusts it;
 * `getUser()` sends it to Supabase to be verified. Since the cookie is
 * attacker-controllable input, only `getUser()` is a real authorisation check.
 *
 * Verifying the session is only half the job. A verified session proves the
 * visitor is *a* Supabase user, not that they are *the firm's administrator*, so
 * the identity is then checked against the `ADMIN_EMAILS` allowlist — see
 * `lib/adminAccess.js` for why that distinction matters.
 */

/**
 * Resolve the currently signed-in admin from the request cookies.
 *
 * Two conditions, both required: the session token verifies with Supabase, and
 * the resulting address is on the admin allowlist.
 *
 * Fails CLOSED: any error (bad token, unreachable Supabase, missing env vars)
 * resolves to null rather than propagating, so a misconfiguration can never
 * accidentally read as "authorised".
 *
 * @returns {Promise<import('@supabase/supabase-js').User | null>} The verified admin, or null.
 */
export async function getAdminUser() {
  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
      return null;
    }

    // Authenticated is not the same as authorised.
    if (!isAdminUser(data.user)) {
      console.warn(
        `[auth] Rejected a valid session for a non-admin address: ${data.user.email ?? 'unknown'}`,
      );
      return null;
    }

    return data.user;
  } catch (error) {
    // Most likely cause: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
    // are not set. Logged server-side so the reason is visible in the terminal
    // instead of looking like a wrong password.
    console.error('[auth] Could not verify admin session:', error);
    return null;
  }
}

/**
 * Guard a Server Component page. Redirects unauthenticated visitors to the
 * login form, preserving where they were headed.
 *
 * @param {string} [redirectedFrom] - Path to return to after a successful login.
 * @returns {Promise<import('@supabase/supabase-js').User>} The verified admin user.
 */
export async function requireAdminPage(redirectedFrom) {
  const user = await getAdminUser();

  if (!user) {
    const target = redirectedFrom
      ? `/admin/login?redirectedFrom=${encodeURIComponent(redirectedFrom)}`
      : '/admin/login';
    redirect(target);
  }

  return user;
}

/**
 * Guard a Route Handler.
 *
 * This is the check that actually protects data. `middleware.js` only issues an
 * HTML redirect for browser navigations to /admin pages — an API route can be
 * called directly with curl, from another origin, or after the middleware
 * matcher changes, so every admin route re-verifies the session itself.
 *
 * @returns {Promise<import('@supabase/supabase-js').User | null>} The verified admin user, or null.
 */
export async function requireAdminApi() {
  return getAdminUser();
}

/**
 * Standard JSON 401 body for admin API routes.
 *
 * @returns {{ok: false, error: string}}
 */
export function unauthorizedBody() {
  return { ok: false, error: 'Not authenticated.' };
}
