const VARIANTS = {
  navy: 'bg-brand-navy/10 text-brand-navy',
  teal: 'bg-brand-teal/10 text-brand-teal',
  muted: 'bg-brand-muted/10 text-brand-muted',
};

/**
 * Badge — small pill label. Used later for "Free" / "Paid" tags on
 * publications and specialty tags on lawyer profiles.
 *
 * @param {object} props
 * @param {'navy'|'teal'|'muted'} [props.variant='navy'] - Color variant.
 * @param {string} [props.className] - Extra classes.
 * @param {React.ReactNode} props.children - Label text.
 */
export default function Badge({ variant = 'navy', className = '', children, ...rest }) {
  const classes = [
    'inline-flex items-center rounded-full px-2.5 py-0.5 text-caption font-medium',
    VARIANTS[variant] ?? VARIANTS.navy,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes} {...rest}>
      {children}
    </span>
  );
}
