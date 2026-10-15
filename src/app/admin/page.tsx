"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  CreditCard,
  Cpu,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  Image as ImageIcon,
  ExternalLink,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatWIBShort } from "@/lib/utils/date-wib";
import { formatRupiah } from "@/lib/utils/currency";

export default function AdminOverviewPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    proUsers: 0,
    starterUsers: 0,
    pendingVerifications: 0,
    pendingPayments: 0,
    totalTransactions: 0,
    aiRequests: 2,
    avgLatency: 785,
  });

  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const fetchAdminStats = async () => {
    try {
      const [usersRes, paymentsRes] = await Promise.all([
        fetch("/api/admin/users", { cache: "no-store" }),
        fetch("/api/admin/payments", { cache: "no-store" }),
      ]);
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        if (usersData.ok && Array.isArray(usersData.data)) {
          const users = usersData.data;
          const pro = users.filter((u: any) => u.plan === "pro").length;
          const starter = users.filter((u: any) => u.plan === "starter").length;
          const txs = users.reduce((acc: number, u: any) => acc + (u.txCount || 0), 0);
          const pending = users.filter(
            (u: any) => u.verification_status === "pending" && !u.is_superadmin
          );

          setPendingUsers(pending);
          setStats((prev) => ({
            ...prev,
            totalUsers: users.length,
            proUsers: pro,
            starterUsers: starter,
            pendingVerifications: pending.length,
            totalTransactions: txs,
          }));
        }
      }
      if (paymentsRes.ok) {
        const payData = await paymentsRes.json();
        if (payData.ok && Array.isArray(payData.data)) {
          const pending = payData.data.filter((p: any) => p.status === "pending").length;
          setStats((prev) => ({
            ...prev,
            pendingPayments: pending,
          }));
        }
      }
    } catch (e) {
      console.error("Failed to load admin overview metrics:", e);
    }
  };

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const handleApprove = async (userId: string, userName: string) => {
    setProcessingId(userId);
    setActionNotice(null);
    try {
      const res = await fetch("/api/admin/users/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: "approve" }),
      });
      const data = await res.json();
      if (data.ok) {
        setActionNotice({
          message: `Akun ${userName} berhasil disetujui. Pengguna kini dapat langsung mengakses dashboard user.`,
          type: "success",
        });
        await fetchAdminStats();
      } else {
        setActionNotice({
          message: data.error || "Gagal menyetujui akun.",
          type: "error",
        });
      }
    } catch (err: any) {
      setActionNotice({
        message: `Terjadi kesalahan: ${err.message}`,
        type: "error",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (userId: string, userName: string) => {
    const promptInput =
      typeof window !== "undefined"
        ? window.prompt(
            `Masukkan alasan penolakan untuk akun ${userName}:`,
            "Data pendaftaran tidak valid atau tidak memenuhi kriteria verifikasi."
          )
        : null;
    if (promptInput === null) return; // cancelled
    const reason = promptInput.trim() || "Data pendaftaran tidak valid atau tidak memenuhi kriteria verifikasi.";

    setProcessingId(userId);
    setActionNotice(null);
    try {
      const res = await fetch("/api/admin/users/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: "reject", reason }),
      });
      const data = await res.json();
      if (data.ok) {
        setActionNotice({
          message: `Pendaftaran akun ${userName} telah ditolak.`,
          type: "error",
        });
        await fetchAdminStats();
      } else {
        setActionNotice({
          message: data.error || "Gagal menolak akun.",
          type: "error",
        });
      }
    } catch (err: any) {
      setActionNotice({
        message: `Terjadi kesalahan: ${err.message}`,
        type: "error",
      });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Superadmin Overview
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Monitoring verifikasi akun baru, metrik sistem, dan status multi-provider AI.
        </p>
      </div>

      {/* Action Notification Toast */}
      {actionNotice && (
        <div
          className={`p-4 rounded-xl border flex items-start justify-between gap-3 text-xs shadow-sm animate-in slide-in-from-top-2 duration-200 ${
            actionNotice.type === "success"
              ? "bg-emerald-50 border-emerald-300 text-emerald-900"
              : "bg-rose-50 border-rose-300 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-2 font-medium">
            <span className="text-base">{actionNotice.type === "success" ? "✅" : "⚠️"}</span>
            <span>{actionNotice.message}</span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            className="font-bold ml-2 hover:opacity-75"
          >
            ✕
          </button>
        </div>
      )}

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Pengguna */}
        <Card className="bg-white border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Pengguna</span>
            <Users className="w-5 h-5 text-orange-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.totalUsers} Akun</div>
          <div className="mt-2 text-xs text-slate-500 flex gap-2">
            <span className="text-emerald-600 font-bold">{stats.proUsers} Pro</span>
            <span>·</span>
            <span className="text-orange-600 font-bold">{stats.starterUsers} Starter</span>
          </div>
        </Card>

        {/* Card 2: Verifikasi Akun Menunggu */}
        <Card className={`bg-white ${stats.pendingVerifications > 0 ? "border-amber-400 bg-amber-50/20" : "border-slate-200"}`}>
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Verifikasi Akun</span>
            <UserCheck className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700">{stats.pendingVerifications} Menunggu</div>
          <Link href="/admin/users" className="mt-2 text-xs text-amber-700 font-semibold hover:underline block">
            Kelola persetujuan akun &rarr;
          </Link>
        </Card>

        {/* Card 3: Verifikasi Pembayaran */}
        <Card className="bg-white border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Verifikasi Pembayaran</span>
            <CreditCard className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.pendingPayments} Pembayaran</div>
          <Link href="/admin/payments" className="mt-2 text-xs text-blue-600 font-semibold hover:underline block">
            Cek transfer manual &rarr;
          </Link>
        </Card>

        {/* Card 4: Status Sistem */}
        <Card className="bg-white border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Status Sistem</span>
            <Zap className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">100% Online</div>
          <div className="mt-2 text-xs text-slate-500">
            RBAC & Auth Database Aktif
          </div>
        </Card>
      </div>

      {/* PENDING VERIFICATION LIST CARD (Requirement 2 & Requirement 8) */}
      <Card className="p-0 border-slate-200 overflow-hidden bg-white shadow-sm">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span>Pendaftaran Akun Menunggu Verifikasi</span>
                {pendingUsers.length > 0 && (
                  <Badge variant="orange" className="py-0.5 px-2 text-[10px]">
                    {pendingUsers.length} Baru
                  </Badge>
                )}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Persetujuan admin diperlukan agar user dapat mengakses dashboard tanpa password.
              </p>
            </div>
          </div>

          <Link href="/admin/users" className="text-xs font-bold text-orange-600 hover:text-orange-700">
            Buka Tabel Pengguna Lengkap &rarr;
          </Link>
        </div>

        {pendingUsers.length === 0 ? (
          <div className="py-10 text-center text-slate-500">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
            <p className="text-xs font-bold text-slate-800">Tidak ada pendaftaran yang menunggu verifikasi</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Semua akun pengguna yang terdaftar telah diproses dan disetujui.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Nama Pengguna</th>
                  <th className="py-3 px-4">Kontak (Email / HP)</th>
                  <th className="py-3 px-4">Paket Dipilih</th>
                  <th className="py-3 px-4">Detail Pembayaran</th>
                  <th className="py-3 px-4">Waktu Daftar</th>
                  <th className="py-3 px-4 text-right">Aksi Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingUsers.map((user) => {
                  const payment = user.payment;
                  const isPro = user.plan === "pro";

                  return (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <div>{user.full_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono font-normal">{user.id}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        <div className="font-mono text-[11px]">{user.email || "-"}</div>
                        <div className="text-[11px] text-slate-500">{user.phone_number || "-"}</div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge variant={isPro ? "green" : "orange"} className="font-bold text-[10px] uppercase">
                          {isPro ? "PRO (Rp99.000)" : "STARTER (Rp49.000)"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        {payment ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 font-bold text-slate-900">
                              <span>{formatRupiah(payment.amount)}</span>
                              <Badge
                                variant={
                                  payment.status === "approved" || payment.status === "settlement"
                                    ? "green"
                                    : payment.status === "pending"
                                    ? "orange"
                                    : "red"
                                }
                                className="text-[9px] py-0 px-1.5 capitalize"
                              >
                                {payment.status}
                              </Badge>
                            </div>
                            <div className="text-[10px] text-slate-500 capitalize">
                              {payment.method?.replace("_", " ")}
                            </div>
                            {payment.proof_image_url && (
                              <a
                                href={payment.proof_image_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-600 hover:text-orange-700 hover:underline pt-0.5"
                              >
                                <ImageIcon className="w-3 h-3" />
                                <span>Lihat Bukti Transfer</span>
                                <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Belum Konfirmasi</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {user.created_at ? formatWIBShort(user.created_at) : "-"}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                        <Button
                          size="sm"
                          disabled={processingId === user.id}
                          onClick={() => handleApprove(user.id, user.full_name)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-1 px-3 h-8 shadow-sm gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Setujui</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={processingId === user.id}
                          onClick={() => handleReject(user.id, user.full_name)}
                          className="border-rose-200 text-rose-700 hover:bg-rose-50 font-bold text-xs py-1 px-3 h-8 gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Tolak</span>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Quick Action Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/admin/ai-providers">
          <Card className="hover:border-orange-500 transition-all p-5 h-full flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-3">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Kelola AI Provider</h3>
              <p className="text-xs text-slate-500 mt-1">
                Atur failover multi-provider (Gemini, OpenAI, DeepSeek) dan token API terenkripsi.
              </p>
            </div>
            <span className="mt-4 text-xs font-bold text-orange-600 flex items-center gap-1">
              Buka Konfigurasi <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Card>
        </Link>

        <Link href="/admin/users">
          <Card className="hover:border-orange-500 transition-all p-5 h-full flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Manajemen Pengguna</h3>
              <p className="text-xs text-slate-500 mt-1">
                Kelola status verifikasi akun, paket langganan Starter/Pro, dan nomor Telegram user.
              </p>
            </div>
            <span className="mt-4 text-xs font-bold text-blue-600 flex items-center gap-1">
              Lihat Pengguna <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Card>
        </Link>

        <Link href="/admin/transactions">
          <Card className="hover:border-orange-500 transition-all p-5 h-full flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Inspeksi Transaksi Ber-Audit</h3>
              <p className="text-xs text-slate-500 mt-1">
                Inspeksi transaksi pengguna untuk kebutuhan audit dengan pencatatan alasan privasi wajib.
              </p>
            </div>
            <span className="mt-4 text-xs font-bold text-purple-600 flex items-center gap-1">
              Buka Audit Log <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Card>
        </Link>
      </div>
    </div>
  );
}
