import { downloadPublicationFile } from '@/lib/storage';
import { peekDownloadToken, recordPaidDownload } from '@/lib/tokens';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const token = String(params?.token ?? '').trim();
  if (!token) {
    return NextResponse.json(
      { ok: false, error: 'Not found.' },
      { status: 404 },
    );
  }

  // Cheap read-only guard first. Expired/exhausted/revoked access never causes
  // a private Storage download.
  const entitlement = await peekDownloadToken(token);
  if (!entitlement.ok) {
    return NextResponse.redirect(new URL(`/download/${token}`, request.url), {
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  const fileResult = await downloadPublicationFile(
    entitlement.publication.file_path,
  );

  if (!fileResult.ok) {
    return NextResponse.json(
      { ok: false, error: fileResult.error },
      { status: 502 },
    );
  }

  // Materialize every byte before consuming an allowance. If private storage or
  // byte loading fails, the buyer keeps all remaining attempts.
  const arrayBuffer = await fileResult.blob.arrayBuffer();

  // The RPC re-checks and increments atomically, so parallel requests cannot
  // push the count past the configured maximum.
  const recorded = await recordPaidDownload(token);
  if (!recorded.ok) {
    return NextResponse.redirect(new URL(`/download/${token}`, request.url), {
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  const extension =
    entitlement.publication.file_path.split('.').pop() || 'pdf';
  const filename = `${entitlement.publication.slug}.${extension}`;
  const contentType =
    fileResult.blob.type || 'application/octet-stream';

  return new NextResponse(Buffer.from(arrayBuffer), {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(arrayBuffer.byteLength),
      'Cache-Control': 'no-store',
    },
  });
}
