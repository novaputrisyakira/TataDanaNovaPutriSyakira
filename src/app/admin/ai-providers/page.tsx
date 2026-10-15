"use client";

import React, { useEffect, useState } from "react";
import { Cpu, Shield, Save, Check, RefreshCw, Layers } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AIProviderConfig, AISystemSettings } from "@/types";

export default function AdminAIProvidersPage() {
  const [providers, setProviders] = useState<AIProviderConfig[]>([]);
  const [settings, setSettings] = useState<AISystemSettings>({
    id: 1,
    mode: "parallel_failover",
    primary_provider: "gemini",
    updated_at: new Date().toISOString(),
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const loadData = async () => {
    try {
      const res = await fetch("/api/admin/ai-settings");
      const d = await res.json();
      if (d.ok) {
        setProviders(d.providers);
        setSettings(d.settings);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveMode = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch("/api/admin/ai-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleToggleProvider = async (id: string, currentState: boolean) => {
    try {
      await fetch("/api/admin/ai-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerUpdate: { id, is_enabled: !currentState },
        }),
      });
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          🤖 Konfigurasi Multi-Provider AI
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Atur penyedia AI (Gemini, GPT, DeepSeek), mode failover otomatis, dan kredensial API.
        </p>
      </div>

      {/* Global Orchestration Mode */}
      <Card className="p-6 bg-white border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Mode Orkestrasi Pemanggilan AI</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Pilih apakah sistem menggunakan satu provider statis atau failover otomatis jika terjadi timeout / limit.
            </p>
          </div>
          {saveSuccess && (
            <Badge variant="green" className="gap-1">
              <Check className="w-3.5 h-3.5" /> Tersimpan
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label
            onClick={() => setSettings({ ...settings, mode: "parallel_failover" })}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
              settings.mode === "parallel_failover"
                ? "border-orange-500 bg-orange-50/50"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs text-slate-900">
                Mode Failover Otomatis (Direkomendasikan)
              </span>
              <input
                type="radio"
                name="ai_mode"
                checked={settings.mode === "parallel_failover"}
                onChange={() => {}}
                className="text-orange-500"
              />
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Jika provider utama mengalami downtime atau error, otomatis beralih ke provider cadangan (Gemini &rarr; OpenAI &rarr; DeepSeek) tanpa kegagalan transaksi user.
            </p>
          </label>

          <label
            onClick={() => setSettings({ ...settings, mode: "single" })}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
              settings.mode === "single"
                ? "border-orange-500 bg-orange-50/50"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs text-slate-900">Mode Single Provider Saja</span>
              <input
                type="radio"
                name="ai_mode"
                checked={settings.mode === "single"}
                onChange={() => {}}
                className="text-orange-500"
              />
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Hanya menggunakan satu provider terpilih secara eksklusif. Transaksi akan error jika provider tersebut mengalami gangguan.
            </p>
          </label>
        </div>

        {/* Primary provider selector */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-700">Provider Utama:</span>
            <select
              value={settings.primary_provider}
              onChange={(e) => setSettings({ ...settings, primary_provider: e.target.value as any })}
              className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 font-semibold"
            >
              <option value="gemini">Google Gemini 1.5 Flash</option>
              <option value="openai">OpenAI GPT-4o Mini</option>
              <option value="deepseek">DeepSeek Chat</option>
            </select>
          </div>

          <Button size="sm" onClick={handleSaveMode} isLoading={saving}>
            Simpan Pengaturan Mode
          </Button>
        </div>
      </Card>

      {/* Provider List Cards */}
      <div className="space-y-4">
        <h3 className="font-bold text-slate-900 text-sm">Daftar Provider Terdaftar</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {providers.map((prov) => (
            <Card key={prov.id} className="p-5 border-slate-200 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wide">
                    {prov.provider_name}
                  </h4>
                  <span className="text-xs text-slate-400 font-mono">{prov.model_name}</span>
                </div>
                <Badge variant={prov.is_enabled ? "green" : "gray"}>
                  {prov.is_enabled ? "Aktif" : "Nonaktif"}
                </Badge>
              </div>

              <div className="text-xs text-slate-500 space-y-1">
                <div>Prioritas Urutan: #{prov.priority_order}</div>
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <Shield className="w-3 h-3 text-emerald-600" />
                  <span>Kredensial disimpan terenkripsi</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-600 font-medium">Status Provider</span>
                <button
                  onClick={() => handleToggleProvider(prov.id, prov.is_enabled)}
                  className={`text-xs font-bold px-2.5 py-1 rounded-lg transition-colors ${
                    prov.is_enabled
                      ? "text-rose-600 bg-rose-50 hover:bg-rose-100"
                      : "text-emerald-600 bg-emerald-50 hover:bg-emerald-100"
                  }`}
                >
                  {prov.is_enabled ? "Nonaktifkan" : "Aktifkan"}
                </button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
