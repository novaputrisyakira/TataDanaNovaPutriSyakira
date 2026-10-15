import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Transaction, Category, Wallet } from "@/types";
import { formatRupiah } from "@/lib/utils/currency";
import { formatWIBShort } from "@/lib/utils/date-wib";

interface GeneratePDFOptions {
  userName: string;
  periodStart: string;
  periodEnd: string;
  transactions: Transaction[];
  categories: Category[];
  wallets: Wallet[];
}

export async function generateFintechPDF(options: GeneratePDFOptions): Promise<Uint8Array> {
  const { userName, periodStart, periodEnd, transactions, categories, wallets } = options;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Calculate metrics
  let totalIncome = 0;
  let totalExpense = 0;
  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const walletMap = new Map(wallets.map((w) => [w.id, w]));

  const categoryExpenses: Record<string, number> = {};

  transactions.forEach((tx) => {
    if (tx.type === "income") {
      totalIncome += tx.amount;
    } else if (tx.type === "expense") {
      totalExpense += tx.amount;
      const catName = (tx.category_id && categoryMap.get(tx.category_id)?.name) || "Lain-lain";
      categoryExpenses[catName] = (categoryExpenses[catName] || 0) + tx.amount;
    }
  });

  const netCashflow = totalIncome - totalExpense;

  // Header Background Accent (Brand Orange)
  doc.setFillColor(249, 115, 22); // #F97316
  doc.rect(0, 0, 210, 28, "F");

  // Logo & Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("TataDana", 14, 15);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Laporan Keuangan Pribadi & Analisis Arus Kas", 14, 21);

  // Period & User info
  doc.setTextColor(75, 85, 99);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`Pemilik Rekening: ${userName}`, 14, 38);
  doc.setFont("helvetica", "normal");
  doc.text(`Periode: ${periodStart} s/d ${periodEnd}`, 14, 44);
  doc.text(`Dicetak: ${formatWIBShort(new Date())}`, 14, 50);

  // Metric Cards (3 boxes)
  // Box 1: Pemasukan
  doc.setFillColor(240, 253, 244); // green-50
  doc.setDrawColor(34, 197, 94);
  doc.roundedRect(14, 56, 56, 22, 2, 2, "FD");
  doc.setTextColor(22, 101, 52);
  doc.setFontSize(8);
  doc.text("TOTAL PEMASUKAN", 18, 62);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(formatRupiah(totalIncome), 18, 72);

  // Box 2: Pengeluaran
  doc.setFillColor(254, 242, 242); // red-50
  doc.setDrawColor(239, 68, 68);
  doc.roundedRect(77, 56, 56, 22, 2, 2, "FD");
  doc.setTextColor(153, 27, 27);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("TOTAL PENGELUARAN", 81, 62);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(formatRupiah(totalExpense), 81, 72);

  // Box 3: Net Cashflow
  const isNetPositive = netCashflow >= 0;
  if (isNetPositive) {
    doc.setFillColor(255, 247, 237);
    doc.setDrawColor(249, 115, 22);
    doc.setTextColor(194, 65, 12);
  } else {
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(239, 68, 68);
    doc.setTextColor(153, 27, 27);
  }
  doc.roundedRect(140, 56, 56, 22, 2, 2, "FD");
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("NET CASHFLOW", 144, 62);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(formatRupiah(netCashflow), 144, 72);

  // Top Categories Table
  const topCategories = Object.entries(categoryExpenses)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  doc.setTextColor(17, 24, 39);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Top 5 Kategori Pengeluaran", 14, 88);

  const catTableData = topCategories.map(([catName, amount]) => {
    const pct = totalExpense > 0 ? ((amount / totalExpense) * 100).toFixed(1) + "%" : "0%";
    return [catName, formatRupiah(amount), pct];
  });

  autoTable(doc, {
    startY: 92,
    head: [["Kategori", "Total Pengeluaran", "Persentase"]],
    body: catTableData.length > 0 ? catTableData : [["Belum ada pengeluaran", "-", "-"]],
    theme: "striped",
    headStyles: { fillColor: [249, 115, 22], textColor: 255 },
    styles: { fontSize: 8 },
    margin: { left: 14, right: 14 },
  });

  // Transaction History Table
  const lastY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 10 : 130;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Daftar Transaksi", 14, lastY);

  const txTableData = transactions.map((t) => {
    const cat = (t.category_id && categoryMap.get(t.category_id)?.name) || (t.type === "transfer" ? "Transfer" : "-");
    const wal = walletMap.get(t.wallet_id)?.name || "Dompet";
    const typeLabel = t.type === "income" ? "+ Masuk" : t.type === "expense" ? "- Keluar" : "⇄ Transfer";
    let desc = t.description;
    if (t.receipt_items && t.receipt_items.length > 0) {
      desc += ` (${t.receipt_items.length} item struk)`;
    }

    return [
      formatWIBShort(t.transaction_date),
      typeLabel,
      cat,
      wal,
      formatRupiah(t.amount),
      desc,
    ];
  });

  autoTable(doc, {
    startY: lastY + 4,
    head: [["Tanggal", "Tipe", "Kategori", "Dompet", "Nominal", "Catatan"]],
    body: txTableData.length > 0 ? txTableData : [["-", "-", "-", "-", "-", "Tidak ada transaksi"]],
    theme: "grid",
    headStyles: { fillColor: [31, 41, 55], textColor: 255 },
    styles: { fontSize: 7, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 32 },
      1: { cellWidth: 18 },
      2: { cellWidth: 30 },
      3: { cellWidth: 26 },
      4: { cellWidth: 28, halign: "right" },
      5: { cellWidth: "auto" },
    },
    margin: { left: 14, right: 14 },
  });

  // Footer page numbers
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text(
      `Halaman ${i} dari ${pageCount} · Dihasilkan otomatis oleh TataDana Fintech`,
      14,
      290
    );
  }

  const output = doc.output("arraybuffer");
  return new Uint8Array(output);
}
