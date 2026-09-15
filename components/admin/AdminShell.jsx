import LogoutButton from "@/components/admin/LogoutButton";
import Link from "next/link";

/**
 * AdminShell — chrome for authenticated admin pages.
 *
 * A navy-dark top bar with the brand wordmark, the signed-in email and a
 * sign-out button, plus a page header and content area on the same
 * near-black background — one continuous navy surface, nothing floating on
 * top of it in a separate panel. Admin components (`PublicationsGrid`,
 * `PublicationForm`, etc.) are themed for this dark surface directly, rather
 * than assuming a light "console" the way an earlier version of this shell
 * provided.
 *
 * Only wrap pages that have already called `requireAdminPage()` — this component
 * displays the session, it doesn't verify it.
 *
 * @param {object} props
 * @param {string} props.email - Signed-in admin's email, shown in the top bar.
 * @param {string} props.title - Page heading.
 * @param {string} [props.description] - Optional sub-heading copy.
 * @param {React.ReactNode} [props.actions] - Buttons/links rendered beside the heading.
 * @param {boolean} [props.centered=false] - Centers the page heading and content column.
 * @param {React.ReactNode} props.children - Page content.
 */
export default function AdminShell({
  email,
  title,
  description,
  actions,
  centered = false,
  children,
}) {
  return (
    <div className="min-h-screen bg-brand-navyDark">
      <header className="border-b border-white/10 bg-brand-navy">
        <div className="container-kac flex h-16 items-center justify-between gap-4">
          <Link
            href="/admin/publications"
            className="leading-none"
            aria-label="KAC admin — publications"
          >
            <span className="block font-display text-[15px] font-semibold text-white">
              Koko Asuquo Chambers
            </span>
            <span className="mt-0.5 block text-[10px] font-medium uppercase tracking-[0.28em] text-brand-teal">
              Admin
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {email && (
              <span className="hidden text-caption text-white/60 sm:inline">
                {email}
              </span>
            )}
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="container-kac py-10 md:py-14">
        <div
          className={[
            "flex flex-col gap-4",
            centered
              ? "items-center text-center"
              : "sm:flex-row sm:items-end sm:justify-between",
          ].join(" ")}
        >
          <div className={centered ? "max-w-2xl" : ""}>
            <h1 className="text-h1 text-white">{title}</h1>
            {description && (
              <p
                className={`mt-2 max-w-2xl text-body text-white/70 ${
                  centered ? "mx-auto" : ""
                }`}
              >
                {description}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex shrink-0 items-center gap-2">{actions}</div>
          )}
        </div>

        <div className={`mt-8 ${centered ? "mx-auto max-w-2xl" : ""}`}>
          {children}
        </div>
      </div>
    </div>
  );
}
