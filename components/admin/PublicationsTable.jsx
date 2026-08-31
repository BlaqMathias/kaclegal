'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { formatDateUTC, formatNaira } from '@/lib/publications';

/**
 * PublicationsTable — the admin list of every publication, drafts included.
 *
 * Delete is two-step: the first click swaps the row's actions for an explicit
 * "Delete permanently / Cancel" pair. A single-click destructive action next to
 * "Edit" is too easy to hit by accident, and this needs no modal.
 *
 * The rows shown are always derived from the `publications` prop rather than
 * copied into state. Local state holds only the ids deleted in this session, used
 * to hide those rows immediately. Seeding state from props would freeze the list
 * at its first render: `router.refresh()` would fetch a new server render and the
 * table would keep showing the stale copy.
 *
 * @param {object} props
 * @param {Array<Record<string, any>>} props.publications - Rows from the server, newest first.
 */
export default function PublicationsTable({ publications }) {
  const router = useRouter();
  const [deletedIds, setDeletedIds] = useState(() => new Set());
  const [confirmingId, setConfirmingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');

  // Once the refreshed server render arrives the deleted rows are simply absent,
  // so this filter becomes a no-op rather than a second source of truth.
  const rows = publications.filter((row) => !deletedIds.has(row.id));

  const handleDelete = async (id) => {
    setError('');
    setDeletingId(id);

    try {
      const response = await fetch(`/api/admin/publications/${id}`, {
        method: 'DELETE',
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload.ok) {
        setError(payload.error || 'Could not delete that publication.');
        setDeletingId(null);
        return;
      }

      // Hide it locally for an immediate response, then refresh so the server
      // render becomes the source of truth again.
      setDeletedIds((current) => {
        const next = new Set(current);
        next.add(id);
        return next;
      });
      setConfirmingId(null);
      setDeletingId(null);
      router.refresh();
    } catch (caught) {
      console.error('[admin] Delete failed:', caught);
      setError('Could not reach the server. Please try again.');
      setDeletingId(null);
    }
  };

  if (rows.length === 0) {
    return (
      <div className="border border-slate-200 bg-white p-10 text-center shadow-card">
        <h2 className="text-h4 text-brand-navy">No publications yet</h2>
        <p className="mx-auto mt-2 max-w-md text-body text-brand-muted">
          Add your first publication to have it appear in the firm&rsquo;s library.
          Anything saved as a draft stays hidden from the public site.
        </p>
        <div className="mt-6 flex justify-center">
          <Button href="/admin/publications/new">Add publication</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div
          role="alert"
          className="mb-4 border border-brand-error/30 bg-brand-error/5 px-4 py-3 text-caption text-brand-error"
        >
          {error}
        </div>
      )}

      <div className="overflow-x-auto border border-slate-200 bg-white shadow-card">
        <table className="w-full min-w-[52rem] border-collapse text-left">
          <caption className="sr-only">
            All publications, including drafts that are not visible on the public
            site.
          </caption>
          <thead>
            <tr className="border-b border-slate-200 bg-brand-offWhite">
              <th scope="col" className="px-5 py-3 text-caption font-semibold uppercase tracking-[0.14em] text-brand-muted">
                Title
              </th>
              <th scope="col" className="px-5 py-3 text-caption font-semibold uppercase tracking-[0.14em] text-brand-muted">
                Type
              </th>
              <th scope="col" className="px-5 py-3 text-caption font-semibold uppercase tracking-[0.14em] text-brand-muted">
                Price
              </th>
              <th scope="col" className="px-5 py-3 text-caption font-semibold uppercase tracking-[0.14em] text-brand-muted">
                Status
              </th>
              <th scope="col" className="px-5 py-3 text-caption font-semibold uppercase tracking-[0.14em] text-brand-muted">
                Added
              </th>
              <th scope="col" className="px-5 py-3 text-right text-caption font-semibold uppercase tracking-[0.14em] text-brand-muted">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isConfirming = confirmingId === row.id;
              const isDeleting = deletingId === row.id;

              return (
                <tr key={row.id} className="border-b border-slate-100 last:border-b-0">
                  <td className="px-5 py-4 align-top">
                    <span className="block font-medium text-brand-slate">
                      {row.title}
                    </span>
                    <span className="mt-1 block text-caption text-brand-muted">
                      /publications/{row.slug}
                    </span>
                    {!row.file_path && (
                      <span className="mt-1 block text-caption text-brand-error">
                        No file attached
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 align-top text-caption text-brand-slate">
                    {row.type}
                  </td>
                  <td className="px-5 py-4 align-top text-caption text-brand-slate">
                    {row.is_paid ? formatNaira(row.price_naira) : 'Free'}
                  </td>
                  <td className="px-5 py-4 align-top">
                    <Badge variant={row.status === 'published' ? 'teal' : 'muted'}>
                      {row.status === 'published' ? 'Published' : 'Draft'}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 align-top text-caption text-brand-muted">
                    {formatDateUTC(row.created_at)}
                  </td>
                  <td className="px-5 py-4 align-top">
                    {isConfirming ? (
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleDelete(row.id)}
                          loading={isDeleting}
                          className="!bg-brand-error hover:!bg-brand-error/90 focus-visible:!ring-brand-error"
                        >
                          Delete permanently
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setConfirmingId(null)}
                          disabled={isDeleting}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center justify-end gap-3">
                        <Link
                          href={`/admin/publications/${row.id}/edit`}
                          className="text-caption font-medium text-brand-navy transition-colors hover:text-brand-teal"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => setConfirmingId(row.id)}
                          className="text-caption font-medium text-brand-error transition-colors hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-caption text-brand-muted">
        Deleting a publication also removes its uploaded file. This cannot be
        undone.
      </p>
    </div>
  );
}
