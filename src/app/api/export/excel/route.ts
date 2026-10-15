import { NextRequest, NextResponse } from "next/server";
import { generateFintechExcel } from "@/lib/export/excel-generator";
import { dbStore } from "@/lib/storage/store";
import { requireUser } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    const userAuth = await requireUser(req);
    if (userAuth instanceof NextResponse) return userAuth;
    const userId = userAuth.user.id;

    const body = await req.json().catch(() => ({}));
    const periodStart = body.periodStart || new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
    const periodEnd = body.periodEnd || new Date().toISOString().split("T")[0];

    const profile = userAuth.user;

    // Enforce Pro plan for exports
    if (profile.plan !== "pro") {
      return NextResponse.json(
        {
          error: "Fitur Export Excel (.xlsx) hanya tersedia untuk pengguna Pro.",
          code: "PRO_REQUIRED",
        },
        { status: 403 }
      );
    }

    const userTransactions = dbStore.state.transactions.filter((tx) => {
      if (tx.user_id !== userId) return false;
      const txDate = tx.transaction_date.split("T")[0];
      return txDate >= periodStart && txDate <= periodEnd;
    });

    const userCategories = dbStore.state.categories.filter((c) => c.user_id === userId);
    const userWallets = dbStore.state.wallets.filter((w) => w.user_id === userId);

    const excelBuffer = await generateFintechExcel({
      userName: profile.full_name,
      periodStart,
      periodEnd,
      transactions: userTransactions,
      categories: userCategories,
      wallets: userWallets,
    });

    const fileName = `TataDana-Laporan-${periodStart}_sd_${periodEnd}.xlsx`;
    const exportId = `exp-xl-${Date.now()}`;
    const exportItem = {
      id: exportId,
      user_id: userId,
      format: "excel" as const,
      period_start: periodStart,
      period_end: periodEnd,
      file_path: `${userId}/${fileName}`,
      file_name: fileName,
      file_size_bytes: excelBuffer.length,
      download_url: `/api/export/excel?id=${exportId}&userId=${userId}`,
      created_at: new Date().toISOString(),
    };
    dbStore.state.exportHistory.unshift(exportItem);

    return new NextResponse(Buffer.from(excelBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": excelBuffer.length.toString(),
      },
    });
  } catch (err: any) {
    console.error("Excel Export Error:", err);
    return NextResponse.json({ error: err.message || "Gagal membuat Excel" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json(
        { ok: false, error: "Autentikasi diperlukan. Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const userId = session.isAdmin && url.searchParams.get("userId") ? url.searchParams.get("userId")! : session.user.id;
    const profile = dbStore.state.profiles.find((p) => p.id === userId);

    if (!profile) {
      return NextResponse.json({ ok: false, error: "Profil tidak ditemukan" }, { status: 404 });
    }

    if (profile.plan !== "pro" && !session.isAdmin) {
      return NextResponse.json(
        { error: "Fitur Export Excel (.xlsx) hanya tersedia untuk pengguna Pro.", code: "PRO_REQUIRED" },
        { status: 403 }
      );
    }

    const now = new Date();
    const periodEnd = now.toISOString().split("T")[0];
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];

    const userTransactions = dbStore.state.transactions.filter((tx) => tx.user_id === userId);
    const userCategories = dbStore.state.categories.filter((c) => c.user_id === userId);
    const userWallets = dbStore.state.wallets.filter((w) => w.user_id === userId);

    const excelBuffer = await generateFintechExcel({
      userName: profile.full_name,
      periodStart,
      periodEnd,
      transactions: userTransactions,
      categories: userCategories,
      wallets: userWallets,
    });

    const fileName = `TataDana-Laporan-${periodStart}_sd_${periodEnd}.xlsx`;
    return new NextResponse(Buffer.from(excelBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": excelBuffer.length.toString(),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal membuat Excel" }, { status: 500 });
  }
}
