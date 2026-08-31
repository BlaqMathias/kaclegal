const BACKGROUNDS = {
  white: 'bg-white text-brand-slate',
  offWhite: 'bg-brand-offWhite text-brand-slate',
  ice: 'bg-brand-ice text-brand-slate',
  teal: 'bg-brand-teal text-white',
  // On navy, force readable light text (including headings, which default to navy).
  navy: 'bg-brand-navy text-white [&_h1]:text-white [&_h2]:text-white [&_h3]:text-white',
  // Navy surfaces meant to CONTAIN white cards. No heading override here, so a
  // white card keeps its navy heading; set light colours on any direct text.
  navyPanel: 'bg-brand-navy text-white/85',
  navyDarkPanel: 'bg-brand-navyDark text-white/85',
};

/**
 * Section — the layout wrapper every page block should use. Handles consistent
 * vertical rhythm and the shared max-width container, so pages never repeat
 * container/padding classes.
 *
 * @param {object} props
 * @param {'white'|'offWhite'|'ice'|'teal'|'navy'|'navyPanel'|'navyDarkPanel'} [props.background='white'] - Section background.
 * @param {keyof JSX.IntrinsicElements} [props.as='section'] - Root element tag.
 * @param {string} [props.id] - Optional anchor id.
 * @param {'sm'|'md'|'lg'} [props.spacing='md'] - Vertical padding scale.
 * @param {boolean} [props.container=true] - Wrap children in the shared content container.
 * @param {string} [props.className] - Extra classes on the outer element.
 * @param {string} [props.containerClassName] - Extra classes on the inner container.
 * @param {React.ReactNode} props.children - Section content.
 */
export default function Section({
  background = 'white',
  as: Tag = 'section',
  id,
  spacing = 'md',
  container = true,
  className = '',
  containerClassName = '',
  children,
  ...rest
}) {
  const spacingClasses = {
    sm: 'py-10 md:py-14',
    md: 'py-16 md:py-24',
    lg: 'py-20 md:py-32',
  };

  const outerClasses = [
    BACKGROUNDS[background] ?? BACKGROUNDS.white,
    spacingClasses[spacing] ?? spacingClasses.md,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Tag id={id} className={outerClasses} {...rest}>
      {container ? (
        <div className={['container-kac', containerClassName].filter(Boolean).join(' ')}>
          {children}
        </div>
      ) : (
        children
      )}
    </Tag>
  );
}
