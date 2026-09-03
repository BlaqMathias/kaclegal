import { createHmac, randomBytes } from 'node:crypto';
import { getSupabaseAdmin } from '@/lib/supabase';

/**
 * Paid-publication download entitlement helpers — SERVER ONLY.
 *
 * Transactions record money. The `downloads` table records access to a file.
 * Keeping those responsibilities separate makes payment retries, recovery and
 * download analytics independent from one another.
 */

const TOKEN_TTL_HOURS = 24;
const MAX_DOWNLOADS = 3;

function getTokenSecret() {
  const secret = process.env.DOWNLOAD_TOKEN_SECRET;
  if (!secret) {
    throw new Error('DOWNLOAD_TOKEN_SECRET is not set.');
  }
  return secret;
}

function generateToken() {
  const random = randomBytes(32);
  return createHmac('sha256', getTokenSecret()).update(random).digest('base64url');
}

function expiryFromNow() {
  return new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000).toISOString();
}

/**
 * Get the existing entitlement for a transaction or create it exactly once.
 * `downloads.transaction_reference` is unique, so verify + webhook can safely
 * race without creating duplicate access records.
 */
export async function getOrCreateDownloadToken({
  transactionReference,
  publicationId,
}) {
  const supabase = getSupabaseAdmin();

  const { data: insertedRows, error: insertError } = await supabase
    .from('downloads')
    .upsert(
      {
        transaction_reference: transactionReference,
        publication_id: publicationId,
        token: generateToken(),
        expires_at: expiryFromNow(),
        download_count: 0,
        max_downloads: MAX_DOWNLOADS,
      },
      { onConflict: 'transaction_reference', ignoreDuplicates: true },
    )
    .select('token');

  if (insertError) {
    console.error('[downloads] Could not create entitlement:', insertError);
    return { ok: false, error: 'Could not prepare your download.' };
  }

  const justCreated = Array.isArray(insertedRows) && insertedRows.length > 0;

  const { data, error } = await supabase
    .from('downloads')
    .select('token, expires_at, download_count, max_downloads, revoked_at')
    .eq('transaction_reference', transactionReference)
    .maybeSingle();

  if (error || !data) {
    console.error('[downloads] Could not read entitlement:', error);
    return { ok: false, error: 'Could not prepare your download.' };
  }

  return {
    ok: true,
    justCreated,
    token: data.token,
    expiresAt: data.expires_at,
    downloadsRemaining: Math.max(
      (data.max_downloads ?? MAX_DOWNLOADS) - (data.download_count ?? 0),
      0,
    ),
  };
}

/**
 * Read-only entitlement check used by both the download page and file route.
 * Merely opening/refreshing the page never consumes a download.
 */
export async function peekDownloadToken(token) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('downloads')
    .select(
      `
        expires_at,
        download_count,
        max_downloads,
        revoked_at,
        transaction_reference,
        publications ( id, slug, title, type, file_path ),
        transactions ( buyer_email, amount, status, created_at, completed_at )
      `,
    )
    .eq('token', token)
    .maybeSingle();

  if (error) {
    console.error('[downloads] Could not look up entitlement:', error);
    return { ok: false, reason: 'error' };
  }

  if (!data) return { ok: false, reason: 'not_found' };
  if (data.revoked_at) return { ok: false, reason: 'revoked' };
  if (data.transactions?.status === 'refunded') {
    return { ok: false, reason: 'revoked' };
  }
  if (new Date(data.expires_at).getTime() < Date.now()) {
    return { ok: false, reason: 'expired' };
  }

  const maxDownloads = data.max_downloads ?? MAX_DOWNLOADS;
  const downloadCount = data.download_count ?? 0;
  if (downloadCount >= maxDownloads) {
    return { ok: false, reason: 'exhausted' };
  }

  if (!data.publications?.id || !data.publications?.file_path) {
    return { ok: false, reason: 'error' };
  }

  return {
    ok: true,
    publication: data.publications,
    transaction: {
      reference: data.transaction_reference,
      buyerEmail: data.transactions?.buyer_email ?? '',
      amount: data.transactions?.amount ?? null,
      purchasedAt:
        data.transactions?.completed_at ?? data.transactions?.created_at ?? null,
    },
    expiresAt: data.expires_at,
    downloadCount,
    maxDownloads,
    downloadsRemaining: Math.max(maxDownloads - downloadCount, 0),
  };
}

/**
 * Atomically record a paid download after the file has already been loaded from
 * private storage. Storage failures therefore do not consume an attempt.
 */
export async function recordPaidDownload(token) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.rpc('record_paid_download', {
    p_token: token,
  });

  if (error) {
    console.error('[downloads] record_paid_download RPC failed:', error);
    return { ok: false, reason: 'error' };
  }

  const result = Array.isArray(data) ? data[0] : data;
  if (!result?.ok) {
    return { ok: false, reason: result?.reason ?? 'error' };
  }

  return {
    ok: true,
    publicationId: result.publication_id,
    downloadCount: result.download_count,
    downloadsRemaining: result.downloads_remaining,
  };
}

/**
 * Recover a completed purchase using the buyer email + Paystack reference.
 * Recovery rotates the old token immediately and creates a fresh 24-hour,
 * three-successful-download access window.
 */
export async function recoverDownloadToken({
  transactionReference,
  buyerEmail,
}) {
  const supabase = getSupabaseAdmin();
  const freshToken = generateToken();
  const freshExpiry = expiryFromNow();

  const { data, error } = await supabase.rpc('recover_download_entitlement', {
    p_reference: String(transactionReference ?? '').trim(),
    p_email: String(buyerEmail ?? '').trim().toLowerCase(),
    p_new_token: freshToken,
    p_expires_at: freshExpiry,
  });

  if (error) {
    console.error('[downloads/recover] Recovery RPC failed:', error);
    return { ok: false, reason: 'error' };
  }

  const result = Array.isArray(data) ? data[0] : data;
  if (!result?.ok) {
    return { ok: false, reason: result?.reason ?? 'not_found' };
  }

  return {
    ok: true,
    token: freshToken,
    expiresAt: freshExpiry,
    downloadsRemaining: MAX_DOWNLOADS,
  };
}
