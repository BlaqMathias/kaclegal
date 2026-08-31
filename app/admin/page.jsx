import { redirect } from 'next/navigation';
import { requireAdminPage } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * /admin — no dashboard of its own yet, so send the admin straight to the only
 * thing there is to manage.
 *
 * The guard runs first even though this page renders nothing and only forwards to
 * an already-guarded page. Two reasons: the middleware passes requests straight
 * through when the Supabase env vars are missing, and "every page under /admin
 * verifies the session itself" is only a useful invariant if there are no
 * exceptions to remember.
 */
export default async function AdminIndexPage() {
  await requireAdminPage('/admin/publications');

  redirect('/admin/publications');
}
