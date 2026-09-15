import ChromeGate from "@/components/layout/ChromeGate";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import OrganizationSchema from "@/components/seo/OrganizationSchema";
import localFont from "next/font/local";
import "./globals.css";

const bricolage = localFont({
  src: [
    {
      path: "./fonts/BricolageGrotesque-ExtraLight.ttf",
      weight: "200",
      style: "normal",
    },
    {
      path: "./fonts/BricolageGrotesque-Light.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "./fonts/BricolageGrotesque-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/BricolageGrotesque-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/BricolageGrotesque-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "./fonts/BricolageGrotesque-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "./fonts/BricolageGrotesque-ExtraBold.ttf",
      weight: "800",
      style: "normal",
    },
  ],
  variable: "--font-bricolage",
  display: "swap",
});

const SITE_URL = "https://www.kaclegalpractice.com";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Koko Asuquo Chambers (KAC) - Business & Corporate Legal Service",
    template: "%s | Koko Asuquo Chambers",
  },
  icons: { icon: "/images/logo/kac-icon.png" },
  description:
    "Koko Asuquo Chambers combines sound legal expertise, commercial insight and technology to serve businesses and individuals across Nigeria.",
  openGraph: {
    type: "website",
    siteName: "Koko Asuquo Chambers",
    title: "Koko Asuquo Chambers (KAC) - Business & Corporate Legal Service",
    description:
      "Koko Asuquo Chambers combines sound legal expertise, commercial insight and technology to serve businesses and individuals across Nigeria.",
    url: SITE_URL,
  },
  twitter: {
    card: "summary",
    title: "Koko Asuquo Chambers (KAC) - Business & Corporate Legal Service",
    description:
      "Koko Asuquo Chambers combines sound legal expertise, commercial insight and technology to serve businesses and individuals across Nigeria.",
  },
};
export const viewport = {
  themeColor: "#04509F",
};

/**
 * Root layout — applies fonts, global styles, and the persistent Header/Footer
 * shell around every page.
 *
 * Header and Footer are wrapped in `ChromeGate`, which suppresses them on
 * `/admin` routes so the admin area renders in its own shell.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - The active route's page content.
 */
export default function RootLayout({ children }) {
  return (
    <html lang="en" className={bricolage.variable}>
      <body className="flex min-h-screen flex-col">
        <OrganizationSchema />
        <ChromeGate>
          <Header />
        </ChromeGate>
        <main className="flex-1">{children}</main>
        <ChromeGate>
          <Footer />
        </ChromeGate>
      </body>
    </html>
  );
}
