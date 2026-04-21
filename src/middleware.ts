import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const session = request.cookies.get('peeka_session')

  // Jika mencoba buka dashboard tapi tidak punya session
  if (request.nextUrl.pathname.startsWith('/dashboard') && !session) {
    return NextResponse.redirect(new URL('/auth/login?error=unauthorized', request.url))
  }

  return NextResponse.next()
}

// Hanya jalankan middleware untuk jalur dashboard
export const config = {
  matcher: ['/dashboard/:path*'],
}