import { createHmac, randomBytes } from 'node:crypto';
import { getSupabaseAdmin } from '@/lib/supabase';

/**
 * Download token issuance and validation — SERVER ONLY.
 *
 * A token is the only thing that appears in a public URL (`/download/[token]`)
 * for a paid publication. See `supabase/payments.sql` for why it is stored as
 * plain text rather than a hash, and why `transaction_reference` being unique
 * is what makes token creation safe to call from two different routes
 * (`verify` and `webhook`) without any coordination between them.
 */

/** How long a download link stays valid after purchase. */
const TOKEN_TTL_HOURS = 24;

/** How many times the file may be downloaded before the link is spent. */
const MAX_DOWNLOADS = 2;

/**
 * Read the download-token signing secret, failing loudly if unset.
 *
 * @returns {string}
 * @throws {Error} If DOWNLOAD_TOKEN_SECRET is not set.
 */
function getTokenSecret() {
  const secret = process.env.DOWNLOAD_TOKEN_SECRET;
  if (!secret) {
    throw new Error('DOWNLOAD_TOKEN_SECRET is not set.');
  }
  return secret;
}

/**
 * Generate a single opaque, unguessable token.
 *
 * 32 bytes of CSPRNG output is already unguessable on its own; HMAC-ing it with
 * a server-held secret before encoding is an additional, low-cost layer on top
 * of that — it means even a hypothetical weakness in the random source alone
 * would not be enough to predict a valid token.
 *
 * @returns {string} A URL-safe token, ~43 characters.
 */
function generateToken() {
  const random = randomBytes(32);
  return createHmac('sha256', getTokenSecret()).update(random).digest('base64url');
}

/**
 * Get the existing download token for a transaction, or create one.
 *
 * Safe to call from both `/api/paystack/verify` and `/api/paystack/webhook`
 * for the same transaction — `transaction_reference` is UNIQUE on
 * `download_tokens`, so the `on conflict ... do nothing` below means whichever
 * caller gets there first wins, and the other simply reads back the same row.
 * No locking or coordination between the two routes is needed.
 *
 * @param {object} params
 * @param {string} params.transactionReference
 * @param {string} params.publicationId
 * @returns {Promise<{ok: true, justCreated: boolean, token: string, expiresAt: string, downloadsRemaining: number} | {ok: false, error: string}>}
 */
export async function getOrCreateDownloadToken({ transactionReference, publicationId }) {
  const supabase = getSupabaseAdmin();

  const expiresAt = new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000).toISOString();

  const { data: insertedRows, error: insertError } = await supabase
    .from('download_tokens')
    .upsert(
      {
        token: generateToken(),
        transaction_reference: transactionReference,
        publication_id: publicationId,
        expires_at: expiresAt,
        downloads_remaining: MAX_DOWNLOADS,
      },
      { onConflict: 'transaction_reference', ignoreDuplicates: true },
    )
    .select();

  if (insertError) {
    console.error('[tokens] Could not create download token:', insertError);
    return { ok: false, error: 'Could not prepare your download link.' };
  }

  // `insertedRows` is only non-empty when THIS call is the one that actually
  // created the row — with `ignoreDuplicates`, a call that lost the race to a
  // concurrent caller (verify vs. webhook, whichever runs second) gets back an
  // empty array here instead of an error. Whoever sees `justCreated: true` is
  // the one responsible for sending the purchase confirmation email — this is
  // what stops the buyer receiving two copies of it.
  const justCreated = Array.isArray(insertedRows) && insertedRows.length > 0;

  // Always read back by transaction_reference, regardless of whether THIS call's
  // insert actually landed — that is what makes this function idempotent.
  const { data, error: selectError } = await supabase
    .from('download_tokens')
    .select('token, expires_at, downloads_remaining')
    .eq('transaction_reference', transactionReference)
    .maybeSingle();

  if (selectError || !data) {
    console.error('[tokens] Could not read back download token:', selectError);
    return { ok: false, error: 'Could not prepare your download link.' };
  }

  return {
    ok: true,
    justCreated,
    token: data.token,
    expiresAt: data.expires_at,
    downloadsRemaining: data.downloads_remaining,
  };
}

/**
 * Read-only check of a token's status, for rendering the download page.
 *
 * Deliberately does NOT spend a download — visiting the page to see whether a
 * link still works should not itself use up one of the buyer's downloads. Only
 * `consumeDownloadToken()` (called when the file is actually requested) does
 * that.
 *
 * @param {string} token
 * @returns {Promise<
 *   | {ok: true, publication: {id: string, slug: string, title: string, type: string}, expiresAt: string, downloadsRemaining: number}
 *   | {ok: false, reason: 'not_found' | 'expired' | 'exhausted' | 'error'}
 * >}
 */
export async function peekDownloadToken(token) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('download_tokens')
    .select(
      'expires_at, downloads_remaining, publications ( id, slug, title, type )',
    )
    .eq('token', token)
    .maybeSingle();

  if (error) {
    console.error('[tokens] Could not look up token:', error);
    return { ok: false, reason: 'error' };
  }

  if (!data) {
    return { ok: false, reason: 'not_found' };
  }

  if (new Date(data.expires_at).getTime() < Date.now()) {
    return { ok: false, reason: 'expired' };
  }

  if (data.downloads_remaining <= 0) {
    return { ok: false, reason: 'exhausted' };
  }

  return {
    ok: true,
    publication: data.publications,
    expiresAt: data.expires_at,
    downloadsRemaining: data.downloads_remaining,
  };
}

/**
 * Atomically validate a token and spend one download, in a single database
 * round trip. This is the ONLY function that should ever be called from the
 * route that actually serves the file — see `consume_download_token()` in
 * `supabase/payments.sql` for why a plain select-then-update from here would
 * be a race condition.
 *
 * @param {string} token
 * @returns {Promise<{ok: true, publicationId: string} | {ok: false, reason: 'not_found' | 'expired' | 'exhausted' | 'error'}>}
 */
export async function consumeDownloadToken(token) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase.rpc('consume_download_token', {
    p_token: token,
  });

  if (error) {
    console.error('[tokens] consume_download_token RPC failed:', error);
    return { ok: false, reason: 'error' };
  }

  const result = Array.isArray(data) ? data[0] : data;

  if (!result?.ok) {
    return { ok: false, reason: result?.reason ?? 'error' };
  }

  return { ok: true, publicationId: result.publication_id };
}
