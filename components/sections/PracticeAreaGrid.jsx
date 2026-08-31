import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Section from "@/components/ui/Section";
import { practiceAreas } from "@/content/practice-areas";

/**
 * PracticeAreaGrid — responsive grid of practice-area teaser cards
 * (1 column mobile, 2 tablet, 3 desktop). Each card links to its detail route
 * at `/practice-areas/[slug]`.
 *
 * Data comes from the shared `/content/practice-areas` source — one source of
 * truth for the homepage teaser and any future hub page.
 *
 * `roundedCards` is homepage-only styling: rounded white cards (via `!`
 * overrides on Card's normally sharp `rounded-none`, the same override
 * pattern already used on Hero/AboutTeaser's buttons) and light text for the
 * navy panel it sits on. Every other usage keeps the site's normal sharp
 * corners untouched.
 *
 * @param {object} props
 * @param {boolean} [props.showIntro=true] - Render the eyebrow/heading/description block above the grid.
 * @param {'white'|'offWhite'|'navy'|'navyPanel'|'navyDarkPanel'} [props.background='offWhite'] - Section background. Defaults to the light/grey panel option.
 * @param {boolean} [props.roundedCards=false] - Homepage-only rounded-card, light-text styling.
 */
export default function PracticeAreaGrid({
  showIntro = true,
  background = "offWhite",
  roundedCards = false,
}) {
  const headingColor = roundedCards ? "text-white" : "text-brand-navy";
  const bodyColor = roundedCards ? "text-white/70" : "text-brand-muted";
  const cardClasses = roundedCards ? "!rounded-2xl" : "";

  return (
    <Section background={background} spacing="md">
      {showIntro && (
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
      )}

      <div
        className={`${showIntro ? "mt-10 " : ""}grid gap-6 sm:grid-cols-2 lg:grid-cols-3`}
      >
        {practiceAreas.map((area) => (
          <Card
            key={area.slug}
            image={`/images/practice-areas/${area.slug}.webp`}
            imageAlt={area.title}
            className={cardClasses}
          >
            <h3 className="font-display text-h3 text-brand-navy">
              {area.title}
            </h3>
            <p className="mt-3 text-body text-brand-muted">{area.summary}</p>
            <Button
              href={`/practice-areas/${area.slug}`}
              size="sm"
              className="mt-5 !flex !w-full !items-center !justify-center !gap-2 !rounded-full"
            >
              <span>Learn more</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
                className="shrink-0"
              >
                <path
                  d="M3.5 8h9M8.5 3.5 13 8l-4.5 4.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Button>
          </Card>
        ))}
      </div>
    </Section>
  );
}
