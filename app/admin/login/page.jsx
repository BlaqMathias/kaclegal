import LoginForm from "@/components/admin/LoginForm";
import Link from "next/link";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false, nocache: true },
};

/**
 * /admin/login — the only page under /admin reachable without a session.
 *
 * The form is wrapped in `<Suspense>` because it reads `useSearchParams()`, which
 * Next requires a suspense boundary for during static/streamed rendering.
 */
export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-navyDark px-6 py-16">
      <div className="w-full max-w-md">
        <div className="text-center">
          <p className="text-caption font-semibold uppercase tracking-[0.22em] text-brand-teal">
            Koko Asuquo Chambers
          </p>
          <h1 className="mt-3 text-h2 text-white">Administrator sign in</h1>
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white p-6 shadow-card sm:p-8">
          <Suspense
            fallback={
              <p className="text-caption text-brand-muted">
                Loading sign-in form…
              </p>
            }
          >
            <LoginForm />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-caption text-white/60">
          <Link href="/" className="transition-colors hover:text-brand-teal">
            Return to kaclegal.com
          </Link>
        </p>
      </div>
    </div>
  );
}
