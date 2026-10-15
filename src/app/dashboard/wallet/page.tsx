"use client";

import React, { useState } from "react";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import { Wallet as WalletIcon, Plus, Check, Star, ArrowRightLeft, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { formatRupiah } from "@/lib/utils/currency";
import { Wallet, WalletType } from "@/types";

export default function WalletPage() {
  const { profile, wallets, refreshData, openTransactionModal } = useDashboard();

  const [modalOpen, setModalOpen] = useState(false);
  const [walletName, setWalletName] = useState("");
  const [walletType, setWalletType] = useState<WalletType>("bank");
  const [initialBalance, setInitialBalance] = useState("");
  const [walletIcon, setWalletIcon] = useState("💳");
  const [isDefault, setIsDefault] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const iconOptions = ["💵", "🏦", "💳", "📱", "🪙", "👛", "📈"];

  const handleCreateWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!walletName.trim()) {
      setError("Nama dompet wajib diisi");
      return;
    }

    const parsedBalance = initialBalance ? parseInt(initialBalance.replace(/\D/g, ""), 10) : 0;

    setLoading(true);
    try {
      const res = await fetch("/api/wallets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: profile.id,
          name: walletName.trim(),
          type: walletType,
          balance: parsedBalance,
          icon: walletIcon,
          isDefault,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Gagal membuat dompet");
      }

      setWalletName("");
      setInitialBalance("");
      setIsDefault(false);
      await refreshData();
      setModalOpen(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (walletId: string) => {
    try {
      await fetch("/api/wallets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: walletId, isDefault: true }),
      });
      await refreshData();
    } catch (err) {
      console.error(err);
    }
  };

  const totalBalance = wallets.reduce((s, w) => s + w.balance, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            👛 Dompet & Rekening Keuangan
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Kelola multi-dompet (Kas Tunai, Rekening Bank, E-Wallet) dan tentukan dompet default Telegram.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button variant="outline" size="sm" onClick={openTransactionModal} className="gap-1.5">
            <ArrowRightLeft className="w-4 h-4 text-blue-600" />
            <span>Transfer Antar Dompet</span>
          </Button>

          <Button size="sm" onClick={() => setModalOpen(true)} className="gap-1.5">
            <Plus className="w-4 h-4" />
            <span>Tambah Dompet</span>
          </Button>
        </div>
      </div>

      {/* Total Balance Card */}
      <Card className="bg-gradient-to-tr from-gray-900 via-gray-800 to-gray-900 text-white p-6 shadow-xl">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
          Total Saldo Tergabung
        </span>
        <div className="text-2xl sm:text-3xl font-black mt-1 text-white">
          {formatRupiah(totalBalance)}
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Tersebar di {wallets.length} dompet aktif. Dompet berikon ⭐ adalah tujuan default saat mencatat dari Telegram.
        </p>
      </Card>

      {/* Wallets Grid */}
      {wallets.length === 0 ? (
        <Card className="p-8 text-center">
          <WalletIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-gray-700">Belum ada dompet</p>
          <p className="text-xs text-gray-400 mt-1 mb-4">Tambahkan dompet pertamamu untuk mulai mengelola keuangan.</p>
          <Button size="sm" onClick={() => setModalOpen(true)}>+ Tambah Dompet</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {wallets.map((wallet) => (
            <Card
              key={wallet.id}
              className={`relative p-5 transition-all ${
                wallet.is_default ? "border-2 border-orange-500 shadow-md" : "border-gray-200"
              }`}
            >
              {wallet.is_default && (
                <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-[10px] font-extrabold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                  <Star className="w-3 h-3 fill-orange-500 text-orange-500" />
                  Default Bot
                </span>
              )}

              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl p-2.5 rounded-xl bg-orange-50 border border-orange-100">
                  {wallet.icon}
                </span>
                <div>
                  <h4 className="font-bold text-gray-900 text-base">{wallet.name}</h4>
                  <span className="text-[11px] font-medium uppercase text-gray-400">
                    {wallet.type}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <span className="text-xs text-gray-400 block mb-0.5">Saldo Saat Ini</span>
                <div className="text-xl font-black text-gray-900">
                  {formatRupiah(wallet.balance)}
                </div>
              </div>

              {!wallet.is_default && (
                <button
                  onClick={() => handleSetDefault(wallet.id)}
                  className="mt-4 w-full py-1.5 px-3 rounded-lg border border-gray-200 hover:border-orange-500 text-xs font-semibold text-gray-600 hover:text-orange-600 transition-colors"
                >
                  Jadikan Dompet Default
                </button>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Add Wallet Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Tambah Dompet Baru"
        maxWidth="md"
      >
        <form onSubmit={handleCreateWallet} className="space-y-4">
          {error && (
            <div className="p-3 text-xs bg-red-50 text-red-700 rounded-xl border border-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
              Nama Dompet / Rekening
            </label>
            <Input
              value={walletName}
              onChange={(e) => setWalletName(e.target.value)}
              placeholder="Contoh: BCA Tabungan, GoPay, Tunai..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                Jenis Dompet
              </label>
              <select
                value={walletType}
                onChange={(e) => setWalletType(e.target.value as WalletType)}
                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl"
              >
                <option value="bank">Rekening Bank</option>
                <option value="cash">Uang Tunai</option>
                <option value="ewallet">E-Wallet (GoPay/OVO)</option>
                <option value="investment">Investasi</option>
                <option value="other">Lainnya</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                Pilih Ikon
              </label>
              <div className="flex gap-1.5">
                {iconOptions.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setWalletIcon(icon)}
                    className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center transition-all ${
                      walletIcon === icon
                        ? "bg-orange-100 border-2 border-orange-500 scale-110"
                        : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
              Saldo Awal
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-sm font-bold text-gray-500">
                Rp
              </span>
              <input
                type="text"
                value={initialBalance}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  setInitialBalance(val ? parseInt(val, 10).toLocaleString("id-ID") : "");
                }}
                placeholder="0"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-base font-bold text-gray-900 focus:outline-none focus:ring-4 focus:ring-orange-200 focus:border-orange-500"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="rounded text-orange-500 focus:ring-orange-400 w-4 h-4"
            />
            <span>Jadikan sebagai dompet default untuk transaksi Telegram</span>
          </label>

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
              Simpan Dompet
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
