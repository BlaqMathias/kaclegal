"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { formatDateUTC, formatNaira } from "@/lib/publications";

/**
 * PublicationsGrid — the admin's card-based publication list, replacing the
 * old table. Cards are grouped into two sections — Published, then Drafts &
 * Unpublished — so anything pulled off the live site (via the edit form's
 * status checkboxes) visibly lands in its own section rather than blending
 * back into an undifferentiated list.
 *
 * There is no bulk selection or bulk delete — every action here is scoped to
 * one card. Deleting a publication that has purchase history is blocked
 * outright (see the API route's `reason: 'has_transactions'`); the card
 * shows a dialog explaining why and pointing at the edit page instead of
 * silently failing or offering a confusing partial delete.
 *
 * As with the table before it, `publications` is never copied into state —
 * only the ids removed in this session are tracked, so `router.refresh()`
 * remains the single source of truth once the server re-renders.
 *
 * @param {object} props
 * @param {Array<Record<string, any>>} props.publications - Every publication row, newest first.
 * @param {string[]} props.protectedIds - Ids of publications that have at least one transaction row, and therefore cannot be deleted.
 */
export default function PublicationsGrid({ publications, protectedIds }) {
  const router = useRouter();
  const protectedIdSet = new Set(protectedIds);

  const [deletedIds, setDeletedIds] = useState(() => new Set());
  const [confirmingId, setConfirmingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [blockedPublication, setBlockedPublication] = useState(null);

  const rows = publications.filter((row) => !deletedIds.has(row.id));

  const handleDeleteClick = (row) => {
    setError("");
    if (protectedIdSet.has(row.id)) {
      setBlockedPublication(row);
      return;
    }
    setConfirmingId(row.id);
  };

  const handleDelete = async (id) => {
    setError("");
    setDeletingId(id);

    try {
      const response = await fetch(`/api/admin/publications/${id}`, {
        method: "DELETE",
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload.ok) {
        if (payload.reason === "has_transactions") {
          // The card's own protectedIds check should have caught this before
          // the request went out, but the database is the final word — a
          // transaction could in principle have landed between page load and
          // this click. Show the same dialog either way.
          const row = publications.find((p) => p.id === id);
          if (row) setBlockedPublication(row);
        } else {
          setError(payload.error || "Could not delete that publication.");
        }
        setConfirmingId(null);
        setDeletingId(null);
        return;
      }

      setDeletedIds((current) => {
        const next = new Set(current);
        next.add(id);
        return next;
      });
      setConfirmingId(null);
      setDeletingId(null);
      router.refresh();
    } catch (caught) {
      console.error("[admin] Delete failed:", caught);
      setError("Could not reach the server. Please try again.");
      setDeletingId(null);
    }
  };

  if (rows.length === 0) {
    return (
      <div className="border border-white/10 bg-white/5 p-10 text-center">
        <h2 className="font-display text-h4 text-white">
          No publications yet
        </h2>
        <p className="mx-auto mt-2 max-w-md text-body text-white/70">
          Add your first publication to have it appear in the firm&rsquo;s
          library. Anything saved as a draft stays hidden from the public
          site.
        </p>
        <div className="mt-6 flex justify-center">
          <Button href="/admin/publications/new">Add publication</Button>
        </div>
      </div>
    );
  }

  const published = rows.filter((row) => row.status === "published");
  const unpublished = rows.filter((row) => row.status !== "published");

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
        onDeleteClick={handleDeleteClick}
        onConfirmDelete={handleDelete}
        onCancelConfirm={() => setConfirmingId(null)}
      />

      <div className="mt-10">
        <PublicationsSection
          heading="Drafts & Unpublished"
          rows={unpublished}
          emptyMessage="Nothing sitting in drafts."
          confirmingId={confirmingId}
          deletingId={deletingId}
          onDeleteClick={handleDeleteClick}
          onConfirmDelete={handleDelete}
          onCancelConfirm={() => setConfirmingId(null)}
        />
      </div>

      <p className="mt-8 text-caption text-white/60">
        Deleting a publication also removes its uploaded file and cover
        image. This cannot be undone.
      </p>

      {blockedPublication && (
        <BlockedDeleteDialog
          publication={blockedPublication}
          onClose={() => setBlockedPublication(null)}
        />
      )}
    </div>
  );
}

/**
 * One titled group of cards (Published, or Drafts & Unpublished).
 *
 * @param {object} props
 * @param {string} props.heading
 * @param {Array<Record<string, any>>} props.rows
 * @param {string} props.emptyMessage
 * @param {string|null} props.confirmingId
 * @param {string|null} props.deletingId
 * @param {(row: Record<string, any>) => void} props.onDeleteClick
 * @param {(id: string) => void} props.onConfirmDelete
 * @param {() => void} props.onCancelConfirm
 */
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
              onConfirmDelete={() => onConfirmDelete(row.id)}
              onCancelConfirm={onCancelConfirm}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/**
 * A single admin publication card: cover image, title, status/type/price
 * badges, and its own Edit/Delete actions.
 *
 * @param {object} props
 * @param {Record<string, any>} props.row
 * @param {boolean} props.isConfirming
 * @param {boolean} props.isDeleting
 * @param {() => void} props.onDeleteClick
 * @param {() => void} props.onConfirmDelete
 * @param {() => void} props.onCancelConfirm
 */
function PublicationCardAdmin({
  row,
  isConfirming,
  isDeleting,
  onDeleteClick,
  onConfirmDelete,
  onCancelConfirm,
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-card">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-brand-offWhite">
        {row.image_path ? (
          <Image
            src={row.image_path}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
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
          <Badge variant={row.is_paid ? "muted" : "teal"}>
            {row.is_paid ? formatNaira(row.price_naira) : "Free"}
          </Badge>
          <Badge variant={row.status === "published" ? "teal" : "muted"}>
            {row.status === "published" ? "Published" : "Draft"}
          </Badge>
        </div>

        <h3 className="mt-3 text-h4 font-bold text-brand-navy">
          {row.title}
        </h3>
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
            {row.download_count === 1 ? "" : "s"}
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
              Delete permanently
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
            <button
              type="button"
              onClick={onDeleteClick}
              className="text-caption font-medium text-brand-error transition-colors hover:underline"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * BlockedDeleteDialog — shown instead of the normal delete confirmation when
 * a publication has purchase history. Explains why deletion is refused and
 * links straight to the edit page, where unpublishing (status → Draft) is
 * the actual path to taking it off the site.
 *
 * @param {object} props
 * @param {Record<string, any>} props.publication
 * @param {() => void} props.onClose
 */
function BlockedDeleteDialog({ publication, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-brand-navyDark/70 px-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="blocked-delete-heading"
        className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-card-hover"
        onClick={(event) => event.stopPropagation()}
      >
        <h2
          id="blocked-delete-heading"
          className="text-h4 font-bold text-brand-navy"
        >
          This publication has transaction records
        </h2>
        <p className="mt-3 text-body text-brand-slate">
          <strong>{publication.title}</strong> has been purchased at least
          once, so it can&rsquo;t be deleted — that would break the purchase
          history behind those transactions. Edit it and unpublish instead:
          that takes it off the public site immediately while keeping its
          records intact.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button href={`/admin/publications/${publication.id}/edit`}>
            Edit and unpublish
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
