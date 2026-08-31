'use client';

import Link from 'next/link';

/**
 * Small inline spinner shown while `loading` is true.
 */
function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

const VARIANTS = {
  // Navy fill — the primary call to action.
  primary:
    'bg-brand-navy text-white hover:bg-brand-navyDark focus-visible:ring-brand-navy',
  // Teal outline — secondary actions.
  secondary:
    'border border-brand-teal text-brand-teal bg-transparent hover:bg-brand-teal hover:text-white focus-visible:ring-brand-teal',
  // Text-only — tertiary / low emphasis.
  ghost:
    'bg-transparent text-brand-navy hover:text-brand-teal focus-visible:ring-brand-teal',
};

const SIZES = {
  sm: 'px-3.5 py-2 text-caption',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3 text-body',
};

/**
 * Button — the single button/CTA primitive used across the site.
 *
 * Renders a Next.js `<Link>` when `href` is provided, otherwise a native
 * `<button>`. Supports `disabled` and `loading` states (loading shows a
 * spinner and blocks interaction) so later phases (form submit, payment) can
 * reuse it directly.
 *
 * @param {object} props
 * @param {'primary'|'secondary'|'ghost'} [props.variant='primary'] - Visual style.
 * @param {'sm'|'md'|'lg'} [props.size='md'] - Padding/type size.
 * @param {string} [props.href] - If set, renders as a link to this route.
 * @param {() => void} [props.onClick] - Click handler (native button mode).
 * @param {'button'|'submit'|'reset'} [props.type='button'] - Button type (ignored for links).
 * @param {boolean} [props.disabled=false] - Disables interaction.
 * @param {boolean} [props.loading=false] - Shows a spinner and disables interaction.
 * @param {boolean} [props.fullWidth=false] - Stretch to container width.
 * @param {string} [props.className] - Extra classes.
 * @param {React.ReactNode} props.children - Button label/content.
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  href,
  onClick,
  type = 'button',
  disabled = false,
  loading = false,
  fullWidth = false,
  className = '',
  children,
  ...rest
}) {
  const isDisabled = disabled || loading;

  const classes = [
    'inline-flex items-center justify-center gap-2 rounded-none font-medium transition-colors duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    VARIANTS[variant] ?? VARIANTS.primary,
    SIZES[size] ?? SIZES.md,
    fullWidth ? 'w-full' : '',
    isDisabled ? 'pointer-events-none opacity-60' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      {loading && <Spinner />}
      {children}
    </>
  );

  // Link mode — only when enabled. A disabled link should not navigate, so we
  // fall through to a real disabled <button> in that case.
  if (href && !isDisabled) {
    return (
      <Link href={href} onClick={onClick} className={classes} {...rest}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={classes}
      {...rest}
    >
      {content}
    </button>
  );
}
