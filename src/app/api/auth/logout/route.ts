import { NextRequest, NextResponse } from "next/server";
import { destroySession, extractTokenFromRequest, SESSION_COOKIE_NAME, ADMIN_COOKIE_NAME } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    const token = extractTokenFromRequest(req);
    if (token) {
      destroySession(token);
    }

    const response = NextResponse.json({
      ok: true,
      message: "Berhasil keluar.",
    });

    response.cookies.delete(SESSION_COOKIE_NAME);
    response.cookies.delete(ADMIN_COOKIE_NAME);

    return response;
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
