import Image from 'next/image';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Section from '@/components/ui/Section';
import { team } from '@/content/team';

export const metadata = {
  title: 'Our Team',
  description:
    'Meet the legal practitioners of Koko Asuquo Chambers — the people behind our company secretarial, data privacy, regulatory, intellectual property, real estate and family law work.',
};

/**
 * Team hub — a page header followed by a simple grid of profile cards, one per
 * practitioner, each linking to their /team/[slug] profile. Data comes from the
 * shared /content/team source. No filtering needed at three people.
 */
export default function TeamPage() {
  return (
    <>
      <Section background="offWhite" spacing="lg">
        <div className="max-w-3xl">
          <p className="text-caption font-semibold uppercase tracking-[0.22em] text-brand-teal">
            Our Team
          </p>
          <h1 className="mt-3 font-display text-hero text-brand-navy">
            The people behind the practice
          </h1>
          <p className="mt-5 text-body-lg text-brand-muted">
            A multidisciplinary team combining commercial legal expertise with a practical,
            technology-forward approach.
          </p>
        </div>
      </Section>

      <Section background="white" spacing="md">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {team.map((member) => (
            <Card key={member.slug} href={`/team/${member.slug}`} hover padded={false}>
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-brand-offWhite">
                <Image
                  src={member.photo}
                  alt={member.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <h2 className="font-display text-h3 text-brand-navy">{member.name}</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {member.specialties.map((specialty) => (
                    <Badge key={specialty} variant="teal">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Section>
    </>
  );
}
