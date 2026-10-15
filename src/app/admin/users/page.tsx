"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  Clock,
  Shield,
  Filter,
  ExternalLink,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const loadUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      const d = await res.json();
      if (d.ok) setUsers(d.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleTogglePlan = async (userId: string, currentPlan: string) => {
    const newPlan = currentPlan === "starter" ? "pro" : "starter";
    try {
      await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, plan: newPlan }),
      });
      await loadUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerify = async (userId: string, action: "approve" | "reject", userName: string) => {
    let reason: string | null = undefined;
    if (action === "reject") {
      reason = window.prompt(
        `Masukkan alasan penolakan pendaftaran untuk ${userName}:`,
        "Data pendaftaran tidak memenuhi kriteria verifikasi."
      );
      if (reason === null) return; // cancelled
    }

    setProcessingId(userId);
    setNotification(null);
    try {
      const res = await fetch("/api/admin/users/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action, reason }),
      });
      const data = await res.json();
      if (data.ok) {
        setNotification({
          message:
            action === "approve"
              ? `Akun ${userName} berhasil disetujui. User kini memiliki akses ke dashboard user.`
              : `Pendaftaran akun ${userName} telah ditolak.`,
          type: action === "approve" ? "success" : "error",
        });
        await loadUsers();
      } else {
        setNotification({
          message: data.error || "Gagal memperbarui status akun.",
          type: "error",
        });
      }
    } catch (err: any) {
      setNotification({
        message: `Terjadi kesalahan: ${err.message}`,
        type: "error",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    // 1. Status Filter
    const vStatus = u.verification_status || (u.is_superadmin ? "approved" : "pending");
    if (statusFilter !== "all" && vStatus !== statusFilter) {
      return false;
    }

    // 2. Search Box Filter
    if (search) {
      const q = search.toLowerCase();
      return (
        u.full_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.phone_number?.includes(search) ||
        u.telegram_username?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pendingCount = users.filter((u) => (u.verification_status || "pending") === "pending" && !u.is_superadmin).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            👥 Manajemen Pengguna & Verifikasi
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Daftar seluruh akun terdaftar, status verifikasi pendaftaran, dan paket langganan.
          </p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, email, HP, atau telegram..."
            className="pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-300 w-72"
          />
        </div>
      </div>

      {/* Action Notification Toast */}
      {notification && (
        <div
          className={`p-4 rounded-xl border flex items-start justify-between gap-3 text-xs shadow-sm animate-in slide-in-from-top-2 duration-200 ${
            notification.type === "success"
              ? "bg-emerald-50 border-emerald-300 text-emerald-900"
              : "bg-rose-50 border-rose-300 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-2 font-medium">
            <span className="text-base">{notification.type === "success" ? "✅" : "⚠️"}</span>
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="font-bold ml-2 hover:opacity-75"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { id: "all", label: `Semua (${users.length})` },
          { id: "pending", label: `Menunggu Verifikasi (${pendingCount})`, badge: pendingCount > 0 },
          { id: "approved", label: "Disetujui" },
          { id: "rejected", label: "Ditolak" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id as any)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              statusFilter === tab.id
                ? "bg-orange-500 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <span>{tab.label}</span>
            {tab.badge && statusFilter !== tab.id && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </button>
        ))}
      </div>

      {/* Users Table */}
      <Card className="p-0 border-slate-200 overflow-hidden bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Pengguna</th>
                <th className="py-3 px-4">No. HP</th>
                <th className="py-3 px-4">Status Akun</th>
                <th className="py-3 px-4">Paket Akun</th>
                <th className="py-3 px-4">Telegram</th>
                <th className="py-3 px-4">Statistik</th>
                <th className="py-3 px-4 text-right">Aksi Superadmin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ada pengguna yang cocok dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const vStatus = u.verification_status || (u.is_superadmin ? "approved" : "pending");
                  const isPrimaryAdmin = u.email?.toLowerCase().trim() === "novaputrisyakira648@gmail.com";

                  return (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      {/* Name & Email */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{u.full_name}</span>
                          {u.is_superadmin && (
                            <Badge variant="purple" className="text-[9px] py-0 px-1.5">
                              Admin
                            </Badge>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">{u.email || "-"}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{u.id}</div>
                      </td>

                      {/* Phone */}
                      <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                        {u.phone_number || "-"}
                      </td>

                      {/* Verification Status Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {vStatus === "approved" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Disetujui
                          </span>
                        ) : vStatus === "pending" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-300 animate-pulse">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Menunggu Verifikasi
                          </span>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <XCircle className="w-3 h-3 text-rose-600" />
                              Ditolak
                            </span>
                            {u.rejection_reason && (
                              <p className="text-[10px] text-rose-500 max-w-xs truncate" title={u.rejection_reason}>
                                {u.rejection_reason}
                              </p>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Plan & Payment Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <button
                            onClick={() => handleTogglePlan(u.id, u.plan)}
                            title="Klik untuk ubah plan"
                          >
                            <Badge variant={u.plan === "pro" ? "green" : "orange"} className="font-bold">
                              {u.plan === "pro" ? "PRO (Rp99.000)" : "STARTER (Rp49.000)"}
                            </Badge>
                          </button>
                          {u.payment && (
                            <div className="space-y-0.5">
                              <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                <span className="font-medium capitalize">{u.payment.method?.replace("_", " ")}:</span>
                                <span className={`font-bold px-1.5 py-0.2 rounded text-[9px] ${
                                  u.payment.status === "approved" || u.payment.status === "settlement"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : u.payment.status === "pending"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-rose-100 text-rose-800"
                                }`}>
                                  {u.payment.status}
                                </span>
                              </div>
                              {u.payment.proof_image_url && (
                                <a
                                  href={u.payment.proof_image_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-600 hover:text-orange-700 hover:underline pt-0.5"
                                >
                                  <span>Lihat Bukti</span>
                                  <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Telegram */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {u.telegram_username ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            @{u.telegram_username}
                          </span>
                        ) : (
                          <span className="text-slate-400">Belum Link</span>
                        )}
                      </td>

                      {/* Stats */}
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        <div>{u.txCount || 0} Transaksi</div>
                        <div className="text-[11px] text-slate-400">{u.walletCount || 0} Dompet</div>
                      </td>

                      {/* Superadmin Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                        {/* Approval / Rejection buttons if pending */}
                        {vStatus === "pending" && (
                          <>
                            <Button
                              size="sm"
                              disabled={processingId === u.id}
                              onClick={() => handleVerify(u.id, "approve", u.full_name)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-1 px-2.5 h-7 shadow-sm gap-1"
                              title="Setujui pendaftaran akun"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Setujui</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={processingId === u.id}
                              onClick={() => handleVerify(u.id, "reject", u.full_name)}
                              className="border-rose-200 text-rose-700 hover:bg-rose-50 font-bold text-xs py-1 px-2.5 h-7 gap-1"
                              title="Tolak pendaftaran akun"
                            >
                              <XCircle className="w-3 h-3" />
                              <span>Tolak</span>
                            </Button>
                          </>
                        )}

                        {/* Re-approval if rejected */}
                        {vStatus === "rejected" && (
                          <Button
                            size="sm"
                            disabled={processingId === u.id}
                            onClick={() => handleVerify(u.id, "approve", u.full_name)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-1 px-2.5 h-7 shadow-sm gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Setujui Ulang</span>
                          </Button>
                        )}

                        {/* Audited Inspection (Complies with Requirement 1 - admin cannot enter user dashboard) */}
                        <Link
                          href={`/admin/transactions?userId=${u.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-lg text-xs transition-colors border border-purple-200"
                          title="Inspeksi transaksi ber-audit"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Inspeksi</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
