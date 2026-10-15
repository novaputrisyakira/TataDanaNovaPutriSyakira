import { NextRequest, NextResponse } from "next/server";
import { dbStore } from "@/lib/storage/store";
import { requireUser } from "@/lib/auth/session";
import { Category } from "@/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const userAuth = await requireUser(req);
  if (userAuth instanceof NextResponse) return userAuth;
  const targetUserId = userAuth.user.id;

  const categories = dbStore.state.categories.filter((c) => c.user_id === targetUserId);
  return NextResponse.json({ ok: true, data: categories });
}

export async function POST(req: NextRequest) {
  try {
    const userAuth = await requireUser(req);
    if (userAuth instanceof NextResponse) return userAuth;
    const targetUserId = userAuth.user.id;

    const { name, type = "expense", emoji = "🏷️", color = "#F97316" } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json({ ok: false, error: "Nama kategori wajib diisi" }, { status: 400 });
    }

    const newCat: Category = {
      id: `c-${Date.now()}`,
      user_id: targetUserId,
      name: name.trim(),
      type,
      emoji,
      color,
      is_system: false,
      created_at: new Date().toISOString(),
    };

    dbStore.state.categories.push(newCat);
    return NextResponse.json({ ok: true, data: newCat });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
