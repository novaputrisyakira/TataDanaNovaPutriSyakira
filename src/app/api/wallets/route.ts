import { NextRequest, NextResponse } from "next/server";
import { dbStore } from "@/lib/storage/store";
import { requireUser } from "@/lib/auth/session";
import { canCreateWallet } from "@/lib/utils/plan-limits";
import { Wallet } from "@/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const userAuth = await requireUser(req);
  if (userAuth instanceof NextResponse) return userAuth;
  const targetUserId = userAuth.user.id;

  const wallets = dbStore.state.wallets.filter((w) => w.user_id === targetUserId);
  return NextResponse.json({ ok: true, data: wallets });
}

export async function POST(req: NextRequest) {
  try {
    const userAuth = await requireUser(req);
    if (userAuth instanceof NextResponse) return userAuth;
    const targetUserId = userAuth.user.id;
    const profile = userAuth.user;

    const { name, type = "bank", balance = 0, color = "#F97316", icon = "💳", isDefault = false } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json({ ok: false, error: "Nama dompet wajib diisi" }, { status: 400 });
    }

    const userWallets = dbStore.state.wallets.filter((w) => w.user_id === targetUserId);
    const check = canCreateWallet(profile.plan, userWallets.length);
    if (!check.allowed) {
      return NextResponse.json({ ok: false, error: check.message }, { status: 403 });
    }

    if (isDefault) {
      userWallets.forEach((w) => (w.is_default = false));
    }

    const newWallet: Wallet = {
      id: `w-${Date.now()}`,
      user_id: targetUserId,
      name: name.trim(),
      type,
      balance: parseInt(balance, 10) || 0,
      color,
      icon,
      is_default: isDefault || userWallets.length === 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    dbStore.state.wallets.push(newWallet);
    return NextResponse.json({ ok: true, data: newWallet });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const userAuth = await requireUser(req);
    if (userAuth instanceof NextResponse) return userAuth;
    const targetUserId = userAuth.user.id;

    const { id, isDefault, name, balance, color, icon } = await req.json();
    const wallet = dbStore.state.wallets.find((w) => w.id === id);
    if (!wallet) return NextResponse.json({ ok: false, error: "Dompet tidak ditemukan" }, { status: 404 });

    if (wallet.user_id !== targetUserId) {
      return NextResponse.json({ ok: false, error: "Akses ditolak: Tidak dapat mengubah dompet milik akun lain." }, { status: 403 });
    }

    if (isDefault) {
      dbStore.state.wallets
        .filter((w) => w.user_id === wallet.user_id)
        .forEach((w) => (w.is_default = false));
      wallet.is_default = true;
    }

    if (name) wallet.name = name.trim();
    if (balance !== undefined) wallet.balance = balance;
    if (color) wallet.color = color;
    if (icon) wallet.icon = icon;
    wallet.updated_at = new Date().toISOString();

    return NextResponse.json({ ok: true, data: wallet });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
