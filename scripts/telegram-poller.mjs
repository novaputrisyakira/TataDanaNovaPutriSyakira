/**
 * Telegram Long-Polling Worker for TataDana Localhost
 * Receives messages directly from Telegram Bot API and forwards to http://localhost:3000/api/telegram/webhook
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8589951302:AAGR4pvpSK2JIUwXdMolwzBX9BMMHQhdcaY";
const LOCAL_WEBHOOK_URL = "http://localhost:3000/api/telegram/webhook";

console.log(`[Telegram Poller] Inisialisasi Bot Poller untuk token: ${BOT_TOKEN.slice(0, 10)}...`);

async function init() {
  // Step 1: Verify getMe
  try {
    const meRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`);
    const meData = await meRes.json();
    if (meData.ok) {
      console.log(`[Telegram Poller] 🟢 Bot terverifikasi: @${meData.result.username} (${meData.result.first_name})`);
    } else {
      console.error(`[Telegram Poller] 🔴 Gagal verifikasi bot:`, meData.description);
      return;
    }
  } catch (e) {
    console.error(`[Telegram Poller] Gagal menghubungi Telegram API:`, e.message);
  }

  // Step 2: Delete existing webhook so getUpdates is allowed
  try {
    const delRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook?drop_pending_updates=false`);
    const delData = await delRes.json();
    console.log(`[Telegram Poller] 🧹 Webhook di-clear untuk mode polling lokal:`, delData.description || delData.ok);
  } catch (e) {
    console.error(`[Telegram Poller] Error clearing webhook:`, e.message);
  }

  console.log(`[Telegram Poller] 🚀 Poller siap! Mendengarkan pesan dari Telegram ke ${LOCAL_WEBHOOK_URL}...`);

  let offset = 0;

  while (true) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=${offset}&timeout=25`, {
        signal: AbortSignal.timeout(30000),
      });
      const data = await res.json();

      if (data.ok && Array.isArray(data.result)) {
        for (const update of data.result) {
          offset = update.update_id + 1;
          const msg = update.message || update.edited_message;
          const sender = msg?.from?.username || msg?.from?.first_name || "User";
          const text = msg?.text || (msg?.photo ? "[Foto]" : msg?.voice ? "[Voice Note]" : "[Pesan]");
          console.log(`[Telegram Poller] 📩 Pesan baru dari ${sender}: "${text}"`);

          try {
            const forwardRes = await fetch(LOCAL_WEBHOOK_URL, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(update),
            });
            const forwardData = await forwardRes.json();
            console.log(`[Telegram Poller] 📤 Status proses: ${forwardData.status || (forwardData.ok ? "sukses" : "gagal")}`);
          } catch (fErr) {
            console.error(`[Telegram Poller] Gagal meneruskan ke localhost:`, fErr.message);
          }
        }
      } else if (!data.ok) {
        console.warn(`[Telegram Poller] Telegram API response not ok:`, data.description);
        await new Promise((r) => setTimeout(r, 3000));
      }
    } catch (err) {
      if (err.name !== "TimeoutError") {
        console.error(`[Telegram Poller] Polling error:`, err.message);
      }
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
}

init();
