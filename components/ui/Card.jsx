import Link from 'next/link';
import Image from 'next/image';

/**
 * Card — the generic surface every content card (practice area, team member,
 * publication) will extend in later phases. Deliberately flexible: consistent
 * padding, radius and shadow, with an optional image slot at the top.
 *
 * Renders as a `<Link>` when `href` is set (making the whole card clickable),
 * otherwise a plain container element.
 *
 * @param {object} props
 * @param {string} [props.image] - Optional image src (local `/public` path). Renders a top media slot.
 * @param {string} [props.imageAlt=''] - Alt text for the image slot.
 * @param {string} [props.href] - If set, the whole card becomes a link.
 * @param {boolean} [props.hover=false] - Adds a hover lift/shadow (useful for clickable cards).
 * @param {boolean} [props.padded=true] - Apply default inner padding to the body.
 * @param {string} [props.className] - Extra classes on the card root.
 * @param {React.ReactNode} props.children - Card body content.
 */
export default function Card({
  image,
  imageAlt = '',
  href,
  hover = false,
  padded = true,
  className = '',
  children,
  ...rest
}) {
  const classes = [
    'group relative overflow-hidden rounded-none border border-slate-100 bg-white shadow-card',
    hover
      ? 'transition-shadow duration-200 hover:shadow-card-hover'
      : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const body = (
    <>
      {image && (
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-brand-offWhite">
          <Image
            src={image}
            alt={imageAlt}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
          />
        </div>
      )}
      <div className={padded ? 'p-6' : ''}>{children}</div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={`${classes} block`} {...rest}>
        {body}
      </Link>
    );
  }

  return (
    <div className={classes} {...rest}>
      {body}
    </div>
  );
}
