"use client";

import React, { useState, useMemo } from "react";
import { useDashboard } from "../layout";
import {
  FileText,
  FileSpreadsheet,
  Download,
  Calendar,
  Lock,
  Sparkles,
  ArrowUpDown,
  Search,
  Filter,
  CheckCircle,
  Clock,
  ChevronDown,
  Layers,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { formatRupiah } from "@/lib/utils/currency";
import { formatWIBShort } from "@/lib/utils/date-wib";
import { ReceiptDetailModal } from "@/components/transactions/ReceiptDetailModal";
import { Transaction } from "@/types";
import Link from "next/link";

export default function LaporanPage() {
  const { profile, transactions, wallets, categories } = useDashboard();

  const isPro = profile.plan === "pro";

  // Date range filters
  const now = new Date();
  const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const defaultEnd = now.toISOString().split("T")[0];

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedWallet, setSelectedWallet] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [searchNotes, setSearchNotes] = useState("");

  // Sorting
  const [sortBy, setSortBy] = useState<"date" | "amount" | "category" | "wallet">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals & Export state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [selectedReceiptTx, setSelectedReceiptTx] = useState<Transaction | null>(null);

  // Filter transactions
  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const d = t.transaction_date.split("T")[0];
      if (d < startDate || d > endDate) return false;
      if (selectedType !== "all" && t.type !== selectedType) return false;
      if (selectedWallet !== "all" && t.wallet_id !== selectedWallet) return false;
      if (selectedCategory !== "all" && t.category_id !== selectedCategory) return false;
      if (searchNotes && !t.description.toLowerCase().includes(searchNotes.toLowerCase())) return false;
      return true;
    });
  }, [transactions, startDate, endDate, selectedType, selectedWallet, selectedCategory, searchNotes]);

  // Sort transactions
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sortBy === "date") {
        const timeA = new Date(a.transaction_date).getTime();
        const timeB = new Date(b.transaction_date).getTime();
        return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
      }
      if (sortBy === "amount") {
        return sortOrder === "asc" ? a.amount - b.amount : b.amount - a.amount;
      }
      if (sortBy === "category") {
        const catA = categories.find((c) => c.id === a.category_id)?.name || "";
        const catB = categories.find((c) => c.id === b.category_id)?.name || "";
        return sortOrder === "asc" ? catA.localeCompare(catB) : catB.localeCompare(catA);
      }
      if (sortBy === "wallet") {
        const walA = wallets.find((w) => w.id === a.wallet_id)?.name || "";
        const walB = wallets.find((w) => w.id === b.wallet_id)?.name || "";
        return sortOrder === "asc" ? walA.localeCompare(walB) : walB.localeCompare(walA);
      }
      return 0;
    });
  }, [filtered, sortBy, sortOrder, categories, wallets]);

  // Paginated records
  const totalPages = Math.ceil(sorted.length / itemsPerPage) || 1;
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sorted.slice(start, start + itemsPerPage);
  }, [sorted, currentPage]);

  // Metrics summary
  const { totalIncome, totalExpense, netCashflow, top5Categories } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    const catMap: Record<string, { name: string; emoji: string; amount: number }> = {};

    filtered.forEach((t) => {
      if (t.type === "income") inc += t.amount;
      if (t.type === "expense") {
        exp += t.amount;
        const cat = categories.find((c) => c.id === t.category_id);
        const name = cat?.name || "Lain-lain";
        const emoji = cat?.emoji || "🏷️";
        if (!catMap[name]) catMap[name] = { name, emoji, amount: 0 };
        catMap[name].amount += t.amount;
      }
    });

    const top5 = Object.values(catMap).sort((a, b) => b.amount - a.amount).slice(0, 5);
    return {
      totalIncome: inc,
      totalExpense: exp,
      netCashflow: inc - exp,
      top5Categories: top5,
    };
  }, [filtered, categories]);

  const toggleSort = (col: "date" | "amount" | "category" | "wallet") => {
    if (sortBy === col) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(col);
      setSortOrder("desc");
    }
  };

  const handleExportPDF = async () => {
    if (!isPro) {
      setShowUpgradeModal(true);
      return;
    }
    setExportingPDF(true);
    try {
      const res = await fetch("/api/export/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: profile.id,
          periodStart: startDate,
          periodEnd: endDate,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Gagal export PDF");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `TataDana-Laporan-${startDate}_sd_${endDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setExportingPDF(false);
    }
  };

  const handleExportExcel = async () => {
    if (!isPro) {
      setShowUpgradeModal(true);
      return;
    }
    setExportingExcel(true);
    try {
      const res = await fetch("/api/export/excel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: profile.id,
          periodStart: startDate,
          periodEnd: endDate,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Gagal export Excel");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `TataDana-Laporan-${startDate}_sd_${endDate}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setExportingExcel(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Export Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            📊 Laporan & Analisis Keuangan
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Laporan native interaktif, audit arus kas, dan generator export PDF & Excel.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            isLoading={exportingExcel}
            className="gap-2"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Excel</span>
            {!isPro && <Lock className="w-3 h-3 text-orange-500" />}
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleExportPDF}
            isLoading={exportingPDF}
            className="gap-2"
          >
            <FileText className="w-4 h-4" />
            <span>Export PDF</span>
            {!isPro && <Lock className="w-3 h-3 text-white/80" />}
          </Button>
        </div>
      </div>

      {/* Starter Plan Banner if not Pro */}
      {!isPro && (
        <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold">
                Kamu sedang menggunakan paket Starter (Ringkasan Bulanan)
              </p>
              <p className="text-xs text-amber-800/80 mt-0.5">
                Upgrade ke paket Pro untuk membuka export unlimited ke PDF & Excel serta filter tanggal tanpa batas.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="primary"
            onClick={() => setShowUpgradeModal(true)}
            className="shrink-0 text-xs"
          >
            Upgrade ke Pro (Rp99.000)
          </Button>
        </div>
      )}

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-t-4 border-t-emerald-500">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Pemasukan</span>
          <p className="text-xl font-black text-emerald-700 mt-1">{formatRupiah(totalIncome)}</p>
          <span className="text-[11px] text-gray-400 mt-1 block">Periode terpilih</span>
        </Card>

        <Card className="border-t-4 border-t-rose-500">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Pengeluaran</span>
          <p className="text-xl font-black text-rose-700 mt-1">{formatRupiah(totalExpense)}</p>
          <span className="text-[11px] text-gray-400 mt-1 block">Periode terpilih</span>
        </Card>

        <Card className="border-t-4 border-t-orange-500">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Net Cashflow</span>
          <p
            className={`text-xl font-black mt-1 ${
              netCashflow >= 0 ? "text-orange-700" : "text-rose-700"
            }`}
          >
            {formatRupiah(netCashflow)}
          </p>
          <span className="text-[11px] text-gray-400 mt-1 block">
            {netCashflow >= 0 ? "Surplus Keuangan" : "Defisit Keuangan"}
          </span>
        </Card>

        <Card className="border-t-4 border-t-blue-500">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Jumlah Transaksi</span>
          <p className="text-xl font-black text-gray-900 mt-1">{filtered.length} Transaksi</p>
          <span className="text-[11px] text-gray-400 mt-1 block">Dalam periode ini</span>
        </Card>
      </div>

      {/* Top 5 Categories & Filter Box */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Filter controls */}
        <Card className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-orange-600" />
            <h3 className="font-bold text-gray-900 text-sm">Filter & Pencarian Laporan</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
                Dari Tanggal
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-300"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
                Sampai Tanggal
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
                Jenis
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl"
              >
                <option value="all">Semua Jenis</option>
                <option value="expense">Pengeluaran</option>
                <option value="income">Pemasukan</option>
                <option value="transfer">Transfer</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
                Dompet
              </label>
              <select
                value={selectedWallet}
                onChange={(e) => setSelectedWallet(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl"
              >
                <option value="all">Semua Dompet</option>
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.icon} {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
                Kategori
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl"
              >
                <option value="all">Semua Kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.emoji} {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
              Cari Keterangan / Catatan
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchNotes}
                onChange={(e) => setSearchNotes(e.target.value)}
                placeholder="Ketik kata kunci catatan transaksi..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-300"
              />
            </div>
          </div>
        </Card>

        {/* Top 5 Expense Categories */}
        <Card>
          <h3 className="font-bold text-gray-900 text-sm mb-3">Top 5 Kategori Pengeluaran</h3>
          {top5Categories.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400">
              {transactions.length === 0
                ? "Belum ada transaksi"
                : "Tidak ada data pengeluaran di rentang tanggal ini."}
            </div>
          ) : (
            <div className="space-y-3">
              {top5Categories.map((c, i) => {
                const pct = totalExpense > 0 ? Math.round((c.amount / totalExpense) * 100) : 0;
                return (
                  <div key={i} className="text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-700 flex items-center gap-1.5">
                        <span>{c.emoji}</span>
                        <span>{c.name}</span>
                      </span>
                      <span className="font-bold text-gray-900">
                        {formatRupiah(c.amount)} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Sortable Transaction Table with Pagination */}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
            Tabel Laporan ({filtered.length} baris)
          </span>
          <span className="text-xs text-gray-400">
            Halaman {currentPage} dari {totalPages}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wider border-b border-gray-100">
              <tr>
                <th
                  onClick={() => toggleSort("date")}
                  className="py-3 px-4 cursor-pointer hover:text-orange-600 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Tanggal</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Tipe</th>
                <th
                  onClick={() => toggleSort("category")}
                  className="py-3 px-4 cursor-pointer hover:text-orange-600 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Kategori</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort("wallet")}
                  className="py-3 px-4 cursor-pointer hover:text-orange-600 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Dompet</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Catatan & Rincian Struk</th>
                <th
                  onClick={() => toggleSort("amount")}
                  className="py-3 px-4 cursor-pointer hover:text-orange-600 transition-colors text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Nominal</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-gray-400">
                    {transactions.length === 0
                      ? "Belum ada transaksi"
                      : "Tidak ada transaksi yang cocok dengan filter yang dipilih."}
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((tx) => {
                  const cat = categories.find((c) => c.id === tx.category_id);
                  const wal = wallets.find((w) => w.id === tx.wallet_id);
                  const isInc = tx.type === "income";

                  return (
                    <tr key={tx.id} className="hover:bg-gray-50/70">
                      <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                        {formatWIBShort(tx.transaction_date)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {tx.type === "transfer" ? (
                          <Badge variant="blue">Transfer</Badge>
                        ) : isInc ? (
                          <Badge variant="green">Masuk</Badge>
                        ) : (
                          <Badge variant="orange">Keluar</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-800 whitespace-nowrap">
                        {cat ? `${cat.emoji} ${cat.name}` : "-"}
                      </td>
                      <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                        {wal?.name || "-"}
                      </td>
                      <td className="py-3 px-4 text-gray-900 max-w-sm truncate">
                        {tx.description}
                        {tx.receipt_items && tx.receipt_items.length > 0 && (
                          <button
                            onClick={() => setSelectedReceiptTx(tx)}
                            className="ml-2 inline-flex items-center gap-1 text-[11px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full hover:bg-orange-100"
                          >
                            <Layers className="w-3 h-3" />
                            Expand {tx.receipt_items.length} Item
                          </button>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-bold whitespace-nowrap">
                        <span className={isInc ? "text-emerald-600" : "text-gray-900"}>
                          {isInc ? "+" : "-"} {formatRupiah(tx.amount)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Sebelumnya
            </Button>
            <span className="text-xs text-gray-500">
              Halaman {currentPage} dari {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Selanjutnya
            </Button>
          </div>
        )}
      </Card>

      {/* Upgrade Pro Modal */}
      <Modal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        title="Upgrade ke TataDana Pro"
        maxWidth="md"
      >
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-gray-900">
              Buka Export PDF & Excel Unlimited
            </h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              Dengan paket Pro, kamu bisa generate laporan keuangan profesional, export tanpa batas, dan menggunakan AI Vision foto struk.
            </p>
          </div>

          <div className="p-4 bg-orange-50/70 rounded-2xl border border-orange-200/60 text-left space-y-2 text-xs">
            <div className="flex items-center gap-2 text-orange-950">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Export PDF & Excel (.xlsx) dengan signed URL privat</span>
            </div>
            <div className="flex items-center gap-2 text-orange-950">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Unlimited pencatatan transaksi & dompet</span>
            </div>
            <div className="flex items-center gap-2 text-orange-950">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>AI OCR foto struk belanja otomatis</span>
            </div>
            <div className="flex items-center gap-2 text-orange-950">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>AI Financial Advisor proaktif</span>
            </div>
          </div>

          <div className="text-2xl font-black text-gray-900">
            Rp99.000 <span className="text-xs font-normal text-gray-500">/ sekali bayar selamanya</span>
          </div>

          <div className="pt-2 flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowUpgradeModal(false)}
              className="flex-1"
            >
              Nanti Saja
            </Button>
            <Link href="/dashboard/settings" className="flex-1">
              <Button variant="primary" className="w-full">
                Upgrade Sekarang
              </Button>
            </Link>
          </div>
        </div>
      </Modal>

      {/* Expandable Receipt Breakdown Modal */}
      <ReceiptDetailModal
        transaction={selectedReceiptTx}
        onClose={() => setSelectedReceiptTx(null)}
      />
    </div>
  );
}
