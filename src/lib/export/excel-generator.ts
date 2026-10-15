import ExcelJS from "exceljs";
import { Transaction, Category, Wallet } from "@/types";
import { formatWIBShort } from "@/lib/utils/date-wib";

interface GenerateExcelOptions {
  userName: string;
  periodStart: string;
  periodEnd: string;
  transactions: Transaction[];
  categories: Category[];
  wallets: Wallet[];
}

export async function generateFintechExcel(options: GenerateExcelOptions): Promise<Uint8Array> {
  const { userName, periodStart, periodEnd, transactions, categories, wallets } = options;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "TataDana Fintech";
  workbook.created = new Date();

  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const walletMap = new Map(wallets.map((w) => [w.id, w]));

  // -------------------------------------------------------------
  // Sheet 1: Ringkasan & Cashflow
  // -------------------------------------------------------------
  const summarySheet = workbook.addWorksheet("Ringkasan Keuangan", {
    views: [{ showGridLines: true }],
  });

  summarySheet.columns = [
    { header: "Parameter", key: "param", width: 28 },
    { header: "Nilai", key: "value", width: 25 },
  ];

  summarySheet.addRow({ param: "Aplikasi", value: "TataDana Fintech" });
  summarySheet.addRow({ param: "Pemilik Akun", value: userName });
  summarySheet.addRow({ param: "Periode Laporan", value: `${periodStart} s/d ${periodEnd}` });
  summarySheet.addRow({ param: "Tanggal Cetak", value: formatWIBShort(new Date()) });
  summarySheet.addRow({});

  let totalIncome = 0;
  let totalExpense = 0;
  transactions.forEach((tx) => {
    if (tx.type === "income") totalIncome += tx.amount;
    if (tx.type === "expense") totalExpense += tx.amount;
  });

  const rowIncome = summarySheet.addRow({ param: "Total Pemasukan", value: totalIncome });
  rowIncome.getCell(2).numFmt = '"Rp"#,##0';
  const rowExpense = summarySheet.addRow({ param: "Total Pengeluaran", value: totalExpense });
  rowExpense.getCell(2).numFmt = '"Rp"#,##0';
  const rowNet = summarySheet.addRow({ param: "Net Cashflow", value: totalIncome - totalExpense });
  rowNet.getCell(2).numFmt = '"Rp"#,##0';
  const rowCount = summarySheet.addRow({ param: "Jumlah Transaksi", value: transactions.length });

  // -------------------------------------------------------------
  // Sheet 2: Daftar Transaksi
  // -------------------------------------------------------------
  const txSheet = workbook.addWorksheet("Daftar Transaksi", {
    views: [{ showGridLines: true }],
  });

  txSheet.columns = [
    { header: "ID Transaksi", key: "id", width: 15 },
    { header: "Waktu (WIB)", key: "date", width: 22 },
    { header: "Tipe", key: "type", width: 14 },
    { header: "Kategori", key: "category", width: 20 },
    { header: "Dompet", key: "wallet", width: 18 },
    { header: "Nominal (IDR)", key: "amount", width: 18 },
    { header: "Catatan", key: "desc", width: 35 },
    { header: "Sumber", key: "source", width: 16 },
    { header: "Item Struk", key: "receipt_count", width: 12 },
  ];

  // Header styling
  txSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  txSheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF97316" }, // Brand orange
  };

  transactions.forEach((t) => {
    const cat = (t.category_id && categoryMap.get(t.category_id)?.name) || (t.type === "transfer" ? "Transfer" : "-");
    const wal = walletMap.get(t.wallet_id)?.name || "-";
    const typeLabel = t.type === "income" ? "Pemasukan" : t.type === "expense" ? "Pengeluaran" : "Transfer";

    const row = txSheet.addRow({
      id: t.id,
      date: formatWIBShort(t.transaction_date),
      type: typeLabel,
      category: cat,
      wallet: wal,
      amount: t.amount,
      desc: t.description,
      source: t.source,
      receipt_count: t.receipt_items ? t.receipt_items.length : 0,
    });

    row.getCell("amount").numFmt = '"Rp"#,##0';
  });

  // -------------------------------------------------------------
  // Sheet 3: Rincian Item Struk
  // -------------------------------------------------------------
  const receiptSheet = workbook.addWorksheet("Rincian Item Struk", {
    views: [{ showGridLines: true }],
  });

  receiptSheet.columns = [
    { header: "ID Transaksi", key: "tx_id", width: 15 },
    { header: "Waktu Struk", key: "date", width: 22 },
    { header: "Merchant / Keterangan", key: "merchant", width: 28 },
    { header: "Nama Item", key: "item_name", width: 25 },
    { header: "Kategori Item", key: "item_cat", width: 18 },
    { header: "Qty", key: "qty", width: 10 },
    { header: "Harga (IDR)", key: "price", width: 18 },
  ];

  receiptSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  receiptSheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF3B82F6" },
  };

  transactions.forEach((t) => {
    if (t.receipt_items && t.receipt_items.length > 0) {
      t.receipt_items.forEach((item) => {
        const row = receiptSheet.addRow({
          tx_id: t.id,
          date: formatWIBShort(t.transaction_date),
          merchant: t.description,
          item_name: item.name,
          item_cat: item.category || "Kebutuhan",
          qty: item.qty || 1,
          price: item.price,
        });
        row.getCell("price").numFmt = '"Rp"#,##0';
      });
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buffer as ArrayBuffer);
}
