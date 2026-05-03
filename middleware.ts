import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "abs4u_session";
const PUBLIC_PATHS = ["/login", "/signup", "/icon.svg", "/manifest.webmanifest"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const isAsset = pathname.startsWith("/_next") || pathname.startsWith("/uploads") || pathname === "/favicon.ico";
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);

  if (!hasSession && !isPublic && !isAsset) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (hasSession && (pathname === "/login" || pathname === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
