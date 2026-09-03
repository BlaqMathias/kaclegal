import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { verifyTransaction } from '@/lib/paystack';
import { getOrCreateDownloadToken } from '@/lib/tokens';
import { sendPurchaseReceiptOnce } from '@/lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
    .select(
      'reference, publication_id, buyer_email, amount, status, created_at, completed_at, publications ( title )',
    )
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

  if (transaction.status === 'refunded') {
    return NextResponse.json(
      { ok: false, error: 'This purchase has been refunded.' },
      { status: 400 },
    );
  }

  // Idempotent fast path: a webhook or earlier verify may already have
  // completed this exact reference. Reuse the same entitlement and retry the
  // receipt only if it has not already been sent.
  if (transaction.status === 'completed') {
    const existing = await getOrCreateDownloadToken({
      transactionReference: reference,
      publicationId: transaction.publication_id,
    });

    if (!existing.ok) {
      return NextResponse.json(
        { ok: false, error: existing.error },
        { status: 500 },
      );
    }

    try {
      await sendPurchaseReceiptOnce({
        buyerEmail: transaction.buyer_email,
        publicationTitle:
          transaction.publications?.title ?? 'your publication',
        amountNaira: transaction.amount,
        reference,
        purchasedAt: transaction.completed_at ?? transaction.created_at,
      });
    } catch (emailError) {
      console.error('[paystack/verify] Purchase receipt retry failed:', emailError);
    }

    return NextResponse.json({
      ok: true,
      token: existing.token,
      reference,
    });
  }

  const verification = await verifyTransaction(reference);
  if (!verification.ok) {
    return NextResponse.json(
      { ok: false, error: verification.error },
      { status: 502 },
    );
  }

  const { data } = verification;
  const paidAmountKobo = data?.amount;
  const expectedAmountKobo = transaction.amount * 100;

  const paymentSucceeded =
    data?.status === 'success' &&
    data?.reference === reference &&
    paidAmountKobo === expectedAmountKobo;

  if (!paymentSucceeded) {
    if (data?.status === 'failed') {
      await supabase
        .from('transactions')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('reference', reference)
        .in('status', ['pending', 'abandoned']);
    } else if (data?.status === 'success') {
      console.error('[paystack/verify] Amount/reference mismatch:', {
        reference,
        expectedAmountKobo,
        paidAmountKobo,
        paystackReference: data?.reference,
      });
    }

    return NextResponse.json(
      { ok: false, error: 'This payment could not be confirmed.' },
      { status: 400 },
    );
  }

  const completedAt =
    data?.paid_at || data?.paidAt || new Date().toISOString();

  const { data: completedTransaction, error: completeError } = await supabase
    .from('transactions')
    .update({
      status: 'completed',
      completed_at: transaction.completed_at || completedAt,
      abandoned_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('reference', reference)
    .neq('status', 'refunded')
    .select('status')
    .maybeSingle();

  if (completeError) {
    console.error('[paystack/verify] Could not complete transaction:', completeError);
    return NextResponse.json(
      { ok: false, error: 'Could not finalise this payment.' },
      { status: 500 },
    );
  }

  // A refund webhook can race this verification request. If it won the row
  // update first, no new entitlement or receipt may be created afterward.
  if (!completedTransaction) {
    return NextResponse.json(
      { ok: false, error: 'This purchase has been refunded.' },
      { status: 400 },
    );
  }

  const tokenResult = await getOrCreateDownloadToken({
    transactionReference: reference,
    publicationId: transaction.publication_id,
  });

  if (!tokenResult.ok) {
    return NextResponse.json(
      { ok: false, error: tokenResult.error },
      { status: 500 },
    );
  }

  // The receipt deliberately contains no download token/link.
  try {
    await sendPurchaseReceiptOnce({
      buyerEmail: transaction.buyer_email,
      publicationTitle: transaction.publications?.title ?? 'your publication',
      amountNaira: transaction.amount,
      reference,
      purchasedAt: completedAt,
    });
  } catch (emailError) {
    console.error('[paystack/verify] Purchase receipt email failed:', emailError);
  }

  return NextResponse.json({
    ok: true,
    token: tokenResult.token,
    reference,
  });
}
