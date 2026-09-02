import ConsultationForm from "@/components/sections/ConsultationForm";
import OfficeCard from "@/components/sections/OfficeCard";
import Section from "@/components/ui/Section";
import Image from "next/image";
import { Suspense } from "react";
import Reveal from "@/components/motion/Reveal";
import { RevealStagger, RevealItem } from "@/components/motion/RevealStagger";

export const metadata = {
  title: "Contact",
  description:
    "Request a consultation with Koko Asuquo Chambers. Offices in Lekki, Lagos and Uyo, Akwa Ibom. Tell us about your business or matter and we will help you find the right way forward.",
};

/**
 * Firm office locations. Content is used exactly as provided by the firm; the
 * shared inbox and general mobile are the only contact channels available.
 */
const OFFICES = [
  {
    name: "Lagos Office",
    address: "5, Pascal Offiah Close, off Platinum Way, Lekki, Lagos.",
    email: "kaclegalpractice@gmail.com",
    phone: "+234 814 731 2802",
  },
  {
    name: "Uyo Office",
    address: "4, Udoumana Street, Uyo, Akwa Ibom State.",
    email: "kaclegalpractice@gmail.com",
    phone: "+234 814 731 2802",
  },
];

/**
 * Contact page.
 *
 * Layout:
 * 1. Heading — white, centered, on the net-line grid + drifting glow used
 *    elsewhere on the site.
 * 2. Body — a navy panel with drifting glow behind it, split into an intro +
 *    office list (left) and the consultation form in a white card (right),
 *    echoing thekreativestack.com/contact's two-column layout.
 *
 * The form is wrapped in <Suspense> because it reads the URL query string via
 * useSearchParams (to pre-select a practice area from a deep link).
 */
export default function ContactPage() {
  return (
    <>
      {/* ---------------------------------------------------------------- */}
      {/* Heading — white, net-line grid + slow drifting glow, centered.    */}
      {/* ---------------------------------------------------------------- */}
      <section className="relative overflow-hidden bg-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(4,80,159,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(4,80,159,0.08) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage:
              "radial-gradient(ellipse 65% 60% at 50% 30%, black 0%, transparent 75%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 65% 60% at 50% 30%, black 0%, transparent 75%)",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
        >
          <div className="absolute left-1/3 top-0 h-[320px] w-[320px] animate-blob-a rounded-full bg-brand-teal/15 blur-[110px]" />
          <div
            className="absolute right-1/4 top-1/3 h-[260px] w-[260px] animate-blob-b rounded-full bg-brand-navy/10 blur-[100px]"
            style={{ animationDelay: "3s" }}
          />
        </div>

        <div className="container-kac relative z-10 py-10 md:py-14">
          <Reveal variant="fadeUp" className="mx-auto max-w-3xl text-center">
            <p className="text-caption font-semibold uppercase tracking-[0.22em] text-brand-teal">
              Contact
            </p>
            <h1 className="mt-3 font-display text-hero text-brand-navy">
              Get in <span className="text-brand-navyDark"> Touch</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-body-lg text-brand-muted">
              Tell us about your business or the matter you need help with, and
              we&rsquo;ll point you to the right member of our team. Prefer to
              reach out directly? Our office details are below.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Body — navy panel with drifting glow; intro + offices (left),     */}
      {/* consultation form in a white card (right).                       */}
      {/* ---------------------------------------------------------------- */}
      <Section
        background="navy"
        spacing="lg"
        container={false}
        className="relative overflow-hidden"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0"
        >
          <div className="absolute -left-24 top-0 h-[380px] w-[380px] animate-blob-a rounded-full bg-brand-teal/20 blur-[120px]" />
          <div
            className="absolute right-[-10%] bottom-0 h-[340px] w-[340px] animate-blob-b rounded-full bg-brand-navyDark/50 blur-[120px]"
            style={{ animationDelay: "4s" }}
          />
        </div>

        <div className="container-kac relative z-10">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <Reveal variant="slideRight">
              <h2 className="font-display text-h2 text-white">
                Let&rsquo;s Talk About Your Matter
              </h2>
              <p className="mt-4 text-body-lg text-white/80">
                Whether you have a specific legal question or just need a
                starting point, we&rsquo;re here to help you find clarity.
              </p>

              <RevealStagger className="mt-10 space-y-6">
                {OFFICES.map((office) => (
                  <RevealItem key={office.name} variant="fadeUp">
                    <OfficeCard office={office} />
                  </RevealItem>
                ))}
              </RevealStagger>
            </Reveal>

            <Reveal
              variant="slideLeft"
              delay={0.1}
              className="rounded-3xl bg-white p-6 shadow-card-hover sm:p-8 lg:p-10"
            >
              <div className="mb-6 flex items-center gap-3">
                <Image
                  src="/images/logo/kac-monogram.png"
                  alt=""
                  width={409}
                  height={681}
                  className="h-11 w-auto"
                />
                <span className="leading-none">
                  <span className="block font-display text-[17px] font-semibold text-brand-navy">
                    Koko Asuquo
                  </span>
                  <span className="mt-0.5 block text-[10px] font-medium uppercase tracking-[0.28em] text-brand-teal">
                    Chambers
                  </span>
                </span>
              </div>

              <h2 className="font-display text-h3 text-brand-navy">
                Request a Consultation
              </h2>
              <p className="mt-3 text-body text-brand-muted">
                Fields marked with <span className="text-brand-error">*</span>{" "}
                are required.
              </p>
              <div className="mt-8">
                <Suspense
                  fallback={
                    <p className="text-body text-brand-muted">
                      Loading form&hellip;
                    </p>
                  }
                >
                  <ConsultationForm />
                </Suspense>
              </div>
            </Reveal>
          </div>
        </div>
      </Section>
    </>
  );
}
