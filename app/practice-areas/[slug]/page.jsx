import CtaBanner from "@/components/sections/CtaBanner";
import Card from "@/components/ui/Card";
import Section from "@/components/ui/Section";
import {
  getPracticeArea,
  getPracticeAreaSlugs,
} from "@/content/practice-areas";
import Image from "next/image";
import { notFound } from "next/navigation";

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
 * from their content files. Layout: header banner (title + summary), intro
 * paragraph, sub-services as a card list, and a closing CTA.
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
      <section className="relative flex min-h-[42vh] items-center overflow-hidden bg-brand-navy">
        {/* Practice-area photo — the same image as the homepage card (decorative). */}
        <Image
          src={`/images/practice-areas/${area.slug}.webp`}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        {/* Deep navy gradient "coat" so the white text pops over any photo. */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-brand-navyDark/100 via-brand-navy/55 to-brand-navy/45"
          aria-hidden="true"
        />
        <div className="container-kac relative z-10 py-16 md:py-24">
          <div className="max-w-3xl">
            <p className="text-caption font-semibold uppercase tracking-[0.22em] text-white/70">
              Practice Area
            </p>
            <h1 className="mt-3 font-display text-hero text-white">{title}</h1>
            <p className="mt-5 text-body-lg text-white/85">{summary}</p>
          </div>
        </div>
      </section>

      <Section background="white" spacing="md">
        <div className="max-w-3xl">
          <p className="text-body-lg text-brand-slate">{intro}</p>
        </div>

        <div className="mt-12">
          <h2 className="font-display text-h3 text-brand-navy">How we help</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {subServices.map((service) => (
              <Card
                key={service.title}
                padded={false}
                className="flex flex-col [&>div]:flex [&>div]:flex-1 [&>div]:flex-col"
              >
                {/* Deep-navy heading band with white title. */}
                <div className="bg-brand-navy px-6 py-5">
                  <h3 className="text-h4 font-semibold text-white">
                    {service.title}
                  </h3>
                </div>
                {/* White body; teal seam echoes the brand's teal-divider motif. */}
                <div className="flex-1 border-t-2 border-brand-teal px-6 py-6">
                  <p className="text-body text-brand-slate">
                    {service.description}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Section>

      <CtaBanner practiceArea={{ slug: area.slug, title: area.title }} />
    </>
  );
}
