import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  const body = await request.json().catch(() => null);
  const reference = String(body?.reference ?? '').trim();
  const buyerEmail = String(body?.buyerEmail ?? '').trim().toLowerCase();

  if (!reference || !buyerEmail) {
    return NextResponse.json({ ok: true });
  }

  const now = new Date().toISOString();
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('transactions')
    .update({
      status: 'abandoned',
      abandoned_at: now,
      updated_at: now,
    })
    .eq('reference', reference)
    .eq('buyer_email', buyerEmail)
    .eq('status', 'pending');

  if (error) {
    console.error('[paystack/abandon] Could not mark transaction abandoned:', error);
  }

  // This is a best-effort UX/analytics signal from the browser. Never make the
  // popup close path noisy for the buyer.
  return NextResponse.json({ ok: true });
}
