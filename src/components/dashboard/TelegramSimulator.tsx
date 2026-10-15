"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, Image, Mic, Sparkles, X, Bot, Check, AlertCircle, ArrowRight, CornerDownLeft } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

interface InteractiveOption {
  id: string;
  label: string;
  emoji?: string;
  description?: string;
}

interface TelegramSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  initialAction?: string;
  onTransactionCreated?: () => void;
}

interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  time: string;
  status?: "success" | "warning" | "error" | "info";
  isVoice?: boolean;
  hasPhoto?: boolean;
  interactiveType?: "savings_preference" | "savings_custom" | "savings_goal" | "savings_goal_custom";
  interactiveOptions?: InteractiveOption[];
}

export const TelegramSimulator: React.FC<TelegramSimulatorProps> = ({
  isOpen,
  onClose,
  userId,
  initialAction,
  onTransactionCreated,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "m0",
      sender: "bot",
      text: "👋 Halo! Saya TataDana Bot.\nAkun barumu aktif dengan saldo Rp0.\n• Ketik /saldo untuk cek dompet (semua mulai Rp0)\n• Ketik /tabungan untuk mengatur tempat menyimpan uang & target tabungan\n• Ketik transaksi kapan saja saat kamu siap mencatat!",
      time: "Sekarang",
      status: "info",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [customInputValue, setCustomInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const actionTriggeredRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const samplePrompts = [
    "/saldo",
    "/tabungan",
    "/budget",
    "/hari ini",
    "/bulan ini",
  ];

  const handleSend = async (customText?: string, isPhoto = false, isVoice = false) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim() && !isPhoto && !isVoice) return;

    // Friendly display text for user bubble if payload is marked
    let displayText = textToSend;
    if (textToSend.startsWith("[PILIH_SIMPAN]: ")) {
      displayText = `Saya memilih: ${textToSend.replace("[PILIH_SIMPAN]: ", "")}`;
    } else if (textToSend.startsWith("[CUSTOM_SIMPAN]: ")) {
      displayText = `Tempat simpan kustom: ${textToSend.replace("[CUSTOM_SIMPAN]: ", "")}`;
    } else if (textToSend.startsWith("[PILIH_TUJUAN]: ")) {
      displayText = `Target tabungan: ${textToSend.replace("[PILIH_TUJUAN]: ", "")}`;
    } else if (textToSend.startsWith("[CUSTOM_TUJUAN]: ")) {
      displayText = `Target kustom: ${textToSend.replace("[CUSTOM_TUJUAN]: ", "")}`;
    }

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: isPhoto
        ? "📸 [Mengirim Foto Struk Belanja]"
        : isVoice
        ? "🎙️ [Mengirim Voice Note Transaksi]"
        : displayText,
      time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      isVoice,
      hasPhoto: isPhoto,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setCustomInputValue("");
    setLoading(true);

    try {
      const res = await fetch("/api/telegram/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          message: isPhoto || isVoice ? "" : textToSend,
          photoUrl: isPhoto ? "https://images.unsplash.com/photo-1554415707-9e49667ff0c8" : undefined,
          voiceUrl: isVoice ? "demo-audio-note" : undefined,
          voiceDuration: isVoice ? 12 : undefined,
        }),
      });

      const data = await res.json();
      const botMsg: ChatMessage = {
        id: `b-${Date.now()}`,
        sender: "bot",
        text: data.reply || data.error || "Pesan tidak dapat diproses.",
        time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        status: data.status || (data.ok ? "success" : "error"),
        interactiveType: data.interactiveType,
        interactiveOptions: data.interactiveOptions,
      };

      setMessages((prev) => [...prev, botMsg]);
      if ((data.transaction || data.updatedProfile) && onTransactionCreated) {
        onTransactionCreated();
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `b-${Date.now()}`,
          sender: "bot",
          text: `❌ Terjadi kesalahan koneksi simulasi: ${err.message}`,
          time: "Sekarang",
          status: "error",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (option: InteractiveOption, type?: string) => {
    if (option.label === "Lainnya") {
      handleSend("[PILIH_SIMPAN]: Lainnya");
    } else if (option.label === "Belum menentukan pilihan") {
      handleSend("[PILIH_SIMPAN]: Belum menentukan pilihan");
    } else if (type === "savings_preference") {
      handleSend(`[PILIH_SIMPAN]: ${option.label}`);
    } else if (type === "savings_goal") {
      handleSend(`[PILIH_TUJUAN]: ${option.label}`);
    } else {
      handleSend(option.label);
    }
  };

  const handleCustomSubmit = (type?: string) => {
    if (!customInputValue.trim()) return;
    if (type === "savings_custom") {
      handleSend(`[CUSTOM_SIMPAN]: ${customInputValue.trim()}`);
    } else if (type === "savings_goal_custom") {
      handleSend(`[CUSTOM_TUJUAN]: ${customInputValue.trim()}`);
    } else {
      handleSend(customInputValue.trim());
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (isOpen && initialAction === "tabungan" && !actionTriggeredRef.current) {
      actionTriggeredRef.current = true;
      handleSend("/tabungan");
    }
    if (!isOpen) {
      actionTriggeredRef.current = false;
    }
  }, [isOpen, initialAction]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="💬 Asisten Keuangan TataDana (Telegram)"
      maxWidth="lg"
    >
      <div className="flex flex-col h-[560px]">
        {/* Banner note */}
        <div className="bg-orange-50 border border-orange-200/70 rounded-xl p-3 mb-2 flex items-start gap-2.5 text-xs text-orange-900">
          <Sparkles className="w-4 h-4 text-orange-600 mt-0.5 shrink-0" />
          <p>
            Simulasi ini terhubung langsung ke profil TataDana kamu. Atur preferensi tempat simpan uang,
            catat arus kas, atau konsultasi finansial secara interaktif.
          </p>
        </div>

        {/* Quick sample chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider shrink-0">
            Aksi Cepat:
          </span>
          <button
            onClick={() => handleSend("/tabungan")}
            disabled={loading}
            className="text-xs px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded-lg whitespace-nowrap transition-colors flex items-center gap-1 shadow-sm"
          >
            <span>🏦 Pilihan Simpan Uang</span>
          </button>
          {samplePrompts.map((p) => (
            <button
              key={p}
              onClick={() => handleSend(p)}
              disabled={loading}
              className="text-xs px-2.5 py-1 bg-gray-100 hover:bg-orange-100 hover:text-orange-700 text-gray-700 rounded-lg whitespace-nowrap transition-colors"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Telegram Chat Box */}
        <div className="flex-1 bg-[#EFEAE2] rounded-xl p-4 overflow-y-auto space-y-3.5 border border-gray-200 shadow-inner mt-1">
          {messages.map((m, idx) => {
            const isLastMessage = idx === messages.length - 1;
            return (
              <div
                key={m.id}
                className={`flex flex-col ${
                  m.sender === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[88%] sm:max-w-[82%] rounded-2xl px-4 py-2.5 text-sm shadow-sm whitespace-pre-wrap font-sans ${
                    m.sender === "user"
                      ? "bg-[#DCF8C6] text-gray-900 rounded-tr-none"
                      : "bg-white text-gray-900 rounded-tl-none border border-gray-100"
                  }`}
                >
                  {m.text}

                  {/* Interactive Options as Cards / Buttons */}
                  {m.interactiveOptions && m.interactiveOptions.length > 0 && isLastMessage && (
                    <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                      <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-orange-500" />
                        <span>Pilih opsi langsung:</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {m.interactiveOptions.map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleSelectOption(opt, m.interactiveType)}
                            disabled={loading}
                            className="w-full text-left p-2.5 rounded-xl border border-gray-200 hover:border-orange-500 bg-gray-50/70 hover:bg-orange-50/80 transition-all flex items-start gap-2 group shadow-xs"
                          >
                            <span className="text-base shrink-0 mt-0.5">{opt.emoji || "👉"}</span>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-gray-900 group-hover:text-orange-900 leading-tight">
                                {opt.label}
                              </p>
                              {opt.description && (
                                <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">
                                  {opt.description}
                                </p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Custom Text Input for 'Lainnya' and Custom Goal */}
                  {(m.interactiveType === "savings_custom" || m.interactiveType === "savings_goal_custom") && isLastMessage && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={customInputValue}
                          onChange={(e) => setCustomInputValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleCustomSubmit(m.interactiveType);
                            }
                          }}
                          placeholder={
                            m.interactiveType === "savings_custom"
                              ? "Contoh: Reksadana, Emas Batangan, SBN..."
                              : "Contoh: Membeli Rumah, Modal Usaha..."
                          }
                          autoFocus
                          disabled={loading}
                          className="flex-1 text-xs px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                        />
                        <button
                          type="button"
                          onClick={() => handleCustomSubmit(m.interactiveType)}
                          disabled={loading || !customInputValue.trim()}
                          className="px-3 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1"
                        >
                          <span>Kirim</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}

                  <div
                    className={`text-[10px] text-right mt-1.5 ${
                      m.sender === "user" ? "text-emerald-700" : "text-gray-400"
                    }`}
                  >
                    {m.time}
                  </div>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-start">
              <div className="bg-white rounded-2xl rounded-tl-none px-4 py-2.5 text-xs text-gray-500 shadow-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
                TataDana Bot sedang memproses...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="pt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSend(undefined, true, false)}
            disabled={loading}
            title="Kirim Foto Struk (Pro)"
            className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:text-orange-600 hover:border-orange-500 hover:bg-orange-50 transition-colors"
          >
            <Image className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => handleSend(undefined, false, true)}
            disabled={loading}
            title="Kirim Voice Note"
            className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:text-orange-600 hover:border-orange-500 hover:bg-orange-50 transition-colors"
          >
            <Mic className="w-5 h-5" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ketik transaksi atau /tabungan untuk atur tempat simpan uang..."
            disabled={loading}
            className="flex-1 bg-white border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 outline-none"
          />

          <Button
            size="md"
            onClick={() => handleSend()}
            disabled={loading || !inputText.trim()}
            className="p-2.5 px-4"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Modal>
  );
};
