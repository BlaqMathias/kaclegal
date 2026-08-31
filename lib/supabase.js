import { createClient } from '@supabase/supabase-js';

/**
 * Server-only Supabase client.
 *
 * This module uses the SERVICE ROLE key, which bypasses row-level security and
 * must NEVER reach the browser. Import it only from server code (API route
 * handlers under `app/api/**`, server actions, etc.). It is never imported by a
 * Client Component, so the key stays out of the client bundle.
 *
 * The client is created lazily (on first use) rather than at module load, so a
 * missing env var surfaces as a clear runtime error in the request handler
 * instead of crashing the build.
 */

/** @type {import('@supabase/supabase-js').SupabaseClient | null} */
let cachedClient = null;

/**
 * Get (and memoise) the service-role Supabase client.
 *
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 * @throws {Error} If the required environment variables are not set.
 */
export function getSupabaseAdmin() {
  if (cachedClient) {
    return cachedClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment.'
    );
  }

  cachedClient = createClient(url, serviceRoleKey, {
    auth: {
      // No user sessions on the server — we only ever act as the service role.
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cachedClient;
}
