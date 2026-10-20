import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const publicRoutes = ["/", "/features", "/login", "/register", "/api/auth"];
const adminRoutes = ["/admin"];

export default auth((req) => {
  const { nextUrl, auth: session } = req as any;
  const pathname = nextUrl.pathname;

  // Allow public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Allow API routes (handled internally)
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Not authenticated → redirect to login
  if (!session) {
    const loginUrl = new URL("/login", nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin routes → require SUPER_ADMIN
  if (adminRoutes.some((route) => pathname.startsWith(route))) {
    const role = (session.user as any)?.role;
    if (role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", nextUrl.origin));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
