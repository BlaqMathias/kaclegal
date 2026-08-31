import { createBrowserClient } from '@supabase/ssr';

/**
 * Browser-side Supabase client (PUBLIC anon key only).
 *
 * Used by exactly two Client Components: the admin login form (to call
 * `signInWithPassword`) and the logout button (to call `signOut`). Sessions are
 * persisted as cookies rather than localStorage, which is what lets
 * `middleware.js` and the server clients see the same session.
 *
 * The service-role key must never be imported into a Client Component — that
 * lives only in `lib/supabase.js`, which is server-only.
 */

/** @type {import('@supabase/supabase-js').SupabaseClient | null} */
let cachedClient = null;

/**
 * Get (and memoise) the browser Supabase client.
 *
 * Memoised so repeated renders reuse one client — multiple instances would each
 * attach their own auth listener and fight over token refresh.
 *
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 * @throws {Error} If the public environment variables are not set.
 */
export function createSupabaseBrowserClient() {
  if (cachedClient) {
    return cachedClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment.',
    );
  }

  cachedClient = createBrowserClient(url, anonKey);
  return cachedClient;
}
