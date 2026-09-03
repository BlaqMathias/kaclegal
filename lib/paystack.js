import { randomBytes } from 'node:crypto';
import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Paystack integration — SERVER ONLY.
 *
 * Every function here reads `PAYSTACK_SECRET_KEY`, which must never reach the
 * browser. The public key (`NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`) is read directly
 * by the client-side Buy button component instead — it is genuinely public by
 * design (Paystack's Popup script needs it in the browser), so it has no
 * business living in this server-only module.
 *
 * There is no `PAYSTACK_WEBHOOK_SECRET`. Paystack does not issue a separate
 * webhook secret: webhook requests are signed with the account's existing
 * secret key via HMAC-SHA512, which is exactly what `verifyWebhookSignature`
 * below recomputes.
 */

const PAYSTACK_API_BASE = 'https://api.paystack.co';

/** The only webhook event this build acts on. Everything else is acknowledged and ignored. */
export const CHARGE_SUCCESS_EVENT = 'charge.success';
export const REFUND_PROCESSED_EVENT = 'refund.processed';

/**
 * Read the Paystack secret key, failing loudly if it is not configured.
 *
 * @returns {string}
 * @throws {Error} If PAYSTACK_SECRET_KEY is not set.
 */
function getSecretKey() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) {
    throw new Error('PAYSTACK_SECRET_KEY is not set.');
  }
  return key;
}

/**
 * Generate a unique, human-traceable transaction reference.
 *
 * Not a security boundary by itself — uniqueness is enforced by the database's
 * `unique` constraint on `transactions.reference` — but collisions this scheme
 * could plausibly produce are astronomically unlikely regardless.
 *
 * @returns {string} e.g. `kac_m1a2b3_9f8e7d6c5b4a`
 */
export function generateReference() {
  return `kac_${Date.now().toString(36)}_${randomBytes(6).toString('hex')}`;
}

/**
 * Call Paystack's own verify-transaction endpoint.
 *
 * This is the only source of truth for "did this payment actually succeed" —
 * a client-side Popup callback reporting success is never sufficient on its
 * own, per this phase's security design.
 *
 * @param {string} reference - The transaction reference to verify.
 * @returns {Promise<{ok: true, data: object} | {ok: false, error: string}>}
 */
export async function verifyTransaction(reference) {
  try {
    const response = await fetch(
      `${PAYSTACK_API_BASE}/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: { Authorization: `Bearer ${getSecretKey()}` },
        cache: 'no-store',
      },
    );

    const body = await response.json().catch(() => null);

    if (!response.ok || !body?.status) {
      console.error('[paystack] Verify call failed:', response.status, body);
      return { ok: false, error: 'Could not verify this payment with Paystack.' };
    }

    return { ok: true, data: body.data };
  } catch (error) {
    console.error('[paystack] Verify call threw:', error);
    return { ok: false, error: 'Could not reach Paystack to verify this payment.' };
  }
}

/**
 * Verify a webhook request's `x-paystack-signature` header.
 *
 * Recomputes the HMAC-SHA512 hex digest of the RAW request body using the
 * account's secret key, and compares it to the header in constant time.
 * `rawBody` must be the exact bytes Paystack sent — parsing to JSON and
 * re-stringifying first would very likely change whitespace and break the
 * comparison, which is why the caller passes `request.text()`, not
 * `request.json()`.
 *
 * @param {string} rawBody - The unparsed request body.
 * @param {string|null} signatureHeader - The `x-paystack-signature` header value.
 * @returns {boolean} True only if the signature matches.
 */
export function verifyWebhookSignature(rawBody, signatureHeader) {
  if (!signatureHeader) return false;

  const expected = createHmac('sha512', getSecretKey()).update(rawBody).digest('hex');

  const expectedBuffer = Buffer.from(expected, 'utf8');
  const receivedBuffer = Buffer.from(signatureHeader, 'utf8');

  // timingSafeEqual throws on mismatched lengths rather than returning false,
  // so that case is handled explicitly first.
  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, receivedBuffer);
}
