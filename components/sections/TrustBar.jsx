import Image from "next/image";
import Section from "@/components/ui/Section";
import Reveal from "@/components/motion/Reveal";

/**
 * Organisations the firm has worked with.
 *
 * Each entry maps a display name to a supplied logo under
 * `public/images/clients`. The filename includes its extension so compressed
 * WEBP logos can live alongside the existing PNG assets.
 *
 * @type {{ name: string, image: string }[]}
 */
const clients = [
  { name: "Dew of Hermon Montessori School", image: "dew-of-hermon.png" },
  { name: "Ray's On It Sha Entertainment", image: "rays-on-it-sha.png" },
  { name: "Decade Homes", image: "decade-homes.png" },
  { name: "Tomi Aina Beauty", image: "tomi-aina-beauty.png" },
  { name: "Zijela ICT", image: "zijela-ict.png" },
  { name: "Opulence Realty", image: "opulence-realty.png" },
  { name: "VFL Iconic Properties Ltd", image: "vfl-iconic-properties.png" },
  { name: "Silver Elevators Nigeria", image: "silver-elevators-nigeria.webp" },
  { name: "Allel Beauty", image: "allel-beauty.webp" },
  { name: "Anirock Sam Ltd", image: "anirock-sam-ltd.webp" },
  { name: "Gaale Beauty", image: "gaale-beauty.webp" },
  { name: "Kaolinite Enterprise", image: "kaolinite-enterprise.webp" },
  { name: "Jite Projects", image: "jite-projects.webp" },
];

// Rendered twice back-to-back so the -50% marquee scroll loops seamlessly.
const track = [...clients, ...clients];

/**
 * TrustBar — a white band with the client logos scrolling continuously in a
 * single row (a marquee). The track holds two copies of the logo set and
 * animates via the `marquee` keyframes (see tailwind.config.js); translating
 * -50% advances exactly one copy, so the loop is seamless.
 *
 * Motion niceties: pauses on hover, and honours `prefers-reduced-motion` by
 * stopping the animation. White gradient masks soften both edges.
 *
 * No props — reads the local `clients` constant above.
 */
export default function TrustBar() {
  return (
    <Section background="white" spacing="sm">
      <Reveal variant="appear">
        <p className="text-center text-caption font-semibold uppercase tracking-[0.22em] text-brand-muted">
          Organisations we have worked with
        </p>
      </Reveal>

      <Reveal
        variant="fadeUp"
        delay={0.1}
        className="group relative mt-8 overflow-hidden"
      >
        {/* Edge fades */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white to-transparent"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white to-transparent"
          aria-hidden="true"
        />

        <div className="flex w-max animate-marquee items-center group-hover:[animation-play-state:paused] motion-reduce:animate-none">
          {track.map((client, index) => {
            const isDuplicate = index >= clients.length;
            return (
              <div
                key={`${client.image}-${index}`}
                className="mr-10 flex h-16 w-44 shrink-0 items-center justify-center sm:mr-16"
                aria-hidden={isDuplicate ? true : undefined}
              >
                <div className="relative h-full w-full">
                  <Image
                    src={`/images/clients/${client.image}`}
                    alt={isDuplicate ? "" : client.name}
                    fill
                    sizes="176px"
                    className="object-contain"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Reveal>
    </Section>
  );
}
