import Reveal from "@/components/motion/Reveal";
import { RevealItem, RevealStagger } from "@/components/motion/RevealStagger";
import CtaBanner from "@/components/sections/CtaBanner";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Section from "@/components/ui/Section";
import { team } from "@/content/team";
import Image from "next/image";

export const metadata = {
  title: "Our Team",
  description:
    "Meet the legal practitioners of Koko Asuquo Chambers — the people behind our company secretarial, data privacy, regulatory, intellectual property, real estate and family law work.",
};

/**
 * Team hub — a centered dark header, a grid of profile cards (one per
 * practitioner, each linking to their /team/[slug] profile), and a closing
 * CTA banner. Data comes from the shared /content/team source. No filtering
 * needed at three people.
 */
export default function TeamPage() {
  return (
    <>
      <Section background="navyDarkPanel" spacing="sm">
        <Reveal variant="fadeUp" className="mx-auto max-w-2xl text-center">
          <p className="text-caption font-semibold uppercase tracking-[0.22em] text-brand-teal">
            Our Team
          </p>
          <h1 className="mt-3 font-display text-hero text-white">
            The people behind the practice
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-body text-white/80">
            A multidisciplinary team combining commercial legal expertise with a
            practical, technology-forward approach.
          </p>
        </Reveal>
      </Section>

      <Section background="white" spacing="md">
        <RevealStagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {team.map((member) => (
            <RevealItem key={member.slug} variant="fadeUp">
              <Card
                href={`/team/${member.slug}`}
                hover
                padded={false}
                className="!rounded-3xl !border-2 !border-transparent shadow-card transition-colors duration-200 hover:!border-brand-navy"
              >
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
                  <h2 className="font-display text-h3 text-brand-navy">
                    {member.name}
                  </h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {member.specialties.map((specialty) => (
                      <Badge key={specialty} variant="teal">
                        {specialty}
                      </Badge>
                    ))}
                  </div>

                  <span className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-brand-teal px-4 py-2 text-sm font-medium text-brand-teal transition-colors duration-200 group-hover:bg-brand-navy group-hover:border-brand-navy group-hover:text-white">
                    More
                    <svg
                      className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M5 12h14" />
                      <path d="m13 6 6 6-6 6" />
                    </svg>
                  </span>
                </div>
              </Card>
            </RevealItem>
          ))}
        </RevealStagger>
      </Section>

      <CtaBanner />
    </>
  );
}
