import Button from "@/components/ui/Button";
import Section from "@/components/ui/Section";

export const metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <Section background="offWhite" spacing="lg">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-caption font-semibold uppercase tracking-[0.22em] text-brand-teal">
          Error 404
        </p>
        <h1 className="mt-3 font-display text-hero text-brand-navy">
          Page not found
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-body-lg text-brand-muted">
          The page you were looking for doesn&apos;t exist or may have moved.
          Let&apos;s get you back on track.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button href="/">Back to Home</Button>
          <Button href="/contact" variant="secondary">
            Contact Us
          </Button>
        </div>
      </div>
    </Section>
  );
}
