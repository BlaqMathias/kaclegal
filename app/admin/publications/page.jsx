import AdminShell from "@/components/admin/AdminShell";
import PublicationStats from "@/components/admin/PublicationStats";
import PublicationsGrid from "@/components/admin/PublicationsGrid";
import Button from "@/components/ui/Button";
import { requireAdminPage } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Publications",
  robots: { index: false, follow: false, nocache: true },
};

/**
 * /admin/publications — manage every publication, draft or published.
 *
 * `requireAdminPage()` runs before any data is fetched. The middleware would
 * normally have redirected already, but this page reads with the service-role
 * client (which bypasses RLS and can see drafts), so it verifies the session
 * itself rather than trusting that the middleware ran.
 *
 * Three queries run here: the publications themselves (now including
 * `download_count`, for the free-downloads stat and per-card display), the
 * distinct set of publication ids with at least one transaction (so the grid
 * knows which cards must refuse deletion), and a count of completed
 * transactions (the "Completed Transactions" stat). None of these depend on
 * each other, so they run concurrently rather than sequentially.
 */
export default async function AdminPublicationsPage() {
  const user = await requireAdminPage("/admin/publications");

  const supabase = getSupabaseAdmin();

  const [publicationsResult, transactionIdsResult, completedCountResult] =
    await Promise.all([
      supabase
        .from("publications")
        .select(
          "id, slug, title, type, description, is_paid, price_naira, file_path, image_path, status, download_count, created_at, updated_at",
        )
        .order("created_at", { ascending: false }),
      supabase.from("transactions").select("publication_id"),
      supabase
        .from("transactions")
        .select("id", { count: "exact", head: true })
        .eq("status", "completed"),
    ]);

  const { data: publications, error } = publicationsResult;

  if (error) {
    console.error("[admin/publications] Could not load publications:", error);
  }

  if (transactionIdsResult.error) {
    console.error(
      "[admin/publications] Could not load transaction references:",
      transactionIdsResult.error,
    );
  }

  if (completedCountResult.error) {
    console.error(
      "[admin/publications] Could not count completed transactions:",
      completedCountResult.error,
    );
  }

  // Dedupe to a plain array of ids — a Set doesn't serialize cleanly across
  // the server/client boundary, so PublicationsGrid rebuilds one from this.
  const protectedIds = Array.from(
    new Set((transactionIdsResult.data ?? []).map((row) => row.publication_id)),
  );

  const rows = publications ?? [];
  const totalFreeDownloads = rows
    .filter((row) => !row.is_paid)
    .reduce((sum, row) => sum + (row.download_count ?? 0), 0);

  return (
    <AdminShell
      email={user.email}
      title="Publications"
      description="Everything in the firm's library. Drafts are visible here only — they stay hidden on the public site until you publish them."
      actions={<Button href="/admin/publications/new">Add publication</Button>}
    >
      <PublicationStats
        totalPublications={rows.length}
        completedTransactions={completedCountResult.count ?? 0}
        totalFreeDownloads={totalFreeDownloads}
      />

      <div className="mt-10">
        {error ? (
          <div
            role="alert"
            className="border border-brand-error/30 bg-brand-error/5 px-5 py-4 text-body text-brand-error"
          >
            Could not load publications. Check that the database is reachable
            and that the <code>publications</code> table exists, then reload
            this page.
          </div>
        ) : (
          <PublicationsGrid publications={rows} protectedIds={protectedIds} />
        )}
      </div>
    </AdminShell>
  );
}
