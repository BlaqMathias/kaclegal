import { requireAdminPage } from '@/lib/auth';
import AdminShell from '@/components/admin/AdminShell';
import PublicationForm from '@/components/admin/PublicationForm';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Add publication',
  robots: { index: false, follow: false, nocache: true },
};

/**
 * /admin/publications/new — create a publication.
 */
export default async function NewPublicationPage() {
  const user = await requireAdminPage('/admin/publications/new');

  return (
    <AdminShell
      email={user.email}
      title="Add publication"
      description="Save it as a draft while you're still working on it. Nothing appears on the public site until the status is set to published."
    >
      <PublicationForm mode="create" />
    </AdminShell>
  );
}
