import Image from "next/image";

/**
 * HoverImage — a framed media slot used to pair an image with a text block
 * (e.g. the Vision/Mission split on the About page). Tilts slightly at rest
 * and settles + zooms in on hover, echoing the interaction on
 * thekreativestack.com/sme-solutions.
 *
 * Renders a branded placeholder (icon + label) when no `src` is supplied yet,
 * so the layout looks intentional before real photography is dropped in —
 * swap in a real `src` and this falls away automatically.
 *
 * @param {object} props
 * @param {string} [props.src] - Image path under /public. Omit to render the placeholder.
 * @param {string} [props.alt] - Alt text (required once `src` is set).
 * @param {string} [props.label] - Placeholder label shown when `src` is omitted.
 * @param {'left'|'right'} [props.tilt='left'] - Direction of the resting tilt, alternated per row.
 * @param {string} [props.className] - Extra classes on the outer frame.
 */
export default function HoverImage({
  src,
  alt = "",
  label = "Image coming soon",
  tilt = "left",
  className = "",
}) {
  const restRotation = tilt === "right" ? "rotate-2" : "-rotate-2";

  return (
    <div
      className={[
        "group relative aspect-[4/3] w-full overflow-hidden rounded-[28px]",
        "border border-white/10 shadow-card-hover",
        "transition-transform duration-700 ease-out will-change-transform",
        restRotation,
        "hover:rotate-0 hover:scale-[1.03]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-brand-navy via-brand-navyDark to-[#02132a] text-white/40 transition-transform duration-700 ease-out group-hover:scale-110">
          <svg
            aria-hidden="true"
            viewBox="0 0 48 48"
            className="h-10 w-10"
            fill="none"
          >
            <rect
              x="4"
              y="8"
              width="40"
              height="32"
              rx="4"
              stroke="currentColor"
              strokeWidth="2"
            />
            <circle cx="16" cy="19" r="3.5" stroke="currentColor" strokeWidth="2" />
            <path
              d="M6 33L17 24l7 6 6-5 12 10"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-caption font-medium uppercase tracking-[0.2em]">
            {label}
          </span>
        </div>
      )}

      {/* Subtle inner border so the frame reads on both photos and the placeholder */}
      <div className="pointer-events-none absolute inset-0 rounded-[28px] ring-1 ring-inset ring-white/10" />
    </div>
  );
}
