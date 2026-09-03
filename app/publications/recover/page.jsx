import Link from 'next/link';
import PurchaseRecoveryForm from '@/components/sections/PurchaseRecoveryForm';
import Section from '@/components/ui/Section';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Recover a publication purchase',
  robots: { index: false, follow: false, nocache: true },
};

export default function RecoverPublicationPage() {
  return (
    <Section background="offWhite" spacing="lg">
      <div className="mx-auto max-w-xl">
        <p className="text-caption font-semibold uppercase tracking-[0.22em] text-brand-teal">
          Publications
        </p>
        <h1 className="mt-3 font-display text-h1 text-brand-navy">
          Recover a purchase
        </h1>
        <p className="mt-4 text-body-lg text-brand-slate">
          Enter the email address used at checkout and the Paystack reference
          from your payment receipt. A fresh download access window will replace
          the old one.
        </p>

        <PurchaseRecoveryForm />

        <p className="mt-6 text-caption text-brand-muted">
          <Link
            href="/publications"
            className="text-brand-teal transition-colors hover:text-brand-navy"
          >
            Back to publications
          </Link>
        </p>
      </div>
    </Section>
  );
}
