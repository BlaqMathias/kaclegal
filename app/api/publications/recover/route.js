import { NextResponse } from 'next/server';
import { recoverDownloadToken } from '@/lib/tokens';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  const body = await request.json().catch(() => null);
  const reference = String(body?.reference ?? '').trim();
  const buyerEmail = String(body?.buyerEmail ?? '').trim().toLowerCase();

  if (!reference || !EMAIL_PATTERN.test(buyerEmail)) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Enter the email and payment reference used for the purchase.',
      },
      { status: 400 },
    );
  }

  const result = await recoverDownloadToken({
    transactionReference: reference,
    buyerEmail,
  });

  if (!result.ok) {
    if (result.reason === 'not_found') {
      return NextResponse.json(
        {
          ok: false,
          error: 'We could not match those details to a completed purchase.',
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { ok: false, error: 'Could not recover this purchase right now.' },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, token: result.token });
}
