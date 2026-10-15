"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Bot,
  Play,
  ArrowRight,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ChevronDown,
  Receipt,
  Mic,
  BarChart3,
  Brain,
  HelpCircle,
  Star,
  Layers,
  Clock,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatRupiah } from "@/lib/utils/currency";

export default function LandingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "lifetime">("monthly");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Toggle FAQ
  const toggleFaq = (idx: number) => {
    setOpenFaqIndex(openFaqIndex === idx ? null : idx);
  };

  const faqItems = [
    {
      q: "Apakah saya bisa mencatat transaksi menggunakan foto struk di paket Starter?",
      a: "Fitur pencatatan otomatis via foto struk belanja menggunakan AI Vision OCR eksklusif untuk paket Pro. Di paket Starter, kamu tetap bisa mencatat transaksi tanpa batas menggunakan chat teks natural dan rekaman suara (Voice Note) Telegram.",
    },
    {
      q: "Bagaimana keamanan dan privasi data transaksi saya di TataDana?",
      a: "TataDana menggunakan arsitektur keamanan standar industri fintech. Database kami dilindungi Row Level Security (RLS) PostgreSQL dari Supabase, di mana setiap user hanya bisa membaca dan memodifikasi datanya sendiri. Token API dan password disimpan terenkripsi, dan akses audit admin dipantau ketat secara permanen.",
    },
    {
      q: "Apakah saya harus membuat bot Telegram sendiri atau menggunakan bot bersama?",
      a: "TataDana menyediakan satu bot Telegram resmi bersama (@tatadana_bot) yang langsung siap pakai begitu kamu mendaftar dan memverifikasi nomor HP. Jika kamu ingin menggunakan bot pribadi eksklusif dengan nama toko atau nama pribadimu, kamu juga bisa memasukkan token BotFather di menu Settings.",
    },
    {
      q: "Format teks apa saja yang dipahami oleh bot Telegram TataDana?",
      a: "Bot kami didukung Large Language Model (LLM) dengan parsing nominal bahasa Indonesia colloquial. Kamu bisa mengetik natural seperti 'beli bakso 15rb', 'gajian 5.5jt', 'bayar listrik pln 250k', 'kopi janji jiwa 28ribu', dan bot akan otomatis mengenali nominal, jenis transaksi, dan kategori yang sesuai.",
    },
    {
      q: "Bagaimana cara kerja AI Financial Advisor di paket Pro?",
      a: "AI Financial Advisor memantau pola arus kasmu secara otomatis di latar belakang tanpa perlu kamu panggil. Advisor akan langsung mengirimkan peringatan dan saran proaktif di Telegram jika pengeluaran suatu kategori melonjak lebih dari 50% dibanding minggu lalu, atau saat pengeluaran bulananmu sudah mendekati 80% dari pemasukan.",
    },
    {
      q: "Bisakah saya mengunduh laporan keuangan ke file Excel dan PDF?",
      a: "Ya! Di paket Pro, kamu bisa mengekspor laporan keuangan native TataDana langsung ke file PDF profesional dan Excel (.xlsx) dengan multi-sheet lengkap (ringkasan, riwayat transaksi, dan rincian item struk). File disimpan privat dengan signed URL yang dapat didownload kapan saja.",
    },
    {
      q: "Metode pembayaran apa saja yang didukung untuk berlangganan Pro?",
      a: "Kami mendukung pembayaran instan otomatis via Midtrans (GoPay, QRIS, Transfer Virtual Account BCA/Mandiri/BRI/BNI, Kartu Kredit) serta opsi Transfer Bank Manual yang bisa kamu upload bukti transfernya untuk diapprove langsung oleh admin kami.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-gray-900 selection:bg-orange-500 selection:text-white">
      {/* ======================================================================
          1. NAVBAR (Sticky, logo TataDana, Fitur/Harga/FAQ, Masuk + Coba Gratis)
          ====================================================================== */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-600 to-orange-400 flex items-center justify-center shadow-md shadow-orange-500/20 text-white font-bold text-lg">
              T
            </div>
            <div>
              <span className="font-extrabold text-xl text-gray-900 tracking-tight">
                Tata<span className="text-orange-500">Dana</span>
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-600">
            <a href="#fitur" className="hover:text-orange-600 transition-colors">
              Fitur
            </a>
            <a href="#demo" className="hover:text-orange-600 transition-colors">
              Cara Kerja
            </a>
            <a href="#pricing" className="hover:text-orange-600 transition-colors">
              Harga
            </a>
            <a href="#faq" className="hover:text-orange-600 transition-colors">
              FAQ
            </a>
          </nav>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs sm:text-sm font-bold text-gray-700 hover:text-orange-600 px-3 py-2 transition-colors"
            >
              Masuk
            </Link>
            <Link href="/register">
              <Button size="sm" className="font-bold">
                Coba Gratis
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ======================================================================
          2 & 3 & 4. PRE-HEADLINE BADGE, HEADLINE (H1), SUB-HEADLINE
          ====================================================================== */}
      <section className="pt-16 pb-12 sm:pt-24 sm:pb-16 px-4 sm:px-8 max-w-5xl mx-auto text-center">
        {/* Pre-headline Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-100/80 border border-orange-200 text-orange-800 text-xs sm:text-sm font-bold mb-6">
          <Sparkles className="w-4 h-4 text-orange-600" />
          <span>Catat keuangan langsung dari Telegram</span>
        </div>

        {/* Headline (H1) with gradient */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-950 tracking-tight leading-[1.15] mb-6">
          Gaji habis sebelum akhir bulan?{" "}
          <span className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 bg-clip-text text-transparent">
            Sudah saatnya kamu tahu
          </span>{" "}
          ke mana uangmu pergi.
        </h1>

        {/* Sub-headline */}
        <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto mb-8 leading-relaxed">
          TataDana mencatat setiap pengeluaranmu langsung dari chat Telegram atau foto struk —
          sisanya kami yang urus.
        </p>

        {/* ======================================================================
            6. CTA BUTTONS ("Mulai Gratis Sekarang" + "Lihat cara kerjanya ->")
            ====================================================================== */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-14">
          <Link href="/register" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto text-base px-8 py-3.5 shadow-lg shadow-orange-500/25">
              Mulai Gratis Sekarang
            </Button>
          </Link>
          <a href="#demo" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full sm:w-auto text-base px-6">
              Lihat cara kerjanya &rarr;
            </Button>
          </a>
        </div>

        {/* ======================================================================
            5. HERO SECTION VIDEO (Placeholder Video clearly marked)
            ====================================================================== */}
        <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-slate-900 aspect-video max-w-4xl mx-auto flex flex-col items-center justify-center group">
          <div className="absolute inset-0 bg-gradient-to-tr from-orange-950/60 to-slate-950/80" />
          <div className="relative z-10 text-center p-6 space-y-3">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-orange-500 group-hover:bg-orange-600 group-hover:scale-110 text-white flex items-center justify-center mx-auto shadow-xl transition-all cursor-pointer">
              <Play className="w-8 h-8 fill-current ml-1" />
            </div>
            <p className="text-white font-extrabold text-sm sm:text-base">
              [PLACEHOLDER VIDEO DEMO TATADANA]
            </p>
            <p className="text-xs text-orange-200/80 max-w-md">
              (Video berdurasi 60 detik memperlihatkan kemudahan mencatat keuangan mulai dari saldo awal Rp0 langsung via Telegram)
            </p>
          </div>
        </div>
      </section>

      {/* ======================================================================
          7 & 8. PROBLEM AWARE BULLETS & SOLUTION TRANSITION
          ====================================================================== */}
      <section className="py-16 sm:py-20 bg-white border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="orange" className="mb-2">Relatable Problem</Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Kenapa mencatat keuangan manual selalu gagal?
            </h2>
          </div>

          {/* 3 Problem Bullets */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card className="p-6 border-red-100 bg-rose-50/30">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mb-4 text-lg font-bold">
                ✕
              </div>
              <h3 className="font-bold text-base text-gray-900 mb-2">
                "Buka aplikasi keuangan? Nanti dulu deh..."
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Aplikasi keuangan biasa terlalu ribet: harus login, pilih sub-akun, cari form, pilih kategori. Ujung-ujungnya malas dan catatan tertunda berhari-hari.
              </p>
            </Card>

            <Card className="p-6 border-red-100 bg-rose-50/30">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mb-4 text-lg font-bold">
                ✕
              </div>
              <h3 className="font-bold text-base text-gray-900 mb-2">
                "Kok uangnya habis ya? Padahal kayak tidak beli apa-apa"
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Pengeluaran mikro (kopi kekinian, biaya admin, parkir, jajan sore) bocor halus tanpa disadari dan tidak pernah dicatat karena dianggap sepele.
              </p>
            </Card>

            <Card className="p-6 border-red-100 bg-rose-50/30">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mb-4 text-lg font-bold">
                ✕
              </div>
              <h3 className="font-bold text-base text-gray-900 mb-2">
                "Udah niat bikin budget, tapi seminggu lupa"
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Budget yang dibuat di Excel tidak pernah dibuka lagi. Tanpa peringatan otomatis yang mengingatkan di aplikasi chat, budget sama saja tak ada gunanya.
              </p>
            </Card>
          </div>

          {/* Solution Transition */}
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl p-8 text-center text-white shadow-xl shadow-orange-500/20 max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-100">
              Solusi Baru
            </span>
            <h3 className="text-xl sm:text-2xl font-extrabold mt-1 mb-2">
              Bagaimana kalau mencatat keuangan semudah kirim pesan ke teman?
            </h3>
            <p className="text-sm text-orange-50/90 mb-5">
              Tanpa form panjang, tanpa install aplikasi tambahan yang berat. Cukup kirim chat di Telegram!
            </p>
            <span className="inline-block font-black text-2xl tracking-tight bg-white text-orange-600 px-5 py-1.5 rounded-full shadow-md">
              Introducing TataDana ✨
            </span>
          </div>
        </div>
      </section>

      {/* ======================================================================
          9. INTERACTIVE DASHBOARD PREVIEW & AUTHENTIC TELEGRAM CHAT PREVIEW
          ====================================================================== */}
      <section id="demo" className="py-16 sm:py-24 max-w-6xl mx-auto px-4 sm:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge variant="orange" className="mb-2">Preview Antarmuka Asli</Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Interaktif: Chat Telegram & Dashboard Terpadu
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Lihat bagaimana pesan natural kamu diubah seketika menjadi grafik dan kartu saldo real-time.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left: Authentic Telegram Bot Chat Mockup */}
          <div className="bg-[#EFEAE2] rounded-3xl p-5 border border-gray-200 shadow-xl space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-300">
              <div className="w-10 h-10 rounded-full bg-orange-500 text-white font-black flex items-center justify-center">
                🤖
              </div>
              <div>
                <h4 className="font-bold text-sm text-gray-900">TataDana Bot</h4>
                <span className="text-[11px] text-emerald-600 font-semibold">online · bot resmi</span>
              </div>
            </div>

            {/* Chat bubble 1: User message */}
            <div className="flex justify-end">
              <div className="bg-[#DCF8C6] text-gray-900 rounded-2xl rounded-tr-none px-4 py-2 text-xs shadow-sm max-w-[80%]">
                /saldo
                <div className="text-[9px] text-emerald-800 text-right mt-1">12:30 WIB · ✓✓</div>
              </div>
            </div>

            {/* Chat bubble 2: Authentic Bot Reply for Zero State */}
            <div className="flex justify-start">
              <div className="bg-white text-gray-900 rounded-2xl rounded-tl-none px-4 py-3 text-xs shadow-sm whitespace-pre-wrap font-sans max-w-[90%] border border-gray-100">
{`📅 Senin, 14 Oktober 2026 — 12:30 WIB
👛 Saldo Dompet Kamu:
├ 💵 Tunai (Cash) : Rp0
├ 🏦 BCA Tabungan : Rp0
└ 📱 GoPay : Rp0

💰 Total Saldo : Rp0
📊 Belum ada transaksi tercatat.
Semua akun baru mulai bersih dari saldo Rp0!`}
                <div className="text-[9px] text-gray-400 text-right mt-1">12:30 WIB</div>
              </div>
            </div>

            {/* Chat bubble 3: Voice Note simulation */}
            <div className="flex justify-end">
              <div className="bg-[#DCF8C6] text-gray-900 rounded-2xl rounded-tr-none px-3.5 py-2 text-xs shadow-sm max-w-[80%] flex items-center gap-2">
                <Bot className="w-4 h-4 text-emerald-700" />
                <span>Akun Baru Bersih Tanpa Transaksi Fiktif</span>
                <span className="text-[9px] text-emerald-800 ml-2">12:31 WIB · ✓✓</span>
              </div>
            </div>

            {/* Chat bubble 4: Bot Reply with Zero State Info */}
            <div className="flex justify-start">
              <div className="bg-white text-gray-900 rounded-2xl rounded-tl-none px-4 py-3 text-xs shadow-sm whitespace-pre-wrap font-sans max-w-[90%] border border-gray-100">
{`👋 Selamat datang di TataDana!
Akunmu siap digunakan dengan saldo Rp0.
Semua transaksi fiktif telah dihapus sepenuhnya.

💡 Catat pengeluaran atau pemasukan pertamamu kapan saja!`}
                <div className="text-[9px] text-gray-400 text-right mt-1">12:31 WIB</div>
              </div>
            </div>
          </div>

          {/* Right: Interactive Dashboard Preview Card */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                Sinkronisasi Dashboard TataDana
              </span>
              <Badge variant="green">Update Otomatis Real-time</Badge>
            </div>

            {/* Real-time stats starting at Rp0 before registration/login */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-orange-50/60 rounded-xl border border-orange-100">
                <span className="text-[10px] uppercase font-bold text-gray-400">Total Saldo Awal</span>
                <p className="text-base font-black text-gray-900 mt-0.5">Rp0</p>
                <span className="text-[10px] text-gray-500 mt-0.5 block">Akun baru: Rp0</span>
              </div>
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                <span className="text-[10px] uppercase font-bold text-emerald-600">Total Pemasukan</span>
                <p className="text-base font-black text-emerald-700 mt-0.5">Rp0</p>
                <span className="text-[10px] text-gray-500 mt-0.5 block">Belum ada pemasukan</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-100">
                <span className="text-[10px] uppercase font-bold text-rose-600">Total Pengeluaran</span>
                <p className="text-base font-black text-rose-700 mt-0.5">Rp0</p>
                <span className="text-[10px] text-gray-500 mt-0.5 block">Belum ada pengeluaran</span>
              </div>
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                <span className="text-[10px] uppercase font-bold text-blue-600">Sisa Budget</span>
                <p className="text-base font-black text-blue-700 mt-0.5">Rp0</p>
                <span className="text-[10px] text-gray-500 mt-0.5 block">Atur via dashboard</span>
              </div>
            </div>

            {/* Empty state prompt */}
            <div className="p-3 rounded-xl bg-gray-50 border border-dashed border-gray-200 text-center">
              <p className="text-xs font-semibold text-gray-700">Belum ada riwayat transaksi</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Nilai keuangan dimulai dari Rp0 dan otomatis diperbarui saat transaksi pertama dicatat.
              </p>
            </div>

            <Link href="/register" className="block pt-1">
              <Button variant="primary" className="w-full text-xs font-bold py-2.5">
                Daftar & Buat Akun Saldo Rp0 &rarr;
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ======================================================================
          10. FITUR SECTION (3 alternating features layout)
          ====================================================================== */}
      <section id="fitur" className="py-16 sm:py-24 bg-white border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 space-y-20">
          {/* Fitur 1: Catat via Telegram (Teks, Suara & Foto Struk) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-4">
              <Badge variant="orange">Fitur Inti</Badge>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                Catat Transaksi Semudah Kirim Chat WhatsApp atau Telegram
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Tulis sesukamu: "beli soto 20rb", "gajian 6jt", kirim pesan suara saat lagi nyetir,
                atau foto struk belanjaan di supermarket. Didukung AI Vision & NLP yang mengenali
                format mata uang rupiah Indonesia.
              </p>
              <ul className="text-xs text-gray-700 space-y-2 font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Mendukung ribuan variasi kata ("15rb", "1.5jt", "500k", "20ribu")
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Voice Note otomatis ditranskrip menjadi teks dan dicatat
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Foto struk belanja otomatis memecah rincian item barang (Paket Pro)
                </li>
              </ul>
            </div>
            <div className="bg-orange-50/60 rounded-3xl p-6 border border-orange-100 shadow-md">
              <img
                src="https://images.unsplash.com/photo-1554415707-9e49667ff0c8?w=600&auto=format&fit=crop&q=80"
                alt="Receipt Scan OCR"
                className="rounded-2xl object-cover h-64 w-full shadow-sm"
              />
              <div className="mt-3 text-center text-xs font-semibold text-orange-950">
                AI Vision membaca toko, harga per item, dan total belanjaan otomatis
              </div>
            </div>
          </div>

          {/* Fitur 2: Laporan & Export Otomatis di Dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="order-2 lg:order-1 bg-blue-50/50 rounded-3xl p-6 border border-blue-100 shadow-md">
              <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-800">Laporan Keuangan Otomatis</span>
                  <Badge variant="blue">PDF & Excel</Badge>
                </div>
                <div className="h-32 bg-gray-50 rounded-xl border border-dashed border-gray-200 flex flex-col items-center justify-center p-3 text-center">
                  <BarChart3 className="w-8 h-8 text-blue-500 mb-1" />
                  <span className="text-xs font-bold text-gray-700">Analisis Cashflow & Top Kategori</span>
                  <span className="text-[11px] text-gray-400">Download sewaktu-waktu dengan signed URL aman</span>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2 space-y-4">
              <Badge variant="blue">Laporan In-App</Badge>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                Laporan & Export Lengkap Tanpa Ribet Bikin Rumus
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Tinggalkan formula Excel manual yang sering error. Di dashboard TataDana, semua laporan
                pemasukan, pengeluaran, perbandingan 6 bulan, dan net cashflow sudah tersaji otomatis.
              </p>
              <ul className="text-xs text-gray-700 space-y-2 font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Export sekali klik ke format PDF dan Excel (.xlsx)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Tabel interaktif dengan filter multi-dompet dan kategori
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Riwayat export tersimpan rapi di cloud privat Supabase
                </li>
              </ul>
            </div>
          </div>

          {/* Fitur 3: AI Financial Advisor */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-4">
              <Badge variant="purple">Kecerdasan Buatan</Badge>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                AI Financial Advisor yang Menjaga Keuanganmu 24/7
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Bukan cuma mencatat angka, TataDana menganalisis perilaku keuanganmu. Jika pengeluaran
                kopi atau jajan naik drastis dibanding minggu lalu, bot langsung memberikan rekomendasi
                konkret agar tabungan akhir bulan tetap aman.
              </p>
              <ul className="text-xs text-gray-700 space-y-2 font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Deteksi lonjakan belanja lebih dari 50% secara otomatis
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Peringatan dini saat pengeluaran mendekati 80% dari gaji
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Saran spesifik dan actionable tanpa jargon perbankan yang rumit
                </li>
              </ul>
            </div>
            <div className="bg-purple-50/60 rounded-3xl p-6 border border-purple-100 shadow-md">
              <div className="bg-white rounded-2xl p-4 shadow-sm space-y-2 border border-purple-100">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  <span className="font-bold text-xs text-gray-900">Peringatan Advisor Proaktif</span>
                </div>
                <div className="p-3 bg-purple-50 rounded-xl text-xs text-purple-950 font-sans leading-relaxed">
                  "Halo! Akun baru kamu siap dipantau 24/7.<br/><br/>
                  💡 <strong>Status:</strong> Saldo Rp0 dan belum ada transaksi. AI Financial Advisor akan aktif menganalisis begitu transaksi pertamamu tercatat."
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================================
          11. TESTIMONIALS (Masonry Grid, clearly marked as placeholder)
          ====================================================================== */}
      <section className="py-16 sm:py-24 max-w-6xl mx-auto px-4 sm:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge variant="orange" className="mb-2">[PLACEHOLDER BETA TESTER]</Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Cerita Mereka yang Keuangannya Lebih Terkontrol
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            *Review di bawah ini merupakan ilustrasi placeholder pra-peluncuran versi Beta.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            {
              name: "Dimas Pratama",
              role: "Software Engineer, Jakarta",
              text: "Dulu males banget buka app keuangan tiap beli kopi atau naik ojol. Pake TataDana tinggal ketik di Telegram pas lagi jalan, saldo BCA langsung kepotong otomatis. Gila sih praktisnya!",
            },
            {
              name: "Anisa Putri",
              role: "Freelance Designer, Bandung",
              text: "Fitur multi-wallet nya ngebantu banget bedain uang operasional sama kas tabungan. Terus Voice Note-nya akurat banget nerjemahin bahasa Indonesia sehari-hari.",
            },
            {
              name: "Rian Hidayat",
              role: "Mahasiswa Tingkat Akhir, Jogja",
              text: "Uang bulanan dari ortu biasanya tanggal 20 udah tipis. Sejak pasang budget per kategori dan dapet warning di Telegram, pengeluaran nongkrong jadi terkontrol.",
            },
            {
              name: "Vivi Angelina",
              role: "Content Creator, Surabaya",
              text: "Fitur foto struk belanjaan di paket Pro luar biasa. Habis belanja bulanan tinggal foto, langsung kepisah mana makanan mana sabun mandi tanpa input satu-satu.",
            },
            {
              name: "Bambang Wijaya",
              role: "Karyawan Swasta, Tangerang",
              text: "Laporan PDF-nya rapi banget buat laporan keluarga di akhir bulan. Net cashflow keliatan jelas tanpa perlu utak-atik spreadsheet.",
            },
            {
              name: "Sarah Amanda",
              role: "Product Manager, Jakarta",
              text: "AI Advisor-nya beneran berguna pas ada pengeluaran impulsif. Pesan reminder jam 8 malam selalu bikin ingat review pengeluaran harian.",
            },
          ].map((t, i) => (
            <Card key={i} className="p-5 flex flex-col justify-between space-y-4">
              <p className="text-xs text-gray-700 leading-relaxed italic">
                "{t.text}"
              </p>
              <div className="pt-3 border-t border-gray-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 font-bold flex items-center justify-center text-xs">
                  {t.name[0]}
                </div>
                <div>
                  <h5 className="font-bold text-xs text-gray-900">{t.name}</h5>
                  <span className="text-[11px] text-gray-400">{t.role}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ======================================================================
          12. PRICING (Toggle Bulanan / Sekali Bayar, 2 Kolom: Starter | Pro)
          ====================================================================== */}
      <section id="pricing" className="py-16 sm:py-24 bg-white border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <Badge variant="orange" className="mb-2">Investasi Keuangan</Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Pilih Paket Sesuai Kebutuhanmu
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Mulai gratis atau buka akses penuh untuk kontrol finansial tanpa batas.
            </p>

            {/* Pricing Toggle */}
            <div className="mt-6 inline-flex p-1 bg-gray-100 rounded-2xl border border-gray-200">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                  billingCycle === "monthly"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Langganan Bulanan
              </button>
              <button
                onClick={() => setBillingCycle("lifetime")}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                  billingCycle === "lifetime"
                    ? "bg-orange-500 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Sekali Bayar (Lifetime) ⭐
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Starter Plan */}
            <Card className="p-8 border-gray-200 flex flex-col justify-between space-y-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Starter</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Cocok untuk mahasiswa dan pemula yang ingin mulai disiplin mencatat.
                </p>
                <div className="mt-4 text-3xl font-black text-gray-900">
                  Rp49.000 <span className="text-xs font-normal text-gray-500">/ bulan</span>
                </div>

                <ul className="mt-6 space-y-3 text-xs text-gray-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Catat transaksi via teks & Voice Note Telegram
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Maksimal 50 transaksi / bulan
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Maksimal 3 dompet (Cash, BCA, E-wallet)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Maksimal 5 target budget kategori
                  </li>
                  <li className="flex items-center gap-2 text-gray-400 line-through">
                    Input via foto struk (AI Vision OCR)
                  </li>
                  <li className="flex items-center gap-2 text-gray-400 line-through">
                    Export laporan ke PDF & Excel
                  </li>
                  <li className="flex items-center gap-2 text-gray-400 line-through">
                    AI Financial Advisor proaktif
                  </li>
                </ul>
              </div>

              <Link href="/register">
                <Button variant="outline" className="w-full font-bold">
                  Mulai dengan Starter
                </Button>
              </Link>
            </Card>

            {/* Pro Plan */}
            <Card className="p-8 border-2 border-orange-500 shadow-xl bg-gradient-to-b from-orange-50/40 to-white relative flex flex-col justify-between space-y-6">
              <span className="absolute -top-3 right-6 text-[11px] font-black uppercase tracking-wider bg-orange-500 text-white px-3 py-0.5 rounded-full shadow-md">
                Paling Hemat
              </span>

              <div>
                <h3 className="text-xl font-bold text-gray-900">Pro Lifetime</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Kontrol finansial penuh untuk karyawan dan profesional.
                </p>
                <div className="mt-4 text-3xl font-black text-gray-900">
                  Rp99.000{" "}
                  <span className="text-xs font-normal text-gray-500">
                    / sekali bayar selamanya
                  </span>
                </div>

                <ul className="mt-6 space-y-3 text-xs text-gray-800 font-medium">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <strong>Semua fitur Starter</strong>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <strong>Unlimited transaksi</strong> per bulan
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <strong>Unlimited dompet</strong> & kategori budget
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <strong>Input foto struk belanja</strong> dengan AI OCR
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <strong>Export unlimited ke PDF & Excel</strong> (.xlsx)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <strong>AI Financial Advisor</strong> peringatan lonjakan otomatis
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Jadwal reminder custom hingga 2x sehari
                  </li>
                </ul>
              </div>

              <Link href="/register">
                <Button variant="primary" className="w-full font-bold shadow-md shadow-orange-500/25">
                  Dapatkan Akses Pro Sekarang
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </section>

      {/* ======================================================================
          13. FAQ (Minimal 7 Pertanyaan Relevan)
          ====================================================================== */}
      <section id="faq" className="py-16 sm:py-24 max-w-4xl mx-auto px-4 sm:px-8">
        <div className="text-center max-w-xl mx-auto mb-12">
          <Badge variant="orange" className="mb-2">Pertanyaan Populer</Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Pertanyaan yang Sering Diajukan
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Semua yang perlu kamu tahu tentang TataDana dan integrasi bot Telegram.
          </p>
        </div>

        <div className="space-y-3">
          {faqItems.map((item, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden transition-all shadow-sm"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-gray-900 hover:text-orange-600 transition-colors"
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-orange-600" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-5 sm:px-5 text-xs text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ======================================================================
          14. FINAL CTA (Background gradient orange)
          ====================================================================== */}
      <section className="py-16 sm:py-20 px-4 sm:px-8 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 text-white text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            Mulai kendalikan keuanganmu hari ini
          </h2>
          <p className="text-sm sm:text-base text-orange-100 max-w-xl mx-auto">
            Hanya butuh 30 detik untuk menghubungkan bot Telegram dan mencatat pengeluaran pertamamu. Tanpa kartu kredit.
          </p>
          <div className="pt-2">
            <Link href="/register">
              <Button
                size="lg"
                className="bg-white hover:bg-orange-50 text-orange-600 font-extrabold shadow-2xl px-8"
              >
                Coba Gratis Sekarang &rarr;
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ======================================================================
          15. FOOTER (4 columns: Logo+sosmed | Produk | Perusahaan | Legal)
          ====================================================================== */}
      <footer className="bg-slate-950 text-slate-400 py-12 px-4 sm:px-8 border-t border-slate-900 text-xs">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1: Logo & Tagline */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center font-bold">
                T
              </div>
              <span className="font-extrabold text-lg text-white">TataDana</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Catat keuangan semudah chat — langsung dari Telegram kamu.
            </p>
            <div className="text-[11px] text-slate-500">
              © 2026 TataDana Fintech Indonesia. All rights reserved.
            </div>
          </div>

          {/* Col 2: Produk */}
          <div className="space-y-2">
            <h5 className="font-bold text-white text-xs uppercase tracking-wider mb-2">Produk</h5>
            <div><a href="#fitur" className="hover:text-white">Bot Telegram</a></div>
            <div><a href="#fitur" className="hover:text-white">AI Vision OCR Struk</a></div>
            <div><a href="#fitur" className="hover:text-white">Voice Note STT</a></div>
            <div><a href="#pricing" className="hover:text-white">Biaya & Langganan</a></div>
          </div>

          {/* Col 3: Perusahaan */}
          <div className="space-y-2">
            <h5 className="font-bold text-white text-xs uppercase tracking-wider mb-2">Perusahaan</h5>
            <div><a href="#demo" className="hover:text-white">Tentang Kami</a></div>
            <div><a href="#demo" className="hover:text-white">Panduan BotFather</a></div>
            <div><a href="#faq" className="hover:text-white">Pusat Bantuan</a></div>
            <div><Link href="/admin" className="text-orange-400 hover:text-orange-300">Admin Portal</Link></div>
          </div>

          {/* Col 4: Legal */}
          <div className="space-y-2">
            <h5 className="font-bold text-white text-xs uppercase tracking-wider mb-2">Legal & Keamanan</h5>
            <div><span className="hover:text-white cursor-pointer">Kebijakan Privasi</span></div>
            <div><span className="hover:text-white cursor-pointer">Syarat & Ketentuan</span></div>
            <div><span className="hover:text-white cursor-pointer">Kepatuhan Data RLS</span></div>
            <div><span className="hover:text-white cursor-pointer">SLA Layanan</span></div>
          </div>
        </div>
      </footer>
    </div>
  );
}
