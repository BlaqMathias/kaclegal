import Reveal from "@/components/motion/Reveal";
import Image from "next/image";
import Link from "next/link";

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
                  href="mailto:info@kaclegalpractice.com"
                  className="transition-colors hover:text-white"
                >
                  info@kaclegalpractice.com
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
