import { NextRequest, NextResponse } from "next/server";
import { dbStore } from "@/lib/storage/store";
import { requireUser } from "@/lib/auth/session";
import { canCreateBudget } from "@/lib/utils/plan-limits";
import { Budget } from "@/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const userAuth = await requireUser(req);
  if (userAuth instanceof NextResponse) return userAuth;
  const targetUserId = userAuth.user.id;

  const budgets = dbStore.state.budgets.filter((b) => b.user_id === targetUserId);
  return NextResponse.json({ ok: true, data: budgets });
}

export async function POST(req: NextRequest) {
  try {
    const userAuth = await requireUser(req);
    if (userAuth instanceof NextResponse) return userAuth;
    const targetUserId = userAuth.user.id;
    const profile = userAuth.user;

    const { categoryId, amount, month, year } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ ok: false, error: "Nominal budget tidak valid" }, { status: 400 });
    }

    const userBudgets = dbStore.state.budgets.filter((b) => b.user_id === targetUserId);

    // Check existing
    const existing = userBudgets.find((b) => b.category_id === categoryId && b.month === month && b.year === year);
    if (existing) {
      existing.amount = amount;
      existing.updated_at = new Date().toISOString();
      return NextResponse.json({ ok: true, data: existing });
    }

    const check = canCreateBudget(profile.plan, userBudgets.length);
    if (!check.allowed) {
      return NextResponse.json({ ok: false, error: check.message }, { status: 403 });
    }

    const newBudget: Budget = {
      id: `b-${Date.now()}`,
      user_id: targetUserId,
      category_id: categoryId,
      amount,
      month: month || new Date().getMonth() + 1,
      year: year || new Date().getFullYear(),
      alert_80_sent: false,
      alert_100_sent: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    dbStore.state.budgets.push(newBudget);
    return NextResponse.json({ ok: true, data: newBudget });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
