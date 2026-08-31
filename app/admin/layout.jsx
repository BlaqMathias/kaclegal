export const metadata = {
  title: 'Admin',
  // The admin area must never appear in search results. `noindex, nofollow` is
  // inherited by every page nested under this layout, including the login form.
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Admin layout — a neutral wrapper for everything under /admin.
 *
 * Deliberately carries NO authentication guard: /admin/login lives inside this
 * segment and has to stay reachable while signed out. Protection is applied by
 * `middleware.js` plus a `requireAdminPage()` call in each protected page.
 *
 * Renders a plain `<div>`, not a `<main>` — the root layout already provides one.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - The active admin route.
 */
export default function AdminLayout({ children }) {
  return <div className="min-h-full bg-brand-offWhite">{children}</div>;
}
