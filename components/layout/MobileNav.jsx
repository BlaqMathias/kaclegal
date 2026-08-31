'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';

/**
 * MobileNav — full-height slide-in menu for viewports below `md`. Opens from
 * the right, dims the page behind it, and closes on link click, backdrop tap,
 * or the Escape key. Body scroll is locked while open.
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
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  // Collapse any open accordion section each time the menu is closed.
  useEffect(() => {
    if (!open) setExpanded(null);
  }, [open]);

  return (
    <div
      className={`fixed inset-0 z-[60] md:hidden ${open ? '' : 'pointer-events-none'}`}
      aria-hidden={open ? undefined : true}
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close menu"
        onClick={onClose}
        className={`absolute inset-0 bg-brand-navyDark/50 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        className={`absolute right-0 top-0 flex h-full w-[85%] max-w-sm flex-col bg-white shadow-xl transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <span className="font-display text-h4 text-brand-navy">Menu</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-none p-2 text-brand-slate transition-colors hover:text-brand-teal"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => {
            if (item.children) {
              const isExpanded = expanded === item.label;
              return (
                <div key={item.label}>
                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    onClick={() => setExpanded((cur) => (cur === item.label ? null : item.label))}
                    className="flex w-full items-center justify-between rounded-none px-3 py-3 text-h4 font-medium text-brand-slate transition-colors hover:bg-brand-offWhite hover:text-brand-navy"
                  >
                    {item.label}
                    <svg
                      className={`h-5 w-5 transition-transform duration-200 ${
                        isExpanded ? 'rotate-180' : ''
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
                    <div className="mb-1 ml-3 flex flex-col gap-0.5 border-l border-slate-100 pl-3">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={onClose}
                          className="rounded-none px-3 py-2.5 text-body font-medium text-brand-slate transition-colors hover:bg-brand-offWhite hover:text-brand-navy"
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
                className="rounded-none px-3 py-3 text-h4 font-medium text-brand-slate transition-colors hover:bg-brand-offWhite hover:text-brand-navy"
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 p-5">
          <Button href="/contact" fullWidth onClick={onClose}>
            Request a Consultation
          </Button>
        </div>
      </div>
    </div>
  );
}
