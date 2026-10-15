import { formatRupiah } from "@/lib/utils/currency";
import { formatWIBTelegramHeader } from "@/lib/utils/date-wib";
import { Wallet, Category } from "@/types";

/**
 * Generate ASCII progress bar with █ and ░
 * Example: 45% -> [████░░░░░░] 45%
 */
export function generateAsciiProgressBar(percentage: number, totalBlocks: number = 10): string {
  const clamped = Math.max(0, Math.min(100, percentage));
  const filledBlocks = Math.round((clamped / 100) * totalBlocks);
  const emptyBlocks = totalBlocks - filledBlocks;
  const bar = "█".repeat(filledBlocks) + "░".repeat(emptyBlocks);
  return `[${bar}] ${clamped}%`;
}

export function formatExpenseReply(params: {
  amount: number;
  category: Category;
  wallet: Wallet;
  description: string;
  newBalance: number;
  budgetTotal?: number;
  budgetSpent?: number;
  transcript?: string;
  advisorMessage?: string;
}): string {
  const {
    amount,
    category,
    wallet,
    description,
    newBalance,
    budgetTotal,
    budgetSpent,
    transcript,
    advisorMessage,
  } = params;

  const header = formatWIBTelegramHeader();
  let text = `${header}\n💸 Pengeluaran tercatat!\n`;
  text += `├ Nominal : ${formatRupiah(amount)}\n`;
  text += `├ Kategori : ${category.emoji || "🏷️"} ${category.name}\n`;
  text += `├ Dompet : ${wallet.icon || "👛"} ${wallet.name}\n`;
  text += `├ Catatan : ${description}\n`;
  text += `└ Saldo : ${formatRupiah(newBalance)}\n`;

  if (transcript) {
    text += `\n🎙️ Transkrip: "${transcript}"\n`;
  }

  // Budget progress section if budget is set
  if (budgetTotal && budgetTotal > 0) {
    const spent = budgetSpent || amount;
    const pct = Math.round((spent / budgetTotal) * 100);
    const sisa = Math.max(0, budgetTotal - spent);
    const bar = generateAsciiProgressBar(pct);

    text += `\n📊 Budget ${category.name} bulan ini:\n`;
    text += `${bar} — sisa ${formatRupiah(sisa)}\n`;

    if (pct >= 100) {
      text += `⚠️ Perhatian: Budget kategori ini sudah habis! Rem pengeluaranmu ya.\n`;
    } else if (pct >= 80) {
      text += `⚡ Waspada: Budget kategori ini sudah mencapai ${pct}%. Bijak sebelum beli lagi!\n`;
    } else {
      text += `👍 Keuanganmu terkendali. Lanjutkan pencatatan konsisten!\n`;
    }
  }

  if (advisorMessage) {
    text += `\n${advisorMessage}\n`;
  }

  return text;
}

export function formatIncomeReply(params: {
  amount: number;
  wallet: Wallet;
  description: string;
  newBalance: number;
  transcript?: string;
}): string {
  const { amount, wallet, description, newBalance, transcript } = params;

  const header = formatWIBTelegramHeader();
  let text = `${header}\n💰 Pemasukan tercatat!\n`;
  text += `├ Nominal : ${formatRupiah(amount)}\n`;
  text += `├ Kategori : 💼 Pemasukan\n`;
  text += `├ Dompet : ${wallet.icon || "👛"} ${wallet.name}\n`;
  text += `└ Saldo baru : ${formatRupiah(newBalance)}\n`;

  if (transcript) {
    text += `\n🎙️ Transkrip: "${transcript}"\n`;
  }

  text += `\n💪 Semangat terus! Jangan lupa sisihkan untuk tabungan ya.`;
  return text;
}

export function formatAIAdvisorMessage(name: string, analysis: string, advice: string): string {
  return `🤖 Financial Advisor\nHei ${name}! ${analysis}\n💡 Saran: ${advice}`;
}

export function formatDailyReminder(): string {
  return `⏰ Reminder Keuangan!\nJangan lupa catat pengeluaran hari ini ya 📝\nPencatatan rutin = keuangan lebih terkontrol 💪\nKetik transaksimu sekarang!`;
}
