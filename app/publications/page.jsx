import Section from '@/components/ui/Section';
import Button from '@/components/ui/Button';
import PublicationCard from '@/components/sections/PublicationCard';
import CtaBanner from '@/components/sections/CtaBanner';
import { createSupabasePublicClient } from '@/lib/supabaseServer';

// Publications are managed through /admin and can change at any time, so this
// page is rendered per request rather than cached at build.
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Publications',
  description:
    'Books, research papers, guides and articles from Koko Asuquo Chambers on commercial law, data privacy, regulatory compliance and intellectual property in Nigeria.',
};

/**
 * Fetch every published publication, newest first.
 *
 * Uses the anon client, so row-level security is doing the filtering: the policy
 * only exposes rows with `status = 'published'`. The explicit `.eq()` below is
 * belt and braces — if the policy were ever loosened, drafts still would not
 * appear here. `file_path` is deliberately not selected: the listing has no use
 * for it.
 *
 * @returns {Promise<{publications: Array<Record<string, any>>, failed: boolean}>}
 */
async function getPublishedPublications() {
  try {
    const supabase = createSupabasePublicClient();
    const { data, error } = await supabase
      .from('publications')
      .select('id, slug, title, type, description, is_paid, price_naira')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[publications] Could not load publications:', error);
      return { publications: [], failed: true };
    }

    return { publications: data ?? [], failed: false };
  } catch (error) {
    console.error('[publications] Could not load publications:', error);
    return { publications: [], failed: true };
  }
}

/**
 * /publications — the firm's library. Free and paid items share one grid.
 */
export default async function PublicationsPage() {
  const { publications, failed } = await getPublishedPublications();

  return (
    <>
      <Section background="offWhite" spacing="lg">
        <div className="max-w-3xl">
          <p className="text-caption font-semibold uppercase tracking-[0.22em] text-brand-teal">
            Publications
          </p>
          <h1 className="mt-3 font-display text-hero text-brand-navy">
            Writing from the practice
          </h1>
          <p className="mt-5 text-body-lg text-brand-muted">
            Books, research papers, guides and articles drawn from the work we do
            for businesses across Nigeria. Some are free to read; others are
            available to purchase.
          </p>
        </div>
      </Section>

      <Section background="white" spacing="md">
        {publications.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {publications.map((publication) => (
              <PublicationCard key={publication.id} publication={publication} />
            ))}
          </div>
        ) : (
          <div className="mx-auto max-w-xl border border-slate-200 bg-brand-offWhite p-10 text-center">
            <h2 className="font-display text-h3 text-brand-navy">
              {failed ? 'Publications are unavailable' : 'Nothing published yet'}
            </h2>
            <p className="mt-3 text-body text-brand-muted">
              {failed
                ? 'We could not load the library just now. Please try again shortly, or get in touch and we will send you what you need.'
                : 'Our first publications are on the way. In the meantime, we are happy to talk through any question directly.'}
            </p>
            <div className="mt-6 flex justify-center">
              <Button href="/contact" variant="secondary">
                Get in touch
              </Button>
            </div>
          </div>
        )}
      </Section>

      <CtaBanner />
    </>
  );
}
