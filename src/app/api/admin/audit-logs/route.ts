import { NextRequest, NextResponse } from "next/server";
import { dbStore } from "@/lib/storage/store";
import { requireAdmin } from "@/lib/auth/session";
import { AuditLog } from "@/types";

export async function GET(req: NextRequest) {
  const authCheck = await requireAdmin(req);
  if (authCheck instanceof NextResponse) return authCheck;

  return NextResponse.json({ ok: true, data: dbStore.state.auditLogs });
}

export async function POST(req: NextRequest) {
  const authCheck = await requireAdmin(req);
  if (authCheck instanceof NextResponse) return authCheck;
  const admin = authCheck.user;

  try {
    const { targetUserId, action, reason } = await req.json();

    if (!reason || !reason.trim()) {
      return NextResponse.json(
        { ok: false, error: "Alasan audit wajib diisi demi menjaga privasi data pengguna." },
        { status: 400 }
      );
    }

    const log: AuditLog = {
      id: `aud-${Date.now()}`,
      admin_id: admin.id,
      admin_email: admin.email || "superadmin@tatadana.id",
      target_user_id: targetUserId,
      action: action || "view_transactions",
      reason: reason.trim(),
      created_at: new Date().toISOString(),
    };

    dbStore.state.auditLogs.unshift(log);

    // Return user's transactions now that reason was legally logged
    const userTransactions = dbStore.state.transactions.filter((t) => t.user_id === targetUserId);

    return NextResponse.json({
      ok: true,
      log,
      transactions: userTransactions,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
