import ChromeGate from "@/components/layout/ChromeGate";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});

export const metadata = {
  title: {
    default: "Koko Asuquo Chambers (KAC) - Business & Corporate Legal Service",
    template: "%s | Koko Asuquo Chambers",
  },
  icons: { icon: "/images/logo/kac-icon.png" },
  description:
    "Koko Asuquo Chambers (KAC) is a modern commercial law firm with offices in Lagos and Uyo, providing business and corporate legal services.",
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
