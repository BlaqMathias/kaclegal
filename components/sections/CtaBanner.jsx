import Button from "@/components/ui/Button";
import Section from "@/components/ui/Section";

/**
 * CtaBanner — the final conversion push before the footer. Full-width navy
 * band (the Section `navy` background renders headings/text light) with a
 * single, focused call to action.
 *
 * The Button uses the `primary` variant but is given a light treatment via
 * `className` so it reads as the brightest element on the navy field. The `!`
 * (important) modifiers are used deliberately: they guarantee the override
 * beats the variant's own `bg-brand-navy`/`text-white` utilities regardless of
 * Tailwind's class output order.
 *
 * Optionally accepts a `practiceArea` so a practice-area page can deep-link the
 * CTA into the contact form with the matching dropdown pre-selected. Without it
 * (homepage, About), the CTA points at the bare /contact page as before.
 *
 * @param {object} [props]
 * @param {{ slug: string, title: string }} [props.practiceArea] - When set, the
 *   CTA links to /contact?practiceArea=<slug> and the body copy references the area.
 */
export default function CtaBanner({ practiceArea = null }) {
  const href = practiceArea
    ? `/contact?practiceArea=${encodeURIComponent(practiceArea.slug)}`
    : "/contact";

  const body = practiceArea
    ? `Tell us about your ${practiceArea.title} matter and we will help you find the right way forward.`
    : "Tell us about your business or matter and we will help you find the right way forward.";

  return (
    <Section background="navy" spacing="md">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-h2">
          Let&rsquo;s talk about what&rsquo;s next.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-body-lg text-white/80">
          {body}
        </p>
        <div className="mt-8 flex justify-center">
          <Button
            href={href}
            size="lg"
            className="!rounded-full !bg-white !text-brand-navy hover:!bg-brand-offWhite focus-visible:!ring-white focus-visible:!ring-offset-brand-navy"
          >
            Request a Consultation
          </Button>
        </div>
      </div>
    </Section>
  );
}
