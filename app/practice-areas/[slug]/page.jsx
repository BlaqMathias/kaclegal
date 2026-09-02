import CtaBanner from "@/components/sections/CtaBanner";
import Section from "@/components/ui/Section";
import {
  getPracticeArea,
  getPracticeAreaSlugs,
} from "@/content/practice-areas";
import Image from "next/image";
import { notFound } from "next/navigation";
import Reveal from "@/components/motion/Reveal";

/**
 * Pre-render one static page per known practice area at build time. Any slug not
 * in this list falls through to the runtime lookup below, which calls
 * notFound() and renders the shared 404.
 *
 * @returns {{ slug: string }[]}
 */
export function generateStaticParams() {
  return getPracticeAreaSlugs().map((slug) => ({ slug }));
}

/**
 * Per-page metadata derived from the matched content file.
 *
 * @param {{ params: { slug: string } }} props
 * @returns {{ title: string, description?: string }}
 */
export function generateMetadata({ params }) {
  const area = getPracticeArea(params.slug);
  if (!area) {
    return { title: "Practice area not found" };
  }
  return { title: area.title, description: area.summary };
}

/**
 * Practice-area detail template — one shared component rendering all six areas
 * from their content files.
 *
 * Layout:
 * 1. Heading banner — white, on the same net-line grid + drifting glow used
 *    elsewhere on the site (no photo; title + summary only).
 * 2. Overview — dark split panel: the practice-area photo in a gradient frame
 *    on one side, the intro paragraph on the other.
 * 3. How We Help — sub-services laid out as an alternating timeline connected
 *    by a center line, echoing thekreativestack.com/our-story's journey
 *    section.
 * 4. Closing CTA banner.
 *
 * An unmatched slug renders the shared not-found.jsx via notFound().
 *
 * @param {{ params: { slug: string } }} props
 */
export default function PracticeAreaDetailPage({ params }) {
  const area = getPracticeArea(params.slug);

  if (!area) {
    notFound();
  }

  const { title, summary, intro, subServices } = area;

  return (
    <>
      {/* ---------------------------------------------------------------- */}
      {/* Heading — white, net-line grid + slow drifting glow (no photo).   */}
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
              "radial-gradient(ellipse 70% 65% at 20% 30%, black 0%, transparent 75%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 70% 65% at 20% 30%, black 0%, transparent 75%)",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
        >
          <div className="absolute -left-16 top-0 h-[320px] w-[320px] animate-blob-a rounded-full bg-brand-teal/15 blur-[110px]" />
          <div
            className="absolute right-0 top-1/3 h-[280px] w-[280px] animate-blob-b rounded-full bg-brand-navy/10 blur-[100px]"
            style={{ animationDelay: "3s" }}
          />
        </div>

        <div className="container-kac relative z-10 py-10 md:py-14">
          <Reveal variant="fadeUp" className="mx-auto max-w-3xl text-center">
            <p className="text-caption font-semibold uppercase tracking-[0.22em] text-brand-teal">
              Practice Area
            </p>
            <h1 className="mt-3 font-display text-hero text-brand-navy">
              {title}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-body-lg text-brand-muted">
              {summary}
            </p>
          </Reveal>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Overview — framed photo (rotate + zoom on hover) + intro copy,    */}
      {/* on a dark panel with drifting glow behind it.                     */}
      {/* ---------------------------------------------------------------- */}
      <Section
        background="navyPanel"
        spacing="lg"
        container={false}
        className="relative overflow-hidden"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0"
        >
          <div className="absolute -left-20 top-0 h-[340px] w-[340px] animate-blob-a rounded-full bg-brand-teal/20 blur-[120px]" />
          <div
            className="absolute right-[-8%] bottom-0 h-[300px] w-[300px] animate-blob-b rounded-full bg-brand-navyDark/50 blur-[110px]"
            style={{ animationDelay: "2s" }}
          />
        </div>

        <div className="container-kac relative z-10">
          <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
            <Reveal variant="slideRight">
              <div className="group mx-auto w-full max-w-md -rotate-2 rounded-[26px] bg-gradient-to-br from-brand-teal via-brand-navy to-brand-teal p-[3px] shadow-card-hover transition-transform duration-700 ease-out hover:rotate-0 hover:scale-[1.03] md:mx-0">
                <div className="relative aspect-[4/3] overflow-hidden rounded-[23px] bg-brand-navyDark">
                  <Image
                    src={`/images/practice-areas/${area.slug}.webp`}
                    alt={title}
                    fill
                    sizes="(max-width: 768px) 100vw, 40vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  />
                </div>
              </div>
            </Reveal>

            <Reveal variant="slideLeft" delay={0.1}>
              <p className="text-caption font-semibold uppercase tracking-[0.22em] text-brand-teal">
                Overview
              </p>
              <h2 className="mt-3 font-display text-h2 text-white">
                What This Means For You
              </h2>
              <p className="mt-5 text-body-lg text-white/80">{intro}</p>
            </Reveal>
          </div>
        </div>
      </Section>

      {/* ---------------------------------------------------------------- */}
      {/* How We Help — alternating timeline on the net-line grid + slow    */}
      {/* drifting glow, center connector line.                            */}
      {/* ---------------------------------------------------------------- */}
      <Section
        background="navyDarkPanel"
        spacing="lg"
        container={false}
        className="relative overflow-hidden"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage:
              "radial-gradient(ellipse 75% 70% at 50% 40%, black 0%, transparent 75%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 75% 70% at 50% 40%, black 0%, transparent 75%)",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
        >
          <div className="absolute left-1/4 top-0 h-[320px] w-[320px] animate-blob-a rounded-full bg-brand-teal/20 blur-[120px]" />
          <div
            className="absolute right-1/4 bottom-0 h-[300px] w-[300px] animate-blob-b rounded-full bg-brand-navy/50 blur-[110px]"
            style={{ animationDelay: "5s" }}
          />
        </div>

        <div className="container-kac relative z-10">
          <Reveal variant="fadeUp" className="mx-auto max-w-2xl text-center">
            <p className="text-caption font-semibold uppercase tracking-[0.22em] text-brand-teal">
              How We Help
            </p>
            <h2 className="mt-3 font-display text-h2 text-white">
              {title}, Step By Step
            </h2>
          </Reveal>

          <div className="relative mx-auto mt-16 max-w-5xl">
            {/* Center connector line — desktop only. */}
            <div
              aria-hidden="true"
              className="absolute inset-y-0 left-1/2 hidden w-[3px] -translate-x-1/2 bg-gradient-to-b from-transparent via-brand-teal to-transparent md:block"
            />
            {/* Small floating accent dots for a bit of life along the line. */}
            <div
              aria-hidden="true"
              className="absolute left-1/2 top-1/4 hidden h-3 w-3 -translate-x-1/2 rounded-full bg-gradient-to-br from-brand-teal to-brand-navy md:block"
            />
            <div
              aria-hidden="true"
              className="absolute left-1/2 top-3/4 hidden h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-gradient-to-br from-brand-navy to-brand-teal md:block"
            />

            <div className="space-y-12 md:space-y-16">
              {subServices.map((service, index) => {
                const isLeft = index % 2 === 0;
                const number = String(index + 1).padStart(2, "0");

                const card = (
                  <Reveal variant={isLeft ? "slideRight" : "slideLeft"}>
                    <div
                      className={`relative rounded-2xl border border-slate-100 bg-white p-6 shadow-card sm:p-7 ${
                        isLeft ? "md:text-right" : ""
                      }`}
                    >
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-navy font-display text-caption font-semibold text-white">
                        {number}
                      </span>
                      <h3 className="mt-4 font-display text-h4 font-bold text-brand-navy">
                        {service.title}
                      </h3>
                      <p className="mt-2 text-body text-brand-slate">
                        {service.description}
                      </p>
                    </div>
                  </Reveal>
                );

                return (
                  <div
                    key={service.title}
                    className="relative grid gap-6 md:grid-cols-2 md:gap-16"
                  >
                    {/* Row marker on the center line. */}
                    <span
                      aria-hidden="true"
                      className="absolute left-1/2 top-8 hidden h-3 w-3 -translate-x-1/2 rounded-full border-2 border-white bg-brand-teal md:block"
                    />
                    {isLeft ? (
                      <>
                        {card}
                        <div aria-hidden="true" />
                      </>
                    ) : (
                      <>
                        <div aria-hidden="true" />
                        {card}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Section>

      <CtaBanner practiceArea={{ slug: area.slug, title: area.title }} />
    </>
  );
}
