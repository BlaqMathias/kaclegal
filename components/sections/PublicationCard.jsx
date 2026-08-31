import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import { formatNaira } from '@/lib/publications';

/**
 * PublicationCard — one item in the public publications grid.
 *
 * Free and paid items share the same card treatment on purpose: the library is
 * one shelf from one firm, not a free section next to a shop. The only
 * difference is the price chip and the wording of the call to action.
 *
 * The whole card links to the detail page; the action label reads as a button
 * but is styled text, so the card stays a single link target rather than nesting
 * an interactive element inside another.
 *
 * `!flex` on the root is deliberate: in link mode `Card` appends `block` after
 * the incoming className, so the display utility needs the extra weight for
 * equal-height cards to work.
 *
 * @param {object} props
 * @param {{slug: string, title: string, type: string, description: string|null, is_paid: boolean, price_naira: number|null}} props.publication - A published publication row.
 */
export default function PublicationCard({ publication }) {
  const { slug, title, type, description, is_paid: isPaid, price_naira: price } =
    publication;

  return (
    <Card
      href={`/publications/${slug}`}
      hover
      className="!flex h-full flex-col [&>div]:flex [&>div]:flex-1 [&>div]:flex-col"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="navy">{type}</Badge>
        <Badge variant={isPaid ? 'muted' : 'teal'}>
          {isPaid ? formatNaira(price) : 'Free'}
        </Badge>
      </div>

      <h3 className="mt-4 text-h4 text-brand-navy">{title}</h3>

      {description && (
        <p className="mt-3 line-clamp-4 text-body text-brand-muted">{description}</p>
      )}

      <span className="mt-auto flex items-center gap-2 pt-6 text-caption font-semibold uppercase tracking-[0.16em] text-brand-teal">
        {isPaid ? 'View details' : 'Read'}
        <svg
          className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1"
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
      </span>
    </Card>
  );
}
