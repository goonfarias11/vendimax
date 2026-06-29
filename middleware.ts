import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

    // Try all cookie names NextAuth v5 might use
    const cookieNames = request.cookies.getAll().map(c => c.name);
    console.log('[MIDDLEWARE] cookies:', cookieNames.join(', '));
    console.log('[MIDDLEWARE] AUTH_SECRET present:', !!process.env.AUTH_SECRET);
    console.log('[MIDDLEWARE] NEXTAUTH_SECRET present:', !!process.env.NEXTAUTH_SECRET);

    const token = await getToken({ req: request, secret });
    console.log('[MIDDLEWARE] token:', token ? JSON.stringify({ adminRole: token.adminRole, role: token.role }) : 'null');

    if (!token) {
      // TEMPORALMENTE: dejar pasar para ver si el problema es el token o algo más
      // return NextResponse.redirect(new URL('/login?next=/admin', request.url));
      console.log('[MIDDLEWARE] No token found, but letting through for debug');
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)',],
};
