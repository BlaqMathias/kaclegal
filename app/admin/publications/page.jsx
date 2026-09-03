import AdminShell from '@/components/admin/AdminShell';
import PublicationStats from '@/components/admin/PublicationStats';
import PublicationsGrid from '@/components/admin/PublicationsGrid';
import Button from '@/components/ui/Button';
import { requireAdminPage } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Publications',
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminPublicationsPage() {
  const user = await requireAdminPage('/admin/publications');
  const supabase = getSupabaseAdmin();

  const [publicationsResult, metricsResult] = await Promise.all([
    supabase
      .from('publications')
      .select(
        'id, slug, title, type, description, is_paid, price_naira, file_path, image_path, status, download_count, archived_at, created_at, updated_at',
      )
      .order('created_at', { ascending: false }),
    supabase.rpc('get_publication_admin_metrics'),
  ]);

  const { data: publications, error } = publicationsResult;
  if (error) {
    console.error('[admin/publications] Could not load publications:', error);
  }
  if (metricsResult.error) {
    console.error(
      '[admin/publications] Could not load publication metrics:',
      metricsResult.error,
    );
  }

  const rows = publications ?? [];
  const metricRow = Array.isArray(metricsResult.data)
    ? metricsResult.data[0]
    : metricsResult.data;

  const metrics = {
    totalPublications: Number(metricRow?.total_publications ?? rows.length),
    freePublications: Number(
      metricRow?.free_publications ??
        rows.filter((row) => !row.is_paid).length,
    ),
    paidPublications: Number(
      metricRow?.paid_publications ??
        rows.filter((row) => row.is_paid).length,
    ),
    totalFreeDownloads: Number(metricRow?.free_downloads ?? 0),
    totalRevenue: Number(metricRow?.total_revenue ?? 0),
    salesThisMonth: Number(metricRow?.sales_this_month ?? 0),
    downloadsThisMonth: Number(metricRow?.downloads_this_month ?? 0),
    bestSeller: metricRow?.best_seller ?? '—',
  };

  return (
    <AdminShell
      email={user.email}
      title="Publications"
      description="Everything in the firm's library. Drafts and archived paid publications stay hidden from the public site."
      actions={<Button href="/admin/publications/new">Add publication</Button>}
    >
      <PublicationStats
        totalPublications={metrics.totalPublications}
        freePublications={metrics.freePublications}
        paidPublications={metrics.paidPublications}
        totalFreeDownloads={metrics.totalFreeDownloads}
        totalRevenue={metrics.totalRevenue}
        salesThisMonth={metrics.salesThisMonth}
        downloadsThisMonth={metrics.downloadsThisMonth}
        bestSeller={metrics.bestSeller}
      />

      <div className="mt-10">
        {error ? (
          <div
            role="alert"
            className="border border-brand-error/30 bg-brand-error/5 px-5 py-4 text-body text-brand-error"
          >
            Could not load publications. Check that the database is reachable
            and reload this page.
          </div>
        ) : (
          <PublicationsGrid publications={rows} />
        )}
      </div>
    </AdminShell>
  );
}
