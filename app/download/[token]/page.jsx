import Link from 'next/link';
import Button from '@/components/ui/Button';
import Section from '@/components/ui/Section';
import PaidDownloadButton from '@/components/sections/PaidDownloadButton';
import { peekDownloadToken } from '@/lib/tokens';
import { formatDateTimeUTC, formatNaira } from '@/lib/publications';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Your download',
  robots: { index: false, follow: false, nocache: true },
};

const EXPIRED_MESSAGES = {
  not_found: {
    heading: 'We couldn’t find that link',
    body: 'This download link does not match an active purchase. You can recover a completed purchase using the email address and payment reference from your receipt.',
  },
  expired: {
    heading: 'This link has expired',
    body: 'Your 24-hour download window has ended. Recover the purchase to create a fresh access window without paying again.',
  },
  exhausted: {
    heading: 'Download limit reached',
    body: 'This access window has used its available downloads. Recover the purchase if you need a fresh access window.',
  },
  revoked: {
    heading: 'This download is no longer available',
    body: 'Access to this purchase has been revoked. Contact us if you believe this is incorrect.',
  },
  error: {
    heading: 'Something went wrong',
    body: 'We could not check this download right now. Please try again or contact us for help.',
  },
};

export default async function DownloadPage({ params }) {
  const token = String(params?.token ?? '').trim();
  const result = token
    ? await peekDownloadToken(token)
    : { ok: false, reason: 'not_found' };

  if (!result.ok) {
    const message = EXPIRED_MESSAGES[result.reason] ?? EXPIRED_MESSAGES.error;

    return (
      <Section background="offWhite" spacing="lg">
        <div className="max-w-xl">
          <h1 className="font-display text-h1 text-brand-navy">
            {message.heading}
          </h1>
          <p className="mt-4 text-body-lg text-brand-slate">{message.body}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            {result.reason !== 'revoked' && (
              <Button href="/publications/recover">Recover purchase</Button>
            )}
            <Button href="/publications" variant="secondary">
              Browse publications
            </Button>
          </div>
        </div>
      </Section>
    );
  }

  const { publication, transaction, expiresAt, downloadsRemaining } = result;
  const extension = publication.file_path?.split('.').pop() || 'pdf';

  return (
    <Section background="offWhite" spacing="lg">
      <div className="max-w-xl">
        <p className="text-caption font-semibold uppercase tracking-[0.22em] text-brand-teal">
          Purchase confirmed
        </p>
        <h1 className="mt-3 font-display text-h1 text-brand-navy">
          Your download is ready
        </h1>
        <p className="mt-4 text-body-lg text-brand-slate">
          Thank you for purchasing <strong>{publication.title}</strong>.
        </p>

        <div className="mt-8 border border-slate-200 bg-white p-6">
          <div className="grid gap-3 text-caption text-brand-slate sm:grid-cols-2">
            <div>
              <span className="text-brand-muted">Amount</span>
              <p className="mt-1 font-medium text-brand-navy">
                {formatNaira(transaction.amount)}
              </p>
            </div>
            <div>
              <span className="text-brand-muted">Reference</span>
              <p className="mt-1 break-all font-medium text-brand-navy">
                {transaction.reference}
              </p>
            </div>
            <div>
              <span className="text-brand-muted">Purchased</span>
              <p className="mt-1 font-medium text-brand-navy">
                {formatDateTimeUTC(transaction.purchasedAt)}
              </p>
            </div>
            <div>
              <span className="text-brand-muted">Access until</span>
              <p className="mt-1 font-medium text-brand-navy">
                {formatDateTimeUTC(expiresAt)}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <PaidDownloadButton
              token={token}
              fallbackFilename={`${publication.slug}.${extension}`}
            />
          </div>

          <p className="mt-4 text-caption text-brand-muted">
            {downloadsRemaining} download
            {downloadsRemaining === 1 ? '' : 's'} remaining in this access
            window.
          </p>
        </div>

        <p className="mt-6 text-caption text-brand-muted">
          Need access later? Keep your payment reference. You can{' '}
          <Link
            href="/publications/recover"
            className="text-brand-teal transition-colors hover:text-brand-navy"
          >
            recover your purchase
          </Link>{' '}
          without paying again.
        </p>
      </div>
    </Section>
  );
}
