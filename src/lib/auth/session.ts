import { NextRequest, NextResponse } from "next/server";
import { dbStore, SUPERADMIN_PRIMARY_EMAIL } from "@/lib/storage/store";
import { Profile } from "@/types";
import {
  SessionData,
  SESSION_COOKIE_NAME,
  ADMIN_COOKIE_NAME,
  SESSION_DURATION_MS,
  bytesToBase64Url,
  base64UrlToBytes,
  strToBase64Url,
  base64UrlToStr,
  createSignedSessionToken,
  verifySignedSessionToken,
} from "./token";

export * from "./token";

/**
 * Creates a new authenticated session for a user.
 */
export async function createSession(
  userId: string,
  role: "admin" | "user",
  status?: "approved" | "pending" | "rejected"
): Promise<string> {
  let vStatus = status;
  if (!vStatus) {
    const p = dbStore.state.profiles.find((x) => x.id === userId);
    vStatus = p?.is_superadmin ? "approved" : (p?.verification_status || "pending");
  }

  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const token = await createSignedSessionToken({
    userId,
    role,
    status: vStatus,
    expiresAt,
  });

  if (!dbStore.state.sessions) {
    dbStore.state.sessions = {};
  }

  dbStore.state.sessions[token] = {
    userId,
    role,
    verificationStatus: vStatus,
    expiresAt,
  };

  return token;
}

/**
 * Retrieves a session from token if valid and not expired.
 */
export async function getSession(token: string): Promise<SessionData | null> {
  if (!token) return null;

  // 1. Try verify signed token
  const verified = await verifySignedSessionToken(token);
  if (verified) {
    return {
      userId: verified.userId,
      role: verified.role,
      verificationStatus: verified.status,
      expiresAt: verified.expiresAt,
    };
  }

  // 2. Fallback to memory store if raw token or legacy session
  if (dbStore.state.sessions && dbStore.state.sessions[token]) {
    const mem = dbStore.state.sessions[token];
    if (Date.now() <= mem.expiresAt) {
      return mem;
    }
    delete dbStore.state.sessions[token];
  }

  return null;
}

/**
 * Invalidates a session by token.
 */
export function destroySession(token: string): void {
  if (token && dbStore.state.sessions && dbStore.state.sessions[token]) {
    delete dbStore.state.sessions[token];
  }
}

/**
 * Extracts session from NextRequest cookies or Authorization header.
 */
export function extractTokenFromRequest(req: NextRequest): string | null {
  // Check cookie
  const cookieToken = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (cookieToken) return cookieToken;

  // Check Bearer authorization header
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    return authHeader.substring(7).trim();
  }

  return null;
}

/**
 * Sets session and admin auth cookies on a NextResponse.
 */
export function setSessionCookie(response: NextResponse, token: string, isAdmin: boolean = false): void {
  const isProd = process.env.NODE_ENV === "production";
  const maxAgeSeconds = Math.floor(SESSION_DURATION_MS / 1000);

  response.cookies.set(SESSION_COOKIE_NAME, token, {
    path: "/",
    httpOnly: false,
    secure: isProd,
    sameSite: "lax",
    maxAge: maxAgeSeconds,
  });

  if (isAdmin) {
    response.cookies.set(ADMIN_COOKIE_NAME, "true", {
      path: "/",
      httpOnly: false,
      secure: isProd,
      sameSite: "lax",
      maxAge: maxAgeSeconds,
    });
  } else {
    response.cookies.delete(ADMIN_COOKIE_NAME);
  }
}

/**
 * Gets the current authenticated user and role from request.
 */
export async function getSessionUser(req: NextRequest): Promise<{
  user: Profile;
  role: "admin" | "user";
  isAdmin: boolean;
  verificationStatus: "approved" | "pending" | "rejected";
} | null> {
  const token = extractTokenFromRequest(req);
  if (!token) return null;

  const session = await getSession(token);
  if (!session) return null;

  const user = dbStore.state.profiles.find((p) => p.id === session.userId);
  if (!user) return null;

  const isAdmin =
    user.is_superadmin === true ||
    user.email?.toLowerCase().trim() === SUPERADMIN_PRIMARY_EMAIL.toLowerCase();

  const verificationStatus = isAdmin ? "approved" : (user.verification_status || "pending");

  return {
    user,
    role: isAdmin ? "admin" : "user",
    isAdmin,
    verificationStatus,
  };
}

/**
 * Middleware helper for API routes requiring Admin privileges.
 */
export async function requireAdmin(req: NextRequest): Promise<
  | { user: Profile; role: "admin"; isAdmin: true }
  | NextResponse
> {
  const session = await getSessionUser(req);

  if (!session) {
    return NextResponse.json(
      { ok: false, error: "Autentikasi diperlukan. Sesi Anda belum aktif atau telah berakhir." },
      { status: 401 }
    );
  }

  if (!session.isAdmin) {
    return NextResponse.json(
      { ok: false, error: "Akses ditolak: Operasi ini membutuhkan hak akses Administrator." },
      { status: 403 }
    );
  }

  return { user: session.user, role: "admin", isAdmin: true };
}

/**
 * Middleware helper for API routes requiring an authenticated and approved regular User.
 * Strictly blocks admins from accessing user financial endpoints directly.
 */
export async function requireUser(req: NextRequest): Promise<
  | { user: Profile; role: "user"; isAdmin: false }
  | NextResponse
> {
  const session = await getSessionUser(req);

  if (!session) {
    return NextResponse.json(
      { ok: false, error: "Autentikasi diperlukan. Silakan login terlebih dahulu." },
      { status: 401 }
    );
  }

  // Administrator is strictly forbidden from directly accessing user financial endpoints (Requirement 1)
  if (session.isAdmin) {
    return NextResponse.json(
      { ok: false, error: "Akses ditolak: Administrator tidak diperkenankan mengakses endpoint pengguna secara langsung." },
      { status: 403 }
    );
  }

  // Enforce account verification status check (Requirement 2)
  if (session.user.verification_status !== "approved") {
    return NextResponse.json(
      {
        ok: false,
        error: "Akun Anda sedang menunggu persetujuan verifikasi oleh Administrator.",
        verification_status: session.user.verification_status || "pending",
      },
      { status: 403 }
    );
  }

  return { user: session.user, role: "user", isAdmin: false };
}
