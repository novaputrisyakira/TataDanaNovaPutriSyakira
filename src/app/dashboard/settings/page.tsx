"use client";

import React, { useState, useEffect, useRef } from "react";
import { useDashboard } from "../layout";
import {
  User,
  Bot,
  Bell,
  Tags,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Shield,
  CreditCard,
  Sparkles,
  RefreshCw,
  Plus,
  Camera,
  Upload,
  Image as ImageIcon,
  Trash2,
  Check,
  Link as LinkIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/utils/currency";

const PRESET_AVATARS = [
  { label: "Pria Profesional", url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80" },
  { label: "Wanita Profesional", url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80" },
  { label: "Pria Modern", url: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&auto=format&fit=crop&q=80" },
  { label: "Wanita Bisnis", url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80" },
  { label: "3D Casual", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80" },
  { label: "Fintech Bot", url: "https://api.dicebear.com/7.x/bottts/svg?seed=tatadana_pro" },
  { label: "Petualang", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=tatadana_adventure" },
  { label: "Notionist", url: "https://api.dicebear.com/7.x/notionists/svg?seed=tatadana_notion" },
];

export default function SettingsPage() {
  const { profile, categories, refreshData } = useDashboard();

  const [activeTab, setActiveTab] = useState<"profile" | "telegram" | "reminder" | "categories" | "plan">("telegram");

  // Profile Tab state
  const [fullName, setFullName] = useState(profile.full_name);
  const [currency, setCurrency] = useState(profile.currency || "IDR");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState("");
  const [showPresets, setShowPresets] = useState(false);
  const [showCustomUrlInput, setShowCustomUrlInput] = useState(false);
  const [customUrlValue, setCustomUrlValue] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync tab from query param if available
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam && ["profile", "telegram", "reminder", "categories", "plan"].includes(tabParam)) {
        setActiveTab(tabParam as any);
      }
    }
  }, []);

  // Sync profile when context updates
  useEffect(() => {
    if (profile.full_name) setFullName(profile.full_name);
    if (profile.currency) setCurrency(profile.currency);
    if (profile.avatar_url !== undefined) setAvatarUrl(profile.avatar_url);
  }, [profile]);

  // Telegram Tab state
  const [botToken, setBotToken] = useState(
    (profile as any)?.custom_bot_token || "8589951302:AAGR4pvpSK2JIUwXdMolwzBX9BMMHQhdcaY"
  );
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{
    status: "idle" | "testing" | "connected" | "disconnected";
    message?: string;
    botUsername?: string;
  }>({
    status: "connected",
    botUsername: profile.telegram_username || "mitawiwbot",
    message: "Bot aktif dan terhubung ke sistem TataDana (@mitawiwbot)",
  });

  // Reminder Tab state
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderFreq, setReminderFreq] = useState<1 | 2>(1);
  const [reminderTime1, setReminderTime1] = useState("20:00");
  const [reminderTime2, setReminderTime2] = useState("12:00");
  const [savingReminder, setSavingReminder] = useState(false);
  const [reminderSuccessMsg, setReminderSuccessMsg] = useState("");

  // Categories Tab state
  const [newCatName, setNewCatName] = useState("");
  const [newCatType, setNewCatType] = useState<"income" | "expense">("expense");
  const [newCatEmoji, setNewCatEmoji] = useState("🍕");
  const [savingCat, setSavingCat] = useState(false);

  // Upgrade Plan state
  const [upgrading, setUpgrading] = useState(false);

  // Handlers
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Harap pilih file gambar (JPG, PNG, atau WebP).");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      alert("Ukuran file maksimal 8MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_DIM = 400;
        let w = img.width;
        let h = img.height;

        if (w > h) {
          if (w > MAX_DIM) {
            h = Math.round((h * MAX_DIM) / w);
            w = MAX_DIM;
          }
        } else {
          if (h > MAX_DIM) {
            w = Math.round((w * MAX_DIM) / h);
            h = MAX_DIM;
          }
        }

        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const compressed = canvas.toDataURL("image/jpeg", 0.85);
          setAvatarUrl(compressed);
          setProfileSuccessMsg("Foto baru siap disimpan! Klik 'Simpan Perubahan Profil' di bawah.");
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSelectPreset = (url: string) => {
    setAvatarUrl(url);
    setShowPresets(false);
    setProfileSuccessMsg("Avatar dipilih! Klik 'Simpan Perubahan Profil' di bawah.");
  };

  const handleApplyCustomUrl = () => {
    if (!customUrlValue.trim()) return;
    setAvatarUrl(customUrlValue.trim());
    setCustomUrlValue("");
    setShowCustomUrlInput(false);
    setProfileSuccessMsg("URL foto diterapkan! Klik 'Simpan Perubahan Profil' di bawah.");
  };

  const handleResetAvatar = () => {
    setAvatarUrl("");
    setProfileSuccessMsg("Foto direset ke default! Klik 'Simpan Perubahan Profil' untuk mengonfirmasi.");
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSuccessMsg("");
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: profile.id,
          profileUpdates: { full_name: fullName, currency, avatar_url: avatarUrl },
        }),
      });

      if (typeof window !== "undefined") {
        if (avatarUrl) {
          localStorage.setItem("tatadana_user_avatar", avatarUrl);
        } else {
          localStorage.removeItem("tatadana_user_avatar");
        }
        localStorage.setItem("tatadana_user_fullname", fullName);
      }

      await refreshData();
      setProfileSuccessMsg("Profil dan foto profil berhasil diperbarui!");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleTestConnection = async () => {
    if (!botToken.trim()) {
      alert("Masukkan token bot Telegram terlebih dahulu.");
      return;
    }

    setTestingConnection(true);
    setTestResult({ status: "testing" });

    try {
      const res = await fetch("/api/telegram/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: botToken, userId: profile.id }),
      });

      const data = await res.json();
      if (data.ok) {
        setTestResult({
          status: "connected",
          message: data.message,
          botUsername: data.botUsername,
        });
        await refreshData();
      } else {
        setTestResult({
          status: "disconnected",
          message: data.error || "Gagal menghubungkan token Telegram",
        });
      }
    } catch (err: any) {
      setTestResult({
        status: "disconnected",
        message: err.message,
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveReminder = async () => {
    setSavingReminder(true);
    setReminderSuccessMsg("");
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: profile.id,
          reminderUpdates: {
            is_enabled: reminderEnabled,
            frequency: reminderFreq,
            time_1: `${reminderTime1}:00`,
            time_2: `${reminderTime2}:00`,
          },
        }),
      });
      setReminderSuccessMsg("Pengaturan pengingat berhasil disimpan!");
    } finally {
      setSavingReminder(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    setSavingCat(true);
    try {
      await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: profile.id,
          name: newCatName.trim(),
          type: newCatType,
          emoji: newCatEmoji,
        }),
      });
      setNewCatName("");
      await refreshData();
    } finally {
      setSavingCat(false);
    }
  };

  const handleUpgradePro = async () => {
    setUpgrading(true);
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: profile.id,
          upgradeToPro: true,
        }),
      });
      await refreshData();
      alert("Selamat! Akun kamu berhasil di-upgrade ke paket Pro.");
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
          ⚙️ Pengaturan Aplikasi
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
          Kelola integrasi bot Telegram, profil akun, jadwal reminder harian, dan kategori pengeluaran.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto gap-4">
        {[
          { id: "telegram", label: "Telegram Bot", icon: Bot },
          { id: "profile", label: "Profil Akun", icon: User },
          { id: "reminder", label: "Pengingat Harian", icon: Bell },
          { id: "categories", label: "Kategori Custom", icon: Tags },
          { id: "plan", label: "Paket & Langganan", icon: Sparkles },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 pb-3 text-xs sm:text-sm font-semibold whitespace-nowrap transition-all border-b-2 ${
                isActive
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Telegram Bot Integration */}
      {activeTab === "telegram" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 space-y-5">
            <div>
              <h3 className="font-bold text-gray-900 text-base">Setup Token Bot Telegram</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Hubungkan bot Telegram kamu agar bisa menerima pesan transaksi secara langsung.
              </p>
            </div>

            {/* Connection Status Badge */}
            <div className="p-4 rounded-xl border flex items-center justify-between bg-gray-50 border-gray-200">
              <div className="flex items-center gap-3">
                <span
                  className={`w-3.5 h-3.5 rounded-full ${
                    testResult.status === "testing"
                      ? "bg-amber-400 animate-ping"
                      : testResult.status === "connected"
                      ? "bg-emerald-500"
                      : "bg-rose-500"
                  }`}
                />
                <div>
                  <span className="text-xs font-bold text-gray-900 block">
                    Status Koneksi:{" "}
                    {testResult.status === "testing"
                      ? "⏳ Testing..."
                      : testResult.status === "connected"
                      ? `🟢 Terhubung (@${testResult.botUsername || profile.telegram_username || "tatadana_bot"})`
                      : "🔴 Tidak terhubung"}
                  </span>
                  {testResult.message && (
                    <span className="text-[11px] text-gray-500 block mt-0.5">
                      {testResult.message}
                    </span>
                  )}
                </div>
              </div>

              {testResult.status === "connected" && (
                <Badge variant="green">Siap Digunakan</Badge>
              )}
            </div>

            {/* Token Input Form */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
                Bot Token dari BotFather
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  placeholder="Contoh: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz..."
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-mono text-gray-900 focus:outline-none focus:ring-4 focus:ring-orange-200 focus:border-orange-500"
                />
              </div>
              <p className="text-[11px] text-gray-400">
                Token disimpan terenkripsi. 1 bot token hanya dapat dihubungkan ke 1 akun TataDana.
              </p>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <Button
                onClick={handleTestConnection}
                isLoading={testingConnection}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Test Koneksi & Simpan</span>
              </Button>

              <button
                type="button"
                onClick={() => setBotToken("demo_token_tatadana_bot")}
                className="text-xs text-orange-600 hover:underline"
              >
                Gunakan demo token simulasi
              </button>
            </div>
          </Card>

          {/* BotFather Step-by-Step Guide */}
          <Card className="space-y-4 bg-orange-50/50 border-orange-100">
            <div className="flex items-center gap-2 text-orange-950">
              <Bot className="w-5 h-5 text-orange-600" />
              <h4 className="font-bold text-sm">Panduan Membuat Bot</h4>
            </div>

            <ol className="text-xs text-orange-950/80 space-y-3 list-decimal list-inside leading-relaxed">
              <li>
                Buka Telegram dan cari akun resmi{" "}
                <a
                  href="https://t.me/BotFather"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-orange-600 underline inline-flex items-center gap-0.5"
                >
                  @BotFather <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                Kirim perintah <code className="bg-white px-1.5 py-0.5 rounded font-mono font-bold text-orange-700">/newbot</code>
              </li>
              <li>Beri nama bot kamu (misal: <em>Catat Duit Budi</em>)</li>
              <li>Tentukan username bot berakhiran <code className="bg-white px-1.5 py-0.5 rounded font-mono font-bold text-orange-700">_bot</code></li>
              <li>Copy <strong>HTTP API Token</strong> yang diberikan dan paste di form sebelah kiri</li>
              <li>Klik tombol <strong>Test Koneksi</strong> untuk memverifikasi dan memasang Webhook otomatis</li>
            </ol>
          </Card>
        </div>
      )}

      {/* TAB 2: Profil Akun & Ganti Foto Profil */}
      {activeTab === "profile" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 space-y-6">
            <div>
              <h3 className="font-bold text-gray-900 text-base">Profil Akun & Foto</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Kelola foto profil, nama lengkap, dan preferensi akun TataDana kamu.
              </p>
            </div>

            {profileSuccessMsg && (
              <div className="p-3.5 text-xs bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{profileSuccessMsg}</span>
              </div>
            )}

            {/* SEKSI GANTI FOTO PROFIL */}
            <div className="p-4 sm:p-5 bg-gradient-to-br from-orange-50/70 via-white to-amber-50/40 rounded-2xl border border-orange-200/80 space-y-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-orange-900">
                📸 Foto Profil Akun
              </label>

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                {/* Avatar Preview with Camera overlay */}
                <div className="relative group shrink-0">
                  <img
                    src={
                      avatarUrl ||
                      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80"
                    }
                    alt={fullName || "User Avatar"}
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-white shadow-md ring-4 ring-orange-200/80 group-hover:ring-orange-400 transition-all bg-orange-100"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Klik untuk ganti foto dari file"
                    className="absolute inset-0 bg-black/40 hover:bg-black/55 text-white rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer backdrop-blur-[1px]"
                  >
                    <Camera className="w-6 h-6 mb-1" />
                    <span className="text-[10px] font-bold">Ganti Foto</span>
                  </button>
                  <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></span>
                </div>

                {/* Photo Actions */}
                <div className="flex-1 space-y-3 text-center sm:text-left">
                  <div>
                    <h4 className="font-bold text-sm text-gray-900">Ubah Foto Profil</h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Upload foto kamu sendiri dari perangkat atau pilih avatar siap pakai. Format JPG, PNG, atau WebP.
                    </p>
                  </div>

                  {/* Hidden file input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                    accept="image/png, image/jpeg, image/webp"
                    className="hidden"
                  />

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload dari Laptop/HP</span>
                    </Button>

                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setShowPresets(!showPresets);
                        setShowCustomUrlInput(false);
                      }}
                      className="gap-1.5 text-xs"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-orange-600" />
                      <span>{showPresets ? "Tutup Koleksi" : "Pilih Avatar Siap Pakai"}</span>
                    </Button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowCustomUrlInput(!showCustomUrlInput);
                        setShowPresets(false);
                      }}
                      className="px-2.5 py-1.5 text-xs text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors inline-flex items-center gap-1.5"
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span>Input URL</span>
                    </button>

                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={handleResetAvatar}
                        className="px-2.5 py-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors inline-flex items-center gap-1"
                        title="Kembalikan foto profil default"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus Foto</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Preset Avatars Gallery */}
              {showPresets && (
                <div className="pt-3 border-t border-orange-200/60 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-bold text-orange-950 uppercase tracking-wider">
                      Pilih dari 8 Avatar Siap Pakai:
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPresets(false)}
                      className="text-xs text-gray-400 hover:text-gray-700"
                    >
                      Tutup ✕
                    </button>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
                    {PRESET_AVATARS.map((preset, idx) => {
                      const isSelected = avatarUrl === preset.url;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectPreset(preset.url)}
                          className={`group relative p-1 rounded-2xl border-2 transition-all flex flex-col items-center text-center ${
                            isSelected
                              ? "border-orange-500 bg-orange-100/70 shadow-sm scale-105"
                              : "border-gray-200 hover:border-orange-300 bg-white hover:bg-orange-50/40"
                          }`}
                        >
                          <img
                            src={preset.url}
                            alt={preset.label}
                            className="w-12 h-12 rounded-xl object-cover"
                          />
                          <span className="text-[10px] text-gray-600 mt-1 truncate max-w-full font-medium">
                            {preset.label.split(" ")[0]}
                          </span>
                          {isSelected && (
                            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-orange-500 text-white rounded-full flex items-center justify-center text-[10px]">
                              ✓
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Custom Image URL Input */}
              {showCustomUrlInput && (
                <div className="pt-3 border-t border-orange-200/60 animate-in fade-in slide-in-from-top-2 duration-200 space-y-2">
                  <span className="text-xs font-bold text-gray-700 block">
                    Masukkan URL Gambar Online (https://...):
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={customUrlValue}
                      onChange={(e) => setCustomUrlValue(e.target.value)}
                      placeholder="https://contoh.com/foto-saya.jpg"
                      className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleApplyCustomUrl}
                      disabled={!customUrlValue.trim()}
                    >
                      Terapkan
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* FORM DATA DIRI */}
            <form onSubmit={handleSaveProfile} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                  Nama Lengkap
                </label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nama Lengkap Anda"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
                    Nomor HP (Kunci Akun Telegram)
                  </label>
                  <Badge variant="green" className="py-0.5 text-[10px]">
                    ✓ Terverifikasi
                  </Badge>
                </div>
                <input
                  type="text"
                  value={profile.phone_number || "081234567890"}
                  disabled
                  className="w-full px-3.5 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-500 cursor-not-allowed font-mono"
                />
                <span className="text-[11px] text-gray-400 mt-1 block">
                  Nomor HP ini terhubung dengan autentikasi bot Telegram TataDana.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                  Mata Uang Default
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="IDR">IDR (Rupiah Indonesia - Rp)</option>
                  <option value="USD">USD (US Dollar - $)</option>
                </select>
              </div>

              <div className="pt-2">
                <Button type="submit" isLoading={savingProfile} className="w-full sm:w-auto px-6 py-2.5">
                  Simpan Perubahan Profil
                </Button>
              </div>
            </form>
          </Card>

          {/* Card Kartu Profil Ringkas (Live Preview) */}
          <Card className="h-fit space-y-4 bg-gradient-to-br from-white to-gray-50 border-gray-200">
            <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <User className="w-4 h-4 text-orange-500" />
              <span>Preview Kartu Profil Kamu</span>
            </h4>

            <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm text-center space-y-3">
              <div className="relative inline-block mx-auto">
                <img
                  src={
                    avatarUrl ||
                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80"
                  }
                  alt={fullName}
                  className="w-20 h-20 rounded-full object-cover border-2 border-orange-400 mx-auto shadow-sm"
                />
                <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></span>
              </div>

              <div>
                <p className="font-extrabold text-gray-900 text-base">{fullName || "Nama Pengguna"}</p>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{profile.phone_number || "081234567890"}</p>
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-around text-xs">
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Paket</span>
                  <Badge variant={profile.plan === "pro" ? "green" : "orange"} className="mt-0.5">
                    {profile.plan.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Mata Uang</span>
                  <span className="font-bold text-gray-700 mt-0.5 block">{currency}</span>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-gray-400 leading-relaxed bg-orange-50/60 p-3 rounded-xl border border-orange-100">
              💡 Foto profil kamu akan langsung ditampilkan di sidebar menu, navigasi atas, dan riwayat aktivitas transaksi.
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: Reminder Setting */}
      {activeTab === "reminder" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 space-y-5">
            <div>
              <h3 className="font-bold text-gray-900 text-base">Jadwal Pengingat Harian (Reminder)</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Bot akan mengirimkan reminder ramah via Telegram untuk mengingatkanmu mencatat pengeluaran.
              </p>
            </div>

            {reminderSuccessMsg && (
              <div className="p-3 text-xs bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
                {reminderSuccessMsg}
              </div>
            )}

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div>
                <span className="font-bold text-sm text-gray-900 block">Status Pengingat</span>
                <span className="text-xs text-gray-500">Aktifkan pengingat rutin harian</span>
              </div>
              <input
                type="checkbox"
                checked={reminderEnabled}
                onChange={(e) => setReminderEnabled(e.target.checked)}
                className="w-5 h-5 text-orange-500 rounded focus:ring-orange-400"
              />
            </div>

            {reminderEnabled && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                    Frekuensi Pengingat (Maksimal 2x / hari)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setReminderFreq(1)}
                      className={`p-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                        reminderFreq === 1
                          ? "border-orange-500 bg-orange-50 text-orange-700 shadow-sm"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      1x Sehari (Malam Hari)
                    </button>
                    <button
                      type="button"
                      onClick={() => setReminderFreq(2)}
                      className={`p-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                        reminderFreq === 2
                          ? "border-orange-500 bg-orange-50 text-orange-700 shadow-sm"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      2x Sehari (Siang & Malam)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                      Waktu Pengingat 1 (WIB)
                    </label>
                    <input
                      type="time"
                      value={reminderTime1}
                      onChange={(e) => setReminderTime1(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm"
                    />
                  </div>

                  {reminderFreq === 2 && (
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                        Waktu Pengingat 2 (WIB)
                      </label>
                      <input
                        type="time"
                        value={reminderTime2}
                        onChange={(e) => setReminderTime2(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            <Button onClick={handleSaveReminder} isLoading={savingReminder}>
              Simpan Pengaturan Pengingat
            </Button>
          </Card>

          {/* Reminder Message Live Preview */}
          <Card className="bg-[#EFEAE2] border-gray-200 space-y-3">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
              Preview Pesan Reminder Telegram
            </span>
            <div className="bg-white rounded-2xl rounded-tl-none p-3.5 shadow-sm text-xs font-sans text-gray-900 whitespace-pre-wrap">
              {`⏰ Reminder Keuangan!\nJangan lupa catat pengeluaran hari ini ya 📝\nPencatatan rutin = keuangan lebih terkontrol 💪\nKetik transaksimu sekarang!`}
              <div className="text-[10px] text-gray-400 text-right mt-1.5">
                {reminderTime1} WIB
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 4: Kategori Custom */}
      {activeTab === "categories" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="space-y-4">
            <h3 className="font-bold text-gray-900 text-base">Tambah Kategori</h3>
            <form onSubmit={handleAddCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                  Nama Kategori
                </label>
                <Input
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Contoh: Skincare, Kopi, Donasi..."
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                  Tipe
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewCatType("expense")}
                    className={`py-2 text-xs font-semibold rounded-lg border ${
                      newCatType === "expense"
                        ? "bg-rose-50 border-rose-300 text-rose-700"
                        : "border-gray-200 text-gray-600"
                    }`}
                  >
                    Pengeluaran
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewCatType("income")}
                    className={`py-2 text-xs font-semibold rounded-lg border ${
                      newCatType === "income"
                        ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                        : "border-gray-200 text-gray-600"
                    }`}
                  >
                    Pemasukan
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                  Emoji Ikon
                </label>
                <div className="flex gap-1.5 flex-wrap">
                  {["🍜", "🚗", "🏠", "👕", "🎮", "💊", "📚", "💰", "💼", "☕", "🛒", "✈️"].map(
                    (em) => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => setNewCatEmoji(em)}
                        className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center ${
                          newCatEmoji === em ? "bg-orange-100 border-2 border-orange-500 scale-110" : "bg-gray-100"
                        }`}
                      >
                        {em}
                      </button>
                    )
                  )}
                </div>
              </div>

              <Button type="submit" isLoading={savingCat} className="w-full">
                + Tambah Kategori
              </Button>
            </form>
          </Card>

          <Card className="lg:col-span-2 space-y-4">
            <h3 className="font-bold text-gray-900 text-base">Daftar Kategori Aktif</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/50"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl p-1.5 rounded-lg bg-white shadow-sm">{cat.emoji}</span>
                    <span className="text-xs font-bold text-gray-900">{cat.name}</span>
                  </div>
                  <Badge variant={cat.type === "income" ? "green" : "orange"}>
                    {cat.type === "income" ? "Masuk" : "Keluar"}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 5: Paket & Langganan */}
      {activeTab === "plan" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          {/* Starter Plan Card */}
          <Card
            className={`p-6 relative ${
              profile.plan === "starter" ? "border-2 border-orange-500" : "border-gray-200"
            }`}
          >
            {profile.plan === "starter" && (
              <span className="absolute top-4 right-4 text-xs font-bold bg-orange-100 text-orange-700 px-2.5 py-0.5 rounded-full">
                Paket Aktif Saat Ini
              </span>
            )}
            <h3 className="font-bold text-lg text-gray-900">Starter</h3>
            <div className="text-2xl font-black text-gray-900 mt-2">
              Rp49.000 <span className="text-xs font-normal text-gray-500">/ bulan</span>
            </div>
            <ul className="mt-4 space-y-2.5 text-xs text-gray-600">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Catat via teks Telegram & Voice Note
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Maksimal 50 transaksi / bulan
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Maksimal 3 dompet, 5 budget kategori
              </li>
              <li className="flex items-center gap-2 text-gray-400 line-through">
                Input foto struk dengan AI Vision OCR
              </li>
              <li className="flex items-center gap-2 text-gray-400 line-through">
                Export unlimited ke PDF & Excel (.xlsx)
              </li>
              <li className="flex items-center gap-2 text-gray-400 line-through">
                AI Financial Advisor proaktif
              </li>
            </ul>
          </Card>

          {/* Pro Plan Card */}
          <Card
            className={`p-6 relative bg-gradient-to-br from-orange-50/50 to-amber-50/30 ${
              profile.plan === "pro" ? "border-2 border-emerald-500" : "border-2 border-orange-500 shadow-lg"
            }`}
          >
            {profile.plan === "pro" ? (
              <span className="absolute top-4 right-4 text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                Paket Aktif Saat Ini
              </span>
            ) : (
              <span className="absolute top-4 right-4 text-xs font-bold bg-orange-500 text-white px-2.5 py-0.5 rounded-full">
                Paling Populer ⭐
              </span>
            )}
            <h3 className="font-extrabold text-lg text-gray-900">Pro Lifetime</h3>
            <div className="text-2xl font-black text-gray-900 mt-2">
              Rp99.000 <span className="text-xs font-normal text-gray-500">/ sekali bayar selamanya</span>
            </div>
            <ul className="mt-4 space-y-2.5 text-xs text-gray-700 font-medium">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Semua fitur Starter tanpa batas
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Unlimited transaksi, dompet & kategori
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Foto struk belanja otomatis via AI Vision OCR
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Export unlimited ke PDF & Excel (.xlsx)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                AI Financial Advisor peringatan lonjakan otomatis
              </li>
            </ul>

            {profile.plan !== "pro" && (
              <Button
                variant="primary"
                onClick={handleUpgradePro}
                isLoading={upgrading}
                className="w-full mt-6"
              >
                Upgrade ke Pro Sekarang (Rp99.000)
              </Button>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
