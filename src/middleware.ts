import { NextResponse, type NextRequest } from "next/server";
import { verifySignedSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/token";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  let sessionToken = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionToken) {
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
      sessionToken = authHeader.substring(7).trim();
    }
  }

  // Verify cryptographically signed session token
  const session = sessionToken ? await verifySignedSessionToken(sessionToken) : null;
  const isAuthenticated = Boolean(session);
  const isAdmin = session?.role === "admin";
  const status = session?.status;

  // 1. Protection for /admin routes
  if (pathname.startsWith("/admin")) {
    // Exclude /admin/login from blocking unauthenticated visitors
    if (pathname === "/admin/login") {
      if (isAuthenticated && isAdmin) {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
      if (isAuthenticated && !isAdmin) {
        return NextResponse.redirect(new URL("/dashboard?denied=admin_only", req.url));
      }
      return NextResponse.next();
    }

    // Unauthenticated -> redirect to login with original target path
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Authenticated regular user (any status) attempting to access admin dashboard -> deny & redirect to user dashboard
    if (!isAdmin) {
      const userDashboardUrl = new URL("/dashboard", req.url);
      userDashboardUrl.searchParams.set("denied", "admin_only");
      return NextResponse.redirect(userDashboardUrl);
    }

    return NextResponse.next();
  }

  // 2. Protection for /dashboard routes
  if (pathname.startsWith("/dashboard")) {
    // Unauthenticated -> redirect to login
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Authenticated as Admin -> strictly deny access to user dashboard! Redirect to admin overview with notification
    if (isAdmin) {
      const adminUrl = new URL("/admin", req.url);
      adminUrl.searchParams.set("denied", "user_only");
      return NextResponse.redirect(adminUrl);
    }

    // Regular user but NOT approved (pending or rejected) -> redirect to waiting verification page
    if (status !== "approved") {
      const pendingUrl = new URL("/verification-pending", req.url);
      if (status === "rejected") {
        pendingUrl.searchParams.set("status", "rejected");
      }
      return NextResponse.redirect(pendingUrl);
    }

    return NextResponse.next();
  }

  // 3. Protection for /verification-pending route
  if (pathname === "/verification-pending") {
    // Admin has no business in user verification waiting page -> redirect to admin
    if (isAuthenticated && isAdmin) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }

    // Approved regular user has already been verified -> redirect straight to user dashboard
    if (isAuthenticated && !isAdmin && status === "approved") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Pending, rejected, or unauthenticated visitors (e.g. requesting passwordless magic link) are allowed
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/verification-pending",
  ],
};
