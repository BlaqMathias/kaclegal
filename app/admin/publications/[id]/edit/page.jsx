import AdminShell from "@/components/admin/AdminShell";
import PublicationForm from "@/components/admin/PublicationForm";
import { requireAdminPage } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Edit publication",
  robots: { index: false, follow: false, nocache: true },
};

/** Matches a canonical UUID, so a junk id 404s instead of erroring in Postgres. */
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * /admin/publications/[id]/edit — edit an existing publication.
 *
 * Reads with the service-role client so drafts are editable, which is why the
 * session is verified here rather than relying on the middleware alone.
 *
 * @param {{params: {id: string}}} props
 */
export default async function EditPublicationPage({ params }) {
  // Validate the id BEFORE it is used to build the login redirect target, so an
  // unchecked path segment never reaches a URL, even a safe one.
  if (!UUID_PATTERN.test(params.id ?? "")) {
    notFound();
  }

  const user = await requireAdminPage(`/admin/publications/${params.id}/edit`);

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("publications")
    .select(
      "id, slug, title, type, description, is_paid, price_naira, file_path, image_path, status, archived_at, created_at, updated_at",
    )
    .eq("id", params.id)
    .maybeSingle();

  if (error) {
    console.error("[admin/publications/edit] Lookup failed:", error);
  }

  if (!data) {
    notFound();
  }

  return (
    <AdminShell
      email={user.email}
      title="Edit publication"
      description={data.title}
    >
      <PublicationForm mode="edit" publication={data} />
    </AdminShell>
  );
}
