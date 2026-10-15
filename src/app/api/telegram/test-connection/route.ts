import { NextRequest, NextResponse } from "next/server";
import { dbStore } from "@/lib/storage/store";
import { getSessionUser } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json(
        { ok: false, error: "Autentikasi diperlukan. Silakan login terlebih dahulu.", status: "disconnected" },
        { status: 401 }
      );
    }

    const { token, userId } = await req.json();
    const targetUserId = session.isAdmin && userId ? userId : session.user.id;

    if (!token || typeof token !== "string" || token.trim().length < 15) {
      return NextResponse.json(
        {
          ok: false,
          error: "Token Telegram tidak valid. Format token harus berasal dari @BotFather.",
          status: "disconnected",
        },
        { status: 400 }
      );
    }

    const cleanToken = token.trim();

    // Check if token is used by another user
    const otherUserHasToken = dbStore.state.profiles.some(
      (p) => p.id !== targetUserId && (p as any).custom_bot_token === cleanToken
    );
    if (otherUserHasToken) {
      return NextResponse.json(
        {
          ok: false,
          error: "Token bot ini sudah digunakan oleh akun lain.",
          status: "disconnected",
        },
        { status: 400 }
      );
    }

    // Special handling for offline demo / local test token
    if (cleanToken.startsWith("demo_") || cleanToken === "123456789:ABCdefGHIjklMNOpqrsTUVwxyz") {
      const profile = dbStore.state.profiles.find((p) => p.id === targetUserId);
      if (profile) {
        profile.telegram_username = "tatadana_demo_bot";
        profile.telegram_connected_at = new Date().toISOString();
        (profile as any).custom_bot_token = cleanToken;
      }

      return NextResponse.json({
        ok: true,
        botUsername: "tatadana_demo_bot",
        botFirstName: "TataDana Demo Bot",
        webhookSet: true,
        webhookUrl: `${process.env.WEBHOOK_BASE_URL || "http://localhost:3000"}/api/telegram/webhook`,
        message: "Bot berhasil terhubung dan Webhook aktif (Mode Simulasi)!",
        status: "connected",
      });
    }

    // Step 1: Call getMe on Telegram API
    const getMeRes = await fetch(`https://api.telegram.org/bot${cleanToken}/getMe`, {
      method: "GET",
    });

    const getMeData = await getMeRes.json();
    if (!getMeData.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: `Telegram API Error: ${getMeData.description || "Token tidak valid"}`,
          status: "disconnected",
        },
        { status: 400 }
      );
    }

    const botInfo = getMeData.result;

    // Step 2: Call setWebhook to register our backend URL
    const baseUrl = process.env.WEBHOOK_BASE_URL || "https://2ae25d691f31c5.lhr.life";
    const webhookUrl = `${baseUrl}/api/telegram/webhook`;

    let webhookSuccess = true;
    let webhookMsg = "Webhook berhasil dipasang.";

    // Only set real webhook if base URL is HTTPS (Telegram requires HTTPS for webhooks)
    if (baseUrl.startsWith("https://")) {
      const setWebhookRes = await fetch(
        `https://api.telegram.org/bot${cleanToken}/setWebhook?url=${encodeURIComponent(webhookUrl)}`,
        { method: "POST" }
      );
      const webhookData = await setWebhookRes.json();
      webhookSuccess = webhookData.ok;
      webhookMsg = webhookData.description || webhookMsg;
    } else {
      webhookMsg = "Webhook URL saat ini localhost (HTTP). Telegram membutuhkan HTTPS publik untuk live webhook, tetapi simulasi bot lokal tetap aktif 100%.";
    }

    // Step 3: Save to profile
    const profile = dbStore.state.profiles.find((p) => p.id === targetUserId);
    if (profile) {
      profile.telegram_username = botInfo.username;
      profile.telegram_connected_at = new Date().toISOString();
      (profile as any).custom_bot_token = cleanToken;
    }

    return NextResponse.json({
      ok: true,
      botUsername: botInfo.username,
      botFirstName: botInfo.first_name,
      webhookSet: webhookSuccess,
      webhookUrl,
      message: webhookMsg,
      status: "connected",
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: `Gagal menghubungkan bot: ${err.message}`,
        status: "disconnected",
      },
      { status: 500 }
    );
  }
}
