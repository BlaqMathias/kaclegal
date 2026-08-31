import Section from "@/components/ui/Section";
import Image from "next/image";

export default function RiskComparison() {
  return (
    <Section background="ice">
      <div className="flex flex-col items-center gap-10 md:flex-row md:gap-14">
        <div className="order-2 w-full md:order-1 md:w-1/2">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl">
            <Image
              src="/images/sections/legal-risk.webp"
              alt="A business owner checking his phone, uncertain about a decision"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>
        <div className="order-1 w-full text-center md:order-2 md:w-1/2 md:text-left">
          <span className="inline-flex items-center rounded-full border border-brand-navy/15 bg-white px-4 py-1.5 text-caption font-medium text-brand-slate">
            Working with the wrong advisors or no advisor at all, puts your
            brand at risk.
          </span>
          <h2 className="mt-5 font-display text-h1 font-bold text-brand-navy">
            One Legal Mistake Can Cost You
            <br />
            <span className="text-brand-navyDark">
              More Than Your Business Gain
            </span>
          </h2>
          <p className="mt-4 text-body-lg text-brand-navyDark">
            We give growing businesses the legal certainty they need to move
            fast and grow confidently.
          </p>
        </div>
      </div>
    </Section>
  );
}
