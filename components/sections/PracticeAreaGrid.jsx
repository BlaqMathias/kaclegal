import Section from "@/components/ui/Section";
import { practiceAreas } from "@/content/practice-areas";
import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/motion/Reveal";
import { RevealStagger, RevealItem } from "@/components/motion/RevealStagger";

/**
 * PracticeAreaGrid — responsive grid of practice-area teaser cards
 * (1 column mobile, 2 tablet, 3 desktop). Each card links to its detail route
 * at `/practice-areas/[slug]`.
 *
 * Data comes from the shared `/content/practice-areas` source — one source of
 * truth for the homepage teaser and any future hub page.
 *
 * Card style: image-forward "selected work" treatment. The photo sits in its
 * own bordered, rounded box; the title sits below it on the section's own
 * background — not inside the image's box. The whole card (image + title) is
 * the link; on hover the image zooms and rotates slightly.
 *
 * `roundedCards` is homepage-only styling: rounded image box + light title
 * text for the navy panel it sits on. Every other usage keeps the site's
 * normal sharp corners (rounded-none) untouched.
 *
 * @param {object} props
 * @param {boolean} [props.showIntro=true] - Render the eyebrow/heading/description block above the grid.
 * @param {'white'|'offWhite'|'navy'|'navyPanel'|'navyDarkPanel'} [props.background='offWhite'] - Section background.
 * @param {boolean} [props.roundedCards=false] - Homepage-only rounded-card, light-text styling.
 */

/** Accent border cycles through these brand colors, one per card in order. */
const BORDER_COLORS = [
  "border-brand-teal",
  "border-brand-navy",
  "border-brand-navyDark",
];

export default function PracticeAreaGrid({
  showIntro = true,
  background = "offWhite",
  roundedCards = false,
}) {
  const headingColor = roundedCards ? "text-white" : "text-brand-navy";
  const bodyColor = roundedCards ? "text-white/70" : "text-brand-muted";
  const titleColor = roundedCards ? "text-white" : "text-brand-navy";
  const cornerClass = roundedCards ? "rounded-3xl" : "rounded-none";

  return (
    <Section background={background} spacing="md">
      {showIntro && (
        <Reveal variant="fadeUp">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-caption font-semibold uppercase tracking-[0.22em] text-brand-teal">
              Our Practice Areas
            </p>
            <h2
              className={`mt-3 font-display text-h2 font-bold ${headingColor}`}
            >
              Everything a Growing Business Needs in One Place
            </h2>
            <p className={`mt-4 text-body ${bodyColor}`}>
              From company formation to scaling challenges, we cover the legal
              ground so you don&rsquo;t have to figure it out alone.
            </p>
          </div>
        </Reveal>
      )}

      <RevealStagger
        className={`${showIntro ? "mt-10 " : ""}grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3`}
      >
        {practiceAreas.map((area, index) => {
          const borderColor = BORDER_COLORS[index % BORDER_COLORS.length];

          return (
            <RevealItem key={area.slug} variant="fadeUp">
              <Link
                href={`/practice-areas/${area.slug}`}
                className="group block"
              >
                {/* Image box — border, corner treatment, and hover zoom/rotate live here only */}
                <div
                  className={`relative aspect-[4/3] w-full overflow-hidden border-2 shadow-card transition-shadow duration-300 group-hover:shadow-card-hover ${cornerClass} ${borderColor}`}
                >
                  <Image
                    src={`/images/practice-areas/${area.slug}.webp`}
                    alt={area.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-110 group-hover:rotate-2"
                  />
                </div>

                {/* Title — sits on the section's own background, below the image box */}
                <h3 className={`mt-4 font-display text-h3 ${titleColor}`}>
                  {area.title}
                </h3>
              </Link>
            </RevealItem>
          );
        })}
      </RevealStagger>
    </Section>
  );
}
