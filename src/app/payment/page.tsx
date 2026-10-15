"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CreditCard,
  QrCode,
  Building2,
  Smartphone,
  CheckCircle2,
  Copy,
  Upload,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Zap,
  Info,
  Clock,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/utils/currency";

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const paramOrderId = searchParams.get("orderId") || "";
  const paramUserId = searchParams.get("userId") || "";
  const paramPlan = searchParams.get("plan") || "pro";

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Order & User State
  const [orderId, setOrderId] = useState(paramOrderId);
  const [userId, setUserId] = useState(paramUserId);
  const [plan, setPlan] = useState<"starter" | "pro">(paramPlan === "starter" ? "starter" : "pro");
  const [amount, setAmount] = useState(paramPlan === "starter" ? 49000 : 99000);
  const [userInfo, setUserInfo] = useState<{ fullName?: string; email?: string; phone?: string }>({});

  // Payment Method selection
  const [paymentMethod, setPaymentMethod] = useState<"qris" | "bank" | "ewallet" | "midtrans">("qris");
  const [selectedBank, setSelectedBank] = useState<"bca" | "mandiri">("bca");
  const [selectedEwallet, setSelectedEwallet] = useState<"gopay" | "ovo" | "dana">("gopay");

  // Confirmation Form Fields
  const [senderName, setSenderName] = useState("");
  const [senderBank, setSenderBank] = useState("BCA");
  const [proofImage, setProofImage] = useState<string>("");
  const [proofFileName, setProofFileName] = useState<string>("");
  const [notes, setNotes] = useState("");

  // Load existing payment & profile data
  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        const query = orderId ? `?orderId=${orderId}` : userId ? `?userId=${userId}` : "";
        if (!query) {
          // If no query, try fetching user session
          const token = typeof window !== "undefined" ? localStorage.getItem("tatadana_session") : null;
          const authHeaders: Record<string, string> = { "Cache-Control": "no-store" };
          if (token) authHeaders["Authorization"] = `Bearer ${token}`;

          const meRes = await fetch("/api/auth/me", {
            headers: authHeaders,
            cache: "no-store",
            credentials: "include",
          });
          if (meRes.ok) {
            const meData = await meRes.json();
            if (meData.ok && meData.user) {
              setUserId(meData.user.id);
              setUserInfo({
                fullName: meData.user.full_name,
                email: meData.user.email,
                phone: meData.user.phone_number,
              });
              const uPlan = meData.user.plan === "starter" ? "starter" : "pro";
              setPlan(uPlan);
              setAmount(uPlan === "starter" ? 49000 : 99000);
            }
          }
          setLoading(false);
          return;
        }

        const res = await fetch(`/api/payment${query}`);
        if (res.ok) {
          const data = await res.json();
          if (data.ok && data.data) {
            setOrderId(data.data.order_id);
            setUserId(data.data.user_id);
            const pPlan = data.data.plan === "starter" ? "starter" : "pro";
            setPlan(pPlan);
            setAmount(data.data.amount || (pPlan === "starter" ? 49000 : 99000));
            if (data.user) {
              setUserInfo({
                fullName: data.user.full_name,
                email: data.user.email,
                phone: data.user.phone_number,
              });
              if (!senderName && data.user.full_name) {
                setSenderName(data.user.full_name);
              }
            }
          }
        }
      } catch (err) {
        console.error("Failed to load payment info:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderData();
  }, [orderId, userId]);

  const copyToClipboard = (text: string, fieldId: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProofFileName(file.name);
      // For local browser preview / base64 or sample URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUseSampleReceipt = () => {
    setProofFileName("bukti-transfer-simulasi.png");
    setProofImage("https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&auto=format&fit=crop&q=80");
  };

  const handleSubmitConfirmation = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!senderName.trim()) {
      setError("Mohon isi nama pengirim / pemilik rekening.");
      return;
    }

    setSubmitting(true);
    try {
      let paymentChannel = "";
      if (paymentMethod === "qris") paymentChannel = "QRIS All Payment";
      else if (paymentMethod === "bank") paymentChannel = `Transfer Bank (${selectedBank.toUpperCase()})`;
      else if (paymentMethod === "ewallet") paymentChannel = `E-Wallet (${selectedEwallet.toUpperCase()})`;
      else if (paymentMethod === "midtrans") paymentChannel = "Midtrans Simulation";

      const res = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orderId || `TATADANA-ORD-${Date.now()}`,
          userId,
          plan,
          method: paymentMethod === "midtrans" ? "midtrans" : "manual_transfer",
          paymentChannel,
          senderName: senderName.trim(),
          bankName: senderBank,
          proofImageUrl: proofImage || "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&auto=format&fit=crop&q=80",
          adminNotes: notes.trim(),
        }),
      });

      const data = await res.json();
      if (data.ok) {
        // Redirect to /verification-pending with payment=submitted flag
        const targetRedirect =
          data.redirectTo ||
          `/verification-pending?payment=submitted&orderId=${orderId || data.data?.order_id}`;
        window.location.href = targetRedirect;
      } else {
        setError(data.error || "Gagal mengirim konfirmasi pembayaran.");
      }
    } catch (err: any) {
      setError(`Terjadi kesalahan: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-8 px-4 sm:px-6 lg:px-8">
      {/* Top Header */}
      <div className="max-w-4xl mx-auto flex items-center justify-between mb-8 pb-4 border-b border-orange-100">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center shadow-md shadow-orange-500/20 text-white font-black text-lg">
            T
          </div>
          <div>
            <span className="font-black text-xl text-gray-900 tracking-tight">
              Tata<span className="text-orange-500">Dana</span>
            </span>
          </div>
        </Link>

        {/* Security Badge */}
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Transaksi Terenkripsi & Terlindungi</span>
        </div>
      </div>

      {/* Progress Steps Breadcrumb */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="flex items-center justify-center gap-2 text-xs font-bold text-gray-500">
          <div className="flex items-center gap-1.5 text-emerald-600">
            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[11px]">
              ✓
            </span>
            <span>1. Registrasi Akun</span>
          </div>
          <span className="text-gray-300">———</span>
          <div className="flex items-center gap-1.5 text-orange-600">
            <span className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center text-[11px]">
              2
            </span>
            <span>2. Pembayaran Paket</span>
          </div>
          <span className="text-gray-300">———</span>
          <div className="flex items-center gap-1.5 text-gray-400">
            <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-[11px]">
              3
            </span>
            <span>3. Verifikasi Admin</span>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* KOLOM KIRI (5/12): Ringkasan Pesanan & Paket */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-5 border-orange-200 bg-white shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Ringkasan Pesanan
              </span>
              <Badge variant="orange" className="text-[10px] uppercase font-mono">
                {orderId || "TATADANA-ORD"}
              </Badge>
            </div>

            {/* User Info Box */}
            <div className="bg-gray-50 rounded-xl p-3.5 text-xs space-y-1.5 border border-gray-100">
              <div className="flex justify-between">
                <span className="text-gray-500">Nama Pendaftar:</span>
                <span className="font-bold text-gray-900">{userInfo.fullName || "Pengguna TataDana"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Email:</span>
                <span className="font-mono text-gray-800">{userInfo.email || "-"}</span>
              </div>
              {userInfo.phone && (
                <div className="flex justify-between">
                  <span className="text-gray-500">No. WhatsApp/HP:</span>
                  <span className="font-medium text-gray-800">{userInfo.phone}</span>
                </div>
              )}
            </div>

            {/* Plan Switcher Toggle */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-700">Pilihan Paket:</span>
                <span className="text-[11px] text-gray-500">Klik untuk ubah</span>
              </div>
              <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setPlan("starter");
                    setAmount(49000);
                  }}
                  className={`py-1.5 px-2 text-xs font-bold rounded-lg transition-all text-center ${
                    plan === "starter"
                      ? "bg-white text-orange-600 shadow-xs"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  Starter (Rp49rb)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPlan("pro");
                    setAmount(99000);
                  }}
                  className={`py-1.5 px-2 text-xs font-bold rounded-lg transition-all text-center flex items-center justify-center gap-1 ${
                    plan === "pro"
                      ? "bg-white text-orange-600 shadow-xs"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  <span>Pro (Rp99rb)</span>
                  <span className="text-[9px] bg-orange-100 text-orange-700 px-1 py-0.2 rounded font-extrabold">⭐</span>
                </button>
              </div>
            </div>

            {/* Selected Plan Details Card */}
            <div className={`rounded-xl p-4 border ${plan === "pro" ? "bg-orange-50/70 border-orange-200" : "bg-blue-50/60 border-blue-200"}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-extrabold text-sm text-gray-900 flex items-center gap-1.5">
                  <span>Paket {plan === "pro" ? "PRO Lifetime" : "Starter Bulanan"}</span>
                  {plan === "pro" && <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />}
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white border border-orange-200 text-orange-700">
                  {plan === "pro" ? "Sekali Bayar" : "/ Bulan"}
                </span>
              </div>

              <div className="text-2xl font-black text-gray-900 mb-2">
                {formatRupiah(amount)}
              </div>

              <ul className="text-xs text-gray-600 space-y-1.5 pt-2 border-t border-orange-200/50">
                {plan === "pro" ? (
                  <>
                    <li className="flex items-center gap-1.5 font-medium text-gray-900">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Unlimited transaksi tanpa batas bulanan</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>OCR foto struk otomatis AI</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>AI Financial Advisor & Prediksi Finansial</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Export laporan keuangan PDF & Excel</span>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                      <span>Catat transaksi via teks Telegram</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                      <span>Maksimal 50 transaksi per bulan</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                      <span>Maksimal 3 dompet multi-wallet</span>
                    </li>
                  </>
                )}
              </ul>
            </div>

            {/* Total Payment Due */}
            <div className="pt-2 flex justify-between items-center border-t border-gray-100">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Total Tagihan:
              </span>
              <span className="text-2xl font-black text-orange-600">
                {formatRupiah(amount)}
              </span>
            </div>
          </Card>

          {/* Guarantee Note */}
          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed text-[11px]">
              Setelah mengirim konfirmasi pembayaran, akun Anda akan diverifikasi oleh Super Admin. Saldo awal akun Anda akan tetap bersih <strong>Rp0</strong>.
            </p>
          </div>
        </div>

        {/* KOLOM KANAN (7/12): Metode Pembayaran & Form Konfirmasi */}
        <div className="lg:col-span-7 space-y-5">
          {/* Method Selection Tabs */}
          <Card className="p-5 border-gray-200 bg-white shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                Pilih Metode Pembayaran
              </span>
              <span className="text-[11px] text-gray-400">Pilih salah satu</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: "qris", label: "QRIS", icon: QrCode, desc: "Scan instan" },
                { id: "bank", label: "Bank Transfer", icon: Building2, desc: "BCA / Mandiri" },
                { id: "ewallet", label: "E-Wallet", icon: Smartphone, desc: "GoPay / OVO" },
                { id: "midtrans", label: "Midtrans", icon: CreditCard, desc: "Simulasi Snap" },
              ].map((m) => {
                const Icon = m.icon;
                const active = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      active
                        ? "border-orange-500 bg-orange-50/60 ring-2 ring-orange-500/20 shadow-xs"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-2 ${active ? "text-orange-600" : "text-gray-500"}`} />
                    <div>
                      <div className="font-bold text-xs text-gray-900">{m.label}</div>
                      <div className="text-[10px] text-gray-400">{m.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* METHOD DETAILS CONTAINER */}
            <div className="mt-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
              {/* Option 1: QRIS */}
              {paymentMethod === "qris" && (
                <div className="text-center space-y-3">
                  <div className="inline-block p-3 bg-white rounded-2xl border border-gray-200 shadow-sm">
                    {/* Simulated Clean QRIS Graphic */}
                    <div className="w-44 h-44 mx-auto bg-white p-2 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center relative">
                      <QrCode className="w-28 h-28 text-gray-900" />
                      <div className="mt-1 text-[9px] font-bold text-gray-500 tracking-wider">
                        NMID: ID1020304050607
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-gray-900">
                      Scan QRIS dari Semua Aplikasi Perbankan & E-Wallet
                    </h4>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto mt-0.5">
                      Buka BCA Mobile, Livin’ Mandiri, GoPay, OVO, Dana, atau ShopeePay, lalu scan kode QR di atas.
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-mono font-bold text-gray-700">
                    <span>Nominal Pas: {formatRupiah(amount)}</span>
                  </div>
                </div>
              )}

              {/* Option 2: Bank Transfer (BCA / Mandiri) */}
              {paymentMethod === "bank" && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBank("bca");
                        setSenderBank("BCA");
                      }}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                        selectedBank === "bca"
                          ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                          : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      Bank BCA
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBank("mandiri");
                        setSenderBank("Mandiri");
                      }}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                        selectedBank === "mandiri"
                          ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                          : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      Bank Mandiri
                    </button>
                  </div>

                  {selectedBank === "bca" ? (
                    <div className="bg-white p-3.5 rounded-xl border border-gray-200 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">Nomor Rekening BCA:</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard("883012345678", "bca")}
                          className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
                        >
                          {copiedField === "bca" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedField === "bca" ? "Tersalin!" : "Salin No. Rek"}</span>
                        </button>
                      </div>
                      <div className="text-xl font-mono font-black text-gray-900 tracking-wider">
                        8830-1234-5678
                      </div>
                      <div className="text-xs text-gray-600">
                        Atas Nama: <strong>PT Tata Dana Indonesia</strong>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white p-3.5 rounded-xl border border-gray-200 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">Nomor Rekening Mandiri:</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard("1370098765432", "mandiri")}
                          className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
                        >
                          {copiedField === "mandiri" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedField === "mandiri" ? "Tersalin!" : "Salin No. Rek"}</span>
                        </button>
                      </div>
                      <div className="text-xl font-mono font-black text-gray-900 tracking-wider">
                        137-00-9876543-2
                      </div>
                      <div className="text-xs text-gray-600">
                        Atas Nama: <strong>PT Tata Dana Indonesia</strong>
                      </div>
                    </div>
                  )}

                  <p className="text-[11px] text-gray-500">
                    Pastikan mentransfer nominal tepat <strong>{formatRupiah(amount)}</strong> agar verifikasi admin berjalan cepat.
                  </p>
                </div>
              )}

              {/* Option 3: E-Wallet */}
              {paymentMethod === "ewallet" && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    {(["gopay", "ovo", "dana"] as const).map((ew) => (
                      <button
                        key={ew}
                        type="button"
                        onClick={() => {
                          setSelectedEwallet(ew);
                          setSenderBank(ew.toUpperCase());
                        }}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg border uppercase transition-all ${
                          selectedEwallet === ew
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                            : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        {ew}
                      </button>
                    ))}
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-gray-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Nomor {selectedEwallet.toUpperCase()}:</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard("081234567890", "ewallet")}
                        className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
                      >
                        {copiedField === "ewallet" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedField === "ewallet" ? "Tersalin!" : "Salin Nomor"}</span>
                      </button>
                    </div>
                    <div className="text-xl font-mono font-black text-gray-900 tracking-wider">
                      0812-3456-7890
                    </div>
                    <div className="text-xs text-gray-600">
                      Atas Nama: <strong>TataDana Official</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Option 4: Midtrans Simulation */}
              {paymentMethod === "midtrans" && (
                <div className="text-center space-y-3 py-2">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center mx-auto">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-gray-900">
                      Simulasi Gateway Pembayaran Midtrans Snap
                    </h4>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto mt-0.5">
                      Mode simulasi otomatis. Mengklik konfirmasi akan langsung memicu callback status settlement dan memproses aktivasi paket.
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold">
                    <span>Status Sandbox: Ready for Auto-Settlement</span>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* KONFIRMASI PEMBAYARAN FORM */}
          <Card className="p-5 border-gray-200 bg-white shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-extrabold text-gray-900 tracking-tight">
                Konfirmasi Bukti Pembayaran
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Kirim data dan bukti transfer agar tim admin segera memverifikasi akun Anda.
              </p>
            </div>

            {error && (
              <div className="p-3 text-xs bg-red-50 text-red-700 rounded-xl border border-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmitConfirmation} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                    Nama Pemilik Rekening / Pengirim
                  </label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="Nama di mutasi bank"
                    required
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                    Bank / Sumber Pembayaran
                  </label>
                  <input
                    type="text"
                    value={senderBank}
                    onChange={(e) => setSenderBank(e.target.value)}
                    placeholder="Contoh: BCA / Mandiri / GoPay"
                    required
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>
              </div>

              {/* Upload Proof / Receipt */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                  Upload Bukti Transfer / Struk Pembayaran
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <label className="flex-1 w-full flex items-center justify-center gap-2 px-3 py-2.5 border border-dashed border-gray-300 hover:border-orange-500 rounded-xl cursor-pointer bg-gray-50 hover:bg-orange-50/30 transition-colors text-xs text-gray-600">
                    <Upload className="w-4 h-4 text-orange-600 shrink-0" />
                    <span className="truncate">
                      {proofFileName ? proofFileName : "Pilih file struk transfer (PNG, JPG)"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handleUseSampleReceipt}
                    className="w-full sm:w-auto px-3 py-2.5 text-xs font-bold text-orange-700 bg-orange-100/70 hover:bg-orange-200 rounded-xl transition-colors shrink-0"
                  >
                    Gunakan Struk Simulasi
                  </button>
                </div>

                {proofImage && (
                  <div className="mt-2 text-[11px] text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Bukti transfer terlampir ({proofFileName || "struk simulasi terverifikasi"})</span>
                  </div>
                )}
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                  Catatan Tambahan (Opsional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Sudah transfer via BCA Mobile pukul 14:30 WIB"
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                isLoading={submitting}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 text-sm rounded-xl shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 mt-4"
              >
                <span>Kirim Konfirmasi Pembayaran &rarr;</span>
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center text-gray-500">
          <div className="w-10 h-10 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mb-4" />
          <span className="text-xs font-semibold tracking-wider uppercase text-gray-400">
            Memuat Rincian Pembayaran...
          </span>
        </div>
      }
    >
      <PaymentContent />
    </Suspense>
  );
}
