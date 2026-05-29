import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const session = request.cookies.get('peeka_session')
  const adminSession = request.cookies.get('peeka_admin_session')
  const pathname = request.nextUrl.pathname

  // Skip middleware untuk API routes
  if (pathname.startsWith('/superadmin/api/')) {
    return NextResponse.next()
  }

  // Proteksi route dashboard user
  if (pathname.startsWith('/dashboard') && !session) {
    return NextResponse.redirect(new URL('/auth/login?error=unauthorized', request.url))
  }

  // Redirect authenticated user dari auth pages
  if (pathname.startsWith('/auth') && session && pathname !== '/auth/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Proteksi route superadmin
  if (pathname.startsWith('/superadmin')) {
    // Allow login page tanpa auth
    if (pathname === '/superadmin/login') {
      // Jika sudah login, redirect ke dashboard superadmin
      if (adminSession) {
        return NextResponse.redirect(new URL('/superadmin', request.url))
      }
      return NextResponse.next()
    }

    // Proteksi semua route superadmin lainnya
    if (!adminSession) {
      return NextResponse.redirect(new URL('/superadmin/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth/:path*', '/profile/:path*', '/superadmin/:path*'],
}