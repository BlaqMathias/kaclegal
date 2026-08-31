import { requireAdminPage } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase';
import AdminShell from '@/components/admin/AdminShell';
import PublicationsTable from '@/components/admin/PublicationsTable';
import Button from '@/components/ui/Button';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Publications',
  robots: { index: false, follow: false, nocache: true },
};

/**
 * /admin/publications — manage every publication, draft or published.
 *
 * `requireAdminPage()` runs before any data is fetched. The middleware would
 * normally have redirected already, but this page reads with the service-role
 * client (which bypasses RLS and can see drafts), so it verifies the session
 * itself rather than trusting that the middleware ran.
 */
export default async function AdminPublicationsPage() {
  const user = await requireAdminPage('/admin/publications');

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('publications')
    .select(
      'id, slug, title, type, description, is_paid, price_naira, file_path, status, created_at, updated_at',
    )
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[admin/publications] Could not load publications:', error);
  }

  return (
    <AdminShell
      email={user.email}
      title="Publications"
      description="Everything in the firm's library. Drafts are visible here only — they stay hidden on the public site until you publish them."
      actions={<Button href="/admin/publications/new">Add publication</Button>}
    >
      {error ? (
        <div
          role="alert"
          className="border border-brand-error/30 bg-brand-error/5 px-5 py-4 text-body text-brand-error"
        >
          Could not load publications. Check that the database is reachable and
          that the <code>publications</code> table exists, then reload this page.
        </div>
      ) : (
        <PublicationsTable publications={data ?? []} />
      )}
    </AdminShell>
  );
}
