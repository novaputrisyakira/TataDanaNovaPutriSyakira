"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bot, Phone, Mail, ArrowRight, ShieldCheck, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();

  const [authMethod, setAuthMethod] = useState<"email" | "phone">("phone");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlError = params.get("error");
      if (urlError) {
        setError(decodeURIComponent(urlError));
      }
    }
  }, []);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/phone-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, action: "send" }),
      });
      const data = await res.json();
      if (data.ok) {
        setOtpSent(true);
        setInfoMsg("Kode OTP 123456 (dev bypass) telah disiapkan.");
      } else {
        setError(data.error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/phone-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: otpCode, action: "verify" }),
      });
      const data = await res.json();
      if (data.ok) {
        if (data.token) {
          try {
            localStorage.setItem("tatadana_session", data.token);
            document.cookie = `tatadana_session=${encodeURIComponent(data.token)}; path=/; max-age=604800; SameSite=Lax`;
            if (data.role === "admin") {
              document.cookie = `tatadana_admin_auth=true; path=/; max-age=604800; SameSite=Lax`;
            }
          } catch (_) {}
        }
        const dest = data.redirectTo || (data.role === "admin" ? "/admin" : "/dashboard");
        window.location.href = dest;
      } else {
        if (data.redirectTo) {
          window.location.href = data.redirectTo;
          return;
        }
        setError(data.error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (data.ok) {
        if (data.token) {
          try {
            localStorage.setItem("tatadana_session", data.token);
            document.cookie = `tatadana_session=${encodeURIComponent(data.token)}; path=/; max-age=604800; SameSite=Lax`;
            if (data.role === "admin") {
              document.cookie = `tatadana_admin_auth=true; path=/; max-age=604800; SameSite=Lax`;
            }
          } catch (_) {}
        }
        const dest = data.redirectTo || (data.role === "admin" ? "/admin" : "/dashboard");
        window.location.href = dest;
      } else {
        if (data.redirectTo) {
          window.location.href = data.redirectTo;
          return;
        }
        setError(data.error || "Email atau kata sandi tidak valid.");
      }
    } catch (err: any) {
      setError(`Gagal masuk: ${err.message}`);
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

        {/* Main Branding Tagline */}
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-bold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            Fintech Terintegrasi Telegram
          </div>
          <h2 className="text-4xl font-black leading-tight tracking-tight">
            Keuanganmu.<br />Terkontrol.
          </h2>
          <p className="text-sm text-orange-100/90 leading-relaxed max-w-sm">
            Pantau arus kas, sisa budget bulanan, dan catat setiap rupiah semudah chat di Telegram.
          </p>

          <div className="pt-4 space-y-2 text-xs text-orange-100">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>Parsing nominal bahasa Indonesia otomatis</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>Multi-wallet: Kas Tunai, Bank & E-wallet</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-[11px] text-orange-100/80">
          © 2026 TataDana Fintech Indonesia. Dilindungi PostgreSQL RLS.
        </div>
      </div>

      {/* KANAN (60%) — Form Container (Full on Mobile) */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Header Logo */}
          <div className="lg:hidden flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold">
              T
            </div>
            <span className="font-bold text-xl text-gray-900">TataDana</span>
          </div>

          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Masuk ke TataDana
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Pilih metode masuk yang kamu gunakan untuk mengelola keuanganmu.
            </p>
          </div>

          {/* Auth Method Selector */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-gray-100 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setAuthMethod("phone");
                setError("");
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                authMethod === "phone"
                  ? "bg-white text-orange-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              📱 Nomor HP (OTP)
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMethod("email");
                setError("");
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                authMethod === "email"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              ✉️ Email & Sandi
            </button>
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

          {/* METHOD 1: Phone OTP (Required for Telegram link) */}
          {authMethod === "phone" && (
            <div>
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                      Nomor HP WhatsApp / Telegram
                    </label>
                    <Input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="08xxxxxxxxxx"
                      required
                    />
                    <span className="text-[11px] text-gray-400 mt-1 block">
                      Nomor ini yang mengaitkan akun TataDana dengan Bot Telegram.
                    </span>
                  </div>

                  <Button type="submit" isLoading={loading} className="w-full">
                    Kirim Kode OTP
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                      Masukkan 6 Digit Kode OTP
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="123456"
                      required
                      autoFocus
                      className="w-full text-center tracking-widest text-2xl font-black py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-200 focus:border-orange-500"
                    />
                    <span className="text-[11px] text-gray-500 text-center block mt-1">
                      Mode Dev Bypass: Masukkan kode <strong>123456</strong>
                    </span>
                  </div>

                  <Button type="submit" isLoading={loading} className="w-full">
                    Verifikasi & Masuk
                  </Button>

                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="w-full text-center text-xs text-orange-600 hover:underline"
                  >
                    Ganti Nomor HP
                  </button>
                </form>
              )}
            </div>
          )}

          {/* METHOD 2: Email & Password */}
          {authMethod === "email" && (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
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
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                  Kata Sandi
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <Button type="submit" isLoading={loading} className="w-full">
                Masuk dengan Email
              </Button>
            </form>
          )}

          {/* Passwordless Magic Link / Verification Status Access (Requirement 3) */}
          <div className="p-3.5 bg-orange-50/70 border border-orange-200/80 rounded-2xl flex items-center justify-between text-xs gap-3">
            <div>
              <span className="font-bold text-gray-900 block">Akun baru disetujui / Lupa sandi?</span>
              <span className="text-gray-500 text-[11px]">Masuk tanpa kata sandi via tautan sekali pakai</span>
            </div>
            <Link
              href="/verification-pending"
              className="font-bold text-orange-600 hover:text-orange-700 bg-white border border-orange-200 px-3 py-1.5 rounded-xl shadow-xs shrink-0 transition-colors"
            >
              Masuk Instan &rarr;
            </Link>
          </div>

          {/* Google OAuth Option */}
          <div className="pt-2">
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink mx-4 text-gray-400 text-xs">atau masuk dengan</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            <button
              type="button"
              onClick={() => {
                setError("Integrasi Google OAuth sedang dalam pemeliharaan. Silakan masuk via Nomor HP / OTP atau Email & Kata Sandi.");
              }}
              className="w-full mt-2 py-2.5 px-4 rounded-xl border border-gray-200 hover:border-gray-300 bg-white text-xs font-bold text-gray-700 flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Lanjutkan dengan Google</span>
            </button>
          </div>

          {/* Paket Akun untuk Pengguna Baru / Belum Punya Akun */}
          <div className="pt-2 border-t border-gray-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800">
                Belum punya akun TataDana?
              </span>
              <span className="text-[11px] text-orange-600 font-semibold">
                Pilih paket pendaftaran:
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/register?plan=starter"
                className="p-2.5 rounded-xl border border-gray-200 hover:border-orange-400 bg-gray-50/50 hover:bg-orange-50/40 transition-all text-left flex flex-col justify-between group"
              >
                <div>
                  <div className="font-extrabold text-xs text-gray-900 group-hover:text-orange-600 transition-colors">
                    Starter
                  </div>
                  <div className="text-[11px] font-bold text-gray-600">
                    Rp49.000<span className="text-[9px] font-normal text-gray-400">/bln</span>
                  </div>
                </div>
                <span className="text-[10px] text-orange-600 font-semibold mt-1">
                  Daftar Starter &rarr;
                </span>
              </Link>

              <Link
                href="/register?plan=pro"
                className="p-2.5 rounded-xl border border-orange-200 bg-orange-50/50 hover:bg-orange-100/50 transition-all text-left flex flex-col justify-between relative group shadow-xs"
              >
                <div className="absolute -top-2 right-2 bg-gradient-to-r from-orange-600 to-amber-500 text-white text-[8px] font-black uppercase px-1.5 py-0.2 rounded-full shadow-xs">
                  Rekomendasi
                </div>
                <div>
                  <div className="font-extrabold text-xs text-orange-950 flex items-center gap-1 group-hover:text-orange-600 transition-colors">
                    <span>Pro</span>
                    <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                  </div>
                  <div className="text-[11px] font-bold text-gray-900">
                    Rp99.000<span className="text-[9px] font-normal text-orange-600"> sekali</span>
                  </div>
                </div>
                <span className="text-[10px] text-orange-700 font-bold mt-1">
                  Daftar Pro &rarr;
                </span>
              </Link>
            </div>

            <div className="text-center text-xs text-gray-500 pt-1">
              <Link href="/register" className="font-bold text-orange-600 hover:underline inline-flex items-center gap-1">
                <span>Daftar sekarang & bandingkan fitur paket</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
