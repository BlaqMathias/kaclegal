import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { verifyTransaction } from '@/lib/paystack';
import { getOrCreateDownloadToken } from '@/lib/tokens';
import { sendPurchaseConfirmation } from '@/lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/paystack/verify — step 2 of the payment flow.
 *
 * Body: `{ reference: string }`
 *
 * Called by the browser immediately after Paystack's Popup reports success —
 * but that report is client-controlled input, not proof of payment. This route
 * is what actually decides whether the purchase is honoured: it asks Paystack
 * directly (server-to-server, with the secret key) whether the payment really
 * succeeded, and cross-checks the amount against what was recorded at
 * `/api/paystack/initiate` time. Only then does it mint (or reuse) a download
 * token.
 *
 * This can safely run even if the webhook already completed the same
 * transaction first — see `getOrCreateDownloadToken()` for why that is
 * idempotent, and the `.eq('status', 'pending')` below for why re-completing an
 * already-completed transaction is harmless.
 *
 * @param {Request} request
 */
export async function POST(request) {
  const body = await request.json().catch(() => null);
  const reference = String(body?.reference ?? '').trim();

  if (!reference) {
    return NextResponse.json(
      { ok: false, error: 'Missing payment reference.' },
      { status: 400 },
    );
  }

  const supabase = getSupabaseAdmin();

  const { data: transaction, error: lookupError } = await supabase
    .from('transactions')
    .select('reference, publication_id, buyer_email, amount, status, publications ( title )')
    .eq('reference', reference)
    .maybeSingle();

  if (lookupError) {
    console.error('[paystack/verify] Transaction lookup failed:', lookupError);
    return NextResponse.json(
      { ok: false, error: 'Could not verify this payment.' },
      { status: 500 },
    );
  }

  if (!transaction) {
    return NextResponse.json(
      { ok: false, error: 'We could not find that transaction.' },
      { status: 404 },
    );
  }

  // A transaction already marked 'failed' does not get a second chance here —
  // if the buyer wants to try again, that is a new purchase with a new
  // reference, started from the publication page.
  if (transaction.status === 'failed') {
    return NextResponse.json(
      { ok: false, error: 'This payment attempt was not successful.' },
      { status: 400 },
    );
  }

  const verification = await verifyTransaction(reference);

  if (!verification.ok) {
    return NextResponse.json({ ok: false, error: verification.error }, { status: 502 });
  }

  const { data } = verification;
  const paidAmountKobo = data?.amount;
  const expectedAmountKobo = transaction.amount * 100;

  const paymentSucceeded =
    data?.status === 'success' &&
    data?.reference === reference &&
    paidAmountKobo === expectedAmountKobo;

  if (!paymentSucceeded) {
    if (data?.status !== 'success') {
      // A genuinely unsuccessful or abandoned payment — record it and stop.
      await supabase
        .from('transactions')
        .update({ status: 'failed' })
        .eq('reference', reference)
        .eq('status', 'pending');
    } else {
      // Paystack reports success, but the amount or reference does not match
      // what we recorded. This should never happen and is worth investigating
      // loudly rather than quietly failing the purchase — it is left 'pending'
      // rather than 'failed', deliberately, so it is not mistaken for a normal
      // declined payment during any later review.
      console.error(
        '[paystack/verify] Amount/reference mismatch on a reported success:',
        { reference, expectedAmountKobo, paidAmountKobo, paystackReference: data?.reference },
      );
    }

    return NextResponse.json(
      { ok: false, error: 'This payment could not be confirmed.' },
      { status: 400 },
    );
  }

  // Idempotent: if the webhook already completed this transaction, this
  // update simply matches zero rows and changes nothing.
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
    return NextResponse.json({ ok: false, error: tokenResult.error }, { status: 500 });
  }

  // Only the call that actually created the token sends the confirmation
  // email — if the webhook already created it first, that call already sent
  // it (or will), and sending here too would give the buyer two copies. A
  // failure to email is logged but never fails the request: the download
  // link itself is already valid regardless of whether this email arrives.
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
      console.error('[paystack/verify] Purchase confirmation email failed:', emailError);
    }
  }

  return NextResponse.json({ ok: true, token: tokenResult.token });
}
