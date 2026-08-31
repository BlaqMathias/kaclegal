import Link from 'next/link';
import Button from '@/components/ui/Button';
import Section from '@/components/ui/Section';
import { peekDownloadToken } from '@/lib/tokens';
import { formatDateUTC } from '@/lib/publications';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Your download',
  robots: { index: false, follow: false, nocache: true },
};

const EXPIRED_MESSAGES = {
  not_found: {
    heading: 'We couldn\u2019t find that link',
    body: 'This download link doesn\u2019t match anything on file. If you just completed a purchase, check your email for the correct link, or contact us for help.',
  },
  expired: {
    heading: 'This link has expired',
    body: 'Download links stay active for a limited time after purchase. Contact us and we\u2019ll get you a fresh link — you won\u2019t need to pay again.',
  },
  exhausted: {
    heading: 'This link has already been used',
    body: 'This download link has reached its limit. Contact us and we\u2019ll get you a fresh link — you won\u2019t need to pay again.',
  },
  error: {
    heading: 'Something went wrong',
    body: 'We couldn\u2019t check this download link just now. Please try again in a moment, or contact us for help.',
  },
};

/**
 * /download/[token] — the post-payment download page.
 *
 * Only PEEKS at the token's status (see `peekDownloadToken`) — visiting this
 * page never spends one of the buyer's downloads. The actual file is only
 * served, and a download only spent, when the "Download your file" link below
 * is clicked, which hits `/api/download/[token]`.
 *
 * @param {{params: {token: string}}} props
 */
export default async function DownloadPage({ params }) {
  const token = String(params?.token ?? '').trim();
  const result = token ? await peekDownloadToken(token) : { ok: false, reason: 'not_found' };

  if (!result.ok) {
    const message = EXPIRED_MESSAGES[result.reason] ?? EXPIRED_MESSAGES.error;

    return (
      <Section background="offWhite" spacing="lg">
        <div className="max-w-xl">
          <h1 className="font-display text-h1 text-brand-navy">{message.heading}</h1>
          <p className="mt-4 text-body-lg text-brand-slate">{message.body}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="/contact">Contact us</Button>
            <Button href="/publications" variant="secondary">
              Browse publications
            </Button>
          </div>
        </div>
      </Section>
    );
  }

  const { publication, expiresAt, downloadsRemaining } = result;

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
          <a
            href={`/api/download/${token}`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-none bg-brand-navy px-7 py-3 text-body font-medium text-white transition-colors duration-200 hover:bg-brand-navyDark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy focus-visible:ring-offset-2"
          >
            Download your file
          </a>
          <p className="mt-4 text-caption text-brand-muted">
            {downloadsRemaining} download{downloadsRemaining === 1 ? '' : 's'} remaining ·
            link valid until {formatDateUTC(expiresAt)}
          </p>
        </div>

        <p className="mt-6 text-caption text-brand-muted">
          Trouble downloading?{' '}
          <Link href="/contact" className="text-brand-teal transition-colors hover:text-brand-navy">
            Contact us
          </Link>{' '}
          and we can help.
        </p>
      </div>
    </Section>
  );
}
