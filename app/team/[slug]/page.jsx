import CtaBanner from "@/components/sections/CtaBanner";
import Badge from "@/components/ui/Badge";
import Section from "@/components/ui/Section";
import { getPracticeArea } from "@/content/practice-areas";
import { getTeamMember, getTeamSlugs } from "@/content/team";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

/**
 * Pre-render one static page per team member. Unknown slugs fall through to the
 * runtime lookup below, which calls notFound().
 *
 * @returns {{ slug: string }[]}
 */
export function generateStaticParams() {
  return getTeamSlugs().map((slug) => ({ slug }));
}

/**
 * Per-page metadata derived from the matched team member.
 *
 * @param {{ params: { slug: string } }} props
 * @returns {{ title: string, description?: string }}
 */
export function generateMetadata({ params }) {
  const member = getTeamMember(params.slug);
  if (!member) {
    return { title: "Team member not found" };
  }
  return {
    title: member.name,
    description: `${member.name} — ${member.specialties.join(", ")} at Koko Asuquo Chambers.`,
  };
}

/**
 * Lawyer profile template — one shared component rendering all team profiles
 * from their content files.
 *
 * Everything (photo, name, specialties, bio, and the linked Practice Areas)
 * lives in a single dark navy section with slow drifting glow behind it. The
 * photo sits on the left; the name and every text block sit to its right in
 * one flowing column.
 *
 * An unmatched slug renders the shared not-found.jsx via notFound().
 *
 * @param {{ params: { slug: string } }} props
 */
export default function TeamProfilePage({ params }) {
  const member = getTeamMember(params.slug);

  if (!member) {
    notFound();
  }

  const { name, specialties, bio, photo, practiceAreaSlugs } = member;

  // Resolve only the practice-area slugs that map to real pages; skip any that
  // don't (defensive — content already lists valid slugs only).
  const linkedAreas = practiceAreaSlugs
    .map((slug) => getPracticeArea(slug))
    .filter(Boolean);

  return (
    <>
      <Section
        background="navyDarkPanel"
        spacing="lg"
        container={false}
        className="relative overflow-hidden"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
        >
          <div className="absolute -left-20 top-0 h-[340px] w-[340px] animate-blob-a rounded-full bg-brand-teal/20 blur-[120px]" />
          <div
            className="absolute right-[-8%] bottom-0 h-[320px] w-[320px] animate-blob-b rounded-full bg-brand-navy/50 blur-[120px]"
            style={{ animationDelay: "3s" }}
          />
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-1/2 z-0 -translate-x-1/2 opacity-90 lg:left-auto lg:right-4 lg:translate-x-0 lg:opacity-10 xl:right-10"
        >
          <Image
            src="/images/sections/lady-justice.png"
            alt=""
            width={1024}
            height={1536}
            className="h-[400px] w-[auto] max-w-none object-contain object-bottom sm:h-96 sm:w-auto lg:h-[480px] xl:h-[560px]"
          />
        </div>

        <div className="container-kac relative z-10">
          <div className="grid gap-10 text-center md:grid-cols-[minmax(0,18rem)_1fr] md:items-start md:gap-12 md:text-left">
            <div className="relative mx-auto aspect-[4/5] w-full max-w-xs overflow-hidden rounded-2xl bg-white shadow-card-hover md:mx-0">
              <Image
                src={photo}
                alt={name}
                fill
                sizes="(max-width: 768px) 100vw, 288px"
                className="object-cover"
              />
            </div>

            <div className="pb-[21rem] sm:pb-[25rem] lg:pb-0">
              <p className="text-caption font-semibold uppercase tracking-[0.22em] text-brand-teal">
                Our Team
              </p>
              <h1 className="mt-3 font-display text-hero text-white">{name}</h1>
              <div className="mt-5 flex flex-wrap justify-center gap-2 md:justify-start">
                {specialties.map((specialty) => (
                  <Badge key={specialty} variant="teal">
                    {specialty}
                  </Badge>
                ))}
              </div>

              <p className="mx-auto mt-6 max-w-2xl text-body-lg text-white/80 md:mx-0">
                {bio}
              </p>

              {linkedAreas.length > 0 && (
                <div className="mt-8">
                  <h2 className="font-display text-h4 text-white">
                    Practice Areas
                  </h2>
                  <ul className="mt-4 flex flex-wrap justify-center gap-3 md:justify-start">
                    {linkedAreas.map((area) => (
                      <li key={area.slug}>
                        <Link
                          href={`/practice-areas/${area.slug}`}
                          className="inline-flex items-center rounded-full bg-brand-teal px-4 py-2 text-sm font-medium text-white"
                        >
                          {area.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </Section>

      <CtaBanner />
    </>
  );
}
