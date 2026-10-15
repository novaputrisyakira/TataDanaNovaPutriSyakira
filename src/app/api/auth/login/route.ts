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
        { ok: false, error: "Email dan kata sandi wajib diisi." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const profile = dbStore.state.profiles.find(
      (p) => p.email?.trim().toLowerCase() === cleanEmail
    );

    if (!profile) {
      return NextResponse.json(
        { ok: false, error: "Email atau kata sandi tidak sesuai." },
        { status: 401 }
      );
    }

    if (!profile.password_hash || !verifyPassword(password, profile.password_hash)) {
      return NextResponse.json(
        { ok: false, error: "Email atau kata sandi tidak sesuai." },
        { status: 401 }
      );
    }

    const isAdmin =
      profile.is_superadmin === true ||
      cleanEmail === SUPERADMIN_PRIMARY_EMAIL.toLowerCase();

    const role = isAdmin ? "admin" : "user";
    const verificationStatus = isAdmin ? "approved" : (profile.verification_status || "pending");

    // Rejected account handling: Attach session so /verification-pending can resolve profile and show reason
    if (!isAdmin && verificationStatus === "rejected") {
      const sessionToken = await createSession(profile.id, "user", "rejected");
      const response = NextResponse.json(
        {
          ok: false,
          error: `Pendaftaran akun Anda ditolak oleh Administrator${profile.rejection_reason ? `: ${profile.rejection_reason}` : "."}`,
          verification_status: "rejected",
          rejection_reason: profile.rejection_reason,
          redirectTo: "/verification-pending?status=rejected",
        },
        { status: 403 }
      );
      setSessionCookie(response, sessionToken, false);
      return response;
    }

    const redirectTo = isAdmin
      ? "/admin"
      : verificationStatus === "approved"
      ? "/dashboard"
      : "/verification-pending";

    const sessionToken = await createSession(profile.id, role, verificationStatus);

    const safeUser = {
      id: profile.id,
      full_name: profile.full_name,
      email: profile.email,
      phone_number: profile.phone_number,
      plan: profile.plan,
      is_superadmin: profile.is_superadmin,
      verification_status: verificationStatus,
      rejection_reason: profile.rejection_reason,
      avatar_url: profile.avatar_url,
      savings_preference: profile.savings_preference,
      savings_goal: profile.savings_goal,
    };

    const response = NextResponse.json({
      ok: true,
      token: sessionToken,
      message: !isAdmin && verificationStatus === "pending"
        ? "Akun Anda sedang menunggu persetujuan verifikasi oleh Administrator."
        : "Login berhasil.",
      user: safeUser,
      role,
      verification_status: verificationStatus,
      redirectTo,
    });

    setSessionCookie(response, sessionToken, isAdmin);

    return response;
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
