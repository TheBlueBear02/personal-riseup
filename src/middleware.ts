import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SITE_ACCESS_COOKIE, verifyAccessToken } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SITE_ACCESS_COOKIE)?.value;
  const authenticated = await verifyAccessToken(token);

  const isApi = pathname.startsWith("/api/");
  const isGate = pathname === "/";
  const isProtected =
    pathname.startsWith("/dashboard") || pathname.startsWith("/api/");

  if (authenticated && isGate) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!authenticated && isProtected) {
    if (isApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except Next internals and static favicon assets.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
