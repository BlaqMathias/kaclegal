import Reveal from "@/components/motion/Reveal";
import CtaBanner from "@/components/sections/CtaBanner";
import PublicationsBrowser from "@/components/sections/PublicationsBrowser";
import Section from "@/components/ui/Section";
import { createSupabasePublicClient } from "@/lib/supabaseServer";

// Publications are managed through /admin and can change at any time, so this
// page is rendered per request rather than cached at build.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Publications",
  description:
    "Books, research papers, guides and articles from Koko Asuquo Chambers on commercial law, data privacy, regulatory compliance and intellectual property in Nigeria.",
};

/**
 * Fetch every published publication, newest first.
 *
 * Uses the anon client, so row-level security is doing the filtering: the policy
 * only exposes rows with `status = 'published'`. The explicit `.eq()` below is
 * belt and braces — if the policy were ever loosened, drafts still would not
 * appear here. `file_path` is deliberately not selected: the listing has no use
 * for it. `created_at` IS selected — the grid shows a publish date per card.
 *
 * @returns {Promise<{publications: Array<Record<string, any>>, failed: boolean}>}
 */
async function getPublishedPublications() {
  try {
    const supabase = createSupabasePublicClient();
    const { data, error } = await supabase
      .from("publications")
      .select(
        "id, slug, title, type, description, is_paid, price_naira, image_path, created_at",
      )
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[publications] Could not load publications:", error);
      return { publications: [], failed: true };
    }

    return { publications: data ?? [], failed: false };
  } catch (error) {
    console.error("[publications] Could not load publications:", error);
    return { publications: [], failed: true };
  }
}

/**
 * /publications — the firm's library. Free and paid items share one grid,
 * filterable by type. Free items download directly from their card (no
 * detail page); paid items link through to `/publications/[slug]` to buy.
 */
export default async function PublicationsPage() {
  const { publications, failed } = await getPublishedPublications();

  return (
    <>
      {/* Intro — same net-line grid + glow treatment as the homepage hero,
          just shorter (spacing="sm" + smaller glow) since this page doesn't
          need the full hero height. */}
      <Section
        background="white"
        spacing="sm"
        container={false}
        className="relative overflow-hidden"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(4,80,159,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(4,80,159,0.08) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage:
              "radial-gradient(ellipse 65% 60% at 50% 30%, black 0%, transparent 75%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 65% 60% at 50% 30%, black 0%, transparent 75%)",
          }}
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-0 hidden justify-center sm:flex">
          <div className="mt-2 h-[220px] w-[220px] rounded-full bg-brand-teal/20 blur-[90px] md:h-[280px] md:w-[280px]" />
          <div className="absolute -right-6 top-12 h-[150px] w-[150px] rounded-full bg-brand-navy/15 blur-[80px]" />
        </div>

        <div className="container-kac relative z-10">
          <Reveal variant="fadeUp" className="mx-auto max-w-3xl text-center">
            <p className="text-caption font-semibold uppercase tracking-[0.22em] text-brand-teal">
              Publications
            </p>
            <h1 className="mt-3 font-display text-hero text-brand-navy">
              Writing from the practice
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-body text-brand-muted">
              Books, research papers, guides and articles drawn from the work we
              do for businesses across Nigeria. Some are free to read; others
              are available to purchase.
            </p>
          </Reveal>
        </div>
      </Section>

      <PublicationsBrowser publications={publications} failed={failed} />

      <CtaBanner />
    </>
  );
}
