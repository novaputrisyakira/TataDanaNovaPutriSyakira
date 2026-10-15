import { NextRequest, NextResponse } from "next/server";
import { dbStore } from "@/lib/storage/store";
import { requireAdmin } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  const authCheck = await requireAdmin(req);
  if (authCheck instanceof NextResponse) return authCheck;

  try {
    const url = new URL(req.url);
    const format = url.searchParams.get("format") || "json";

    if (format === "csv") {
      let csv = "ID_User,Nama_Lengkap,Email,Nomor_HP,Plan,Telegram_Username,Total_Transaksi,Tanggal_Daftar\n";
      dbStore.state.profiles.forEach((p) => {
        const txCount = dbStore.state.transactions.filter((t) => t.user_id === p.id).length;
        csv += `"${p.id}","${p.full_name}","${p.email || ""}","${p.phone_number || ""}","${p.plan}","${p.telegram_username || ""}","${txCount}","${p.created_at}"\n`;
      });

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": 'attachment; filename="TataDana-Semua-Pengguna.csv"',
        },
      });
    }

    const safeUsers = dbStore.state.profiles.map((p) => {
      const { password_hash, ...safe } = p;
      return safe;
    });

    const payload = {
      exportedAt: new Date().toISOString(),
      totalUsers: safeUsers.length,
      users: safeUsers,
      transactionsCount: dbStore.state.transactions.length,
      paymentsCount: dbStore.state.payments.length,
    };

    return NextResponse.json({ ok: true, data: payload });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
