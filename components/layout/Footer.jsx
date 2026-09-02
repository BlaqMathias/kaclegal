import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/motion/Reveal";

const EXPLORE_LINKS = [
  { label: "About", href: "/about" },
  { label: "Our Team", href: "/team" },
  { label: "Publications", href: "/publications" },
  { label: "Contact", href: "/contact" },
];

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms of Use", href: "/terms" },
];

/**
 * Footer — dark (navyDark) site footer with the brand wordmark, contact
 * details, office blocks (placeholder copy until Phase 5/9), navigation
 * mirror, and legal links.
 *
 * Pairs the icon-only logo mark (kac-icon.png) with an HTML text wordmark,
 * rather than the full colour lockup: the icon's panels are already navy/teal
 * with white lettering carved out, so it reads cleanly here, but the full
 * lockup's wordmark text has no background behind it and would disappear
 * against this navy footer.
 */
export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-brand-navyDark text-white/75">
      <Reveal variant="appear" className="container-kac py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand + contact */}
          <div className="lg:pr-6">
            <div className="flex items-center gap-3">
              <Image
                src="/images/logo/kac-icon.png"
                alt=""
                width={64}
                height={64}
                className="h-16 w-16"
              />
              <div className="leading-none">
                <span className="block font-display text-h4 font-semibold text-white">
                  Koko Asuquo Chambers
                </span>
                <span className="mt-1 block text-caption uppercase tracking-[0.22em] text-brand-teal">
                  Business &amp; Corporate Legal Service
                </span>
              </div>
            </div>
            <div className="mt-5 space-y-1 text-caption">
              <p>
                <a
                  href="mailto:kaclegalpractice@gmail.com"
                  className="transition-colors hover:text-white"
                >
                  kaclegalpractice@gmail.com
                </a>
              </p>
              <p>
                <a
                  href="tel:+2348147312802"
                  className="transition-colors hover:text-white"
                >
                  +234 814 731 2802
                </a>
              </p>
            </div>
          </div>

          {/* Explore */}
          <div>
            <h2 className="text-caption font-semibold uppercase tracking-[0.18em] text-white">
              Explore
            </h2>
            <ul className="mt-4 space-y-2.5 text-caption">
              {EXPLORE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="transition-colors hover:text-brand-teal"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Offices — placeholder copy until Phase 5/9 */}
          <div>
            <h2 className="text-caption font-semibold uppercase tracking-[0.18em] text-white">
              Offices
            </h2>
            <ul className="mt-4 space-y-4 text-caption">
              <li>
                <span className="block font-medium text-white">Lagos</span>
                <span className="block">
                  5, Pascal Offiah Close, off Platinum Way, Lekki, Lagos.
                </span>
              </li>
              <li>
                <span className="block font-medium text-white">Uyo</span>
                <span className="block">
                  4, Udoumana Street, Uyo, Akwa Ibom State.
                </span>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h2 className="text-caption font-semibold uppercase tracking-[0.18em] text-white">
              Legal
            </h2>
            <ul className="mt-4 space-y-2.5 text-caption">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="transition-colors hover:text-brand-teal"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-caption text-white/60">
          <p>&copy; {year} Koko Asuquo Chambers. All rights reserved.</p>
        </div>
      </Reveal>
    </footer>
  );
}
