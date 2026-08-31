import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';

/**
 * Server-side Supabase clients that use the PUBLIC (anon) key.
 *
 * Two distinct jobs, deliberately kept separate:
 *
 * 1. `createSupabaseServerClient()` — cookie-bound. Reads and refreshes the
 *    admin's auth session from the request cookies, so `auth.getUser()` works
 *    inside Server Components and Route Handlers. This is how we know WHO is
 *    asking.
 *
 * 2. `createSupabasePublicClient()` — session-less. A plain anon client for
 *    genuinely public reads (the /publications pages). It never looks at
 *    cookies, so it can't accidentally inherit an admin session and leak a
 *    draft, and it doesn't opt a page into dynamic rendering by touching
 *    `next/headers`.
 *
 * Neither client can write to `publications`: row-level security grants the
 * anon and authenticated roles SELECT on published rows only, and no write
 * policy exists. All writes go through the admin API routes on the service-role
 * key (see `lib/supabase.js`).
 */

/**
 * Read the public Supabase credentials, failing loudly if they're missing.
 *
 * Called inside the factory functions rather than at module scope so that an
 * unconfigured environment surfaces as a request-time error instead of breaking
 * the build.
 *
 * @returns {{url: string, anonKey: string}}
 * @throws {Error} If either public env var is unset.
 */
function readPublicConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment.',
    );
  }

  return { url, anonKey };
}

/**
 * Create a cookie-bound anon client for the current request.
 *
 * Use this whenever the caller's identity matters — i.e. anything that ends up
 * calling `auth.getUser()`.
 *
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
export function createSupabaseServerClient() {
  const { url, anonKey } = readPublicConfig();
  const cookieStore = cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        // Server Components render with a read-only cookie store, so writing
        // throws there. That's expected and harmless: `middleware.js` already
        // refreshed the session cookie for this request, so the only thing lost
        // is a duplicate write. Route Handlers and Server Actions DO get a
        // writable store, and this is where their refreshed cookies land.
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          /* read-only cookie store — see comment above */
        }
      },
    },
  });
}

/**
 * Create a session-less anon client for public reads.
 *
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
export function createSupabasePublicClient() {
  const { url, anonKey } = readPublicConfig();

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
