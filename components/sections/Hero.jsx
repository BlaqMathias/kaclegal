import Reveal from "@/components/motion/Reveal";
import HeroApproachToggle from "@/components/sections/HeroApproachToggle";
import Button from "@/components/ui/Button";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-brand-navyDark">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(194,245,255,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(194,245,255,0.07) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage:
            "radial-gradient(ellipse 80% 75% at 78% 25%, black 0%, transparent 78%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 75% at 78% 25%, black 0%, transparent 78%)",
        }}
      />

      <div className="pointer-events-none absolute -right-24 top-16 z-0 h-[420px] w-[420px] rounded-full bg-brand-teal/20 blur-[130px]" />
      <div className="pointer-events-none absolute -left-32 bottom-8 z-0 h-[360px] w-[360px] rounded-full bg-brand-navy/50 blur-[120px]" />

      <div className="container-kac relative z-10 pb-14 pt-10 sm:pb-18 sm:pt-14 lg:pb-20 lg:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16">
          <div className="text-center lg:text-left">
            <Reveal variant="fadeDown" amount={0.1}>
              <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-4 py-2 text-caption font-semibold uppercase tracking-[0.18em] text-brand-ice backdrop-blur-sm">
                Commercial Law · Nigeria
              </span>
            </Reveal>

            <Reveal variant="fadeUp" delay={0.1} amount={0.1}>
              <h1 className="mt-7 max-w-3xl font-display text-hero font-bold text-white">
                Legal clarity for
                <span className="block text-brand-ice">
                  confident decisions.
                </span>
              </h1>
            </Reveal>

            <Reveal variant="fadeUp" delay={0.2} amount={0.1}>
              <p className="mx-auto mt-6 max-w-2xl text-body text-white/80 lg:mx-0">
                We combine sound legal expertise, commercial insight and
                technology to help businesses manage risk, protect their
                interests and move forward.
              </p>
            </Reveal>

            <Reveal variant="zoom" delay={0.3} amount={0.1}>
              <div className="mt-9 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                <Button
                  href="/contact"
                  size="lg"
                  className="!rounded-full !bg-brand-teal hover:!bg-white hover:!text-brand-navyDark"
                >
                  Request a Consultation
                </Button>

                <Button
                  href="/about"
                  variant="secondary"
                  size="lg"
                  className="!rounded-full !border-white/60 !text-white hover:!border-white hover:!bg-white hover:!text-brand-navyDark"
                >
                  About the Firm
                </Button>
              </div>
            </Reveal>
          </div>

          <Reveal variant="slideLeft" delay={0.15} amount={0.1}>
            <HeroApproachToggle />
          </Reveal>
        </div>
      </div>

      <Reveal variant="fadeUp" amount={0.15}>
        <div className="container-kac relative z-10 pb-12 lg:pb-16">
          <div className="rounded-[40px] bg-white px-6 py-8 shadow-card-hover sm:px-10 sm:py-10">
            <div className="grid gap-8 md:grid-cols-2 md:gap-12">
              <div className="text-center md:text-left">
                <p className="text-caption font-semibold uppercase tracking-[0.22em] text-brand-teal">
                  About the Firm
                </p>
                <h2 className="mt-3 font-display text-h2 text-brand-navy">
                  Measured by our clients&rsquo; success.
                </h2>
              </div>

              <div className="text-center md:text-left">
                <p className="border-t-2 border-brand-teal pt-4 text-body-lg text-brand-navyDark md:border-l-2 md:border-t-0 md:pl-5 md:pt-0">
                  &ldquo;At K.A.C, we believe that our success is measured by
                  the success of our clients.&rdquo;
                </p>
                <p className="mt-5 text-body text-brand-muted">
                  Koko Asuquo Chambers pairs commercial legal expertise with
                  technology to help businesses and individuals move forward
                  with clarity.
                </p>
                <div className="mt-6 flex justify-center md:justify-start">
                  <Button href="/about" className="!rounded-full">
                    Learn About the Firm
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
