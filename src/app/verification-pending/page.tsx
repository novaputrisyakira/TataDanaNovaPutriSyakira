"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Clock,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  LogOut,
  Mail,
  Send,
  RefreshCw,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function VerificationPendingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [status, setStatus] = useState<"pending" | "approved" | "rejected">("pending");
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [autoRedirectCount, setAutoRedirectCount] = useState<number | null>(null);

  // Magic Link state
  const [magicEmail, setMagicEmail] = useState("");
  const [magicLoading, setMagicLoading] = useState(false);
  const [magicSuccessMsg, setMagicSuccessMsg] = useState("");
  const [magicLinkUrl, setMagicLinkUrl] = useState("");
  const [magicErrorMsg, setMagicErrorMsg] = useState("");

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Initial Profile & Status Fetch
  const checkInitialStatus = async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("tatadana_session") : null;
      const authHeaders: Record<string, string> = { "Cache-Control": "no-store" };
      if (token) {
        authHeaders["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("/api/auth/me", {
        headers: authHeaders,
        cache: "no-store",
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.user) {
          setProfile(data.user);
          setMagicEmail(data.user.email || "");

          if (data.isAdmin) {
            window.location.href = "/admin";
            return;
          }

          const currentStatus = data.user.verification_status || "pending";
          setStatus(currentStatus);
          if (data.user.rejection_reason) {
            setRejectionReason(data.user.rejection_reason);
          }

          // If already approved, prepare instant dashboard entry
          if (currentStatus === "approved") {
            startAutoRedirect();
          }
          return;
        }
      }

      // If not logged in, check URL param ?status=rejected or ?email=...
      const paramStatus = searchParams.get("status");
      const paramEmail = searchParams.get("email");
      if (paramEmail) {
        setMagicEmail(paramEmail);
      }
      if (paramStatus === "rejected") {
        setStatus("rejected");
      }

      // If email param is present, fetch initial verification status by email
      if (paramEmail) {
        const statusRes = await fetch(`/api/auth/verification-status?email=${encodeURIComponent(paramEmail)}`);
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          if (statusData.ok) {
            setProfile({
              id: statusData.userId,
              full_name: statusData.fullName,
              email: statusData.email,
              plan: statusData.plan,
              verification_status: statusData.status,
              payment: statusData.payment,
            });
            setStatus(statusData.status);
            if (statusData.rejectionReason) {
              setRejectionReason(statusData.rejectionReason);
            }
            if (statusData.status === "approved") {
              startAutoRedirect();
            }
          }
        }
      }
    } catch {
      // Offline or network error
    } finally {
      setLoading(false);
    }
  };

  const handleEnterDashboard = async () => {
    try {
      const query = profile?.id ? `?userId=${profile.id}` : magicEmail ? `?email=${encodeURIComponent(magicEmail)}` : "";
      await fetch(`/api/auth/verification-status${query}`);
    } catch {
      // ignore
    }
    window.location.href = "/dashboard";
  };

  const startAutoRedirect = () => {
    if (autoRedirectCount !== null) return;
    // Pre-emptively refresh the cookie in the background
    const query = profile?.id ? `?userId=${profile.id}` : magicEmail ? `?email=${encodeURIComponent(magicEmail)}` : "";
    fetch(`/api/auth/verification-status${query}`).catch(() => {});
    setAutoRedirectCount(3);
  };

  useEffect(() => {
    if (autoRedirectCount === null) return;
    if (autoRedirectCount <= 0) {
      handleEnterDashboard();
      return;
    }

    const timer = setTimeout(() => {
      setAutoRedirectCount((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [autoRedirectCount]);

  // 2. Real-time Status Polling (Auto-Detection every 3 seconds)
  useEffect(() => {
    checkInitialStatus();

    pollIntervalRef.current = setInterval(async () => {
      // If already approved, stop polling
      if (status === "approved") return;

      try {
        const query = profile?.id
          ? `?userId=${profile.id}`
          : magicEmail
          ? `?email=${encodeURIComponent(magicEmail)}`
          : "";

        if (!query) return;

        const res = await fetch(`/api/auth/verification-status${query}`);
        if (res.ok) {
          const data = await res.json();
          if (data.ok) {
            if (data.status) {
              setProfile((prev: any) => ({
                ...(prev || {}),
                id: prev?.id || data.userId,
                full_name: prev?.full_name || data.fullName,
                email: prev?.email || data.email,
                plan: data.plan || prev?.plan,
                verification_status: data.status,
                payment: data.payment || prev?.payment,
              }));
            }

            if (data.status === "approved" && status !== "approved") {
              setStatus("approved");
              setRejectionReason("");
              startAutoRedirect();
            } else if (data.status === "rejected" && status !== "rejected") {
              setStatus("rejected");
              if (data.rejectionReason) setRejectionReason(data.rejectionReason);
            }
          }
        }
      } catch {
        // Ignore background polling errors
      }
    }, 3000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [status, profile?.id, magicEmail]);

  // 3. Request Passwordless Magic Link
  const handleRequestMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setMagicLoading(true);
    setMagicErrorMsg("");
    setMagicSuccessMsg("");
    setMagicLinkUrl("");

    try {
      const res = await fetch("/api/auth/request-magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: magicEmail.trim() }),
      });
      const data = await res.json();
      if (data.ok) {
        setMagicSuccessMsg("Tautan masuk sekali pakai berhasil dibuat dan dikirim ke email kamu.");
        if (data.magicLink) {
          setMagicLinkUrl(data.magicLink);
        }
      } else {
        setMagicErrorMsg(data.error || "Gagal membuat tautan masuk.");
      }
    } catch (err: any) {
      setMagicErrorMsg(`Terjadi kesalahan: ${err.message}`);
    } finally {
      setMagicLoading(false);
    }
  };

  // 4. Logout Handler
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    document.cookie = "tatadana_session=; path=/; max-age=0";
    document.cookie = "tatadana_admin_auth=; path=/; max-age=0";
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center text-gray-500">
        <div className="w-10 h-10 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mb-4" />
        <span className="text-xs font-semibold tracking-wider uppercase text-gray-400">
          Memeriksa Status Akun...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8">
      {/* Top Header */}
      <div className="max-w-xl w-full mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-600 to-orange-400 flex items-center justify-center shadow-md shadow-orange-500/20 text-white font-bold text-base">
            T
          </div>
          <div>
            <span className="font-extrabold text-lg text-gray-900 tracking-tight">
              Tata<span className="text-orange-500">Dana</span>
            </span>
          </div>
        </Link>

        <button
          onClick={handleLogout}
          className="text-xs font-semibold text-gray-500 hover:text-gray-900 flex items-center gap-1.5 py-1.5 px-3 rounded-lg hover:bg-white border border-transparent hover:border-gray-200 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Ganti Akun / Keluar</span>
        </button>
      </div>

      {/* Main Container */}
      <div className="max-w-xl w-full mx-auto my-6 space-y-6">
        {/* STATE 1: PENDING (Waiting for Admin Approval) */}
        {status === "pending" && (
          <Card className="p-6 sm:p-8 border-orange-200 shadow-xl shadow-orange-500/5 text-center relative overflow-hidden bg-white">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 animate-pulse" />

            {/* Icon Banner */}
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto mb-4 relative">
              <Clock className="w-8 h-8 animate-spin-slow" />
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
              </span>
            </div>

            {/* Status Badge: Payment Confirmation Submitted or Action Required */}
            {(() => {
              const hasSubmittedPayment =
                searchParams.get("payment") === "submitted" ||
                Boolean(profile?.payment?.proof_image_url) ||
                profile?.payment?.status === "pending" ||
                profile?.payment?.status === "settlement" ||
                profile?.payment?.status === "approved";

              if (hasSubmittedPayment) {
                return (
                  <div className="mb-5 p-3.5 bg-emerald-50 border-2 border-emerald-300 rounded-2xl flex items-center justify-center gap-2.5 text-xs font-black text-emerald-900 shadow-sm animate-in slide-in-from-top-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Bukti Pembayaran Terkirim — Menunggu Konfirmasi & Verifikasi Admin</span>
                  </div>
                );
              }

              return (
                <div className="mb-5 p-3.5 bg-amber-50 border border-amber-300 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-sm">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-left">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Konfirmasi bukti pembayaran belum dikirim.</span>
                  </div>
                  <Link
                    href={`/payment?orderId=${profile?.payment?.order_id || ""}&userId=${profile?.id || ""}&plan=${profile?.plan || "pro"}`}
                    className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-sm shrink-0"
                  >
                    <span>Selesaikan Pembayaran &rarr;</span>
                  </Link>
                </div>
              );
            })()}

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/80 text-amber-800 text-xs font-bold mb-3 border border-amber-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Menunggu Verifikasi Admin</span>
            </div>

            <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-2">
              Akun Anda Sedang Dalam Antrean Persetujuan
            </h1>

            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-md mx-auto mb-6">
              Terima kasih telah mendaftar di TataDana! Tim administrator kami sedang memverifikasi bukti transaksi pembayaran dan data akun Anda.
            </p>

            {/* Account Details Box */}
            <div className="bg-orange-50/60 rounded-xl p-4 border border-orange-100 text-left text-xs space-y-2 mb-6">
              <div className="flex justify-between items-center text-gray-600">
                <span className="font-medium">Nama Terdaftar:</span>
                <span className="font-bold text-gray-900">{profile?.full_name || "Pengguna Baru"}</span>
              </div>
              <div className="flex justify-between items-center text-gray-600">
                <span className="font-medium">Email Akun:</span>
                <span className="font-bold text-gray-900">{profile?.email || "-"}</span>
              </div>
              {profile?.phone_number && (
                <div className="flex justify-between items-center text-gray-600">
                  <span className="font-medium">Nomor WhatsApp/HP:</span>
                  <span className="font-bold text-gray-900">{profile.phone_number}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-gray-600">
                <span className="font-medium">Paket Akun:</span>
                <span className="font-extrabold text-orange-600 uppercase text-[11px] bg-orange-100 px-2 py-0.5 rounded-full">
                  {profile?.plan === "starter" ? "Starter (Rp49.000 / bln)" : "Pro Lifetime (Rp99.000)"}
                </span>
              </div>
              <div className="flex justify-between items-center text-gray-600">
                <span className="font-medium">Status Pembayaran:</span>
                <div className="flex items-center gap-1.5">
                  <span className={`font-bold text-[11px] px-2 py-0.5 rounded-full ${
                    searchParams.get("payment") === "submitted" ||
                    Boolean(profile?.payment?.proof_image_url) ||
                    profile?.payment?.status === "pending" ||
                    profile?.payment?.status === "settlement" ||
                    profile?.payment?.status === "approved"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      : "bg-amber-100 text-amber-800"
                  }`}>
                    {searchParams.get("payment") === "submitted" ||
                    Boolean(profile?.payment?.proof_image_url) ||
                    profile?.payment?.status === "pending" ||
                    profile?.payment?.status === "settlement" ||
                    profile?.payment?.status === "approved"
                      ? "Bukti Terkirim (Menunggu Verifikasi)"
                      : "Menunggu Pembayaran"}
                  </span>
                  {!(
                    searchParams.get("payment") === "submitted" ||
                    Boolean(profile?.payment?.proof_image_url) ||
                    profile?.payment?.status === "pending" ||
                    profile?.payment?.status === "settlement" ||
                    profile?.payment?.status === "approved"
                  ) && (
                    <Link
                      href={`/payment?orderId=${profile?.payment?.order_id || ""}&userId=${profile?.id || ""}&plan=${profile?.plan || "pro"}`}
                      className="text-[10px] font-bold text-orange-600 hover:underline"
                    >
                      (Bayar &rarr;)
                    </Link>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center text-gray-600 pt-1 border-t border-orange-200/50">
                <span className="font-medium">Status Akun:</span>
                <span className="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full text-[11px]">
                  Menunggu Disetujui Admin
                </span>
              </div>
            </div>

            {/* Live Auto-Detection Indicator */}
            <div className="flex items-center justify-center gap-2 text-xs text-gray-400 py-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-orange-500" />
              <span>Mendeteksi persetujuan admin secara otomatis...</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Halaman ini akan otomatis beralih ke dashboard segera setelah akun disetujui tanpa perlu mengetik ulang kata sandi.
            </p>
          </Card>
        )}

        {/* STATE 2: APPROVED (Live Auto-Detected or Already Approved) */}
        {status === "approved" && (
          <Card className="p-6 sm:p-8 border-emerald-300 shadow-xl shadow-emerald-500/10 text-center relative overflow-hidden bg-white animate-in zoom-in-95 duration-300">
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-emerald-400 to-teal-500" />

            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-3 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Akun Berhasil Diverifikasi</span>
            </div>

            <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-2">
              🎉 Pendaftaran Anda Telah Disetujui!
            </h1>

            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-md mx-auto mb-6">
              Selamat! Administrator telah menyetujui akun kamu. Dompet awal Rp0 dan kategori pencatatan telah siap digunakan.
            </p>

            {/* Direct Dashboard Entry Button */}
            <div className="space-y-3">
              <Button
                size="lg"
                onClick={handleEnterDashboard}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 text-sm rounded-xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2"
              >
                <span>Masuk ke Dashboard TataDana</span>
                <ArrowRight className="w-4 h-4" />
              </Button>

              {autoRedirectCount !== null && autoRedirectCount > 0 && (
                <p className="text-xs text-emerald-700 font-semibold">
                  Mengarahkan kamu otomatis ke dashboard dalam {autoRedirectCount} detik...
                </p>
              )}
            </div>
          </Card>
        )}

        {/* STATE 3: REJECTED */}
        {status === "rejected" && (
          <Card className="p-6 sm:p-8 border-rose-300 shadow-xl shadow-rose-500/5 text-center relative overflow-hidden bg-white">
            <div className="absolute top-0 inset-x-0 h-2 bg-rose-500" />

            <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-9 h-9" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold mb-3 border border-rose-200">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              <span>Pendaftaran Ditolak</span>
            </div>

            <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-2">
              Pendaftaran Tidak Dapat Disetujui
            </h1>

            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-md mx-auto mb-5">
              Mohon maaf, permohonan pendaftaran akun Anda saat ini belum dapat disetujui oleh Administrator TataDana.
            </p>

            {rejectionReason && (
              <div className="bg-rose-50 rounded-xl p-4 border border-rose-200 text-left text-xs mb-6">
                <span className="font-bold text-rose-900 block mb-1">Alasan Penolakan:</span>
                <p className="text-rose-700">{rejectionReason}</p>
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/register" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full text-xs">
                  Daftar Ulang dengan Data Baru
                </Button>
              </Link>
              <Link href="/" className="w-full sm:w-auto">
                <Button variant="ghost" className="w-full text-xs">
                  Kembali ke Beranda
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {/* PASSWORDLESS MAGIC LINK UTILITY CARD (Requirement 3) */}
        <Card className="p-5 border-gray-200 bg-white">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-gray-900">
                Masuk Tanpa Kata Sandi (Tautan Login Sekali Pakai)
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Jika kamu telah menutup halaman ini atau sesi browser telah kadaluarsa setelah admin menyetujui akun, kamu dapat meminta tautan login instan tanpa mengetik sandi kembali.
              </p>

              {magicSuccessMsg && (
                <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 space-y-2">
                  <p className="font-semibold">{magicSuccessMsg}</p>
                  {magicLinkUrl && (
                    <div className="pt-1">
                      <a
                        href={magicLinkUrl}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-bold text-xs hover:bg-emerald-700 shadow-sm"
                      >
                        <span>Buka Tautan Masuk Sekarang &rarr;</span>
                      </a>
                    </div>
                  )}
                </div>
              )}

              {magicErrorMsg && (
                <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                  {magicErrorMsg}
                </div>
              )}

              <form onSubmit={handleRequestMagicLink} className="mt-3 flex gap-2">
                <input
                  type="email"
                  value={magicEmail}
                  onChange={(e) => setMagicEmail(e.target.value)}
                  placeholder="Masukkan email terdaftar..."
                  required
                  className="flex-1 px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
                <Button type="submit" size="sm" isLoading={magicLoading} className="text-xs gap-1.5">
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirim Tautan</span>
                </Button>
              </form>
            </div>
          </div>
        </Card>
      </div>

      {/* Footer */}
      <div className="max-w-xl w-full mx-auto text-center text-xs text-gray-400">
        Butuh bantuan? Hubungi Administrator via Telegram @mitawiwbot atau email support@tatadana.id.
      </div>
    </div>
  );
}

export default function VerificationPendingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center text-gray-500">
          <div className="w-10 h-10 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mb-4" />
          <span className="text-xs font-semibold tracking-wider uppercase text-gray-400">
            Memeriksa Status Akun...
          </span>
        </div>
      }
    >
      <VerificationPendingContent />
    </Suspense>
  );
}
