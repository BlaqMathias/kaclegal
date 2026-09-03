import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import {
  CHARGE_SUCCESS_EVENT,
  REFUND_PROCESSED_EVENT,
  verifyWebhookSignature,
} from '@/lib/paystack';
import { getOrCreateDownloadToken } from '@/lib/tokens';
import { sendPurchaseReceiptOnce } from '@/lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-paystack-signature');

  if (!verifyWebhookSignature(rawBody, signature)) {
    console.warn('[paystack/webhook] Invalid signature.');
    return NextResponse.json(
      { ok: false, error: 'Invalid signature.' },
      { status: 401 },
    );
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch (error) {
    console.error('[paystack/webhook] Invalid JSON:', error);
    return NextResponse.json({ ok: true });
  }

  try {
    const supabase = getSupabaseAdmin();

    if (payload?.event === REFUND_PROCESSED_EVENT) {
      const reference = String(
        payload?.data?.transaction_reference ?? '',
      ).trim();

      if (!reference) {
        return NextResponse.json({ ok: true });
      }

      const now = new Date().toISOString();
      const { error: refundError } = await supabase
        .from('transactions')
        .update({
          status: 'refunded',
          refunded_at: now,
          updated_at: now,
        })
        .eq('reference', reference);

      if (refundError) {
        console.error('[paystack/webhook] Could not record refund:', refundError);
        return NextResponse.json({ ok: false }, { status: 500 });
      }

      const { error: revokeError } = await supabase
        .from('downloads')
        .update({
          revoked_at: now,
          updated_at: now,
        })
        .eq('transaction_reference', reference);

      if (revokeError) {
        console.error(
          '[paystack/webhook] Could not revoke refunded download:',
          revokeError,
        );
        return NextResponse.json({ ok: false }, { status: 500 });
      }

      return NextResponse.json({ ok: true });
    }

    if (payload?.event !== CHARGE_SUCCESS_EVENT) {
      return NextResponse.json({ ok: true });
    }

    const reference = String(payload?.data?.reference ?? '').trim();
    const paidAmountKobo = payload?.data?.amount;
    const chargeStatus = payload?.data?.status;

    if (!reference || chargeStatus !== 'success') {
      return NextResponse.json({ ok: true });
    }

    const { data: transaction, error: lookupError } = await supabase
      .from('transactions')
      .select(
        'reference, publication_id, buyer_email, amount, status, completed_at, publications ( title )',
      )
      .eq('reference', reference)
      .maybeSingle();

    if (lookupError) {
      console.error('[paystack/webhook] Transaction lookup failed:', lookupError);
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    if (!transaction) {
      console.warn('[paystack/webhook] Unknown transaction:', reference);
      return NextResponse.json({ ok: true });
    }

    if (transaction.status === 'refunded') {
      return NextResponse.json({ ok: true });
    }

    const expectedAmountKobo = transaction.amount * 100;
    if (paidAmountKobo !== expectedAmountKobo) {
      console.error('[paystack/webhook] Amount mismatch:', {
        reference,
        expectedAmountKobo,
        paidAmountKobo,
      });
      return NextResponse.json({ ok: true });
    }

    const completedAt =
      payload?.data?.paid_at || new Date().toISOString();
    const now = new Date().toISOString();

    const { data: completedTransaction, error: completeError } = await supabase
      .from('transactions')
      .update({
        status: 'completed',
        completed_at: transaction.completed_at || completedAt,
        abandoned_at: null,
        updated_at: now,
      })
      .eq('reference', reference)
      .neq('status', 'refunded')
      .select('status')
      .maybeSingle();

    if (completeError) {
      console.error('[paystack/webhook] Could not complete transaction:', completeError);
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    // A refund event may race this charge-success delivery. If the refund won,
    // do not recreate access or send a receipt after access was revoked.
    if (!completedTransaction) {
      return NextResponse.json({ ok: true });
    }

    const tokenResult = await getOrCreateDownloadToken({
      transactionReference: reference,
      publicationId: transaction.publication_id,
    });

    if (!tokenResult.ok) {
      console.error(
        '[paystack/webhook] Could not create entitlement:',
        tokenResult.error,
      );
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    try {
      await sendPurchaseReceiptOnce({
        buyerEmail: transaction.buyer_email,
        publicationTitle:
          transaction.publications?.title ?? 'your publication',
        amountNaira: transaction.amount,
        reference,
        purchasedAt: completedAt,
      });
    } catch (emailError) {
      console.error(
        '[paystack/webhook] Purchase receipt email failed:',
        emailError,
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[paystack/webhook] Unexpected error:', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
