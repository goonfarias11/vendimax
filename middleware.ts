import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { hasAdminPanelAccess } from '@/lib/admin/access';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Headers de seguridad
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  if (request.nextUrl.pathname.startsWith('/admin')) {
    const session = await auth();

    if (!session?.user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search);
      return NextResponse.redirect(loginUrl);
    }

    const adminRole = (session.user as any).adminRole as string | null;
    const role = (session.user as any).role as string | null;

    if (!hasAdminPanelAccess(adminRole, role)) {
      return NextResponse.redirect(new URL('/403', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
