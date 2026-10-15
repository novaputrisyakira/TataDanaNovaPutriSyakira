import { NextRequest, NextResponse } from "next/server";
import { dbStore } from "@/lib/storage/store";
import { requireUser } from "@/lib/auth/session";
import { canCreateTransaction } from "@/lib/utils/plan-limits";
import { Transaction } from "@/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const userAuth = await requireUser(req);
    if (userAuth instanceof NextResponse) return userAuth;
    const targetUserId = userAuth.user.id;

    const url = new URL(req.url);
    const categoryId = url.searchParams.get("categoryId");
    const walletId = url.searchParams.get("walletId");
    const type = url.searchParams.get("type");
    const search = url.searchParams.get("search")?.toLowerCase();
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");

    let txs = dbStore.state.transactions.filter((t) => t.user_id === targetUserId);

    if (categoryId) txs = txs.filter((t) => t.category_id === categoryId);
    if (walletId) txs = txs.filter((t) => t.wallet_id === walletId);
    if (type) txs = txs.filter((t) => t.type === type);
    if (search) txs = txs.filter((t) => t.description.toLowerCase().includes(search));
    if (startDate) txs = txs.filter((t) => t.transaction_date.split("T")[0] >= startDate);
    if (endDate) txs = txs.filter((t) => t.transaction_date.split("T")[0] <= endDate);

    // Sort descending by date
    txs.sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());

    return NextResponse.json({ ok: true, data: txs });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userAuth = await requireUser(req);
    if (userAuth instanceof NextResponse) return userAuth;
    const targetUserId = userAuth.user.id;
    const profile = userAuth.user;

    const body = await req.json();
    const {
      walletId,
      toWalletId,
      categoryId,
      type,
      amount,
      description,
      source = "web",
      transactionDate = new Date().toISOString(),
    } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ ok: false, error: "Nominal tidak valid" }, { status: 400 });
    }

    const curMonthPrefix = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
    const thisMonthTxCount = dbStore.state.transactions.filter(
      (t) => t.user_id === targetUserId && t.transaction_date.startsWith(curMonthPrefix)
    ).length;

    const limitCheck = canCreateTransaction(profile.plan, thisMonthTxCount);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { ok: false, error: limitCheck.message || "Batas transaksi bulanan telah tercapai" },
        { status: 403 }
      );
    }

    const wallet = dbStore.state.wallets.find((w) => w.id === walletId && w.user_id === targetUserId);
    if (!wallet) {
      return NextResponse.json({ ok: false, error: "Dompet tidak ditemukan" }, { status: 404 });
    }

    // Sync wallet balance
    if (type === "expense") {
      wallet.balance -= amount;
    } else if (type === "income") {
      wallet.balance += amount;
    } else if (type === "transfer") {
      const toWallet = dbStore.state.wallets.find((w) => w.id === toWalletId && w.user_id === targetUserId);
      if (!toWallet) {
        return NextResponse.json({ ok: false, error: "Dompet tujuan transfer tidak ditemukan" }, { status: 404 });
      }
      wallet.balance -= amount;
      toWallet.balance += amount;
    }

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      user_id: targetUserId,
      wallet_id: walletId,
      to_wallet_id: toWalletId,
      category_id: categoryId,
      type,
      amount,
      description,
      source,
      transaction_date: transactionDate,
      created_at: new Date().toISOString(),
    };

    dbStore.state.transactions.unshift(newTx);

    return NextResponse.json({ ok: true, data: newTx });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userAuth = await requireUser(req);
    if (userAuth instanceof NextResponse) return userAuth;
    const targetUserId = userAuth.user.id;

    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    const idx = dbStore.state.transactions.findIndex((t) => t.id === id);
    if (idx === -1) {
      return NextResponse.json({ ok: false, error: "Transaksi tidak ditemukan" }, { status: 404 });
    }

    const oldTx = dbStore.state.transactions[idx];

    // Check ownership
    if (oldTx.user_id !== targetUserId) {
      return NextResponse.json(
        { ok: false, error: "Akses ditolak: Tidak dapat menghapus transaksi milik akun lain." },
        { status: 403 }
      );
    }

    const wallet = dbStore.state.wallets.find((w) => w.id === oldTx.wallet_id && w.user_id === targetUserId);

    // Reverse balance update
    if (wallet) {
      if (oldTx.type === "expense") {
        wallet.balance += oldTx.amount;
      } else if (oldTx.type === "income") {
        wallet.balance -= oldTx.amount;
      } else if (oldTx.type === "transfer" && oldTx.to_wallet_id) {
        wallet.balance += oldTx.amount;
        const toWallet = dbStore.state.wallets.find((w) => w.id === oldTx.to_wallet_id && w.user_id === targetUserId);
        if (toWallet) toWallet.balance -= oldTx.amount;
      }
    }

    dbStore.state.transactions.splice(idx, 1);
    return NextResponse.json({ ok: true, message: "Transaksi berhasil dihapus" });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
