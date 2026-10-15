import { NextRequest, NextResponse } from "next/server";
import { dbStore } from "@/lib/storage/store";
import { requireAdmin } from "@/lib/auth/session";
import { AuditLog } from "@/types";

export async function GET(req: NextRequest) {
  const authCheck = await requireAdmin(req);
  if (authCheck instanceof NextResponse) return authCheck;

  const usersWithStats = dbStore.state.profiles.map((p) => {
    const txCount = dbStore.state.transactions.filter((t) => t.user_id === p.id).length;
    const walletCount = dbStore.state.wallets.filter((w) => w.user_id === p.id).length;
    const userPayments = (dbStore.state.payments || [])
      .filter((pay) => pay.user_id === p.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const latestPayment = userPayments[0] || null;

    // Strip sensitive fields
    const { password_hash, ...safeProfile } = p;
    return {
      ...safeProfile,
      verification_status: p.verification_status || (p.is_superadmin ? "approved" : "pending"),
      rejection_reason: p.rejection_reason,
      txCount,
      walletCount,
      payment: latestPayment,
    };
  });

  return NextResponse.json({ ok: true, data: usersWithStats });
}

export async function PATCH(req: NextRequest) {
  const authCheck = await requireAdmin(req);
  if (authCheck instanceof NextResponse) return authCheck;
  const admin = authCheck.user;

  try {
    const { userId, plan, isSuperadmin, verificationStatus, rejectionReason } = await req.json();
    const user = dbStore.state.profiles.find((p) => p.id === userId);
    if (!user) return NextResponse.json({ ok: false, error: "User tidak ditemukan" }, { status: 404 });

    if (plan) user.plan = plan;

    // Never demote primary superadmin
    if (user.email?.toLowerCase().trim() === "novaputrisyakira648@gmail.com") {
      user.is_superadmin = true;
      user.verification_status = "approved";
    } else {
      if (isSuperadmin !== undefined) user.is_superadmin = isSuperadmin;
      if (verificationStatus) {
        user.verification_status = verificationStatus;
        if (verificationStatus === "rejected") {
          user.rejection_reason = rejectionReason || "Pendaftaran ditolak oleh Administrator";
        } else if (verificationStatus === "approved") {
          user.rejection_reason = undefined;
        }
      }
    }
    user.updated_at = new Date().toISOString();

    // Log admin action with active admin's credentials
    const log: AuditLog = {
      id: `aud-${Date.now()}`,
      admin_id: admin.id,
      admin_email: admin.email || "superadmin@tatadana.id",
      target_user_id: userId,
      action: verificationStatus ? `verify_${verificationStatus}` : "update_user",
      reason: rejectionReason || `Admin updated profile (status: ${user.verification_status}, plan: ${user.plan})`,
      created_at: new Date().toISOString(),
    };
    dbStore.state.auditLogs.unshift(log);

    const { password_hash, ...safeUser } = user;
    return NextResponse.json({ ok: true, data: safeUser });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
