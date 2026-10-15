"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Zap,
  Check,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

function RegisterFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planParam = searchParams.get("plan");

  const [selectedPlan, setSelectedPlan] = useState<"starter" | "pro">(
    planParam === "starter" ? "starter" : "pro"
  );

  useEffect(() => {
    if (planParam === "starter" || planParam === "pro") {
      setSelectedPlan(planParam);
    }
  }, [planParam]);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!fullName.trim() || !phone.trim() || !email.trim() || !password) {
      setError("Mohon lengkapi seluruh kolom pendaftaran.");
      return;
    }

    if (password.length < 6) {
      setError("Kata sandi minimal 6 karakter.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          phone,
          email,
          password,
          plan: selectedPlan,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        if (data.token) {
          try {
            localStorage.setItem("tatadana_session", data.token);
            document.cookie = `tatadana_session=${encodeURIComponent(data.token)}; path=/; max-age=604800; SameSite=Lax`;
          } catch (_) {}
        }
        // Redirect user to payment processing page
        const targetUrl =
          data.redirectTo ||
          `/payment?orderId=${data.orderId}&userId=${data.user?.id}&plan=${selectedPlan}`;
        window.location.href = targetUrl;
      } else {
        setError(data.error || "Gagal melakukan pendaftaran akun.");
      }
    } catch (err: any) {
      setError(`Terjadi kesalahan: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* KIRI (40%) — Branding Panel (Desktop Only) */}
      <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-orange-600 via-orange-500 to-amber-500 p-12 text-white flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-orange-950/20 blur-2xl" />

        {/* Brand Top */}
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white text-orange-600 flex items-center justify-center font-black text-xl shadow-lg">
              T
            </div>
            <span className="font-extrabold text-2xl tracking-tight">TataDana</span>
          </Link>
        </div>

        {/* Branding Center */}
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-bold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            Mulai Bebas Cemas Finansial
          </div>
          <h2 className="text-4xl font-black leading-tight tracking-tight">
            Keuanganmu.<br />Terkontrol.
          </h2>
          <p className="text-sm text-orange-100/90 leading-relaxed max-w-sm">
            Pilih paket langganan terbaik, selesaikan pembayaran akun, dan nikmati kemudahan mencatat keuangan terintegrasi AI Telegram.
          </p>

          <div className="pt-4 space-y-2.5 text-xs text-orange-100">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>Pilihan paket Starter atau Pro Lifetime</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>Verifikasi pembayaran dan persetujuan instan</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>Langsung terhubung dengan bot Telegram</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-[11px] text-orange-100/80">
          © 2026 TataDana Fintech Indonesia. Data dienkripsi aman & saldo awal Rp0.
        </div>
      </div>

      {/* KANAN (60%) — Form Container */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-lg space-y-5">
          <div className="lg:hidden flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold">
              T
            </div>
            <span className="font-bold text-xl text-gray-900">TataDana</span>
          </div>

          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Daftar Akun & Pilih Paket
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Pilih paket akun, isi data diri, lalu lanjutkan ke pembayaran dan verifikasi admin.
            </p>
          </div>

          {error && (
            <div className="p-3 text-xs bg-red-50 text-red-700 rounded-xl border border-red-200">
              {error}
            </div>
          )}

          {infoMsg && (
            <div className="p-3 text-xs bg-orange-50 text-orange-900 rounded-xl border border-orange-200">
              {infoMsg}
            </div>
          )}

          {/* PACKAGE SELECTION CARDS */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
              Pilih Paket Akun TataDana
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Card 1: Starter */}
              <div
                onClick={() => setSelectedPlan("starter")}
                className={`cursor-pointer rounded-2xl p-4 border transition-all relative flex flex-col justify-between ${
                  selectedPlan === "starter"
                    ? "border-orange-500 bg-orange-50/50 ring-2 ring-orange-500/20 shadow-sm"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-extrabold text-sm text-gray-900 tracking-tight">
                      Starter
                    </span>
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-xs border ${
                        selectedPlan === "starter"
                          ? "bg-orange-500 border-orange-500 text-white"
                          : "border-gray-300 bg-white text-transparent"
                      }`}
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  </div>

                  <div className="mb-2">
                    <span className="text-lg font-black text-gray-900">Rp49.000</span>
                    <span className="text-[11px] text-gray-500 ml-1">/ bulan</span>
                  </div>

                  <ul className="text-[11px] text-gray-600 space-y-1.5 pt-1 border-t border-gray-100">
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-orange-500 shrink-0" />
                      <span>Catat transaksi via teks Telegram</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-orange-500 shrink-0" />
                      <span>Maksimal 50 transaksi / bulan</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-orange-500 shrink-0" />
                      <span>Maksimal 3 wallet keuangan</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Card 2: Pro (Rekomendasi) */}
              <div
                onClick={() => setSelectedPlan("pro")}
                className={`cursor-pointer rounded-2xl p-4 border transition-all relative flex flex-col justify-between ${
                  selectedPlan === "pro"
                    ? "border-orange-500 bg-orange-50/60 ring-2 ring-orange-500/30 shadow-md"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <div className="absolute -top-2.5 right-3">
                  <span className="bg-gradient-to-r from-orange-600 to-amber-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                    <Star className="w-2.5 h-2.5 fill-current" />
                    Rekomendasi
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-extrabold text-sm text-gray-900 tracking-tight flex items-center gap-1.5">
                      <span>Pro</span>
                      <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                    </span>
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-xs border ${
                        selectedPlan === "pro"
                          ? "bg-orange-500 border-orange-500 text-white"
                          : "border-gray-300 bg-white text-transparent"
                      }`}
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  </div>

                  <div className="mb-2">
                    <span className="text-lg font-black text-gray-900">Rp99.000</span>
                    <span className="text-[11px] text-orange-600 font-semibold ml-1">sekali bayar</span>
                  </div>

                  <ul className="text-[11px] text-gray-600 space-y-1.5 pt-1 border-t border-gray-100">
                    <li className="flex items-center gap-1.5 font-medium text-gray-900">
                      <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>Unlimited transaksi & dompet</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>OCR foto struk otomatis AI</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>AI Financial Advisor & Prediksi</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* REGISTRATION FORM */}
          <form onSubmit={handleSubmitForm} className="space-y-3.5 pt-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                Nama Lengkap
              </label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Budi Santoso"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                Nomor HP (WhatsApp / Telegram)
              </label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="081234567890"
                required
              />
              <span className="text-[11px] text-gray-400 mt-0.5 block">
                Nomor ini dipakai untuk mengaitkan chat bot Telegram @mitawiwbot.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                Alamat Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="budi@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                Kata Sandi
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                required
              />
            </div>

            <Button
              type="submit"
              isLoading={loading}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 text-sm mt-2"
            >
              <span>Daftar & Proses Pembayaran ({selectedPlan === "pro" ? "Rp99.000" : "Rp49.000"})</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          {/* Link to Login */}
          <div className="text-center text-xs text-gray-500 pt-2 border-t border-gray-100">
            Sudah memiliki akun TataDana?{" "}
            <Link href="/login" className="font-bold text-orange-600 hover:underline">
              Masuk di sini &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white text-gray-400">
          <div className="w-8 h-8 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
        </div>
      }
    >
      <RegisterFormContent />
    </Suspense>
  );
}
