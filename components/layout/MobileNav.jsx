"use client";

import Button from "@/components/ui/Button";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * MobileNav — full-height slide-in menu for viewports below `md`. Opens from
 * the right, dims the page behind it, and closes on link click, backdrop tap,
 * or the Escape key. Body scroll is locked while open.
 *
 * Panel is a navy surface with slow-moving glow blobs behind the content,
 * matching the treatment used on the Hero and Risk Comparison sections.
 *
 * Nav items with a `children` array render as an expandable accordion (there
 * is no hover on touch), revealing the child links indented beneath.
 *
 * @param {object} props
 * @param {boolean} props.open - Whether the menu is visible.
 * @param {() => void} props.onClose - Called to request closing the menu.
 * @param {Array<{label: string, href?: string, children?: Array<{label: string, href: string}>}>} props.navItems - Nav links to render.
 */
export default function MobileNav({ open, onClose, navItems }) {
  const [expanded, setExpanded] = useState(null);

  // Lock body scroll + wire up Escape while the menu is open.
  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  // Collapse any open accordion section each time the menu is closed.
  useEffect(() => {
    if (!open) setExpanded(null);
  }, [open]);

  return (
    <div
      className={`fixed inset-0 z-[60] md:hidden ${open ? "" : "pointer-events-none"}`}
      aria-hidden={open ? undefined : true}
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close menu"
        onClick={onClose}
        className={`absolute inset-0 bg-brand-navyDark/50 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        className={`absolute right-0 top-0 flex h-full w-[85%] max-w-sm flex-col overflow-hidden bg-brand-navyDark shadow-xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Decorative moving glow, behind all panel content */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0"
        >
          <div className="absolute -left-16 top-10 h-[220px] w-[220px] animate-pulse rounded-full bg-brand-teal/20 blur-[90px] [animation-duration:7s]" />
          <div className="absolute -right-20 bottom-24 h-[240px] w-[240px] animate-pulse rounded-full bg-brand-teal/10 blur-[100px] [animation-duration:9s]" />
        </div>

        <div className="relative z-10 flex items-center justify-between border-b border-white/10 px-5 py-4">
          <Link
            href="/"
            onClick={onClose}
            className="flex items-center gap-2.5"
            aria-label="Koko Asuquo Chambers — home"
          >
            <Image
              src="/images/logo/kac-monogram.png"
              alt=""
              width={409}
              height={681}
              className="h-9 w-auto"
            />
            <span className="leading-none">
              <span className="block font-display text-[15px] font-semibold text-white">
                Koko Asuquo
              </span>
              <span className="mt-0.5 block text-[9px] font-medium uppercase tracking-[0.28em] text-brand-teal">
                Chambers
              </span>
            </span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-none p-2 text-white/70 transition-colors hover:text-brand-teal"
          >
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <nav className="relative z-10 flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => {
            if (item.children) {
              const isExpanded = expanded === item.label;
              return (
                <div key={item.label}>
                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    onClick={() =>
                      setExpanded((cur) =>
                        cur === item.label ? null : item.label,
                      )
                    }
                    className="flex w-full items-center justify-between rounded-none px-3 py-3 text-h4 font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    {item.label}
                    <svg
                      className={`h-5 w-5 transition-transform duration-200 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
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
                  {isExpanded && (
                    <div className="mb-1 ml-3 flex flex-col gap-0.5 border-l border-white/15 pl-3">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={onClose}
                          className="rounded-none px-3 py-2.5 text-body font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className="rounded-none px-3 py-3 text-h4 font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="relative z-10 border-t border-white/10 p-5">
          <Button
            href="/contact"
            fullWidth
            onClick={onClose}
            className="!rounded-full !bg-white !text-brand-navy hover:!bg-brand-offWhite"
          >
            Request a Consultation
          </Button>
        </div>
      </div>
    </div>
  );
}
