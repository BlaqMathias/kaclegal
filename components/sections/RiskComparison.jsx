import Section from "@/components/ui/Section";
import Image from "next/image";

export default function RiskComparison() {
  return (
    <Section background="white" className="relative overflow-hidden">
      {/* Decorative blue flowing glows + faint net grid, behind the content */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute -left-24 top-0 h-[360px] w-[360px] animate-pulse rounded-full bg-brand-teal/15 blur-[110px] [animation-duration:7s]" />
        <div className="absolute -right-16 bottom-0 h-[300px] w-[300px] animate-pulse rounded-full bg-brand-navy/15 blur-[100px] [animation-duration:9s]" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(4,80,159,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(4,80,159,0.06) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage:
              "radial-gradient(ellipse 70% 60% at 50% 50%, black 0%, transparent 80%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 70% 60% at 50% 50%, black 0%, transparent 80%)",
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-10 md:flex-row md:gap-14">
        <div className="group order-2 w-full md:order-1 md:w-1/2">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl">
            <Image
              src="/images/sections/legal-risk.webp"
              alt="A business owner checking his phone, uncertain about a decision"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-110 group-hover:rotate-2"
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
