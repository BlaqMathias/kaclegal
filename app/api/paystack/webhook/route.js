import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { CHARGE_SUCCESS_EVENT, verifyWebhookSignature } from '@/lib/paystack';
import { getOrCreateDownloadToken } from '@/lib/tokens';
import { sendPurchaseConfirmation } from '@/lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/paystack/webhook — the independent safety net.
 *
 * A buyer can close their browser, lose connectivity, or hit a bug in the
 * client right after paying but before `/api/paystack/verify` runs. This route
 * exists so the purchase is honoured regardless: Paystack calls it
 * server-to-server the moment a charge succeeds, independent of anything the
 * buyer's browser does or does not do afterwards.
 *
 * The raw body is read as TEXT, not JSON, and the signature is checked before
 * anything else happens — parsing first and verifying a re-serialised copy
 * would very likely produce different bytes than what Paystack actually sent
 * and signed, breaking verification in a way that fails ambiguously. Nothing
 * from the payload is used, logged as trustworthy, or acted upon until the
 * signature check has passed.
 *
 * Response codes are deliberate: 401 for a bad signature (never retried by
 * design), 200 for "verified, but nothing to do" (do not make Paystack retry
 * something that isn't actionable), and 500 only for a genuine failure on our
 * side that SHOULD be retried.
 *
 * @param {Request} request
 */
export async function POST(request) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-paystack-signature');

  if (!verifyWebhookSignature(rawBody, signature)) {
    console.warn('[paystack/webhook] Rejected a request with an invalid signature.');
    return NextResponse.json({ ok: false, error: 'Invalid signature.' }, { status: 401 });
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch (error) {
    console.error('[paystack/webhook] Signature valid but body is not valid JSON:', error);
    // The signature matched, so this is a Paystack quirk, not an attack — but
    // there is nothing to act on. Acknowledge so it is not retried forever.
    return NextResponse.json({ ok: true });
  }

  if (payload?.event !== CHARGE_SUCCESS_EVENT) {
    // Paystack sends many event types; this build only acts on a successful
    // charge. Anything else is acknowledged and ignored, not an error.
    return NextResponse.json({ ok: true });
  }

  const reference = payload?.data?.reference;
  const paidAmountKobo = payload?.data?.amount;
  const chargeStatus = payload?.data?.status;

  if (!reference) {
    console.warn('[paystack/webhook] charge.success event with no reference:', payload);
    return NextResponse.json({ ok: true });
  }

  try {
    const supabase = getSupabaseAdmin();

    const { data: transaction, error: lookupError } = await supabase
      .from('transactions')
      .select('reference, publication_id, buyer_email, amount, status, publications ( title )')
      .eq('reference', reference)
      .maybeSingle();

    if (lookupError) {
      // A real failure on our side — worth a retry, so this is the one case
      // that returns 500 rather than 200.
      console.error('[paystack/webhook] Transaction lookup failed:', lookupError);
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    if (!transaction) {
      // A charge.success for a reference we never created. Not something a
      // retry would fix — log it for investigation and acknowledge.
      console.warn('[paystack/webhook] No matching transaction for reference:', reference);
      return NextResponse.json({ ok: true });
    }

    if (chargeStatus !== 'success') {
      return NextResponse.json({ ok: true });
    }

    const expectedAmountKobo = transaction.amount * 100;
    if (paidAmountKobo !== expectedAmountKobo) {
      // Signature is valid, so this really did come from Paystack, but the
      // amount does not match what was recorded at initiate time. Do not
      // complete the purchase on a mismatch — log loudly for investigation.
      console.error('[paystack/webhook] Amount mismatch on charge.success:', {
        reference,
        expectedAmountKobo,
        paidAmountKobo,
      });
      return NextResponse.json({ ok: true });
    }

    // Idempotent: if /api/paystack/verify already completed this transaction,
    // this update matches zero rows and changes nothing.
    await supabase
      .from('transactions')
      .update({ status: 'completed' })
      .eq('reference', reference)
      .eq('status', 'pending');

    const tokenResult = await getOrCreateDownloadToken({
      transactionReference: reference,
      publicationId: transaction.publication_id,
    });

    if (!tokenResult.ok) {
      console.error('[paystack/webhook] Could not create download token:', tokenResult.error);
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    // See the matching comment in /api/paystack/verify — only whichever of
    // the two routes actually creates the token sends this email, so a buyer
    // whose browser is slow (verify runs after this) or who closed it
    // entirely (verify never runs) gets exactly one confirmation either way.
    if (tokenResult.justCreated) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
      try {
        await sendPurchaseConfirmation({
          buyerEmail: transaction.buyer_email,
          publicationTitle: transaction.publications?.title ?? 'your publication',
          downloadUrl: `${siteUrl}/download/${tokenResult.token}`,
          expiresAt: tokenResult.expiresAt,
          downloadsRemaining: tokenResult.downloadsRemaining,
        });
      } catch (emailError) {
        console.error('[paystack/webhook] Purchase confirmation email failed:', emailError);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[paystack/webhook] Unexpected error:', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
