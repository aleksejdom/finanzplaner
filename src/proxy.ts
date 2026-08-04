import { NextResponse, type NextRequest } from "next/server"
import { getSessionCookie } from "better-auth/cookies"

const PUBLIC_PATHS = ["/login", "/register"]

// Next 16: Nachfolger von middleware.ts. Prüft nur, ob ein signiertes
// Session-Cookie vorhanden ist (kein DB-Zugriff hier) – die eigentliche
// Session-Validierung passiert serverseitig in den Server Components
// bzw. Server Actions über auth.api.getSession().
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublic =
    pathname === "/" || PUBLIC_PATHS.some((p) => pathname.startsWith(p))

  const sessionCookie = getSessionCookie(request)

  if (!sessionCookie && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
