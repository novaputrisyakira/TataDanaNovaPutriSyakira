import { NextRequest, NextResponse } from "next/server";
import { processTelegramMessage } from "@/lib/telegram/bot-engine";
import { dbStore } from "@/lib/storage/store";
import { getSessionUser } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json(
        { ok: false, error: "Silakan login terlebih dahulu untuk menggunakan asisten keuangan." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      message,
      userId,
      photoUrl,
      voiceUrl,
      voiceDuration,
    } = body;

    // Only admin can simulate on behalf of another user; regular users are strictly bound to their own session
    const targetUserId = session.isAdmin && userId ? userId : session.user.id;
    const profile = dbStore.state.profiles.find((p) => p.id === targetUserId);

    if (!profile) {
      return NextResponse.json(
        { ok: false, error: "Profil pengguna tidak ditemukan." },
        { status: 404 }
      );
    }

    const telegramUserId = profile.telegram_id || `sim-${profile.id}`;

    const result = await processTelegramMessage({
      telegramUserId,
      telegramUsername: profile.telegram_username,
      text: message,
      photoUrl,
      voiceUrl,
      voiceDuration,
      userId: targetUserId,
    });

    return NextResponse.json({
      ok: true,
      reply: result.replyText,
      transaction: result.transactionCreated,
      status: result.status,
      interactiveType: result.interactiveType,
      interactiveOptions: result.interactiveOptions,
      updatedProfile: result.updatedProfile,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err.message,
      },
      { status: 500 }
    );
  }
}
