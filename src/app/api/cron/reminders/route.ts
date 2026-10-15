import { NextRequest, NextResponse } from "next/server";
import { dbStore } from "@/lib/storage/store";
import { formatDailyReminder } from "@/lib/telegram/formatter";

export async function GET(req: NextRequest) {
  try {
    const activeReminders = dbStore.state.reminders.filter((r) => r.is_enabled);
    const reminderMsg = formatDailyReminder();
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    const dispatchResults: Array<{ userId: string; telegramId?: string; ok: boolean; error?: string; simulated?: boolean }> = [];

    for (const rem of activeReminders) {
      const user = dbStore.state.profiles.find((p) => p.id === rem.user_id);
      if (user && user.telegram_id) {
        if (botToken && !botToken.startsWith("demo_") && botToken !== "your_telegram_bot_token_from_botfather") {
          try {
            const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: user.telegram_id,
                text: reminderMsg,
              }),
            });
            const data = await res.json();
            dispatchResults.push({ userId: user.id, telegramId: user.telegram_id, ok: data.ok, error: data.description });
          } catch (e: any) {
            dispatchResults.push({ userId: user.id, telegramId: user.telegram_id, ok: false, error: e.message });
          }
        } else {
          dispatchResults.push({ userId: user.id, telegramId: user.telegram_id, ok: true, simulated: true });
        }
      }
    }

    return NextResponse.json({
      ok: true,
      remindersEvaluated: activeReminders.length,
      dispatched: dispatchResults,
      messageTemplate: reminderMsg,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
