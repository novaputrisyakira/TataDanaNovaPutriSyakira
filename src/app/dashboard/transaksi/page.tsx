"use client";

import React, { useState, useMemo } from "react";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import {
  CreditCard,
  Search,
  Filter,
  Trash2,
  Receipt,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRightLeft,
  Bot,
  Mic,
  Calendar,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/utils/currency";
import { formatWIBShort } from "@/lib/utils/date-wib";
import { ReceiptDetailModal } from "@/components/transactions/ReceiptDetailModal";
import { Transaction } from "@/types";

export default function TransactionsPage() {
  const { transactions, wallets, categories, openTransactionModal, refreshData } = useDashboard();

  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedWallet, setSelectedWallet] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedReceiptTx, setSelectedReceiptTx] = useState<Transaction | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (search && !tx.description.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (selectedType !== "all" && tx.type !== selectedType) {
        return false;
      }
      if (selectedWallet !== "all" && tx.wallet_id !== selectedWallet) {
        return false;
      }
      if (selectedCategory !== "all" && tx.category_id !== selectedCategory) {
        return false;
      }
      return true;
    });
  }, [transactions, search, selectedType, selectedWallet, selectedCategory]);

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah kamu yakin ingin menghapus transaksi ini? Saldo dompet akan otomatis disesuaikan kembali.")) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/transactions?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await refreshData();
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            💳 Daftar Transaksi
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Semua catatan pemasukan, pengeluaran, dan transfer antar dompet.
          </p>
        </div>

        <Button onClick={openTransactionModal} className="gap-2 self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          <span>Tambah Transaksi</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari catatan transaksi..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>

          {/* Type filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-300"
          >
            <option value="all">Semua Jenis Transaksi</option>
            <option value="expense">💸 Pengeluaran Saja</option>
            <option value="income">💰 Pemasukan Saja</option>
            <option value="transfer">⇄ Transfer Antar Dompet</option>
          </select>

          {/* Wallet filter */}
          <select
            value={selectedWallet}
            onChange={(e) => setSelectedWallet(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-300"
          >
            <option value="all">Semua Dompet</option>
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.icon} {w.name}
              </option>
            ))}
          </select>

          {/* Category filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-300"
          >
            <option value="all">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.emoji} {c.name}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Transactions Table */}
      <Card className="p-0 overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="py-16 text-center">
            <CreditCard className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-gray-700">
              {transactions.length === 0 ? "Belum ada transaksi" : "Tidak ada transaksi ditemukan"}
            </p>
            <p className="text-xs text-gray-400 mt-1 mb-4">
              {transactions.length === 0
                ? "Mulai kelola keuanganmu dengan mencatat transaksi pertamamu."
                : "Coba ganti filter atau catat transaksi barumu sekarang."}
            </p>
            <Button size="sm" onClick={openTransactionModal}>
              + Catat Transaksi
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Tanggal (WIB)</th>
                  <th className="py-3 px-4">Tipe</th>
                  <th className="py-3 px-4">Sumber</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Dompet</th>
                  <th className="py-3 px-4">Catatan</th>
                  <th className="py-3 px-4 text-right">Nominal</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTransactions.map((tx) => {
                  const cat = categories.find((c) => c.id === tx.category_id);
                  const wal = wallets.find((w) => w.id === tx.wallet_id);
                  const toWal = tx.to_wallet_id ? wallets.find((w) => w.id === tx.to_wallet_id) : null;
                  const isIncome = tx.type === "income";
                  const isTransfer = tx.type === "transfer";

                  return (
                    <tr key={tx.id} className="hover:bg-orange-50/20 transition-colors">
                      <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                        {formatWIBShort(tx.transaction_date)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isTransfer ? (
                          <Badge variant="blue">Transfer</Badge>
                        ) : isIncome ? (
                          <Badge variant="green">Masuk</Badge>
                        ) : (
                          <Badge variant="orange">Keluar</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {tx.source === "telegram_photo" ? (
                          <button
                            onClick={() => setSelectedReceiptTx(tx)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100"
                          >
                            <Receipt className="w-3 h-3" /> Foto Struk
                          </button>
                        ) : tx.source === "telegram_voice" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <Mic className="w-3 h-3" /> Voice Note
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
                      <td className="py-3 px-4 font-medium text-gray-800 whitespace-nowrap">
                        {cat ? `${cat.emoji} ${cat.name}` : isTransfer ? "⇄ Transfer" : "-"}
                      </td>
                      <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                        {isTransfer ? (
                          <span>
                            {wal?.name} → {toWal?.name}
                          </span>
                        ) : (
                          <span>{wal ? `${wal.icon} ${wal.name}` : "-"}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900 max-w-xs truncate">
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
                      <td className="py-3 px-4 text-right font-bold whitespace-nowrap">
                        <span
                          className={
                            isIncome
                              ? "text-emerald-600"
                              : isTransfer
                              ? "text-blue-600"
                              : "text-gray-900"
                          }
                        >
                          {isIncome ? "+" : isTransfer ? "⇄" : "-"} {formatRupiah(tx.amount)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleDelete(tx.id)}
                          disabled={deletingId === tx.id}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          title="Hapus transaksi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Receipt Item Modal */}
      <ReceiptDetailModal
        transaction={selectedReceiptTx}
        onClose={() => setSelectedReceiptTx(null)}
      />
    </div>
  );
}
