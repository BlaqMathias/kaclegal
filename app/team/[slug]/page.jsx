import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Badge from '@/components/ui/Badge';
import Section from '@/components/ui/Section';
import CtaBanner from '@/components/sections/CtaBanner';
import { getTeamMember, getTeamSlugs } from '@/content/team';
import { getPracticeArea } from '@/content/practice-areas';

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
    return { title: 'Team member not found' };
  }
  return {
    title: member.name,
    description: `${member.name} — ${member.specialties.join(', ')} at Koko Asuquo Chambers.`,
  };
}

/**
 * Lawyer profile template — one shared component rendering all team profiles
 * from their content files. Layout: photo + name header, specialties as badges,
 * bio prose, a "Practice Areas" section linking only to real Phase 3 pages
 * (from practiceAreaSlugs), and a closing CTA.
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
      <Section background="offWhite" spacing="lg">
        <div className="grid items-center gap-8 text-center md:grid-cols-[minmax(0,18rem)_1fr] md:gap-12 md:text-left">
          <div className="relative mx-auto aspect-[4/5] w-full max-w-xs overflow-hidden rounded-none bg-white shadow-card md:mx-0">
            <Image
              src={photo}
              alt={name}
              fill
              sizes="(max-width: 768px) 100vw, 288px"
              className="object-cover"
            />
          </div>
          <div>
            <p className="text-caption font-semibold uppercase tracking-[0.22em] text-brand-teal">
              Our Team
            </p>
            <h1 className="mt-3 font-display text-hero text-brand-navy">{name}</h1>
            <div className="mt-5 flex flex-wrap justify-center gap-2 md:justify-start">
              {specialties.map((specialty) => (
                <Badge key={specialty} variant="teal">
                  {specialty}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section background="white" spacing="md">
        <div className="max-w-3xl">
          <p className="text-body-lg text-brand-slate">{bio}</p>
        </div>

        {linkedAreas.length > 0 && (
          <div className="mt-12 max-w-3xl">
            <h2 className="font-display text-h3 text-brand-navy">Practice Areas</h2>
            <ul className="mt-5 flex flex-wrap gap-3">
              {linkedAreas.map((area) => (
                <li key={area.slug}>
                  <Link
                    href={`/practice-areas/${area.slug}`}
                    className="inline-flex items-center rounded-none border border-brand-teal px-4 py-2 text-sm font-medium text-brand-teal transition-colors hover:bg-brand-teal hover:text-white"
                  >
                    {area.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Section>

      <CtaBanner />
    </>
  );
}
