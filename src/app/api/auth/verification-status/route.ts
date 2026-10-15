import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, createSession, setSessionCookie } from "@/lib/auth/session";
import { dbStore, ensureSuperadminAccount } from "@/lib/storage/store";

export async function GET(req: NextRequest) {
  try {
    ensureSuperadminAccount();
    const url = new URL(req.url);
    const queryEmail = url.searchParams.get("email")?.toLowerCase().trim();
    const queryUserId = url.searchParams.get("userId");

    // 1. First attempt to resolve by active session
    const session = await getSessionUser(req);
    let targetProfile = session?.user;

    // 2. Fallback to query param if not in session or checking specific email
    if (!targetProfile && queryEmail) {
      targetProfile = dbStore.state.profiles.find(
        (p) => p.email?.toLowerCase().trim() === queryEmail
      );
    }
    if (!targetProfile && queryUserId) {
      targetProfile = dbStore.state.profiles.find((p) => p.id === queryUserId);
    }

    if (!targetProfile) {
      return NextResponse.json(
        { ok: false, error: "Profil tidak ditemukan atau sesi tidak aktif." },
        { status: 404 }
      );
    }

    const isSuper = targetProfile.is_superadmin === true;
    const status = isSuper ? "approved" : targetProfile.verification_status || "pending";

    const userPayments = (dbStore.state.payments || [])
      .filter((p) => p.user_id === targetProfile.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const latestPayment = userPayments[0] || null;

    const response = NextResponse.json({
      ok: true,
      userId: targetProfile.id,
      fullName: targetProfile.full_name,
      email: targetProfile.email,
      status,
      rejectionReason: targetProfile.rejection_reason,
      isSuperadmin: isSuper,
      plan: targetProfile.plan,
      payment: latestPayment,
    });

    // If approved and user is identified, refresh session cookie with approved status
    // so client can immediately navigate to /dashboard without password or middleware bounce
    if (status === "approved" && targetProfile) {
      const refreshedToken = await createSession(targetProfile.id, isSuper ? "admin" : "user", "approved");
      setSessionCookie(response, refreshedToken, isSuper);
    }

    return response;
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
