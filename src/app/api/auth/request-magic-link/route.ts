import { NextRequest, NextResponse } from "next/server";
import { dbStore, createMagicLoginToken } from "@/lib/storage/store";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !String(email).trim()) {
      return NextResponse.json(
        { ok: false, error: "Alamat email wajib diisi." },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const user = dbStore.state.profiles.find((p) => p.email?.toLowerCase().trim() === cleanEmail);

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Alamat email tidak terdaftar di sistem kami." },
        { status: 404 }
      );
    }

    const isApproved = user.verification_status === "approved" || user.is_superadmin === true;

    if (!isApproved) {
      if (user.verification_status === "rejected") {
        return NextResponse.json(
          {
            ok: false,
            error: `Pendaftaran akun Anda ditolak oleh Administrator: ${user.rejection_reason || "Tidak memenuhi kriteria"}`,
            status: "rejected",
          },
          { status: 403 }
        );
      }
      return NextResponse.json(
        {
          ok: false,
          error: "Akun Anda masih dalam status Menunggu Verifikasi oleh Administrator. Tautan masuk akan tersedia setelah disetujui.",
          status: "pending",
        },
        { status: 403 }
      );
    }

    // Generate secure one-time token
    const { token, expiresAt } = createMagicLoginToken(user.id, cleanEmail);

    // Build URL from request origin
    const origin = req.nextUrl.origin || "http://localhost:3000";
    const magicLink = `${origin}/api/auth/magic-login?token=${token}`;

    return NextResponse.json({
      ok: true,
      message: "Tautan masuk satu kali pakai berhasil dibuat.",
      magicLink,
      expiresAt,
      token,
      email: cleanEmail,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
