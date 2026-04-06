import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { hasAdminPanelAccess } from '@/lib/admin/access';

export async function proxy(request: NextRequest) {
  const response = NextResponse.next();
  
  // Headers de seguridad
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );
  
  // CSP más permisivo para desarrollo, ajustar en producción
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https: blob:; " +
    "font-src 'self' data:; " +
    "connect-src 'self' https://*.mercadopago.com https://vercel.live; " +
    "frame-src https://vercel.live;"
  );

  if (request.nextUrl.pathname.startsWith('/admin')) {
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('next', `${request.nextUrl.pathname}${request.nextUrl.search}`);
      return NextResponse.redirect(loginUrl);
    }

    const tokenAdminRole = typeof token.adminRole === 'string' ? token.adminRole : null;
    const tokenRole = typeof token.role === 'string' ? token.role : null;

    if (!hasAdminPanelAccess(tokenAdminRole, tokenRole)) {
      return NextResponse.redirect(new URL('/403', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
