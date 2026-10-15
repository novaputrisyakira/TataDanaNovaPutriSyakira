import { NextRequest, NextResponse } from "next/server";
import { processTelegramMessage } from "@/lib/telegram/bot-engine";
import { dbStore } from "@/lib/storage/store";

async function resolveTelegramFileUrl(botToken?: string, fileId?: string): Promise<string | undefined> {
  const token = botToken || process.env.TELEGRAM_BOT_TOKEN || "8589951302:AAGR4pvpSK2JIUwXdMolwzBX9BMMHQhdcaY";
  if (!token || !fileId || token.startsWith("demo_") || token === "your_telegram_bot_token_from_botfather") {
    return undefined;
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
    const data = await res.json();
    if (data.ok && data.result?.file_path) {
      return `https://api.telegram.org/file/bot${token}/${data.result.file_path}`;
    }
  } catch (e) {
    console.error("Failed to resolve Telegram file path:", e);
  }
  return undefined;
}

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();

    if (!update || !update.update_id) {
      return NextResponse.json({ ok: false, error: "Invalid Telegram payload" }, { status: 400 });
    }

    const updateId = update.update_id;

    // Idempotency check: skip already processed updates
    const alreadyProcessed = dbStore.state.telegramUpdates.some((u) => u.update_id === updateId);
    if (alreadyProcessed) {
      return NextResponse.json({ ok: true, note: "Already processed (idempotent)" });
    }

    // Mark as processed
    dbStore.state.telegramUpdates.push({
      update_id: updateId,
      processed_at: new Date().toISOString(),
    });

    const msg = update.message || update.edited_message;
    if (!msg || !msg.from) {
      return NextResponse.json({ ok: true, note: "Ignored non-message event" });
    }

    const telegramUserId = String(msg.from.id);
    const telegramUsername = msg.from.username;
    const text = msg.text || msg.caption || msg.contact?.phone_number;
    const photo = msg.photo ? msg.photo[msg.photo.length - 1]?.file_id : undefined;
    const voice = msg.voice ? msg.voice.file_id : undefined;
    const voiceDuration = msg.voice?.duration;

    const botToken =
      process.env.TELEGRAM_BOT_TOKEN ||
      (dbStore.state.profiles[0] as any)?.custom_bot_token ||
      "8589951302:AAGR4pvpSK2JIUwXdMolwzBX9BMMHQhdcaY";
    const photoUrl = photo ? await resolveTelegramFileUrl(botToken, photo) : undefined;
    const voiceUrl = voice ? await resolveTelegramFileUrl(botToken, voice) : undefined;

    // Process message through bot engine
    const result = await processTelegramMessage({
      telegramUserId,
      telegramUsername,
      text,
      photoUrl,
      voiceUrl,
      voiceDuration,
    });

    // Send reply back to Telegram API
    if (botToken && !botToken.startsWith("demo_") && botToken !== "your_telegram_bot_token_from_botfather") {
      try {
        const sendRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: msg.chat.id,
            text: result.replyText,
          }),
        });
        const sendData = await sendRes.json();
        if (!sendData.ok) {
          console.warn("Telegram sendMessage warning:", sendData.description);
        }
      } catch (sendErr) {
        console.error("Failed to forward reply to Telegram API:", sendErr);
      }
    }

    return NextResponse.json({
      ok: true,
      result: result.replyText,
      status: result.status,
    });
  } catch (err: any) {
    console.error("Telegram Webhook Error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
