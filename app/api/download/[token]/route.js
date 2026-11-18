import { createSignedDownloadUrl } from '@/lib/storage';
import { peekDownloadToken, recordPaidDownload } from '@/lib/tokens';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
};

// Short-lived direct Storage URL. The publication bytes never pass through
// Vercel, which avoids serverless response-size limits for large documents.
const SIGNED_DOWNLOAD_TTL_SECONDS = 600;

export async function GET(request, { params }) {
  const token = String(params?.token ?? '').trim();
  if (!token) {
    return NextResponse.json(
      { ok: false, error: 'Not found.' },
      { status: 404, headers: NO_STORE_HEADERS },
    );
  }

  const entitlement = await peekDownloadToken(token);
  if (!entitlement.ok) {
    return NextResponse.redirect(new URL(`/download/${token}`, request.url), {
      headers: NO_STORE_HEADERS,
    });
  }

  const extension = entitlement.publication.file_path.split('.').pop() || 'pdf';
  const filename = `${entitlement.publication.slug}.${extension}`;

  const signedUrl = await createSignedDownloadUrl(
    entitlement.publication.file_path,
    {
      expiresIn: SIGNED_DOWNLOAD_TTL_SECONDS,
      downloadAs: filename,
    },
  );

  if (!signedUrl) {
    return NextResponse.json(
      { ok: false, error: 'Could not prepare this download.' },
      { status: 502, headers: NO_STORE_HEADERS },
    );
  }

  // Consume the allowance atomically only after Storage is ready to serve the
  // file. If entitlement recording fails, the signed URL is never sent out.
  const recorded = await recordPaidDownload(token);
  if (!recorded.ok) {
    return NextResponse.redirect(new URL(`/download/${token}`, request.url), {
      headers: NO_STORE_HEADERS,
    });
  }

  return NextResponse.redirect(signedUrl, {
    headers: NO_STORE_HEADERS,
  });
}
