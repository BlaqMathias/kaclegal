import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { generateReference } from '@/lib/paystack';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Reasonable-enough email shape check. Paystack itself validates it further. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Matches a canonical UUID. */
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * POST /api/paystack/initiate — step 1 of the payment flow.
 *
 * Body: `{ publicationId: string, buyerEmail: string }`
 *
 * This is the ONLY place the price for a purchase is decided, and it is read
 * from the `publications` table — never from anything the client sends. A
 * `pending` transaction row is created here with that price, and every later
 * step (verify, webhook) checks against THIS recorded amount, not against
 * whatever Paystack or the browser later claims was charged.
 *
 * @param {Request} request
 */
export async function POST(request) {
  const body = await request.json().catch(() => null);
  const publicationId = String(body?.publicationId ?? '').trim();
  const buyerEmail = String(body?.buyerEmail ?? '').trim().toLowerCase();

  if (!UUID_PATTERN.test(publicationId)) {
    return NextResponse.json(
      { ok: false, error: 'That publication could not be found.' },
      { status: 404 },
    );
  }

  if (!EMAIL_PATTERN.test(buyerEmail)) {
    return NextResponse.json(
      { ok: false, error: 'Enter a valid email address.' },
      { status: 400 },
    );
  }

  const supabase = getSupabaseAdmin();

  const { data: publication, error: lookupError } = await supabase
    .from('publications')
    .select('id, is_paid, price_naira, status')
    .eq('id', publicationId)
    .maybeSingle();

  if (lookupError) {
    console.error('[paystack/initiate] Publication lookup failed:', lookupError);
    return NextResponse.json(
      { ok: false, error: 'Could not start this purchase. Please try again.' },
      { status: 500 },
    );
  }

  // Not found, unpublished, or free: all of these get the same generic 404.
  // A distinct error for "this one exists but is free" would confirm the
  // publication's id and paid status to a caller who should not be probing it.
  if (!publication || publication.status !== 'published' || !publication.is_paid) {
    return NextResponse.json(
      { ok: false, error: 'That publication could not be found.' },
      { status: 404 },
    );
  }

  // Enforced by a database constraint in Phase 6 (a paid item must carry a
  // positive price), so this should be unreachable — but never trust that from
  // a payment code path. Treat a violation as a data problem, not a 404.
  if (!publication.price_naira || publication.price_naira <= 0) {
    console.error(
      '[paystack/initiate] Paid publication has no valid price:',
      publication.id,
    );
    return NextResponse.json(
      { ok: false, error: 'This publication is not available for purchase right now.' },
      { status: 500 },
    );
  }

  const reference = generateReference();

  const { error: insertError } = await supabase.from('transactions').insert({
    reference,
    publication_id: publication.id,
    buyer_email: buyerEmail,
    amount: publication.price_naira,
    status: 'pending',
  });

  if (insertError) {
    console.error('[paystack/initiate] Could not create transaction:', insertError);
    return NextResponse.json(
      { ok: false, error: 'Could not start this purchase. Please try again.' },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    reference,
    // Paystack's Popup expects kobo, not Naira. Computed here, from the
    // database value, so the client never supplies the amount it will be
    // charged.
    amountKobo: publication.price_naira * 100,
    email: buyerEmail,
  });
}
