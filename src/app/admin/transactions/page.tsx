"use client";

import React, { useState, useEffect } from "react";
import { Eye, ShieldAlert, Lock, CheckCircle2, Search, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/utils/currency";
import { formatWIBShort } from "@/lib/utils/date-wib";
import { Transaction, AuditLog } from "@/types";

export default function AdminTransactionsAuditPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [reason, setReason] = useState("");
  const [unlockedTransactions, setUnlockedTransactions] = useState<Transaction[] | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadInitial = async () => {
    try {
      const uRes = await fetch("/api/admin/users", { cache: "no-store" });
      const uData = await uRes.json();
      if (uData.ok) {
        setUsers(uData.data);
        if (uData.data.length > 0) setSelectedUserId(uData.data[0].id);
      }

      const aRes = await fetch("/api/admin/audit-logs", { cache: "no-store" });
      const aData = await aRes.json();
      if (aData.ok) setAuditLogs(aData.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadInitial();
  }, []);

  const handleUnlockTransactions = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!reason.trim() || reason.trim().length < 8) {
      setError("Alasan inspeksi wajib diisi secara detail (minimal 8 karakter) demi kepatuhan privasi.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/audit-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: selectedUserId,
          action: "view_transactions",
          reason: reason.trim(),
        }),
      });

      const d = await res.json();
      if (!res.ok) {
        throw new Error(d.error || "Gagal memverifikasi audit privasi");
      }

      setUnlockedTransactions(d.transactions);
      setReason("");
      // Refresh audit logs
      const aRes = await fetch("/api/admin/audit-logs");
      const aData = await aRes.json();
      if (aData.ok) setAuditLogs(aData.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedUser = users.find((u) => u.id === selectedUserId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          🔍 Inspeksi Transaksi Pengguna & Audit Privasi
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Akses audit data transaksi pengguna yang dilindungi sistem logging privasi ketat.
        </p>
      </div>

      {/* Audit Enforcement Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-amber-950">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-bold">Protokol Kepatuhan Privasi Data Keuangan (Fintech Standard)</p>
          <p className="text-amber-900/80 leading-relaxed">
            Data transaksi pengguna bersifat rahasia. Setiap kali admin membuka data transaksi pengguna, sistem mewajibkan pengisian alasan resmi (misal: nomor tiket bantuan) dan akan mencatat IP, email admin, dan timestamp secara permanen di Audit Log yang tidak dapat dihapus.
          </p>
        </div>
      </div>

      {/* Selection & Authorization Form */}
      <Card className="p-5 border-slate-200">
        <form onSubmit={handleUnlockTransactions} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Pilih Pengguna yang Diinspeksi
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => {
                  setSelectedUserId(e.target.value);
                  setUnlockedTransactions(null);
                }}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-orange-300"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} ({u.phone_number || "Tanpa No HP"}) — ID: {u.id}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Alasan Inspeksi (Wajib untuk Audit Log)
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Contoh: Investigasi keluhan selisih saldo Tiket #982"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-orange-300"
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-3 text-xs bg-red-50 text-red-700 rounded-xl border border-red-200">
              {error}
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" isLoading={loading} className="gap-2">
              <Lock className="w-4 h-4" />
              <span>Otorisasi & Buka Data Transaksi</span>
            </Button>
          </div>
        </form>
      </Card>

      {/* Unlocked Transactions Result */}
      {unlockedTransactions && (
        <Card className="p-0 border-emerald-300 overflow-hidden shadow-md">
          <div className="bg-emerald-50 px-5 py-3 border-b border-emerald-200 flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-900">
              Data Transaksi: {selectedUser?.full_name} ({unlockedTransactions.length} Transaksi)
            </span>
            <Badge variant="green">Otorisasi Tercatat</Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-semibold uppercase">
                <tr>
                  <th className="py-2.5 px-4">Waktu (WIB)</th>
                  <th className="py-2.5 px-4">Tipe</th>
                  <th className="py-2.5 px-4">Sumber</th>
                  <th className="py-2.5 px-4">Catatan</th>
                  <th className="py-2.5 px-4 text-right">Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {unlockedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Pengguna ini belum memiliki transaksi.
                    </td>
                  </tr>
                ) : (
                  unlockedTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">
                        {formatWIBShort(tx.transaction_date)}
                      </td>
                      <td className="py-2.5 px-4">
                        <Badge variant={tx.type === "income" ? "green" : "orange"}>
                          {tx.type}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[11px] text-slate-600">
                        {tx.source}
                      </td>
                      <td className="py-2.5 px-4 text-slate-900 font-medium">
                        {tx.description}
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                        {formatRupiah(tx.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Permanent Audit Log Table */}
      <Card className="p-0 border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">Riwayat Audit Akses Transaksi</h3>
          <span className="text-xs text-slate-400">{auditLogs.length} Entri Tercatat</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
              <tr>
                <th className="py-2.5 px-4">Waktu Audit</th>
                <th className="py-2.5 px-4">Admin</th>
                <th className="py-2.5 px-4">Target User ID</th>
                <th className="py-2.5 px-4">Alasan Akses</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">
                    {formatWIBShort(log.created_at)}
                  </td>
                  <td className="py-2.5 px-4 font-semibold text-slate-800">
                    {log.admin_email}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-[11px] text-slate-600">
                    {log.target_user_id}
                  </td>
                  <td className="py-2.5 px-4 text-slate-900">{log.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
