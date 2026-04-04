import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("authjs.session-token")?.value
    || request.cookies.get("__Secure-authjs.session-token")?.value;

  const isAuthPage = request.nextUrl.pathname.startsWith("/login")
    || request.nextUrl.pathname.startsWith("/register");
  const isApiRoute = request.nextUrl.pathname.startsWith("/api");
  const isPublicPage = request.nextUrl.pathname === "/";

  // Allow public pages, auth pages, and API routes
  if (isPublicPage || isAuthPage || isApiRoute) {
    // If logged in and on auth page, redirect to dashboard
    if (isAuthPage && token) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // Protected pages — redirect to login if no session
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
