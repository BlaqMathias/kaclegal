import Section from "@/components/ui/Section";
import Link from "next/link";

export const metadata = {
  title: "Privacy Policy",
  description:
    "How Koko Asuquo Chambers collects, uses, and protects information submitted through this website.",
};

/**
 * Update this manually whenever the content below actually changes — it is a
 * fixed string, not the current date, so it accurately reflects the last
 * real revision rather than always showing "today."
 */
const LAST_UPDATED = "August 28, 2026";

/**
 * Privacy Policy content, grounded in what this site actually does as built
 * through Phase 7 — the consultation form (Phase 5), publications and payment
 * (Phases 6–7). This is a structurally sound first draft for KAC's own
 * lawyers to review and approve before launch; it is not a final legal
 * document. Kept as local data (mirroring the About page's pattern) so the
 * wording is easy to find and edit in one place.
 *
 * @type {{title: string, paragraphs: (string | string[])[]}[]}
 */
const sections = [
  {
    title: "Information We Collect",
    paragraphs: [
      "When you submit a consultation request through our Contact page, we collect your name, email address, phone number, the practice area you select, and the message you provide.",
      "When you purchase a publication, we collect the email address you provide at checkout. Payment itself is processed entirely by our payment processor, Paystack — we do not receive or store your card number or other payment card details.",
    ],
  },
  {
    title: "How We Use Your Information",
    paragraphs: [
      [
        "To respond to consultation requests and follow up regarding your enquiry.",
        "To process payment for, and deliver, publications you purchase.",
        "To maintain records of our communications and transactions for legal, accounting, and business purposes.",
      ],
      "We do not sell your personal information, and we do not use it for advertising.",
    ],
  },
  {
    title: "Third-Party Service Providers",
    paragraphs: [
      "We rely on the following service providers to operate this website. Each processes only the information necessary to perform its role:",
      [
        "Supabase — stores the information you submit through this site, such as consultation requests and purchase records, in a secure database.",
        "Paystack — processes payments for publications, including your card or bank details, which we never receive or store.",
        "Resend — delivers the email notification we receive when you submit the consultation form.",
        "Vercel — hosts this website.",
      ],
      "As part of these providers\u2019 standard infrastructure, some data may be stored on servers outside Nigeria.",
    ],
  },
  {
    title: "Data Retention",
    paragraphs: [
      "We retain consultation request records and transaction records for as long as necessary to respond to your enquiry, deliver publications you have purchased, and meet our legal, regulatory, and accounting obligations.",
    ],
  },
  {
    title: "Your Rights Under Nigerian Law",
    paragraphs: [
      "As a data privacy and regulatory compliance practice, we take our own obligations under the Nigeria Data Protection Act (NDPA) 2023 seriously. Subject to that Act, you have the right to request access to, correction of, or deletion of the personal data we hold about you, and the right to lodge a complaint with the Nigeria Data Protection Commission.",
      "To exercise any of these rights, contact us using the details at the end of this page.",
    ],
  },
  {
    title: "Cookies and Analytics",
    paragraphs: [
      "This site does not currently use cookies to track visitors. We may in future use privacy-respecting analytics tools to understand how the site is used; if we do, this section will be updated to name the tool and describe what it collects.",
    ],
  },
  {
    title: "Children\u2019s Privacy",
    paragraphs: [
      "This site is not directed at children, and we do not knowingly collect personal data from anyone under the age of 18. If you believe a child has provided us with personal data, please contact us and we will remove it.",
    ],
  },
  {
    title: "Changes to This Policy",
    paragraphs: [
      "We may update this Privacy Policy from time to time. The date at the top of this page reflects the most recent revision. Continuing to use this site after a change takes effect means you accept the updated policy.",
    ],
  },
];

/**
 * Renders one section's paragraphs, where a string is a plain paragraph and
 * an array of strings is rendered as a bulleted list — used above for the
 * "how we use it" and "third parties" sections, which read better as lists.
 *
 * @param {{paragraphs: (string | string[])[]}} props
 */
function SectionBody({ paragraphs }) {
  return (
    <div className="mt-4 space-y-4">
      {paragraphs.map((item, index) =>
        Array.isArray(item) ? (
          <ul
            key={index}
            className="list-disc space-y-2 pl-5 text-body text-brand-slate"
          >
            {item.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        ) : (
          <p key={index} className="text-body text-brand-slate">
            {item}
          </p>
        ),
      )}
    </div>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <Section background="offWhite" spacing="lg">
      <div className="max-w-3xl">
        <p className="text-caption font-semibold uppercase tracking-[0.22em] text-brand-teal">
          Legal
        </p>
        <h1 className="mt-3 font-display text-hero text-brand-navy">
          Privacy Policy
        </h1>
        <p className="mt-3 text-caption text-brand-muted">
          Last updated: {LAST_UPDATED}
        </p>

        <p className="mt-6 text-body-lg text-brand-muted">
          This Privacy Policy explains how Koko Asuquo Chambers
          (&ldquo;KAC&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) collects,
          uses, and protects information submitted through this website by
          visitors, consultation requesters, and publication purchasers.
        </p>

        <div className="mt-10 space-y-10">
          {sections.map((section, index) => (
            <div key={section.title}>
              <h2 className="font-display text-h3 text-brand-navy">
                {index + 1}. {section.title}
              </h2>
              <SectionBody paragraphs={section.paragraphs} />
            </div>
          ))}

          <div>
            <h2 className="font-display text-h3 text-brand-navy">
              {sections.length + 1}. Contact Us
            </h2>
            <p className="mt-4 text-body text-brand-slate">
              Questions about this Privacy Policy or the personal data we hold
              about you can be sent to{" "}
              <a
                href="mailto:info@kaclegalpractice.com"
                className="text-brand-teal transition-colors hover:text-brand-navy"
              >
                info@kaclegalpractice.com
              </a>
              , or by phone at{" "}
              <a
                href="tel:+2348147312802"
                className="text-brand-teal transition-colors hover:text-brand-navy"
              >
                +234 814 731 2802
              </a>
              . You can also reach us through our{" "}
              <Link
                href="/contact"
                className="text-brand-teal transition-colors hover:text-brand-navy"
              >
                Contact page
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}
