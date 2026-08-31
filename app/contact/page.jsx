import { Suspense } from 'react';
import Section from '@/components/ui/Section';
import ConsultationForm from '@/components/sections/ConsultationForm';
import OfficeCard from '@/components/sections/OfficeCard';

export const metadata = {
  title: 'Contact',
  description:
    'Request a consultation with Koko Asuquo Chambers. Offices in Lekki, Lagos and Uyo, Akwa Ibom. Tell us about your business or matter and we will help you find the right way forward.',
};

/**
 * Firm office locations. Content is used exactly as provided by the firm; the
 * shared inbox and general mobile are the only contact channels available.
 */
const OFFICES = [
  {
    name: 'Lagos Office',
    address: '5, Pascal Offiah Close, off Platinum Way, Lekki, Lagos.',
    email: 'kaclegalpractice@gmail.com',
    phone: '+234 814 731 2802',
  },
  {
    name: 'Uyo Office',
    address: '4, Udoumana Street, Uyo, Akwa Ibom State.',
    email: 'kaclegalpractice@gmail.com',
    phone: '+234 814 731 2802',
  },
];

/**
 * Contact page — page header, the consultation form (main column), and both
 * office information blocks (side column). Responsive: the form and offices
 * stack on small screens and sit side by side from `lg` up.
 *
 * The form is wrapped in <Suspense> because it reads the URL query string via
 * useSearchParams (to pre-select a practice area from a deep link).
 */
export default function ContactPage() {
  return (
    <>
      <Section background="navy" spacing="lg">
        <div className="max-w-3xl">
          <p className="text-caption font-semibold uppercase tracking-[0.22em] text-brand-teal">
            Contact
          </p>
          <h1 className="mt-3 font-display text-hero text-white">Get in touch</h1>
          <p className="mt-5 text-body-lg text-white/80">
            Tell us about your business or the matter you need help with, and we&rsquo;ll point you to
            the right member of our team. Prefer to reach out directly? Our office details are below.
          </p>
        </div>
      </Section>

      <Section background="white" spacing="md">
        <div className="grid gap-12 lg:grid-cols-[1.6fr_1fr] lg:gap-16">
          <div>
            <h2 className="font-display text-h3 text-brand-navy">Request a consultation</h2>
            <p className="mt-3 text-body text-brand-muted">
              Fields marked with <span className="text-brand-error">*</span> are required.
            </p>
            <div className="mt-8">
              <Suspense
                fallback={<p className="text-body text-brand-muted">Loading form&hellip;</p>}
              >
                <ConsultationForm />
              </Suspense>
            </div>
          </div>

          <aside className="space-y-6">
            <h2 className="font-display text-h3 text-brand-navy">Our offices</h2>
            {OFFICES.map((office) => (
              <OfficeCard key={office.name} office={office} />
            ))}
          </aside>
        </div>
      </Section>
    </>
  );
}
