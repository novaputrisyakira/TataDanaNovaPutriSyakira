"use client";

import React, { useState } from "react";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import { Target, Plus, AlertTriangle, CheckCircle, Sparkles, Bell } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { formatRupiah } from "@/lib/utils/currency";
import { generateAsciiProgressBar } from "@/lib/telegram/formatter";

export default function BudgetPage() {
  const { profile, budgets, categories, transactions, refreshData } = useDashboard();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCatId, setSelectedCatId] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const currentMonthPrefix = `${currentYear}-${String(currentMonth).padStart(2, "0")}`;

  const expenseCategories = categories.filter((c) => c.type === "expense");

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const parsedAmount = parseInt(amountStr.replace(/\D/g, ""), 10);
    if (!parsedAmount || parsedAmount <= 0) {
      setError("Masukkan nominal budget yang valid");
      return;
    }

    const catId = selectedCatId || expenseCategories[0]?.id;
    if (!catId) {
      setError("Pilih kategori pengeluaran");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: profile.id,
          categoryId: catId,
          amount: parsedAmount,
          month: currentMonth,
          year: currentYear,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Gagal menyimpan budget");
      }

      setAmountStr("");
      await refreshData();
      setModalOpen(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            🎯 Budget & Pengendalian Pengeluaran
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Batas pengeluaran per kategori bulan ini dengan peringatan otomatis via Telegram.
          </p>
        </div>

        <Button onClick={() => setModalOpen(true)} className="gap-2 self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          <span>Pasang Budget Baru</span>
        </Button>
      </div>

      {/* Telegram Alert Info Banner */}
      <div className="bg-orange-50 border border-orange-200/80 rounded-2xl p-4 flex items-start gap-3 text-orange-950">
        <Bell className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
        <div className="text-xs space-y-0.5">
          <p className="font-bold">Notifikasi Peringatan Otomatis Aktif</p>
          <p className="text-orange-900/80">
            TataDana akan otomatis mengirimkan pesan Telegram saat pengeluaran kategori mencapai 80% (Waspada) dan 100% (Budget Habis) agar kamu tidak boncos sebelum akhir bulan.
          </p>
        </div>
      </div>

      {/* Budget Grid */}
      {budgets.length === 0 ? (
        <Card className="py-16 text-center">
          <Target className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <h3 className="font-bold text-gray-800 text-sm">Belum Ada Budget Ditentukan</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto mb-4">
            Mulai atur batas belanja bulanan per kategori untuk mengendalikan pengeluaran harianmu.
          </p>
          <Button size="sm" onClick={() => setModalOpen(true)}>
            + Pasang Budget Pertama
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map((b) => {
            const cat = categories.find((c) => c.id === b.category_id);
            const spent = transactions
              .filter(
                (t) =>
                  t.category_id === b.category_id &&
                  t.transaction_date.startsWith(currentMonthPrefix)
              )
              .reduce((s, t) => s + t.amount, 0);

            const pct = Math.round((spent / b.amount) * 100);
            const sisa = Math.max(0, b.amount - spent);
            const isOver = pct >= 100;
            const isWarning = pct >= 80 && !isOver;

            return (
              <Card key={b.id} className="relative overflow-hidden">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl p-2 rounded-xl bg-orange-50 border border-orange-100">
                      {cat?.emoji || "🏷️"}
                    </span>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">{cat?.name || "Kategori"}</h4>
                      <p className="text-[11px] text-gray-400">
                        Bulan {currentMonth} / {currentYear}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      isOver
                        ? "bg-rose-100 text-rose-700"
                        : isWarning
                        ? "bg-amber-100 text-amber-800"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {pct}% Terpakai
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5 my-3">
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${
                        isOver
                          ? "bg-rose-500"
                          : isWarning
                          ? "bg-amber-500"
                          : "bg-orange-500"
                      }`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Terpakai: {formatRupiah(spent)}</span>
                    <span className="font-semibold text-gray-700">
                      Batas: {formatRupiah(b.amount)}
                    </span>
                  </div>
                </div>

                {/* Status Box */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="text-gray-500">Sisa saldo budget:</span>
                  <span
                    className={`font-black ${
                      isOver ? "text-rose-600" : "text-gray-900"
                    }`}
                  >
                    {isOver ? "Rp0 (Habis)" : formatRupiah(sisa)}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add / Edit Budget Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Pasang Budget Bulanan"
        maxWidth="md"
      >
        <form onSubmit={handleSaveBudget} className="space-y-4">
          {error && (
            <div className="p-3 text-xs bg-red-50 text-red-700 rounded-xl border border-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
              Pilih Kategori
            </label>
            <select
              value={selectedCatId}
              onChange={(e) => setSelectedCatId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-4 focus:ring-orange-200 focus:border-orange-500"
            >
              {expenseCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
              Target Batas Pengeluaran (Bulan Ini)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-sm font-bold text-gray-500">
                Rp
              </span>
              <input
                type="text"
                value={amountStr}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  setAmountStr(val ? parseInt(val, 10).toLocaleString("id-ID") : "");
                }}
                placeholder="Contoh: 1.500.000"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-lg font-bold text-gray-900 focus:outline-none focus:ring-4 focus:ring-orange-200 focus:border-orange-500"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" isLoading={loading}>
              Simpan Budget
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
