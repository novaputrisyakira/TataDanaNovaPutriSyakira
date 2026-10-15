import { dbStore, DEFAULT_USER_ID } from "@/lib/storage/store";
import { parseTransactionWithAI, parseReceiptWithAI, transcribeVoiceNoteWithAI } from "@/lib/ai/providers";
import { formatExpenseReply, formatIncomeReply, formatAIAdvisorMessage, generateAsciiProgressBar } from "./formatter";
import { formatRupiah } from "@/lib/utils/currency";
import { canCreateTransaction } from "@/lib/utils/plan-limits";
import { Transaction, Profile, Wallet, Category, Budget } from "@/types";

export interface InteractiveOption {
  id: string;
  label: string;
  emoji?: string;
  description?: string;
  actionPayload?: string;
}

export interface BotProcessResult {
  replyText: string;
  transactionCreated?: Transaction;
  status: "success" | "warning" | "error" | "info";
  interactiveType?: "savings_preference" | "savings_custom" | "savings_goal" | "savings_goal_custom";
  interactiveOptions?: InteractiveOption[];
  updatedProfile?: Partial<Profile>;
}

export const STORAGE_OPTIONS: InteractiveOption[] = [
  { id: "opt-bank", label: "Rekening bank", emoji: "🏦", description: "BCA, Mandiri, BRI, BNI (Aman dijamin LPS)" },
  { id: "opt-ewallet", label: "Dompet digital (e-wallet)", emoji: "📱", description: "GoPay, OVO, DANA, ShopeePay (Praktis harian)" },
  { id: "opt-cash", label: "Celengan atau uang tunai", emoji: "🪙", description: "Uang tunai fisik tanpa biaya admin bulanan" },
  { id: "opt-special", label: "Rekening tabungan khusus", emoji: "💼", description: "Tabungan terpisah tanpa kartu debit" },
  { id: "opt-deposito", label: "Deposito", emoji: "🔒", description: "Bunga lebih tinggi, dana dikunci berjangka" },
  { id: "opt-undecided", label: "Belum menentukan pilihan", emoji: "🤔", description: "Lihat penjelasan umum panduan simpan uang" },
  { id: "opt-other", label: "Lainnya", emoji: "✏️", description: "Tuliskan sendiri tempat penyimpanan pilihanmu" },
];

export const GOAL_OPTIONS: InteractiveOption[] = [
  { id: "goal-emergency", label: "Dana Darurat (Emergency Fund)", emoji: "🛡️", description: "Cadangan 3-6 bulan pengeluaran untuk situasi darurat" },
  { id: "goal-edu", label: "Pendidikan", emoji: "🎓", description: "Biaya kuliah, sekolah, atau kursus sertifikasi" },
  { id: "goal-purchase", label: "Membeli Barang / Gadget", emoji: "💻", description: "Laptop, handphone, kendaraan, atau kebutuhan primer" },
  { id: "goal-vacation", label: "Liburan & Healing", emoji: "✈️", description: "Traveling dan refreshing bersama keluarga" },
  { id: "goal-investment", label: "Investasi / Rumah Impian", emoji: "🏠", description: "DP properti atau portofolio investasi masa depan" },
  { id: "goal-other", label: "Tujuan Lainnya", emoji: "🎯", description: "Tuliskan tujuan finansial pribadimu" },
];

export async function processTelegramMessage(params: {
  telegramUserId: string;
  telegramUsername?: string;
  text?: string;
  photoUrl?: string;
  voiceUrl?: string;
  voiceDuration?: number;
  userId?: string;
}): Promise<BotProcessResult> {
  const { telegramUserId, telegramUsername, text, photoUrl, voiceUrl, voiceDuration, userId: directUserId } = params;

  // 1. Identify User Profile
  let profile = directUserId ? dbStore.state.profiles.find((p) => p.id === directUserId) : undefined;
  if (!profile) {
    profile = dbStore.state.profiles.find((p) => p.telegram_id === telegramUserId);
  }
  const isSimulator = telegramUserId === "simulator" || telegramUserId === "687123456";

  if (!profile) {
    if (isSimulator) {
      profile = dbStore.state.profiles.find((p) => p.id === DEFAULT_USER_ID) || dbStore.state.profiles[0];
    } else {
      // Check if message contains a phone number to link account
      const cleanPhone = text?.replace(/\D/g, "") || "";
      const normalizedPhone = cleanPhone.startsWith("62") ? "0" + cleanPhone.slice(2) : cleanPhone;

      if (normalizedPhone.length >= 10 && normalizedPhone.length <= 14) {
        const foundUser = dbStore.state.profiles.find((p) => {
          const userPhone = p.phone_number?.replace(/\D/g, "") || "";
          const normalizedUserPhone = userPhone.startsWith("62") ? "0" + userPhone.slice(2) : userPhone;
          return normalizedUserPhone === normalizedPhone;
        });

        if (foundUser) {
          foundUser.telegram_id = telegramUserId;
          if (telegramUsername) foundUser.telegram_username = telegramUsername;
          foundUser.telegram_connected_at = new Date().toISOString();
          return {
            replyText: `✅ Halo ${foundUser.full_name}! Akun TataDana kamu berhasil dihubungkan dengan bot Telegram ini!\n\n` +
              `Sekarang kamu bisa langsung mencatat pengeluaran & pemasukan semudah kirim pesan.\n\n` +
              `💡 Coba langsung ketik:\n• "beli bakso 15rb"\n• "gajian 5jt"\n• Ketik /saldo untuk cek saldo\n• Ketik /bantuan untuk daftar command lengkap.`,
            status: "success",
          };
        }
      }

      if (text?.trim() === "/start" || text?.trim() === "/bantuan" || text?.trim() === "/help") {
        return {
          replyText: `👋 Halo! Selamat datang di TataDana Bot (@mitawiwbot).\n\n` +
            `Bot ini terhubung langsung ke dashboard TataDana di localhost kamu!\n\n` +
            `📱 Langkah Cepat Menghubungkan Akun:\n` +
            `Ketik nomor HP akun TataDana kamu di chat ini (contoh: 081234567890).\n\n` +
            `Setelah terkirim, akun akan otomatis terhubung dan kamu bisa langsung catat keuangan lewat Telegram! 🚀`,
          status: "info",
        };
      }

      return {
        replyText: `👋 Halo! Akun Telegram ini belum terhubung dengan akun TataDana di localhost.\n\n` +
          `Untuk mulai menggunakan bot:\n` +
          `Ketikkan nomor HP akun kamu di chat ini (contoh: 081234567890) untuk menghubungkan akun secara otomatis!`,
        status: "info",
      };
    }
  }

  const userId = profile.id;
  const userWallets = dbStore.state.wallets.filter((w) => w.user_id === userId);
  const defaultWallet = userWallets.find((w) => w.is_default) || userWallets[0];

  // 2. Handle Commands
  const trimmed = text?.trim() || "";

  if (trimmed === "/start") {
    return {
      replyText: `👋 Halo ${profile.full_name}! Selamat datang di TataDana.\n\n` +
        `Catat pemasukan dan pengeluaran semudah chat WhatsApp/Telegram!\n\n` +
        `💡 Cara pakai:\n` +
        `• Ketik pengeluaran: "beli bakso 15rb" atau "kopi susu 25k"\n` +
        `• Ketik pemasukan: "gajian 5jt" atau "freelance 1.5jt"\n` +
        `• Kirim Voice Note untuk mencatat dengan suara\n` +
        `• Kirim foto struk belanjaanmu (khusus Pro)\n\n` +
        `Ketik /bantuan untuk melihat daftar command lengkap.`,
      status: "info",
    };
  }

  if (trimmed === "/bantuan" || trimmed === "/help") {
    return {
      replyText: `📖 Daftar Command TataDana:\n\n` +
        `• /tabungan — Pilihan tempat menyimpan uang & target tabungan\n` +
        `• /saldo — Cek saldo semua dompet (Cash, BCA, GoPay, dll)\n` +
        `• /hari ini — Rekap transaksi hari ini\n` +
        `• /minggu ini — Rekap pengeluaran 7 hari terakhir\n` +
        `• /bulan ini — Ringkasan keuangan bulan berjalan\n` +
        `• /budget — Pantau persentase budget per kategori\n` +
        `• /sheet — Link akses cepat data & laporan keuangan\n` +
        `• /bantuan — Tampilkan pesan ini\n\n` +
        `Ketik transaksi langsung kapan saja tanpa command!`,
      status: "info",
    };
  }

  // --- A. Handle Savings Storage & Goal Preferences ---
  const lowerTrimmed = trimmed.toLowerCase();
  const isSavingsTrigger =
    trimmed === "/tabungan" ||
    trimmed === "/simpan" ||
    trimmed === "/preferensi" ||
    lowerTrimmed === "tabungan" ||
    lowerTrimmed === "simpan uang" ||
    lowerTrimmed === "tempat simpan" ||
    lowerTrimmed === "tempat menyimpan uang" ||
    lowerTrimmed === "atur tabungan" ||
    lowerTrimmed === "preferensi tabungan" ||
    lowerTrimmed === "pilihan tempat simpan" ||
    lowerTrimmed === "pilihan tempat menyimpan uang";

  if (isSavingsTrigger) {
    const currentStorage = profile.savings_preference ? `\n\n📌 Preferensi saat ini: **${profile.savings_preference}**` : "";
    return {
      replyText: `Hai! Kamu berencana menyimpan uangmu di mana? 💰${currentStorage}\n\nSilakan pilih salah satu pilihan yang tersedia:`,
      status: "info",
      interactiveType: "savings_preference",
      interactiveOptions: STORAGE_OPTIONS,
    };
  }

  // Handle Selection of Storage Preference
  if (trimmed.startsWith("[PILIH_SIMPAN]: ") || STORAGE_OPTIONS.some((o) => o.label.toLowerCase() === lowerTrimmed)) {
    const chosenRaw = trimmed.startsWith("[PILIH_SIMPAN]: ")
      ? trimmed.replace("[PILIH_SIMPAN]: ", "").trim()
      : trimmed;

    if (chosenRaw === "Belum menentukan pilihan") {
      return {
        replyText: `💡 **Panduan Opsi Tempat Menyimpan Uang:**\n\n` +
          `1. **Rekening Bank**: Paling aman dijamin LPS (hingga 2 miliar), bunga bertahap, mudah transfer & tarik tunai ATM.\n` +
          `2. **Dompet Digital (E-Wallet)**: Sangat praktis untuk belanja/makan harian, banyak promo & cashback GoPay/OVO/DANA.\n` +
          `3. **Celengan / Uang Tunai**: Tanpa biaya admin bulanan, cocok untuk uang receh & dana pegangan cepat di rumah.\n` +
          `4. **Rekening Tabungan Khusus**: Rekening kedua tanpa kartu debit agar uang tidak gampang ditarik belanja impulsif.\n` +
          `5. **Deposito**: Imbal hasil bunga lebih tinggi dibanding tabungan reguler, dana dikunci per 1-12 bulan agar disiplin.\n\n` +
          `Setelah memahami beberapa opsi di atas, ke mana kamu ingin menyimpan uangmu?`,
        status: "info",
        interactiveType: "savings_preference",
        interactiveOptions: STORAGE_OPTIONS.filter((o) => o.label !== "Belum menentukan pilihan"),
      };
    }

    if (chosenRaw === "Lainnya") {
      return {
        replyText: `✏️ Silakan ketik nama tempat penyimpanan uang yang kamu inginkan (contoh: Reksadana Pasar Uang, Emas Fisik, Surat Berharga Negara, Koperasi, dll):`,
        status: "info",
        interactiveType: "savings_custom",
      };
    }

    // Save storage preference to profile
    profile.savings_preference = chosenRaw;
    profile.updated_at = new Date().toISOString();

    return {
      replyText: `✅ Pilihan tempat menyimpan uang kamu: **${chosenRaw}** telah berhasil disimpan ke profilmu! 🏦\n\nSelanjutnya, apa tujuan tabungan utama kamu saat ini?`,
      status: "success",
      interactiveType: "savings_goal",
      interactiveOptions: GOAL_OPTIONS,
      updatedProfile: { savings_preference: chosenRaw },
    };
  }

  // Handle Custom Storage Input
  if (trimmed.startsWith("[CUSTOM_SIMPAN]: ")) {
    const customStorage = trimmed.replace("[CUSTOM_SIMPAN]: ", "").trim();
    if (!customStorage) {
      return {
        replyText: "Mohon isi nama tempat penyimpanan uang yang kamu inginkan.",
        status: "warning",
        interactiveType: "savings_custom",
      };
    }
    profile.savings_preference = customStorage;
    profile.updated_at = new Date().toISOString();

    return {
      replyText: `✅ Tempat penyimpanan uang kustom: **${customStorage}** berhasil disimpan ke profilmu! 🏦\n\nSelanjutnya, apa tujuan tabungan utama kamu saat ini?`,
      status: "success",
      interactiveType: "savings_goal",
      interactiveOptions: GOAL_OPTIONS,
      updatedProfile: { savings_preference: customStorage },
    };
  }

  // Handle Selection of Goal Preference
  const matchedGoal = GOAL_OPTIONS.find(
    (g) => g.label.toLowerCase() === lowerTrimmed || g.label.toLowerCase().startsWith(lowerTrimmed)
  );

  if (trimmed.startsWith("[PILIH_TUJUAN]: ") || matchedGoal) {
    const chosenGoal = trimmed.startsWith("[PILIH_TUJUAN]: ")
      ? trimmed.replace("[PILIH_TUJUAN]: ", "").trim()
      : (matchedGoal ? matchedGoal.label : trimmed);

    if (chosenGoal === "Tujuan Lainnya") {
      return {
        replyText: `🎯 Silakan ketik tujuan tabungan finansialmu (contoh: Menikah, Modal Usaha, Renovasi Rumah, Beli Rumah):`,
        status: "info",
        interactiveType: "savings_goal_custom",
      };
    }

    profile.savings_goal = chosenGoal;
    profile.updated_at = new Date().toISOString();

    return {
      replyText: `🎉 **Preferensi Keuangan Berhasil Disimpan!**\n\n` +
        `├ 🏦 Tempat Menyimpan : **${profile.savings_preference || "Belum ditentukan"}**\n` +
        `└ 🎯 Tujuan Tabungan  : **${chosenGoal}**\n\n` +
        `Pilihan ini tersimpan di akun TataDana kamu dan akan tampil di dashboard. Kamu dapat mengubah preferensi kapan saja dengan mengetik /tabungan.`,
      status: "success",
      updatedProfile: { savings_preference: profile.savings_preference, savings_goal: chosenGoal },
    };
  }

  // Handle Custom Goal Input
  if (trimmed.startsWith("[CUSTOM_TUJUAN]: ")) {
    const customGoal = trimmed.replace("[CUSTOM_TUJUAN]: ", "").trim();
    if (!customGoal) {
      return {
        replyText: "Mohon isi tujuan tabungan yang kamu inginkan.",
        status: "warning",
        interactiveType: "savings_goal_custom",
      };
    }
    profile.savings_goal = customGoal;
    profile.updated_at = new Date().toISOString();

    return {
      replyText: `🎉 **Preferensi Keuangan Berhasil Disimpan!**\n\n` +
        `├ 🏦 Tempat Menyimpan : **${profile.savings_preference || "Belum ditentukan"}**\n` +
        `└ 🎯 Tujuan Tabungan  : **${customGoal}**\n\n` +
        `Pilihan ini tersimpan di akun TataDana kamu dan akan tampil di dashboard. Kamu dapat mengubah preferensi kapan saja dengan mengetik /tabungan.`,
      status: "success",
      updatedProfile: { savings_preference: profile.savings_preference, savings_goal: customGoal },
    };
  }

  if (trimmed === "/saldo") {
    if (userWallets.length === 0) {
      return {
        replyText: `👛 **Saldo Dompet Kamu:**\n\nBelum ada dompet aktif.\n💰 Total Saldo: Rp0\n\nSilakan buat dompet di menu Wallet dashboard TataDana untuk mulai mengelola keuangan.`,
        status: "info",
      };
    }
    const total = userWallets.reduce((acc, w) => acc + w.balance, 0);
    let msg = `👛 Saldo Dompet Kamu:\n\n`;
    userWallets.forEach((w) => {
      msg += `${w.icon} ${w.name}${w.is_default ? " (Default)" : ""}: ${formatRupiah(w.balance)}\n`;
    });
    msg += `\n💰 Total Saldo: ${formatRupiah(total)}`;
    return { replyText: msg, status: "info" };
  }

  if (trimmed === "/hari ini") {
    const todayStr = new Date().toISOString().split("T")[0];
    const txsToday = dbStore.state.transactions.filter(
      (t) => t.user_id === userId && t.transaction_date.startsWith(todayStr)
    );
    const inc = txsToday.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const exp = txsToday.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

    let msg = `📅 Rekap Hari Ini (${todayStr}):\n\n`;
    msg += `📈 Pemasukan: ${formatRupiah(inc)}\n`;
    msg += `📉 Pengeluaran: ${formatRupiah(exp)}\n`;
    msg += `📊 Selisih Hari Ini: ${formatRupiah(inc - exp)}\n\n`;
    msg += `Daftar transaksi hari ini:\n`;
    if (txsToday.length === 0) {
      msg += `Belum ada transaksi dicatat hari ini.`;
    } else {
      txsToday.forEach((t) => {
        msg += `• ${t.type === "income" ? "+" : "-"} ${formatRupiah(t.amount)} : ${t.description}\n`;
      });
    }
    return { replyText: msg, status: "info" };
  }

  if (trimmed === "/minggu ini") {
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const txsWeek = dbStore.state.transactions.filter(
      (t) => t.user_id === userId && t.transaction_date >= sevenDaysAgo
    );
    const inc = txsWeek.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const exp = txsWeek.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

    return {
      replyText: `📅 Rekap 7 Hari Terakhir:\n\n` +
        `📈 Total Pemasukan: ${formatRupiah(inc)}\n` +
        `📉 Total Pengeluaran: ${formatRupiah(exp)}\n` +
        `Net Cashflow: ${formatRupiah(inc - exp)}\n` +
        `Total transaksi: ${txsWeek.length} transaksi`,
      status: "info",
    };
  }

  if (trimmed === "/bulan ini") {
    const curYear = new Date().getFullYear();
    const curMonth = new Date().getMonth() + 1;
    const prefix = `${curYear}-${String(curMonth).padStart(2, "0")}`;

    const txsMonth = dbStore.state.transactions.filter(
      (t) => t.user_id === userId && t.transaction_date.startsWith(prefix)
    );
    const inc = txsMonth.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const exp = txsMonth.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

    return {
      replyText: `📊 Ringkasan Bulan Ini:\n\n` +
        `📈 Pemasukan: ${formatRupiah(inc)}\n` +
        `📉 Pengeluaran: ${formatRupiah(exp)}\n` +
        `💰 Net Tabungan: ${formatRupiah(inc - exp)}\n` +
        `Total transaksi: ${txsMonth.length}`,
      status: "info",
    };
  }

  if (trimmed === "/budget") {
    const userBudgets = dbStore.state.budgets.filter((b) => b.user_id === userId);
    if (userBudgets.length === 0) {
      return {
        replyText: "🎯 Kamu belum mengatur budget kategori bulan ini. Buka menu Budget di dashboard TataDana untuk mulai mengontrol pengeluaranmu!",
        status: "info",
      };
    }

    let msg = `🎯 Status Budget Bulan Ini:\n\n`;
    userBudgets.forEach((b) => {
      const cat = dbStore.state.categories.find((c) => c.id === b.category_id);
      const catName = cat ? `${cat.emoji} ${cat.name}` : "Kategori";

      // Calculate total spent in this category
      const curYear = new Date().getFullYear();
      const curMonth = new Date().getMonth() + 1;
      const prefix = `${curYear}-${String(curMonth).padStart(2, "0")}`;
      const spent = dbStore.state.transactions
        .filter((t) => t.user_id === userId && t.category_id === b.category_id && t.transaction_date.startsWith(prefix))
        .reduce((sum, t) => sum + t.amount, 0);

      const pct = Math.round((spent / b.amount) * 100);
      const sisa = Math.max(0, b.amount - spent);
      const bar = generateAsciiProgressBar(pct);

      msg += `${catName}\n${bar} (${formatRupiah(spent)} / ${formatRupiah(b.amount)})\nSisa: ${formatRupiah(sisa)}\n\n`;
    });

    return { replyText: msg.trim(), status: "info" };
  }

  if (trimmed === "/sheet") {
    return {
      replyText: `📊 Akses Laporan Keuangan:\n` +
        `Buka dashboard laporan native TataDana untuk melihat tabel lengkap, filter custom, dan export PDF/Excel:\n` +
        `🔗 ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/laporan`,
      status: "info",
    };
  }

  // 3. Plan Transaction Limits Check
  const curMonthPrefix = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
  const thisMonthTxCount = dbStore.state.transactions.filter(
    (t) => t.user_id === userId && t.transaction_date.startsWith(curMonthPrefix)
  ).length;

  const limitCheck = canCreateTransaction(profile.plan, thisMonthTxCount);
  if (!limitCheck.allowed) {
    return {
      replyText: `⚠️ Batas Transaksi Tercapai!\n\n${limitCheck.message}\n\n👉 Upgrade sekarang di ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/settings untuk menikmati transaksi tanpa batas.`,
      status: "warning",
    };
  }

  // 4. Handle Receipt Photo Input (Pro Only)
  if (photoUrl) {
    if (profile.plan !== "pro") {
      return {
        replyText: `📸 Fitur Catat Foto Struk (AI Vision OCR) adalah fitur eksklusif paket Pro!\n\n` +
          `Dengan Pro, kamu cukup foto struk belanja dan AI akan otomatis membaca nama toko, rincian barang, dan nominalnya.\n\n` +
          `🚀 Upgrade ke Pro hanya Rp99.000 sekali bayar di dashboard TataDana!`,
        status: "warning",
      };
    }

    if (!defaultWallet) {
      return {
        replyText: "⚠️ Belum ada dompet aktif untuk mencatat transaksi. Silakan buat dompet di menu Wallet dashboard TataDana terlebih dahulu.",
        status: "warning",
      };
    }

    try {
      const ocrResult = await parseReceiptWithAI(photoUrl, userId);
      const userCategories = dbStore.state.categories.filter((c) => c.user_id === userId);
      const defaultExpCat = userCategories.find((c) => c.type === "expense") || userCategories[0];

      // Update wallet balance
      defaultWallet.balance -= ocrResult.total;

      const newTx: Transaction = {
        id: `tx-${Date.now()}`,
        user_id: userId,
        wallet_id: defaultWallet.id,
        category_id: defaultExpCat.id,
        type: "expense",
        amount: ocrResult.total,
        description: `Struk: ${ocrResult.merchant}`,
        source: "telegram_photo",
        receipt_url: photoUrl,
        receipt_items: ocrResult.items,
        transaction_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      dbStore.state.transactions.unshift(newTx);

      let reply = `📅 Struk ${ocrResult.merchant} Berhasil Dicatat!\n`;
      reply += `💸 Total : ${formatRupiah(ocrResult.total)}\n`;
      reply += `├ Dompet : ${defaultWallet.icon} ${defaultWallet.name}\n`;
      reply += `└ Saldo sisa : ${formatRupiah(defaultWallet.balance)}\n\n`;
      reply += `📋 Rincian Item (${ocrResult.items.length} item):\n`;
      ocrResult.items.forEach((item) => {
        reply += `• ${item.name} (${formatRupiah(item.price)})\n`;
      });

      return { replyText: reply, transactionCreated: newTx, status: "success" };
    } catch (e: any) {
      return {
        replyText: `❌ Gagal memproses foto struk: ${e.message}. Pastikan foto struk terlihat jelas dan terang.`,
        status: "error",
      };
    }
  }

  // 5. Handle Voice Note Input (All Plans)
  let voiceTranscript: string | undefined;
  let textToParse = trimmed;

  if (voiceUrl) {
    try {
      const stt = await transcribeVoiceNoteWithAI(voiceUrl, voiceDuration || 10, userId);
      voiceTranscript = stt.transcript;
      textToParse = stt.transcript;
    } catch (err: any) {
      return {
        replyText: `❌ ${err.message}`,
        status: "error",
      };
    }
  }

  if (!textToParse) {
    return {
      replyText: "Mohon ketikkan transaksi, kirim foto struk, atau kirim voice note kamu.",
      status: "warning",
    };
  }

  // 6. Natural Language Parse via Multi-Provider AI
  try {
    if (!defaultWallet) {
      return {
        replyText: "⚠️ Belum ada dompet aktif untuk mencatat transaksi. Silakan buat dompet di menu Wallet dashboard TataDana terlebih dahulu.",
        status: "warning",
      };
    }

    const parseResult = await parseTransactionWithAI(textToParse, userId);
    const userCategories = dbStore.state.categories.filter((c) => c.user_id === userId);

    let matchedCategory = userCategories.find(
      (c) => c.name.toLowerCase() === parseResult.kategori.toLowerCase()
    );
    if (!matchedCategory) {
      matchedCategory = userCategories.find((c) => c.type === parseResult.jenis) || userCategories[0];
    }

    // Balance update
    if (parseResult.jenis === "expense") {
      defaultWallet.balance -= parseResult.nominal;
    } else {
      defaultWallet.balance += parseResult.nominal;
    }

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      user_id: userId,
      wallet_id: defaultWallet.id,
      category_id: matchedCategory.id,
      type: parseResult.jenis,
      amount: parseResult.nominal,
      description: parseResult.catatan,
      source: voiceUrl ? "telegram_voice" : "telegram_text",
      transaction_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    dbStore.state.transactions.unshift(newTx);

    // AI Financial Advisor Trigger (Pro Only)
    let advisorMsg: string | undefined;
    if (profile.plan === "pro" && parseResult.jenis === "expense") {
      const nowMs = Date.now();
      const sevenDaysMs = 7 * 86400000;
      const curYear = new Date().getFullYear();
      const curMonth = new Date().getMonth() + 1;
      const curMonthPrefix = `${curYear}-${String(curMonth).padStart(2, "0")}`;

      // Trigger 1: Single transaction > 20% of category monthly budget
      const budget = dbStore.state.budgets.find(
        (b) => b.user_id === userId && b.category_id === matchedCategory?.id && b.month === curMonth && b.year === curYear
      );

      if (budget && budget.amount > 0 && parseResult.nominal >= budget.amount * 0.2) {
        const pctBudget = Math.round((parseResult.nominal / budget.amount) * 100);
        advisorMsg = formatAIAdvisorMessage(
          profile.full_name.split(" ")[0],
          `Pengeluaran untuk ${matchedCategory.name} kali ini cukup besar (${pctBudget}% dari total budget ${formatRupiah(budget.amount)} sekaligus).`,
          `Pertimbangkan untuk mengerem belanja non-primer di sisa bulan ini agar budget tetap aman.`
        );
      }

      // Trigger 2: Total monthly expenses > 80% of total monthly income
      if (!advisorMsg) {
        const userTxsThisMonth = dbStore.state.transactions.filter(
          (t) => t.user_id === userId && t.transaction_date.startsWith(curMonthPrefix)
        );
        const totalInc = userTxsThisMonth
          .filter((t) => t.type === "income")
          .reduce((sum, t) => sum + t.amount, 0);
        const totalExp = userTxsThisMonth
          .filter((t) => t.type === "expense")
          .reduce((sum, t) => sum + t.amount, 0);

        if (totalInc > 0 && totalExp >= totalInc * 0.8) {
          const expRatio = Math.round((totalExp / totalInc) * 100);
          advisorMsg = formatAIAdvisorMessage(
            profile.full_name.split(" ")[0],
            `Total pengeluaranmu bulan ini sudah mencapai ${expRatio}% dari total pemasukan (${formatRupiah(totalExp)} dari ${formatRupiah(totalInc)}).`,
            `Prioritaskan hanya kebutuhan pokok di sisa hari bulan ini agar arus kas tetap surplus.`
          );
        }
      }

      // Trigger 3: Spending in this category up > 50% vs previous week (7-14 days ago)
      if (!advisorMsg && matchedCategory) {
        const spentThisWeek = dbStore.state.transactions
          .filter((t) => {
            if (t.user_id !== userId || t.category_id !== matchedCategory.id || t.type !== "expense") return false;
            const tTime = new Date(t.transaction_date).getTime();
            return tTime >= nowMs - sevenDaysMs;
          })
          .reduce((sum, t) => sum + t.amount, 0);

        const spentPrevWeek = dbStore.state.transactions
          .filter((t) => {
            if (t.user_id !== userId || t.category_id !== matchedCategory.id || t.type !== "expense") return false;
            const tTime = new Date(t.transaction_date).getTime();
            return tTime >= nowMs - 2 * sevenDaysMs && tTime < nowMs - sevenDaysMs;
          })
          .reduce((sum, t) => sum + t.amount, 0);

        if (spentPrevWeek > 0 && spentThisWeek >= spentPrevWeek * 1.5) {
          const increasePct = Math.round(((spentThisWeek - spentPrevWeek) / spentPrevWeek) * 100);
          advisorMsg = formatAIAdvisorMessage(
            profile.full_name.split(" ")[0],
            `Pengeluaran untuk kategori ${matchedCategory.name} melonjak ${increasePct}% dibanding minggu lalu (${formatRupiah(spentThisWeek)} vs ${formatRupiah(spentPrevWeek)}).`,
            `Coba evaluasi pengeluaran di kategori ini agar tidak melampaui target bulananmu.`
          );
        }
      }
    }

    // Format reply
    if (parseResult.jenis === "expense") {
      const curYear = new Date().getFullYear();
      const curMonth = new Date().getMonth() + 1;
      const budget = dbStore.state.budgets.find(
        (b) => b.user_id === userId && b.category_id === matchedCategory?.id && b.month === curMonth && b.year === curYear
      );

      // Total spent in this category
      const prefix = `${curYear}-${String(curMonth).padStart(2, "0")}`;
      const spent = dbStore.state.transactions
        .filter((t) => t.user_id === userId && t.category_id === matchedCategory?.id && t.transaction_date.startsWith(prefix))
        .reduce((sum, t) => sum + t.amount, 0);

      const reply = formatExpenseReply({
        amount: parseResult.nominal,
        category: matchedCategory,
        wallet: defaultWallet,
        description: parseResult.catatan,
        newBalance: defaultWallet.balance,
        budgetTotal: budget?.amount,
        budgetSpent: spent,
        transcript: voiceTranscript,
        advisorMessage: advisorMsg,
      });

      return { replyText: reply, transactionCreated: newTx, status: "success" };
    } else {
      const reply = formatIncomeReply({
        amount: parseResult.nominal,
        wallet: defaultWallet,
        description: parseResult.catatan,
        newBalance: defaultWallet.balance,
        transcript: voiceTranscript,
      });

      return { replyText: reply, transactionCreated: newTx, status: "success" };
    }
  } catch (err: any) {
    return {
      replyText: `❌ Gagal mencatat: ${err.message}`,
      status: "error",
    };
  }
}
