"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wallet, Category, TransactionType } from "@/types";
import { formatRupiah } from "@/lib/utils/currency";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallets: Wallet[];
  categories: Category[];
  userId: string;
  onSuccess: () => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  wallets,
  categories,
  userId,
  onSuccess,
}) => {
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [walletId, setWalletId] = useState(wallets[0]?.id || "");
  const [toWalletId, setToWalletId] = useState(wallets[1]?.id || "");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filteredCategories = categories.filter((c) => c.type === (type === "income" ? "income" : "expense"));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const parsedAmount = parseInt(amount.replace(/\D/g, ""), 10);
    if (!parsedAmount || parsedAmount <= 0) {
      setError("Masukkan nominal yang valid");
      return;
    }

    if (!description.trim()) {
      setError("Masukkan catatan / keterangan transaksi");
      return;
    }

    if (type === "transfer" && walletId === toWalletId) {
      setError("Dompet asal dan tujuan tidak boleh sama");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          walletId,
          toWalletId: type === "transfer" ? toWalletId : undefined,
          categoryId: type === "transfer" ? undefined : (categoryId || filteredCategories[0]?.id),
          type,
          amount: parsedAmount,
          description,
          transactionDate: new Date(date).toISOString(),
          source: "web",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menyimpan transaksi");
      }

      setAmount("");
      setDescription("");
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Catat Transaksi Baru"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type selector tabs */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-gray-100 rounded-xl">
          <button
            type="button"
            onClick={() => setType("expense")}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              type === "expense"
                ? "bg-white text-rose-600 shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            💸 Pengeluaran
          </button>
          <button
            type="button"
            onClick={() => setType("income")}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              type === "income"
                ? "bg-white text-emerald-600 shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            💰 Pemasukan
          </button>
          <button
            type="button"
            onClick={() => setType("transfer")}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              type === "transfer"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            ⇄ Transfer
          </button>
        </div>

        {error && (
          <div className="p-3 text-xs bg-red-50 border border-red-200 text-red-700 rounded-xl">
            {error}
          </div>
        )}

        {/* Nominal Input */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
            Nominal
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-sm font-bold text-gray-500">
              Rp
            </span>
            <input
              type="text"
              value={amount}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                setAmount(val ? parseInt(val, 10).toLocaleString("id-ID") : "");
              }}
              placeholder="0"
              required
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-lg font-bold text-gray-900 focus:outline-none focus:ring-4 focus:ring-orange-200 focus:border-orange-500 transition-all"
            />
          </div>
        </div>

        {/* Wallets */}
        {type !== "transfer" ? (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
              Pilih Dompet
            </label>
            <select
              value={walletId}
              onChange={(e) => setWalletId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-4 focus:ring-orange-200 focus:border-orange-500"
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.icon} {w.name} (Saldo: {formatRupiah(w.balance)})
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                Dari Dompet
              </label>
              <select
                value={walletId}
                onChange={(e) => setWalletId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:ring-2 focus:ring-orange-300"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.icon} {w.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                Ke Dompet
              </label>
              <select
                value={toWalletId}
                onChange={(e) => setToWalletId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:ring-2 focus:ring-orange-300"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.icon} {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Category (if not transfer) */}
        {type !== "transfer" && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
              Kategori
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-4 focus:ring-orange-200 focus:border-orange-500"
            >
              {filteredCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Catatan / Description */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
            Catatan
          </label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Contoh: Makan siang Nasi Padang, Belanja Mingguan..."
            required
          />
        </div>

        {/* Tanggal */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
            Tanggal Transaksi
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-4 focus:ring-orange-200 focus:border-orange-500"
          />
        </div>

        <div className="pt-2 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Batal
          </Button>
          <Button type="submit" variant="primary" isLoading={loading}>
            Simpan Transaksi
          </Button>
        </div>
      </form>
    </Modal>
  );
};
