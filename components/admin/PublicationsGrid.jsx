'use client';

import { useState } from 'react';
import { resolvePublicationImageUrl } from '@/lib/publicationImages';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { formatDateUTC, formatNaira } from '@/lib/publications';

export default function PublicationsGrid({ publications }) {
  const router = useRouter();
  const [deletedIds, setDeletedIds] = useState(() => new Set());
  const [confirmingId, setConfirmingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');

  const rows = publications.filter((row) => !deletedIds.has(row.id));

  async function handleDelete(row) {
    setError('');
    setDeletingId(row.id);

    try {
      const response = await fetch(`/api/admin/publications/${row.id}`, {
        method: 'DELETE',
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload.ok) {
        setError(
          payload.error ||
            `Could not ${row.is_paid ? 'archive' : 'delete'} that publication.`,
        );
        setConfirmingId(null);
        setDeletingId(null);
        return;
      }

      // Free publications are physically removed. Paid publications are soft
      // deleted into Archived so their financial/download history survives.
      if (payload.action === 'deleted') {
        setDeletedIds((current) => new Set([...current, row.id]));
      }

      setConfirmingId(null);
      setDeletingId(null);
      router.refresh();
    } catch (caught) {
      console.error('[admin] Publication removal failed:', caught);
      setError('Could not reach the server. Please try again.');
      setDeletingId(null);
    }
  }

  if (rows.length === 0) {
    return (
      <div className="border border-white/10 bg-white/5 p-10 text-center">
        <h2 className="font-display text-h4 text-white">No publications yet</h2>
        <p className="mx-auto mt-2 max-w-md text-body text-white/70">
          Add your first publication to have it appear in the firm&rsquo;s
          library.
        </p>
        <div className="mt-6 flex justify-center">
          <Button href="/admin/publications/new">Add publication</Button>
        </div>
      </div>
    );
  }

  const published = rows.filter((row) => row.status === 'published');
  const drafts = rows.filter((row) => row.status === 'draft');
  const archived = rows.filter((row) => row.status === 'archived');

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

      <PublicationsSection
        heading="Published"
        rows={published}
        emptyMessage="Nothing published yet."
        confirmingId={confirmingId}
        deletingId={deletingId}
        onDeleteClick={(row) => setConfirmingId(row.id)}
        onConfirmDelete={handleDelete}
        onCancelConfirm={() => setConfirmingId(null)}
      />

      <div className="mt-10">
        <PublicationsSection
          heading="Drafts & Unpublished"
          rows={drafts}
          emptyMessage="Nothing sitting in drafts."
          confirmingId={confirmingId}
          deletingId={deletingId}
          onDeleteClick={(row) => setConfirmingId(row.id)}
          onConfirmDelete={handleDelete}
          onCancelConfirm={() => setConfirmingId(null)}
        />
      </div>

      <div className="mt-10">
        <PublicationsSection
          heading="Archived"
          rows={archived}
          emptyMessage="No archived paid publications."
          confirmingId={confirmingId}
          deletingId={deletingId}
          onDeleteClick={(row) => setConfirmingId(row.id)}
          onConfirmDelete={handleDelete}
          onCancelConfirm={() => setConfirmingId(null)}
        />
      </div>

      <p className="mt-8 text-caption text-white/60">
        Free publications are deleted permanently with their uploaded file and
        cover image. Paid publications are archived instead so payment history
        and existing purchase records remain intact.
      </p>
    </div>
  );
}

function PublicationsSection({
  heading,
  rows,
  emptyMessage,
  confirmingId,
  deletingId,
  onDeleteClick,
  onConfirmDelete,
  onCancelConfirm,
}) {
  return (
    <section>
      <h2 className="font-display text-h4 text-white">
        {heading} <span className="text-white/50">({rows.length})</span>
      </h2>

      {rows.length === 0 ? (
        <p className="mt-3 text-caption text-white/60">{emptyMessage}</p>
      ) : (
        <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((row) => (
            <PublicationCardAdmin
              key={row.id}
              row={row}
              isConfirming={confirmingId === row.id}
              isDeleting={deletingId === row.id}
              onDeleteClick={() => onDeleteClick(row)}
              onConfirmDelete={() => onConfirmDelete(row)}
              onCancelConfirm={onCancelConfirm}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function PublicationCardAdmin({
  row,
  isConfirming,
  isDeleting,
  onDeleteClick,
  onConfirmDelete,
  onCancelConfirm,
}) {
  const actionLabel = row.is_paid ? 'Archive' : 'Delete';
  const confirmLabel = row.is_paid
    ? 'Archive publication'
    : 'Delete permanently';
  const statusLabel =
    row.status === 'published'
      ? 'Published'
      : row.status === 'archived'
        ? 'Archived'
        : 'Draft';

  return (
    <div className="flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-card">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-brand-offWhite">
        {row.image_path ? (
          <img
            src={resolvePublicationImageUrl(row.image_path)}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-caption text-brand-muted">
            No cover image
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="navy">{row.type}</Badge>
          <Badge variant={row.is_paid ? 'muted' : 'teal'}>
            {row.is_paid ? formatNaira(row.price_naira) : 'Free'}
          </Badge>
          <Badge variant={row.status === 'published' ? 'teal' : 'muted'}>
            {statusLabel}
          </Badge>
        </div>

        <h3 className="mt-3 text-h4 font-bold text-brand-navy">{row.title}</h3>
        <p className="mt-1 text-caption text-brand-muted">
          /publications/{row.slug}
        </p>
        {!row.file_path && (
          <p className="mt-1 text-caption text-brand-error">
            No file attached
          </p>
        )}
        {!row.is_paid && (
          <p className="mt-1 text-caption text-brand-muted">
            {row.download_count ?? 0} download
            {row.download_count === 1 ? '' : 's'}
          </p>
        )}
        <p className="mt-1 text-caption text-brand-muted">
          Added {formatDateUTC(row.created_at)}
        </p>

        <div className="mt-4 flex-1" />

        {isConfirming ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={onConfirmDelete}
              loading={isDeleting}
              className="!bg-brand-error hover:!bg-brand-error/90 focus-visible:!ring-brand-error"
            >
              {confirmLabel}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onCancelConfirm}
              disabled={isDeleting}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Link
              href={`/admin/publications/${row.id}/edit`}
              className="text-caption font-medium text-brand-navy transition-colors hover:text-brand-teal"
            >
              Edit
            </Link>

            {row.status !== 'archived' && (
              <button
                type="button"
                onClick={onDeleteClick}
                className="text-caption font-medium text-brand-error transition-colors hover:underline"
              >
                {actionLabel}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
