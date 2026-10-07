import Reveal from "@/components/motion/Reveal";
import Button from "@/components/ui/Button";
import Image from "next/image";

export default function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-brand-navyDark">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(194,245,255,0.055) 1px, transparent 1px), linear-gradient(to bottom, rgba(194,245,255,0.055) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse 90% 80% at 50% 45%, black 10%, transparent 90%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 90% 80% at 50% 45%, black 10%, transparent 90%)",
        }}
      />
      <div className="relative isolate flow-root rounded-b-[3rem] bg-white sm:rounded-b-[5rem]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 15% 40%, rgba(194,245,255,0.48), transparent 55%), radial-gradient(ellipse at 85% 55%, rgba(30,158,184,0.12), transparent 55%)",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(4,80,159,0.10) 1px, transparent 1px), linear-gradient(to bottom, rgba(4,80,159,0.10) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage:
              "radial-gradient(ellipse 85% 85% at 50% 35%, black 15%, transparent 90%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 85% 85% at 50% 35%, black 15%, transparent 90%)",
            filter: "drop-shadow(0 0 4px rgba(30,158,184,0.2))",
          }}
        />
        <div className="container-kac relative z-20 pt-10 text-center sm:pt-12 lg:pt-16">
          <Reveal variant="fadeDown" amount={0.1}>
            <span className="inline-flex bg-white items-center rounded-full border border-brand-navyDark px-5 py-1.5 text-caption font-semibold text-brand-navyDark sm:px-7">
              Commercial Law · Lagos &amp; Uyo
            </span>
          </Reveal>
          <Reveal variant="fadeUp" delay={0.1} amount={0.1}>
            <h1 className="mx-auto mt-5 max-w-[72rem] font-display text-[clamp(2rem,4.5vw,4rem)] font-bold leading-[1.08] tracking-[-0.025em] text-brand-navy">
              Legal clarity for
              <span className="block text-brand-navyDark">
                confident decisions.
              </span>
            </h1>
          </Reveal>
          <Reveal variant="fadeUp" delay={0.2} amount={0.1}>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-brand-navyDark lg:max-w-[48rem] lg:text-body">
              We combine sound legal expertise, commercial insight and
              technology to help businesses manage risk, protect their interests
              and move forward.
            </p>
          </Reveal>
          <Reveal variant="zoom" delay={0.3} amount={0.1}>
            <div className="mx-auto mt-7 inline-flex max-w-full items-center rounded-full border border-slate-200 bg-white p-1 shadow-[inset_0_1px_5px_rgba(4,35,69,0.12)]">
              <Button
                href="/contact"
                size="lg"
                className="!rounded-full !px-4 !text-[0.75rem] sm:!px-7 sm:!text-sm"
              >
                Request a Consultation
              </Button>
              <Button
                href="/about"
                variant="ghost"
                size="lg"
                className="!rounded-full !px-5 !text-[0.75rem] !text-brand-navyDark hover:!bg-brand-offWhite sm:!px-8 sm:!text-sm"
              >
                About Us
              </Button>
            </div>
          </Reveal>
        </div>
        <div className="pointer-events-none relative z-10 -mt-[clamp(3rem,calc(24vw_-_2rem),28rem)] -mb-[clamp(1.5rem,7vw,7rem)]">
          <Image
            src="/images/hero/kaclegal-handshake.png"
            alt="A business professional and a robotic hand shaking hands"
            width={2048}
            height={1100}
            priority
            sizes="100vw"
            className="h-auto w-full select-none"
          />
        </div>
      </div>
      <div className="container-kac relative z-20 pb-12 pt-[clamp(3rem,6vw,6rem)] lg:pb-16">
        <Reveal variant="fadeUp" amount={0.15}>
          <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2 md:gap-12">
            <div className="text-center md:text-left">
              <p className="text-caption font-semibold uppercase tracking-[0.22em] text-brand-ice">
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
              <p className="mt-5 text-body text-white/80">
                Koko Asuquo Chambers pairs commercial legal expertise with
                technology to help businesses and individuals move forward with
                clarity.
              </p>
              <div className="mt-6 flex justify-center md:justify-start">
                <Button
                  href="/about"
                  className="!rounded-full !bg-white !text-brand-navyDark hover:!bg-brand-ice"
                >
                  Learn About the Firm
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
