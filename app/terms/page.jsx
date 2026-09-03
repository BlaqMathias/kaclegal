import Section from "@/components/ui/Section";
import Link from "next/link";

export const metadata = {
  title: "Terms of Use",
  description:
    "The terms governing use of the Koko Asuquo Chambers website, including publication purchases.",
};

/**
 * Update this manually whenever the content below actually changes — it is a
 * fixed string, not the current date, so it accurately reflects the last
 * real revision rather than always showing "today."
 */
const LAST_UPDATED = "September 3, 2026";

/**
 * Terms of Use content, grounded in what this site actually does as built
 * through Phase 7. This is a structurally sound first draft for KAC's own
 * lawyers to review and approve before launch; it is not a final legal
 * document. The download-link figures below (72 hours, 3 downloads) are read
 * from the real values in lib/tokens.js, not invented — if those constants
 * ever change, this page's wording needs to change with them.
 *
 * @type {{title: string, paragraphs: (string | string[])[]}[]}
 */
const sections = [
  {
    title: "No Legal Advice; No Attorney-Client Relationship",
    paragraphs: [
      "Content on this site — including practice area descriptions, team profiles, and publications available for purchase — is provided for general informational purposes only and does not constitute legal advice.",
      "No attorney-client relationship is formed by browsing this site, submitting a consultation request through our Contact page, or purchasing a publication. An attorney-client relationship is only formed once we have expressly agreed, in writing, to act for you following a formal engagement.",
      "You should not act, or refrain from acting, on the basis of anything on this site without seeking advice specific to your circumstances.",
    ],
  },
  {
    title: "Use of This Site",
    paragraphs: [
      "You agree to use this site only for lawful purposes.",
      [
        "You must not attempt to gain unauthorized access to any part of this site, including the admin area or payment systems.",
        "You must not interfere with the normal operation of this site, or probe, scan, or test its security.",
      ],
      "We may suspend or restrict access to this site for anyone who violates these Terms.",
    ],
  },
  {
    title: "Publications and Purchases",
    paragraphs: [
      "Some publications on this site are available for purchase; others are free.",
      "Purchasing a paid publication entitles you to a personal-use digital copy. After payment is confirmed, a secure download page is opened for you. Each access window is valid for 24 hours and allows up to 3 successful downloads.",
      "If your access window expires or reaches its download limit, you can recover the purchase using the email address and payment reference from your receipt, without paying again. You may also contact us for help.",
      "Refunds: because publications are digital content delivered immediately upon purchase, we do not offer refunds once a publication has been downloaded.",
    ],
  },
  {
    title: "Intellectual Property",
    paragraphs: [
      "All content on this site — including text, publications, graphics, and the KAC name and logo — is the property of Koko Asuquo Chambers or its licensors and is protected by applicable intellectual property laws. You may not reproduce, distribute, or create derivative works from this content without our prior written permission, other than for your own personal, non-commercial reference to a publication you have purchased.",
    ],
  },
  {
    title: "Limitation of Liability",
    paragraphs: [
      "To the fullest extent permitted by law, Koko Asuquo Chambers shall not be liable for any indirect, incidental, or consequential loss arising from your use of this site or reliance on its content.",
    ],
  },
  {
    title: "Governing Law",
    paragraphs: [
      "These Terms are governed by the laws of the Federal Republic of Nigeria, and any dispute arising from them is subject to the exclusive jurisdiction of the Nigerian courts.",
    ],
  },
  {
    title: "Changes to These Terms",
    paragraphs: [
      "We may update these Terms from time to time. The date at the top of this page reflects the most recent revision. Continuing to use this site after a change takes effect means you accept the updated Terms.",
    ],
  },
];

/**
 * Renders one section's paragraphs, where a string is a plain paragraph and
 * an array of strings is rendered as a bulleted list.
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

export default function TermsPage() {
  return (
    <Section background="offWhite" spacing="lg">
      <div className="max-w-3xl">
        <p className="text-caption font-semibold uppercase tracking-[0.22em] text-brand-teal">
          Legal
        </p>
        <h1 className="mt-3 font-display text-hero text-brand-navy">
          Terms of Use
        </h1>
        <p className="mt-3 text-caption text-brand-muted">
          Last updated: {LAST_UPDATED}
        </p>

        <p className="mt-6 text-body-lg text-brand-muted">
          These Terms of Use govern your use of this website, operated by Koko
          Asuquo Chambers (&ldquo;KAC&rdquo;, &ldquo;we&rdquo;,
          &ldquo;us&rdquo;). By using this site, you agree to these Terms.
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
              Questions about these Terms can be sent to{" "}
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
