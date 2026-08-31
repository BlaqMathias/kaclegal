import { notFound } from 'next/navigation';
import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Section from '@/components/ui/Section';
import CtaBanner from '@/components/sections/CtaBanner';
import BuyButton from '@/components/sections/BuyButton';
import { createSupabasePublicClient } from '@/lib/supabaseServer';
import { formatNaira } from '@/lib/publications';

export const dynamic = 'force-dynamic';

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
      .from('publications')
      .select('id, slug, title, type, description, is_paid, price_naira, created_at')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle();

    if (error) {
      console.error('[publications/:slug] Lookup failed:', error);
      return null;
    }

    return data ?? null;
  } catch (error) {
    console.error('[publications/:slug] Lookup failed:', error);
    return null;
  }
}

/**
 * @param {{params: {slug: string}}} props
 */
export async function generateMetadata({ params }) {
  const publication = await getPublication(params.slug);

  if (!publication) {
    return { title: 'Publication not found' };
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
 * Free items link to the read route, which mints a short-lived signed URL for the
 * private file. Paid items show the price and a deliberately disabled Buy
 * button: payment arrives in Phase 7, and a button that looks live but silently
 * does nothing would be worse than one that says so.
 *
 * @param {{params: {slug: string}}} props
 */
export default async function PublicationDetailPage({ params }) {
  const publication = await getPublication(params.slug);

  if (!publication) {
    notFound();
  }

  const isPaid = publication.is_paid;

  return (
    <>
      <Section background="offWhite" spacing="lg">
        <div className="max-w-3xl">
          <p className="text-caption font-semibold uppercase tracking-[0.22em] text-brand-teal">
            <Link href="/publications" className="transition-colors hover:text-brand-navy">
              Publications
            </Link>
          </p>
          <h1 className="mt-3 font-display text-h1 text-brand-navy">
            {publication.title}
          </h1>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Badge variant="navy">{publication.type}</Badge>
            <Badge variant={isPaid ? 'muted' : 'teal'}>
              {isPaid ? formatNaira(publication.price_naira) : 'Free'}
            </Badge>
          </div>
        </div>
      </Section>

      <Section background="white" spacing="md">
        <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
          <div>
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
              <p className="text-body-lg text-brand-muted">
                Further details for this publication are on the way.
              </p>
            )}
          </div>

          <aside>
            <div className="border border-slate-200 bg-brand-offWhite p-6">
              {isPaid ? (
                <>
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
                </>
              ) : (
                <>
                  <p className="text-caption font-semibold uppercase tracking-[0.16em] text-brand-muted">
                    Free to read
                  </p>
                  <p className="mt-2 text-body text-brand-slate">
                    Open the full document — no sign-up, no email required.
                  </p>
                  <div className="mt-6">
                    {/*
                      A native anchor, not <Button href> / <Link>: this navigates
                      out to a signed storage URL rather than to an app route, so
                      client-side routing must not intercept it.
                    */}
                    <a
                      href={`/api/publications/${publication.slug}/read`}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-none bg-brand-navy px-7 py-3 text-body font-medium text-white transition-colors duration-200 hover:bg-brand-navyDark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy focus-visible:ring-offset-2"
                    >
                      Read now
                    </a>
                  </div>
                  <p className="mt-3 text-caption text-brand-muted">
                    Opens as a download in a new step. The link is generated fresh
                    each time.
                  </p>
                </>
              )}
            </div>

            <p className="mt-6 text-caption text-brand-muted">
              <Link href="/publications" className="transition-colors hover:text-brand-teal">
                Back to all publications
              </Link>
            </p>
          </aside>
        </div>
      </Section>

      <CtaBanner />
    </>
  );
}
