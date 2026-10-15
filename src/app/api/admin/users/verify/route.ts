import { NextRequest, NextResponse } from "next/server";
import { dbStore, ensureSuperadminAccount } from "@/lib/storage/store";
import { requireAdmin } from "@/lib/auth/session";
import { AuditLog, Wallet, Category } from "@/types";

export async function POST(req: NextRequest) {
  try {
    ensureSuperadminAccount();
    const authCheck = await requireAdmin(req);
    if (authCheck instanceof NextResponse) return authCheck;
    const admin = authCheck.user;

    const { userId, action, reason } = await req.json();

    if (!userId || !action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { ok: false, error: "userId dan action ('approve' | 'reject') wajib diisi." },
        { status: 400 }
      );
    }

    const user = dbStore.state.profiles.find((p) => p.id === userId);
    if (!user) {
      return NextResponse.json({ ok: false, error: "Pengguna tidak ditemukan." }, { status: 404 });
    }

    if (action === "approve") {
      user.verification_status = "approved";
      user.rejection_reason = undefined;

      // Dual Approval: Also approve all pending payment transactions for this user
      if (dbStore.state.payments) {
        const userPayments = dbStore.state.payments.filter((p) => p.user_id === user.id);
        for (const p of userPayments) {
          if (p.status === "pending") {
            p.status = "approved";
            p.updated_at = new Date().toISOString();
            if (p.plan) {
              user.plan = p.plan;
            }
          }
        }
      }

      // Ensure user has at least one default wallet with strictly Rp0 balance
      const userWallets = dbStore.state.wallets.filter((w) => w.user_id === user.id);
      if (userWallets.length === 0) {
        const defaultWallet: Wallet = {
          id: `w-${Date.now()}-1`,
          user_id: user.id,
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
        // Enforce strictly Rp0 initial balance invariant
        userWallets.forEach((w) => {
          if (w.balance !== 0) w.balance = 0;
        });
      }

      // Ensure user has default categories if missing
      const userCategories = dbStore.state.categories.filter((c) => c.user_id === user.id);
      if (userCategories.length === 0) {
        const initialCategories: Category[] = [
          { id: `c-${Date.now()}-1`, user_id: user.id, name: "Makanan & Minuman", type: "expense", emoji: "🍜", color: "#F97316", is_system: true, created_at: new Date().toISOString() },
          { id: `c-${Date.now()}-2`, user_id: user.id, name: "Transportasi", type: "expense", emoji: "🚗", color: "#3B82F6", is_system: true, created_at: new Date().toISOString() },
          { id: `c-${Date.now()}-3`, user_id: user.id, name: "Tagihan & Kos", type: "expense", emoji: "🏠", color: "#10B981", is_system: true, created_at: new Date().toISOString() },
          { id: `c-${Date.now()}-4`, user_id: user.id, name: "Belanja & Pulsa", type: "expense", emoji: "👕", color: "#EC4899", is_system: true, created_at: new Date().toISOString() },
          { id: `c-${Date.now()}-5`, user_id: user.id, name: "Hiburan & Hobi", type: "expense", emoji: "🎮", color: "#8B5CF6", is_system: true, created_at: new Date().toISOString() },
          { id: `c-${Date.now()}-6`, user_id: user.id, name: "Gaji Pokok", type: "income", emoji: "💰", color: "#10B981", is_system: true, created_at: new Date().toISOString() },
        ];
        dbStore.state.categories.push(...initialCategories);
      }

      // Sync active session status in memory store
      if (dbStore.state.sessions) {
        for (const token in dbStore.state.sessions) {
          if (dbStore.state.sessions[token].userId === user.id) {
            dbStore.state.sessions[token].verificationStatus = "approved";
          }
        }
      }
    } else {
      user.verification_status = "rejected";
      user.rejection_reason = reason?.trim() || "Pendaftaran tidak disetujui oleh Administrator.";

      // Also mark pending payments as rejected
      if (dbStore.state.payments) {
        const userPayments = dbStore.state.payments.filter((p) => p.user_id === user.id && p.status === "pending");
        for (const p of userPayments) {
          p.status = "rejected";
          p.updated_at = new Date().toISOString();
        }
      }

      // Sync active session status in memory store
      if (dbStore.state.sessions) {
        for (const token in dbStore.state.sessions) {
          if (dbStore.state.sessions[token].userId === user.id) {
            dbStore.state.sessions[token].verificationStatus = "rejected";
          }
        }
      }
    }

    user.updated_at = new Date().toISOString();

    // Log admin action into audit logs
    const log: AuditLog = {
      id: `aud-${Date.now()}`,
      admin_id: admin.id,
      admin_email: admin.email || "superadmin@tatadana.id",
      target_user_id: userId,
      action: action === "approve" ? "approve_user" : "reject_user",
      reason: reason?.trim() || (action === "approve" ? "Admin menyetujui pendaftaran akun" : "Admin menolak pendaftaran akun"),
      created_at: new Date().toISOString(),
    };
    dbStore.state.auditLogs.unshift(log);

    const { password_hash, ...safeUser } = user;
    return NextResponse.json({
      ok: true,
      message: action === "approve" ? "Akun berhasil disetujui." : "Pendaftaran akun berhasil ditolak.",
      data: safeUser,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
