import { NextRequest, NextResponse } from "next/server";
import { dbStore, ensureSuperadminAccount, SUPERADMIN_PRIMARY_EMAIL } from "@/lib/storage/store";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, setSessionCookie } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    ensureSuperadminAccount();
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, error: "Email dan kata sandi admin wajib diisi." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const profile = dbStore.state.profiles.find(
      (p) => p.email?.trim().toLowerCase() === cleanEmail
    );

    if (!profile) {
      return NextResponse.json(
        { ok: false, error: "Email atau kata sandi admin salah." },
        { status: 401 }
      );
    }

    // Role verification strictly on backend
    if (profile.is_superadmin !== true && cleanEmail !== SUPERADMIN_PRIMARY_EMAIL.toLowerCase()) {
      return NextResponse.json(
        { ok: false, error: "Akses ditolak: Akun ini bukan akun administrator yang sah." },
        { status: 403 }
      );
    }

    if (!profile.password_hash || !verifyPassword(password, profile.password_hash)) {
      return NextResponse.json(
        { ok: false, error: "Email atau kata sandi admin salah." },
        { status: 401 }
      );
    }

    // Successfully verified Superadmin
    const sessionToken = await createSession(profile.id, "admin", "approved");

    const safeUser = {
      id: profile.id,
      full_name: profile.full_name,
      email: profile.email,
      role: "superadmin",
      is_superadmin: true,
      plan: profile.plan,
    };

    const response = NextResponse.json({
      ok: true,
      message: "Verifikasi Superadmin berhasil.",
      user: safeUser,
      redirectTo: "/admin",
    });

    setSessionCookie(response, sessionToken, true);

    return response;
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
