'use client';

import { usePathname } from 'next/navigation';

/**
 * ChromeGate — hides the public site chrome on admin routes.
 *
 * The root layout renders Header and Footer around every page, but /admin has
 * its own shell and shouldn't show public navigation or a marketing footer.
 *
 * Implemented as a wrapper rather than a guard inside Header and Footer so that
 * neither of those Phase 1 components has to change: Footer in particular stays
 * a Server Component, keeping the copyright year server-rendered instead of
 * risking a hydration mismatch across a year boundary.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - Chrome to render on public routes only.
 */
export default function ChromeGate({ children }) {
  const pathname = usePathname();

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return children;
}
