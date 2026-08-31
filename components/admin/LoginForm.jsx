'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';

/** Where to land after login when no specific destination was requested. */
const DEFAULT_DESTINATION = '/admin/publications';

/** Copy for the `?error=` values the middleware can send back. */
const ERROR_MESSAGES = {
  'not-admin':
    'That account is signed in but is not the administrator, so it has been signed out again. Use the firm’s admin account.',
};

/**
 * Sanitise the `redirectedFrom` query parameter before navigating to it.
 *
 * The value comes from the URL, so it's attacker-supplied. Without this an
 * attacker could send a link like `/admin/login?redirectedFrom=https://evil.example`
 * and have the site bounce the admin to their page immediately after a genuine
 * login — a classic open redirect. Only same-site paths under /admin are allowed,
 * and protocol-relative `//host` forms are rejected.
 *
 * @param {string|null} value - Raw query parameter.
 * @returns {string} A safe internal path.
 */
export function safeRedirect(value) {
  if (typeof value !== 'string' || !value) return DEFAULT_DESTINATION;
  if (!value.startsWith('/')) return DEFAULT_DESTINATION;
  if (value.startsWith('//')) return DEFAULT_DESTINATION;
  if (!value.startsWith('/admin')) return DEFAULT_DESTINATION;
  if (value.startsWith('/admin/login')) return DEFAULT_DESTINATION;
  return value;
}

/**
 * LoginForm — email + password sign-in for the single admin account.
 *
 * There is no sign-up path and no self-service password reset anywhere in the
 * app: the only account is created directly in the Supabase dashboard, which is
 * also where its password is reset. Failures show one deliberately vague message
 * so the form can't be used to discover which email addresses exist.
 *
 * Signing in successfully is not sufficient on its own — the address must also be
 * on the server-side `ADMIN_EMAILS` allowlist, which this component cannot see.
 * That check happens on the next request, in the middleware and page guards.
 */
export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const destination = safeRedirect(searchParams.get('redirectedFrom'));
  const reason = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(ERROR_MESSAGES[reason] ?? '');
  const [submitting, setSubmitting] = useState(false);

  // A non-admin who signs in successfully gets bounced back here by the
  // middleware while still holding a valid session. Left in place, that session
  // is dead weight: it grants nothing, but it makes the next sign-in attempt
  // confusing. Clear it so the form starts from a clean state.
  useEffect(() => {
    if (reason !== 'not-admin') return;

    let cancelled = false;
    (async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        await supabase.auth.signOut();
        if (!cancelled) router.refresh();
      } catch (caught) {
        console.error('[admin] Could not clear the non-admin session:', caught);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reason, router]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }

    setSubmitting(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError('Those details did not match an admin account.');
        setPassword('');
        setSubmitting(false);
        return;
      }

      // refresh() re-runs the Server Components with the new session cookie so
      // the destination page sees an authenticated request.
      router.replace(destination);
      router.refresh();
    } catch (caught) {
      console.error('[admin] Sign in failed:', caught);
      setError('Could not sign in right now. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <Input
        label="Email"
        id="email"
        name="email"
        type="email"
        autoComplete="username"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="you@kaclegal.com"
      />

      <Input
        label="Password"
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />

      {error && (
        <div
          role="alert"
          className="border border-brand-error/30 bg-brand-error/5 px-4 py-3 text-caption text-brand-error"
        >
          {error}
        </div>
      )}

      <Button type="submit" fullWidth loading={submitting}>
        Sign in
      </Button>

      <p className="text-caption text-brand-muted">
        Access is limited to the firm&rsquo;s administrator account. Passwords are
        managed in the Supabase dashboard.
      </p>
    </form>
  );
}
