import Badge from "@/components/ui/Badge";
import { formatDateUTC, formatNaira } from "@/lib/publications";
import Image from "next/image";
import Link from "next/link";

/**
 * PublicationCard — one item in the public publications grid.
 *
 * Paid and free items diverge on purpose:
 * - Paid items still have a detail page (`/publications/[slug]`), so the
 *   whole card is a `Link` there and the pill reads "View to purchase". It's
 *   a styled `<span>`, not a nested interactive element, since the card
 *   itself is already the link.
 * - Free items have no detail page at all — the pill IS the action: a real
 *   `<a>` pointing straight at the signed-download route, so clicking "Read"
 *   starts the download immediately. The rest of the card is a plain,
 *   non-interactive `<div>`.
 *
 * The pill is a rounded, content-width button that floats in the card body
 * (not edge-to-edge); the publish date sits in its own light footer band
 * below, always pinned to the card's bottom edge via `mt-auto` so cards of
 * differing description length still line up.
 *
 * @param {object} props
 * @param {{slug: string, title: string, type: string, description: string|null, is_paid: boolean, price_naira: number|null, created_at?: string}} props.publication - A published publication row.
 */
export default function PublicationCard({ publication }) {
  const {
    slug,
    title,
    type,
    description,
    is_paid: isPaid,
    price_naira: price,
    image_path: imagePath,
    created_at: createdAt,
  } = publication;

  const arrow = (
    <svg
      className="h-3.5 w-3.5 shrink-0 transition-transform duration-200 group-hover:translate-x-1"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const body = (
    <div className="flex-1 p-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="navy">{type}</Badge>
        <Badge variant={isPaid ? "muted" : "teal"}>
          {isPaid ? formatNaira(price) : "Free"}
        </Badge>
      </div>

      <h3 className="mt-4 text-h4 font-bold text-brand-navy">{title}</h3>

      {description && (
        <p className="mt-3 line-clamp-4 text-body text-brand-muted">
          {description}
        </p>
      )}

      <div className="mt-5">
        {isPaid ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-navyDark px-5 py-2.5 text-sm font-medium text-white transition-colors duration-200 group-hover:bg-brand-navy">
            View to purchase
            {arrow}
          </span>
        ) : (
          // A native anchor, not <Link>: free items have no detail page, so
          // this pill is the entire action — it hits the signed-download
          // route directly and must not be intercepted by client routing.
          <a
            href={`/api/publications/${slug}/read`}
            className="inline-flex items-center gap-2 rounded-full bg-brand-navy px-5 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-brand-navyDark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy focus-visible:ring-offset-2"
          >
            Read
            {arrow}
          </a>
        )}
      </div>
    </div>
  );

  const coverImage = imagePath ? (
    <div className="relative aspect-[16/10] w-full overflow-hidden bg-brand-offWhite">
      <Image
        src={imagePath}
        alt=""
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className="object-cover"
      />
    </div>
  ) : null;

  const dateBand = (
    <div className="mt-auto border-t border-slate-100 bg-brand-offWhite px-6 py-3">
      <p className="text-caption text-brand-muted">
        {formatDateUTC(createdAt)}
      </p>
    </div>
  );

  if (isPaid) {
    return (
      <Link
        href={`/publications/${slug}`}
        className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-card transition-shadow duration-200 hover:shadow-card-hover"
      >
        {coverImage}
        {body}
        {dateBand}
      </Link>
    );
  }

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-card transition-shadow duration-200 hover:shadow-card-hover">
      {coverImage}
      {body}
      {dateBand}
    </div>
  );
}
