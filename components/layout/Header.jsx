"use client";

import MobileNav from "@/components/layout/MobileNav";
import Button from "@/components/ui/Button";
import { practiceAreas } from "@/content/practice-areas";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/** Practice-area links for the dropdown — derived from the single content source. */
const PRACTICE_AREA_LINKS = practiceAreas.map((area) => ({
  label: area.title,
  href: `/practice-areas/${area.slug}`,
}));

/**
 * Primary navigation — shared by the desktop header and the mobile menu.
 * "Practice Areas" is a dropdown trigger (no page of its own); its `children`
 * are the individual practice-area detail pages.
 */
const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Practice Areas", children: PRACTICE_AREA_LINKS },
  { label: "Team", href: "/team" },
  { label: "Publications", href: "/publications" },
  { label: "Contact", href: "/contact" },
];

/**
 * NavDropdown — accessible disclosure menu for a nav item with children.
 * Opens on hover and on click/Enter; closes on mouse-leave (after a short
 * grace period so the pointer can travel to the panel), Escape, outside
 * click, focus leaving the group, or a route change. When closed the panel is
 * `invisible`, which also removes its links from the tab order.
 *
 * @param {object} props
 * @param {string} props.label - Trigger label.
 * @param {Array<{label: string, href: string}>} props.items - Dropdown links.
 * @param {boolean} props.active - Whether a child route is currently active.
 * @param {string} props.pathname - Current path (used to auto-close on nav).
 */
function NavDropdown({ label, items, active, pathname }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const closeTimer = useRef(null);

  const openMenu = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setIsOpen(true);
  };

  // Small delay on mouse-leave so a diagonal move to the panel doesn't dismiss it.
  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setIsOpen(false), 120);
  };

  const handleBlur = (e) => {
    if (!containerRef.current?.contains(e.relatedTarget)) setIsOpen(false);
  };

  // Auto-close when the route changes (header persists across navigations).
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // While open: Escape closes and an outside click dismisses.
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    const onDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target))
        setIsOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [isOpen]);

  // Clear any pending close timer on unmount.
  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    [],
  );

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
      onBlur={handleBlur}
    >
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((v) => !v)}
        className={`inline-flex items-center gap-1 text-sm font-medium transition-colors hover:text-brand-teal ${
          active ? "text-brand-navy" : "text-brand-slate"
        }`}
      >
        {label}
        <svg
          className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Panel. `pt-3` is an invisible bridge so hover survives the gap. */}
      <div
        className={`absolute left-1/2 top-full z-50 w-[30rem] max-w-[90vw] -translate-x-1/2 pt-3 transition duration-150 ${
          isOpen
            ? "visible translate-y-0 opacity-100"
            : "invisible -translate-y-1 opacity-0"
        }`}
      >
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-card">
          <p className="text-caption font-semibold uppercase tracking-[0.22em] text-brand-teal">
            {label}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-1 border-t border-slate-100 pt-4">
            {items.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                aria-current={
                  pathname.startsWith(child.href) ? "page" : undefined
                }
                className="block py-2 text-sm font-medium text-brand-slate transition-colors hover:text-brand-teal"
              >
                {child.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Header — sticky top bar with the brand lockup, primary navigation, and the
 * primary "Request a Consultation" CTA. Collapses to a hamburger + MobileNav
 * below the `md` breakpoint.
 */
export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close the mobile menu on any route change (Header persists across
  // navigations because it lives in the root layout).
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const isActive = (href) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 border-b-2 border-brand-navy bg-white">
      <div className="container-kac flex h-20 items-center justify-between gap-4">
        {/* Brand lockup: monogram + wordmark */}
        <Link
          href="/"
          className="flex items-center gap-3"
          aria-label="Koko Asuquo Chambers — home"
        >
          <Image
            src="/images/logo/kac-monogram.png"
            alt=""
            width={409}
            height={681}
            priority
            className="h-11 w-auto"
          />
          <span className="leading-none">
            <span className="block font-display text-[17px] font-semibold text-brand-navy">
              Koko Asuquo
            </span>
            <span className="mt-0.5 block text-[10px] font-medium uppercase tracking-[0.28em] text-brand-teal">
              Chambers
            </span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
          {NAV_ITEMS.map((item) =>
            item.children ? (
              <NavDropdown
                key={item.label}
                label={item.label}
                items={item.children}
                active={item.children.some((child) =>
                  pathname.startsWith(child.href),
                )}
                pathname={pathname}
              />
            ) : (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={`text-sm font-medium transition-colors hover:text-brand-teal ${
                  isActive(item.href) ? "text-brand-navy" : "text-brand-slate"
                }`}
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <Button href="/contact" size="sm" className="!rounded-full">
              Request a Consultation
            </Button>
          </div>

          {/* Hamburger — mobile only */}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            className="rounded-none p-2 text-brand-navy transition-colors hover:text-brand-teal md:hidden"
          >
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M4 7h16M4 12h16M4 17h16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>

      <div id="mobile-nav">
        <MobileNav
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          navItems={NAV_ITEMS}
        />
      </div>
    </header>
  );
}
