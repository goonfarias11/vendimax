import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
    const token = await getToken({ req: request, secret });

    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('next', request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    const adminRole = token.adminRole as string | undefined;
    const role = token.role as string | undefined;

    const hasAccess =
      adminRole === 'super_admin' ||
      adminRole === 'admin' ||
      role === 'OWNER' ||
      role === 'ADMIN';

    if (!hasAccess) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)',],
};
