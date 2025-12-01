import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Track page view asynchronously (don't block the request)
  trackPageView(request);

  return NextResponse.next();
}

async function trackPageView(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;

    // Skip tracking for:
    // - API routes
    // - Static assets
    // - Next.js internals
    if (
      pathname.startsWith('/api/') ||
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/favicon.ico') ||
      pathname.includes('.')
    ) {
      return;
    }

    // Get visitor info
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';
    const userAgent = request.headers.get('user-agent') || undefined;
    const referer = request.headers.get('referer') || undefined;

    // Track the page view via API (fire and forget)
    fetch(`${request.nextUrl.origin}/api/analytics/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: pathname,
        ipAddress,
        userAgent,
        referer,
      }),
    }).catch(() => {
      // Silently fail - don't break the user experience
    });
  } catch (error) {
    // Silently fail - analytics should never break the site
  }
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (will track separately)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
