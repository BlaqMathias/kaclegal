import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { isAdminUser } from '@/lib/adminAccess';

/**
 * Route protection for the admin area.
 *
 * Two jobs on every /admin request:
 *
 * 1. Refresh the Supabase session cookie. Access tokens are short-lived; without
 *    this, an admin gets logged out mid-session because Server Components can't
 *    write cookies during render.
 * 2. Gate access — no admin session on an /admin page redirects to /admin/login,
 *    and a live admin session on /admin/login redirects onward to the list.
 *
 * "Admin session" means two things: the token verifies with Supabase, AND the
 * address is on the `ADMIN_EMAILS` allowlist. The same pair is checked by
 * `lib/auth.js`, using the same helper, so the two layers cannot drift apart and
 * start disagreeing about who is allowed in — which is how redirect loops happen.
 *
 * This is a CONVENIENCE layer, not the security boundary. It only sees requests
 * matching `config.matcher`, and it can only issue an HTML redirect — useless as
 * a response to `fetch()`. The real enforcement is `requireAdminPage()` in each
 * admin page and `requireAdminApi()` in each admin API route, which re-verify the
 * session independently. `/api/admin/*` is deliberately EXCLUDED from the matcher
 * below so those routes return a JSON 401 instead of a redirect to an HTML page.
 */

/** Where an authenticated admin lands by default. */
const ADMIN_HOME = '/admin/publications';

/** The one /admin path reachable without a session. */
const LOGIN_PATH = '/admin/login';

/**
 * @param {import('next/server').NextRequest} request
 * @returns {Promise<NextResponse>}
 */
export async function middleware(request) {
  const { pathname, search } = request.nextUrl;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Unconfigured environment: pass through rather than redirect-looping into a
  // login page that also can't work. Nothing is exposed by doing so — the page
  // and API guards fail closed on the same missing config.
  if (!url || !anonKey) {
    console.error(
      '[middleware] Supabase env vars are missing; /admin guards are relying on the page-level check.',
    );
    return NextResponse.next();
  }

  // `response` is reassigned inside setAll because refreshed cookies have to be
  // attached to the response that is actually returned.
  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // getUser(), not getSession(): the cookie is untrusted input, so the token has
  // to be verified with Supabase rather than merely decoded.
  //
  // Wrapped because a corrupted cookie or an unreachable auth endpoint throws, and
  // an uncaught throw here is a 500 on every /admin request. Treating failure as
  // "no user" fails closed and still lets the login page render.
  /** @type {import('@supabase/supabase-js').User|null} */
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data?.user ?? null;
  } catch (error) {
    console.error('[middleware] Could not verify the session:', error);
  }

  const isLoginRoute = pathname === LOGIN_PATH;
  const isAdmin = isAdminUser(user);

  if (!isAdmin && !isLoginRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = LOGIN_PATH;
    loginUrl.search = '';
    loginUrl.searchParams.set('redirectedFrom', `${pathname}${search}`);
    // A signed-in non-admin needs different wording from a signed-out visitor,
    // otherwise "wrong password" is the obvious but wrong conclusion.
    if (user) {
      loginUrl.searchParams.set('error', 'not-admin');
    }
    return NextResponse.redirect(loginUrl);
  }

  if (isAdmin && isLoginRoute) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = ADMIN_HOME;
    homeUrl.search = '';
    return NextResponse.redirect(homeUrl);
  }

  return response;
}

export const config = {
  // Matches /admin and everything beneath it. `/api/admin/*` is intentionally
  // absent: those routes answer with JSON 401s of their own.
  matcher: ['/admin/:path*'],
};
