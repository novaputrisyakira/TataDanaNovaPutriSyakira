import { NextRequest, NextResponse } from "next/server";
import { dbStore, ensureSuperadminAccount } from "@/lib/storage/store";
import { requireAdmin } from "@/lib/auth/session";
import { AuditLog, Wallet } from "@/types";

export async function GET(req: NextRequest) {
  ensureSuperadminAccount();
  const authCheck = await requireAdmin(req);
  if (authCheck instanceof NextResponse) return authCheck;

  const payments = dbStore.state.payments || [];
  const enrichedPayments = payments.map((p) => {
    const rawUser = dbStore.state.profiles.find((u) => u.id === p.user_id);
    let user = undefined;
    if (rawUser) {
      const { password_hash, ...safeUser } = rawUser;
      user = safeUser;
    }
    return {
      ...p,
      user,
    };
  });
  return NextResponse.json({ ok: true, data: enrichedPayments });
}

export async function PATCH(req: NextRequest) {
  ensureSuperadminAccount();
  const authCheck = await requireAdmin(req);
  if (authCheck instanceof NextResponse) return authCheck;
  const admin = authCheck.user;

  try {
    const { paymentId, status, adminNotes } = await req.json();

    if (!dbStore.state.payments) dbStore.state.payments = [];
    const payment = dbStore.state.payments.find((p) => p.id === paymentId);
    if (!payment) {
      return NextResponse.json({ ok: false, error: "Pembayaran tidak ditemukan" }, { status: 404 });
    }

    payment.status = status; // 'approved' | 'rejected'
    if (adminNotes) payment.admin_notes = adminNotes;
    payment.updated_at = new Date().toISOString();

    const targetUser = dbStore.state.profiles.find((u) => u.id === payment.user_id);

    // Dual Approval: If approved, activate plan on user profile and approve verification
    if (status === "approved") {
      if (targetUser) {
        targetUser.plan = payment.plan;
        targetUser.verification_status = "approved";
        targetUser.rejection_reason = undefined;
        targetUser.updated_at = new Date().toISOString();
      }

      // Enforce strictly Rp0 initial balance invariant
      if (!dbStore.state.wallets) dbStore.state.wallets = [];
      const userWallets = dbStore.state.wallets.filter((w) => w.user_id === payment.user_id);
      if (userWallets.length === 0) {
        const defaultWallet: Wallet = {
          id: `w-${Date.now()}-1`,
          user_id: payment.user_id,
          name: "Tunai (Cash)",
          type: "cash",
          balance: 0,
          color: "#F97316",
          icon: "💵",
          is_default: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        dbStore.state.wallets.push(defaultWallet);
      } else {
        userWallets.forEach((w) => {
          if (w.balance !== 0) w.balance = 0;
        });
      }

      // Sync active session status in memory store
      if (dbStore.state.sessions) {
        for (const token in dbStore.state.sessions) {
          if (dbStore.state.sessions[token].userId === payment.user_id) {
            dbStore.state.sessions[token].verificationStatus = "approved";
          }
        }
      }

      // Log admin action into audit logs
      if (!dbStore.state.auditLogs) dbStore.state.auditLogs = [];
      const log: AuditLog = {
        id: `aud-${Date.now()}`,
        admin_id: admin?.id,
        admin_email: admin?.email || "superadmin@tatadana.id",
        target_user_id: payment.user_id,
        action: "approve_payment",
        reason: adminNotes || `Admin menyetujui pembayaran paket ${payment.plan}`,
        created_at: new Date().toISOString(),
      };
      dbStore.state.auditLogs.unshift(log);
    } else if (status === "rejected") {
      // Dual Rejection: mark user as rejected with reason
      if (targetUser) {
        targetUser.verification_status = "rejected";
        targetUser.rejection_reason =
          adminNotes || "Bukti pembayaran paket ditolak oleh Administrator.";
        targetUser.updated_at = new Date().toISOString();
      }

      // Sync active session status in memory store
      if (dbStore.state.sessions) {
        for (const token in dbStore.state.sessions) {
          if (dbStore.state.sessions[token].userId === payment.user_id) {
            dbStore.state.sessions[token].verificationStatus = "rejected";
          }
        }
      }

      // Log admin action into audit logs
      if (!dbStore.state.auditLogs) dbStore.state.auditLogs = [];
      const log: AuditLog = {
        id: `aud-${Date.now()}`,
        admin_id: admin?.id,
        admin_email: admin?.email || "superadmin@tatadana.id",
        target_user_id: payment.user_id,
        action: "reject_payment",
        reason: adminNotes || `Admin menolak bukti pembayaran paket ${payment.plan}`,
        created_at: new Date().toISOString(),
      };
      dbStore.state.auditLogs.unshift(log);
    }

    return NextResponse.json({ ok: true, data: payment });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
