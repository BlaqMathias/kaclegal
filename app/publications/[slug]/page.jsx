import Reveal from "@/components/motion/Reveal";
import BuyButton from "@/components/sections/BuyButton";
import CtaBanner from "@/components/sections/CtaBanner";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Section from "@/components/ui/Section";
import { formatNaira } from "@/lib/publications";
import { createSupabasePublicClient } from "@/lib/supabaseServer";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * Look up one published publication by slug.
 *
 * Drafts are invisible here by two independent mechanisms: the RLS policy only
 * exposes published rows to the anon key, and the query filters on status
 * anyway. `file_path` is never selected — the browser has no business knowing
 * the storage key, and the read route resolves it server-side.
 *
 * @param {string} slug - URL slug.
 * @returns {Promise<Record<string, any>|null>}
 */
async function getPublication(slug) {
  try {
    const supabase = createSupabasePublicClient();
    const { data, error } = await supabase
      .from("publications")
      .select(
        "id, slug, title, type, description, is_paid, price_naira, created_at",
      )
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();

    if (error) {
      console.error("[publications/:slug] Lookup failed:", error);
      return null;
    }

    return data ?? null;
  } catch (error) {
    console.error("[publications/:slug] Lookup failed:", error);
    return null;
  }
}

/**
 * @param {{params: {slug: string}}} props
 */
export async function generateMetadata({ params }) {
  const publication = await getPublication(params.slug);

  if (!publication) {
    return { title: "Publication not found" };
  }

  return {
    title: publication.title,
    description:
      publication.description ??
      `${publication.type} from Koko Asuquo Chambers.`,
  };
}

/**
 * /publications/[slug] — a single publication.
 *
 * Paid only: free publications have no detail page. If a free item's slug is
 * requested directly (an old bookmark, a shared link, etc.), this redirects
 * straight to the signed-download route instead of rendering anything — the
 * download route re-validates `is_paid`/`status` itself either way.
 *
 * @param {{params: {slug: string}}} props
 */
export default async function PublicationDetailPage({ params }) {
  const publication = await getPublication(params.slug);

  if (!publication) {
    notFound();
  }

  if (!publication.is_paid) {
    redirect(`/api/publications/${publication.slug}/read`);
  }

  return (
    <>
      <Section background="offWhite" spacing="lg">
        <Reveal variant="fadeUp" className="mx-auto max-w-3xl text-center">
          <p className="text-caption font-semibold uppercase tracking-[0.22em] text-brand-teal">
            <Link
              href="/publications"
              className="transition-colors hover:text-brand-navy"
            >
              Publications
            </Link>
          </p>
          <h1 className="mt-3 font-display text-h1 text-brand-navyDark">
            {publication.title}
          </h1>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <Badge variant="navy">{publication.type}</Badge>
            <Badge variant="muted">
              {formatNaira(publication.price_naira)}
            </Badge>
          </div>
        </Reveal>
      </Section>

      <Section background="white" spacing="md">
        <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
          <Reveal variant="slideRight">
            {publication.description ? (
              <div className="max-w-2xl space-y-4 text-body-lg text-brand-slate">
                {publication.description
                  .split(/\n{2,}/)
                  .filter(Boolean)
                  .map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
              </div>
            ) : (
              <p className="text-body text-brand-muted">
                Further details for this publication are on the way.
              </p>
            )}
          </Reveal>

          <Reveal variant="slideLeft" delay={0.1} as="aside">
            <div className="border border-slate-200 bg-brand-offWhite p-6">
              <p className="text-caption font-semibold uppercase tracking-[0.16em] text-brand-muted">
                Price
              </p>
              <p className="mt-2 font-display text-h2 text-brand-navy">
                {formatNaira(publication.price_naira)}
              </p>
              <div className="mt-6">
                <BuyButton
                  publicationId={publication.id}
                  priceLabel={formatNaira(publication.price_naira)}
                />
              </div>
              <p className="mt-3 text-caption text-brand-muted">
                Secure payment via Paystack. Your download link arrives
                immediately after payment is confirmed.
              </p>
              <div className="mt-4">
                <Button href="/contact" variant="secondary" size="sm" fullWidth>
                  Prefer to pay another way? Contact us
                </Button>
              </div>
            </div>

            <p className="mt-6 text-caption text-brand-muted">
              <Link
                href="/publications"
                className="transition-colors hover:text-brand-teal"
              >
                Back to all publications
              </Link>
            </p>
          </Reveal>
        </div>
      </Section>

      <CtaBanner />
    </>
  );
}
