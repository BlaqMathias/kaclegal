import Image from "next/image";
import Section from "@/components/ui/Section";
import Reveal from "@/components/motion/Reveal";

/**
 * Organisations the firm has worked with.
 *
 * Each entry maps a display name to a logo file the firm supplies at
 * `public/images/clients/<file>.png` (transparent PNG or SVG recommended).
 * Add/rename files to match `file` below — order here is the display order.
 *
 * @type {{ name: string, file: string }[]}
 */
const clients = [
  { name: "Saroafrica International Ltd", file: "saroafrica" },
  { name: "Dew of Hermon Montessori School", file: "dew-of-hermon" },
  { name: "Ray's On It Sha Entertainment", file: "rays-on-it-sha" },
  { name: "Decade Homes", file: "decade-homes" },
  { name: "Tomi Aina Beauty", file: "tomi-aina-beauty" },
  { name: "Zijela ICT", file: "zijela-ict" },
  { name: "Opulence Realty", file: "opulence-realty" },
  { name: "VFL Iconic Properties Ltd", file: "vfl-iconic-properties" },
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
                key={`${client.file}-${index}`}
                className="mr-10 flex h-16 w-44 shrink-0 items-center justify-center sm:mr-16"
                aria-hidden={isDuplicate ? true : undefined}
              >
                <div className="relative h-full w-full">
                  <Image
                    src={`/images/clients/${client.file}.png`}
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
