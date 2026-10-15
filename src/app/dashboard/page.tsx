"use client";

import React, { useState, useMemo } from "react";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import {
  Wallet as WalletIcon,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Filter,
  Bot,
  Plus,
  Receipt,
  Mic,
  MessageSquare,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/utils/currency";
import { formatWIBShort } from "@/lib/utils/date-wib";
import { ReceiptDetailModal } from "@/components/transactions/ReceiptDetailModal";
import { Transaction } from "@/types";
import Link from "next/link";

type PeriodFilter = "today" | "week" | "month" | "year" | "all";

export default function DashboardOverviewPage() {
  const { profile, wallets, categories, transactions, budgets, openSimulator, openTransactionModal } =
    useDashboard();

  const [period, setPeriod] = useState<PeriodFilter>("month");
  const [selectedReceiptTx, setSelectedReceiptTx] = useState<Transaction | null>(null);

  // Filter transactions according to selected period
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    return transactions.filter((t) => {
      const txDate = t.transaction_date.split("T")[0];
      if (period === "today") return txDate === todayStr;
      if (period === "week") {
        const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
        return txDate >= weekAgo;
      }
      if (period === "month") {
        const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        return txDate.startsWith(monthPrefix);
      }
      if (period === "year") {
        return txDate.startsWith(String(now.getFullYear()));
      }
      return true;
    });
  }, [transactions, period]);

  // Aggregate metrics
  const totalBalance = useMemo(() => wallets.reduce((acc, w) => acc + w.balance, 0), [wallets]);

  const { incomeTotal, expenseTotal } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    filteredTransactions.forEach((t) => {
      if (t.type === "income") inc += t.amount;
      if (t.type === "expense") exp += t.amount;
    });
    return { incomeTotal: inc, expenseTotal: exp };
  }, [filteredTransactions]);

  const totalBudgetMonthly = useMemo(
    () => budgets.reduce((acc, b) => acc + b.amount, 0),
    [budgets]
  );
  const remainingBudget = Math.max(0, totalBudgetMonthly - expenseTotal);

  // Category breakdown for Pie/Donut
  const categoryExpenses = useMemo(() => {
    const map: Record<string, { name: string; emoji: string; color: string; amount: number }> = {};
    filteredTransactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        const cat = categories.find((c) => c.id === t.category_id);
        const name = cat?.name || "Lain-lain";
        const emoji = cat?.emoji || "🏷️";
        const color = cat?.color || "#F97316";

        if (!map[name]) {
          map[name] = { name, emoji, color, amount: 0 };
        }
        map[name].amount += t.amount;
      });

    return Object.values(map).sort((a, b) => b.amount - a.amount);
  }, [filteredTransactions, categories]);

  // 6-Month Comparison dynamically calculated from user's actual transactions
  const sixMonthComparison = useMemo(() => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    const now = new Date();
    const result = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mIdx = d.getMonth();
      const yr = d.getFullYear();
      const prefix = `${yr}-${String(mIdx + 1).padStart(2, "0")}`;

      let mIncome = 0;
      let mExpense = 0;

      transactions.forEach((t) => {
        if (t.transaction_date && t.transaction_date.startsWith(prefix)) {
          if (t.type === "income") mIncome += t.amount;
          if (t.type === "expense") mExpense += t.amount;
        }
      });

      result.push({
        month: monthNames[mIdx],
        income: mIncome,
        expense: mExpense,
      });
    }

    return result;
  }, [transactions]);

  // Onboarding Checklist
  const onboardingSteps = [
    {
      title: "Hubungkan Telegram Bot",
      desc: "Link akun ke Telegram untuk mulai catat via chat",
      done: !!profile.telegram_username,
      href: "/dashboard/settings",
    },
    {
      title: "Atur Dompet & Saldo Awal",
      desc: "Pilih dompet default (Cash, BCA, GoPay)",
      done: wallets.length > 0,
      href: "/dashboard/wallet",
    },
    {
      title: "Pasang Budget Kategori",
      desc: "Tentukan batas pengeluaran bulanan",
      done: budgets.length > 0,
      href: "/dashboard/budget",
    },
  ];

  const recentTransactions = transactions.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Welcome Banner & Period Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Selamat datang, {profile.full_name.split(" ")[0]}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Berikut ringkasan kondisi keuangan dan arus kas kamu saat ini.
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200 shadow-sm self-start sm:self-auto overflow-x-auto">
          {[
            { id: "today", label: "Hari Ini" },
            { id: "week", label: "Minggu Ini" },
            { id: "month", label: "Bulan Ini" },
            { id: "year", label: "Tahun Ini" },
            { id: "all", label: "Semua" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setPeriod(item.id as PeriodFilter)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                period === item.id
                  ? "bg-orange-500 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Savings Preference & Financial Goal Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-orange-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 shadow-xs">
            <PiggyBank className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                Preferensi Tabungan Pengguna
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-1.5 text-xs sm:text-sm">
              <div>
                <span className="text-gray-500 font-medium">Tempat Menyimpan:</span>{" "}
                <span className="text-gray-900 font-bold">{profile.savings_preference || "Belum ditentukan"}</span>
              </div>
              <div className="hidden sm:inline text-gray-300">•</div>
              <div>
                <span className="text-gray-500 font-medium">Tujuan Tabungan:</span>{" "}
                <span className="text-orange-600 font-bold">{profile.savings_goal || "Belum ditentukan"}</span>
              </div>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => openSimulator("tabungan")}
          className="self-start sm:self-auto text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 shadow-xs"
        >
          <Bot className="w-4 h-4 text-orange-600" />
          <span>Atur / Ubah via Chatbot</span>
        </button>
      </div>

      {/* Onboarding Checklist Card (if not fully completed) */}
      {!profile.telegram_username && (
        <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 rounded-2xl p-5 sm:p-6 text-white shadow-lg shadow-orange-500/15">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-200" />
              <h3 className="font-bold text-base sm:text-lg">Mulai Cepat TataDana</h3>
            </div>
            <span className="text-xs font-semibold bg-white/20 px-2.5 py-0.5 rounded-full">
              Langkah Awal
            </span>
          </div>
          <p className="text-xs sm:text-sm text-orange-50/90 mb-4 max-w-xl">
            Selesaikan 3 langkah mudah ini agar fitur pencatatan otomatis via Telegram dan peringatan budget aktif maksimal.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {onboardingSteps.map((step, idx) => (
              <Link
                key={idx}
                href={step.href}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl p-3.5 border border-white/15 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-amber-200">Langkah {idx + 1}</span>
                    {step.done ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    ) : (
                      <Circle className="w-4 h-4 text-white/50" />
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-white">{step.title}</h4>
                  <p className="text-[11px] text-orange-100/80 mt-0.5 leading-snug">{step.desc}</p>
                </div>
                <div className="mt-3 flex items-center text-[11px] font-semibold text-white gap-1">
                  <span>Atur sekarang</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 5 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* Card 1: Saldo Total */}
        <Card className="border-l-4 border-l-orange-500">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Saldo</span>
            <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <WalletIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-gray-900">
            {formatRupiah(totalBalance)}
          </div>
          <div className="mt-2 text-xs text-gray-500 flex items-center gap-1.5">
            <span className="font-semibold text-orange-600">{wallets.length} Dompet</span>
            <span>terhubung</span>
          </div>
        </Card>

        {/* Card 2: Pemasukan */}
        <Card className="border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Pemasukan</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700">
            {formatRupiah(incomeTotal)}
          </div>
          <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
            <span>Periode {period}</span>
          </div>
        </Card>

        {/* Card 3: Pengeluaran */}
        <Card className="border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Pengeluaran</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-700">
            {formatRupiah(expenseTotal)}
          </div>
          <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
            <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />
            <span>Arus keluar</span>
          </div>
        </Card>

        {/* Card 4: Total Transaksi */}
        <Card className="border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Transaksi</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-gray-900">
            {filteredTransactions.length} <span className="text-xs font-semibold text-gray-400">Transaksi</span>
          </div>
          <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
            <span>{transactions.length === 0 ? "Belum ada transaksi" : `Total akun: ${transactions.length}`}</span>
          </div>
        </Card>

        {/* Card 5: Sisa Budget */}
        <Card className="border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Budget Tersisa</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <PiggyBank className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-blue-700">
            {formatRupiah(remainingBudget)}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            <span>Dari total {formatRupiah(totalBudgetMonthly)}</span>
          </div>
        </Card>
      </div>

      {/* Charts Section: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 cols): 6-Month Income vs Expense Bar Chart */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-gray-900 text-base">Arus Kas 6 Bulan Terakhir</h3>
              <p className="text-xs text-gray-400 mt-0.5">Perbandingan pemasukan vs pengeluaran</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-emerald-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Pemasukan
              </span>
              <span className="flex items-center gap-1.5 text-orange-600">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> Pengeluaran
              </span>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          {transactions.length === 0 ? (
            <div className="h-56 flex flex-col items-center justify-center text-center p-6 border-b border-gray-100">
              <span className="text-3xl mb-2">📊</span>
              <p className="text-sm font-semibold text-gray-700">Belum ada transaksi</p>
              <p className="text-xs text-gray-400 mt-1 max-w-sm">
                Grafik arus kas akan muncul secara otomatis setelah Anda mencatat transaksi pemasukan atau pengeluaran pertama.
              </p>
            </div>
          ) : (
            <div className="h-56 flex items-end justify-between gap-2 sm:gap-6 pt-6 pb-2 border-b border-gray-100">
              {sixMonthComparison.map((item, idx) => {
                const maxVal = Math.max(
                  1000000,
                  ...sixMonthComparison.map((m) => Math.max(m.income, m.expense))
                );
                const incHeight = maxVal > 0 && item.income > 0 ? Math.min(100, Math.round((item.income / maxVal) * 100)) : 0;
                const expHeight = maxVal > 0 && item.expense > 0 ? Math.min(100, Math.round((item.expense / maxVal) * 100)) : 0;

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <div className="w-full flex items-end justify-center gap-1 sm:gap-2 h-full">
                      {/* Income Bar */}
                      <div
                        style={{ height: `${incHeight}%` }}
                        className="w-3.5 sm:w-6 bg-emerald-400 group-hover:bg-emerald-500 rounded-t-lg transition-all relative"
                        title={`Pemasukan: ${formatRupiah(item.income)}`}
                      />
                      {/* Expense Bar */}
                      <div
                        style={{ height: `${expHeight}%` }}
                        className="w-3.5 sm:w-6 bg-orange-400 group-hover:bg-orange-500 rounded-t-lg transition-all relative"
                        title={`Pengeluaran: ${formatRupiah(item.expense)}`}
                      />
                    </div>
                    <span className="text-xs font-semibold text-gray-500">{item.month}</span>
                  </div>
                );
              })}
            </div>
          )}
          <div className="pt-3 text-[11px] text-gray-400 text-right">
            Nilai dalam jutaan Rupiah (IDR)
          </div>
        </Card>

        {/* Right (1 col): Expense by Category breakdown */}
        <Card>
          <div className="mb-4">
            <h3 className="font-bold text-gray-900 text-base">Pengeluaran per Kategori</h3>
            <p className="text-xs text-gray-400 mt-0.5">Distribusi pengeluaran periode ini</p>
          </div>

          {categoryExpenses.length === 0 ? (
            <div className="h-52 flex flex-col items-center justify-center text-center p-4">
              <span className="text-3xl mb-2">🍜</span>
              <p className="text-xs font-semibold text-gray-600">
                {transactions.length === 0 ? "Belum ada transaksi" : "Belum ada pengeluaran"}
              </p>
              <p className="text-[11px] text-gray-400 mt-1">
                Catat pengeluaran lewat chat bot atau tombol di atas.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {categoryExpenses.slice(0, 5).map((cat, idx) => {
                const pct = expenseTotal > 0 ? Math.round((cat.amount / expenseTotal) * 100) : 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 font-medium text-gray-700">
                        <span>{cat.emoji}</span>
                        <span className="truncate max-w-[130px]">{cat.name}</span>
                      </span>
                      <div className="text-right">
                        <span className="font-bold text-gray-900">{formatRupiah(cat.amount)}</span>
                        <span className="text-[10px] text-gray-400 ml-1">({pct}%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: cat.color || "#F97316",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-5 pt-3 border-t border-gray-100">
            <Link
              href="/dashboard/laporan"
              className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center justify-between"
            >
              <span>Lihat rincian laporan lengkap</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </Card>
      </div>

      {/* Recent 10 Transactions Table */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="font-bold text-gray-900 text-base">10 Transaksi Terbaru</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Update real-time dari Web, Bot Telegram, dan Foto Struk
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/dashboard/transaksi">
              <Button variant="outline" size="sm">
                Lihat Semua Transaksi
              </Button>
            </Link>
          </div>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm font-semibold text-gray-700">Belum ada transaksi</p>
            <p className="text-xs text-gray-400 mt-1 mb-4">
              Coba simulator bot untuk mencatat transaksi pertamamu sekarang!
            </p>
            <Button size="sm" onClick={() => openSimulator()}>
              Buka Simulator Bot
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/70 border-y border-gray-100 text-gray-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3">Tanggal (WIB)</th>
                  <th className="py-3 px-3">Sumber</th>
                  <th className="py-3 px-3">Kategori</th>
                  <th className="py-3 px-3">Dompet</th>
                  <th className="py-3 px-3">Catatan</th>
                  <th className="py-3 px-3 text-right">Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentTransactions.map((tx) => {
                  const cat = categories.find((c) => c.id === tx.category_id);
                  const wal = wallets.find((w) => w.id === tx.wallet_id);
                  const isIncome = tx.type === "income";

                  return (
                    <tr key={tx.id} className="hover:bg-orange-50/30 transition-colors">
                      <td className="py-3 px-3 text-gray-500 whitespace-nowrap">
                        {formatWIBShort(tx.transaction_date)}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {tx.source === "telegram_photo" ? (
                          <button
                            onClick={() => setSelectedReceiptTx(tx)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100"
                          >
                            <Receipt className="w-3 h-3" /> Foto Struk
                          </button>
                        ) : tx.source === "telegram_voice" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <Mic className="w-3 h-3" /> Voice
                          </span>
                        ) : tx.source === "telegram_text" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Bot className="w-3 h-3" /> Telegram
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">
                            Web
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-gray-800 font-medium whitespace-nowrap">
                        {cat ? `${cat.emoji} ${cat.name}` : tx.type === "transfer" ? "⇄ Transfer" : "-"}
                      </td>
                      <td className="py-3 px-3 text-gray-600 whitespace-nowrap">
                        {wal ? `${wal.icon} ${wal.name}` : "-"}
                      </td>
                      <td className="py-3 px-3 text-gray-900 font-medium max-w-xs truncate">
                        {tx.description}
                        {tx.receipt_items && tx.receipt_items.length > 0 && (
                          <button
                            onClick={() => setSelectedReceiptTx(tx)}
                            className="ml-2 text-[10px] font-bold text-orange-600 underline hover:text-orange-700"
                          >
                            ({tx.receipt_items.length} item)
                          </button>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-bold whitespace-nowrap">
                        <span className={isIncome ? "text-emerald-600" : "text-gray-900"}>
                          {isIncome ? "+" : "-"} {formatRupiah(tx.amount)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Receipt Item Expansion Modal */}
      <ReceiptDetailModal
        transaction={selectedReceiptTx}
        onClose={() => setSelectedReceiptTx(null)}
      />
    </div>
  );
}
