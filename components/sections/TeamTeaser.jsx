import Button from "@/components/ui/Button";
import Section from "@/components/ui/Section";
import Image from "next/image";

export default function TeamTeaser() {
  return (
    <Section background="navy" spacing="md">
      <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
        <div>
          <p className="text-caption font-semibold uppercase tracking-[0.22em] text-white/70">
            Our Team
          </p>
          <h2 className="mt-3 font-display text-h2 text-white">
            The people behind our counsel.
          </h2>
          <p className="mt-5 max-w-xl text-body-lg text-white/80">
            A close-knit team of commercial lawyers giving clear, practical
            advice across company and compliance work, intellectual property,
            real estate and family matters.
          </p>
          <div className="mt-8">
            <Button
              href="/team"
              variant="secondary"
              size="lg"
              className="!border-white !text-white hover:!bg-white hover:!text-brand-navy focus-visible:!ring-white focus-visible:!ring-offset-brand-navy"
            >
              Meet the Team
            </Button>
          </div>
        </div>

        {/* Oversized on purpose: scaled up + negative vertical margins so the
            portrait bleeds a little past the navy band's top and bottom edges.
            Kept off the left/text column; the Section is not clipped, so the
            overshoot shows. Tweak the scale / -my values to taste. */}
        <div className="relative aspect-[4/3] w-full origin-center scale-105 md:-my-24 md:scale-110 lg:-my-28 lg:scale-125">
          <Image
            src="/images/team/combinationTeam.webp"
            alt="The Koko Asuquo Chambers team"
            fill
            sizes="(max-width: 768px) 100vw, 60vw"
            className="object-contain"
          />
        </div>
      </div>
    </Section>
  );
}
