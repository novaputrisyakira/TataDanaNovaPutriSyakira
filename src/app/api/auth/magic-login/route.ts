import { NextRequest, NextResponse } from "next/server";
import { verifyAndConsumeMagicToken } from "@/lib/storage/store";
import { createSession, setSessionCookie } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(new URL("/login?error=token_missing", req.url));
    }

    const verification = verifyAndConsumeMagicToken(token);
    if (!verification.ok || !verification.user) {
      const errorMsg = encodeURIComponent(verification.error || "Tautan login tidak valid atau telah kadaluarsa.");
      return NextResponse.redirect(new URL(`/login?error=${errorMsg}`, req.url));
    }

    const user = verification.user;
    const isAdmin = user.is_superadmin === true;
    const role = isAdmin ? "admin" : "user";
    const sessionToken = await createSession(user.id, role, "approved");

    const redirectPath = isAdmin ? "/admin" : "/dashboard?auth=magic_success";
    const response = NextResponse.redirect(new URL(redirectPath, req.url));

    setSessionCookie(response, sessionToken, isAdmin);

    return response;
  } catch (err: any) {
    const errorMsg = encodeURIComponent(err.message || "Gagal memproses tautan login.");
    return NextResponse.redirect(new URL(`/login?error=${errorMsg}`, req.url));
  }
}
