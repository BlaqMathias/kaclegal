import Button from "@/components/ui/Button";
import Section from "@/components/ui/Section";

export default function AboutTeaser() {
  return (
    <Section background="navyDarkPanel" spacing="md">
      <div className="grid gap-8 md:grid-cols-2 md:gap-12">
        <div className="text-center md:text-left">
          <p className="text-caption font-semibold uppercase tracking-[0.22em] text-brand-teal">
            About the Firm
          </p>
          <h2 className="mt-3 font-display text-h2 text-white">
            Measured by our clients&rsquo; success.
          </h2>
        </div>

        <div className="text-center md:text-left">
          <p className="border-t-2 border-brand-teal pt-4 text-body-lg text-white md:border-l-2 md:border-t-0 md:pl-5 md:pt-0">
            &ldquo;At K.A.C, we believe that our success is measured by the
            success of our clients.&rdquo;
          </p>
          <p className="mt-5 text-body text-white/70">
            Koko Asuquo Chambers pairs commercial legal expertise with
            technology to help businesses and individuals move forward with
            clarity.
          </p>
          <div className="mt-6 flex justify-center md:justify-start">
            <Button
              href="/about"
              className="!rounded-full !bg-white !text-brand-navy hover:!bg-brand-offWhite focus-visible:!ring-white focus-visible:!ring-offset-brand-navyDark"
            >
              Request a Consultation
            </Button>
          </div>
        </div>
      </div>
    </Section>
  );
}
