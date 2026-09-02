import Reveal from "@/components/motion/Reveal";
import Button from "@/components/ui/Button";
import Image from "next/image";

export default function Hero() {
  return (
    <section className="relative overflow-visible rounded-b-[60px] sm:rounded-b-[100px] md:rounded-b-[160px] bg-white">
      {/* Decorative net/grid line mesh, fading outward from the headline — purely visual */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(4,80,159,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(4,80,159,0.08) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse 65% 55% at 50% 15%, black 0%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 65% 55% at 50% 15%, black 0%, transparent 75%)",
        }}
      />

      {/* Decorative floating glow behind the headline — purely visual, no layout impact */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 hidden justify-center sm:flex">
        <div className="mt-4 h-[320px] w-[320px] rounded-full bg-brand-teal/20 blur-[100px] md:h-[420px] md:w-[420px]" />
        <div className="absolute -right-10 top-24 h-[220px] w-[220px] rounded-full bg-brand-navy/15 blur-[90px]" />
      </div>

      <div className="container-kac relative z-10 pb-0 pt-5 text-center md:pt-10">
        <div className="mx-auto max-w-6xl">
          <Reveal variant="fadeDown" amount={0.1}>
            <span className="inline-flex items-center rounded-full border bg-white border-brand-navy/15 px-4 py-1.5 text-caption font-medium text-brand-slate shadow-card">
              Commercial Law · Lagos &amp; Uyo
            </span>
          </Reveal>

          <Reveal variant="fadeUp" delay={0.1} amount={0.1}>
            <h1 className="mt-5 font-display text-hero font-bold text-brand-navy">
              Your Competitors Probably Have
              <br />
              <span className="text-brand-navyDark">
                Better Legal Setup Than You.
              </span>
            </h1>
          </Reveal>

          <Reveal variant="fadeUp" delay={0.2} amount={0.1}>
            <p className="mx-auto mt-5 max-w-3xl text-body text-brand-navy">
              With modern technical expertise, Koko Asuquo Chambers helps
              businesses in Lagos and Uyo get legally competitive — so you can
              focus on winning the market.
            </p>
          </Reveal>

          <Reveal variant="zoom" delay={0.3} amount={0.1}>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-10">
              <Button href="/contact" size="lg" className="!rounded-full">
                Request a Consultation
              </Button>

              <Button
                href="/about"
                variant="secondary"
                size="lg"
                className="!rounded-full !border-brand-navy !text-brand-navy hover:!bg-brand-teal hover:!border-brand-teal hover:!text-white"
              >
                About Us
              </Button>
            </div>
          </Reveal>
        </div>
      </div>

      <Reveal variant="appear" duration={0.9}>
        <div className="relative z-0 -mt-[10vw] overflow-hidden sm:-mt-[20.83vw]">
          <Image
            src="/images/hero/hero-handshake.webp"
            alt="A business professional shaking hands with a robotic hand, representing legal expertise meeting technology"
            width={1920}
            height={800}
            priority
            sizes="100vw"
            className="h-auto w-full object-contain"
          />
        </div>
      </Reveal>

      <Reveal variant="fadeUp" amount={0.15}>
        <div className="relative z-10 mt-8 px-4 pb-10 sm:-mt-[5vw] sm:px-8 md:px-12 md:pb-14">
          <div className="mx-auto max-w-6xl rounded-3xl bg-brand-navyDark px-6 py-8 shadow-card-hover sm:px-10 sm:py-10">
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
                  &ldquo;At K.A.C, we believe that our success is measured by
                  the success of our clients.&rdquo;
                </p>
                <p className="mt-5 text-body text-white/70">
                  Koko Asuquo Chambers pairs commercial legal expertise with
                  technology to help businesses and individuals move forward
                  with clarity.
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
          </div>
        </div>
      </Reveal>
    </section>
  );
}
