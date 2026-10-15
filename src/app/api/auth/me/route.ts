import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, createSession, setSessionCookie } from "@/lib/auth/session";
import { dbStore } from "@/lib/storage/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);

    if (!session) {
      return NextResponse.json(
        { ok: false, error: "Pengguna belum login atau sesi telah berakhir." },
        { status: 401 }
      );
    }

    const { user, role, isAdmin } = session;
    const currentStatus = isAdmin ? "approved" : (user.verification_status || "pending");

    const userPayments = (dbStore.state.payments || [])
      .filter((p) => p.user_id === user.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const latestPayment = userPayments[0] || null;

    const safeUser = {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      phone_number: user.phone_number,
      avatar_url: user.avatar_url,
      currency: user.currency,
      plan: user.plan,
      telegram_id: user.telegram_id,
      telegram_username: user.telegram_username,
      is_superadmin: user.is_superadmin,
      verification_status: currentStatus,
      rejection_reason: user.rejection_reason,
      savings_preference: user.savings_preference,
      savings_goal: user.savings_goal,
      created_at: user.created_at,
      payment: latestPayment,
    };

    const response = NextResponse.json({
      ok: true,
      user: safeUser,
      role,
      isAdmin,
    });

    // If the database verification status differs from the session token status (e.g. newly approved by admin),
    // refresh the cryptographically signed session cookie so middleware will allow access immediately without re-entering password.
    if (session.verificationStatus !== currentStatus) {
      const refreshedToken = await createSession(user.id, role, currentStatus);
      setSessionCookie(response, refreshedToken, isAdmin);
    }

    return response;
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
