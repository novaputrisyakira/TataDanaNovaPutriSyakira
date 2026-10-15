"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  CreditCard,
  BarChart3,
  Target,
  Wallet as WalletIcon,
  Settings,
  LogOut,
  Sparkles,
  Bot,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Profile } from "@/types";

interface SidebarProps {
  profile: Profile;
  isOpen: boolean;
  onClose: () => void;
  onOpenSimulator: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  profile,
  isOpen,
  onClose,
  onOpenSimulator,
}) => {
  const pathname = usePathname();

  const navigation = [
    { name: "Beranda", href: "/dashboard", icon: Home },
    { name: "Transaksi", href: "/dashboard/transaksi", icon: CreditCard },
    { name: "Laporan", href: "/dashboard/laporan", icon: BarChart3 },
    { name: "Budget", href: "/dashboard/budget", icon: Target },
    { name: "Wallet", href: "/dashboard/wallet", icon: WalletIcon },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-gray-100">
      {/* Brand Logo */}
      <div className="p-6 border-b border-gray-50 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-600 to-orange-400 flex items-center justify-center shadow-md shadow-orange-500/20 text-white font-bold text-lg">
            T
          </div>
          <div>
            <span className="font-bold text-xl text-gray-900 tracking-tight">
              Tata<span className="text-orange-500">Dana</span>
            </span>
            <span className="block text-[10px] text-gray-400 font-medium">Fintech Indonesia</span>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-orange-500 text-white shadow-sm shadow-orange-500/30"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? "text-white" : "text-gray-400"}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}

        {/* Telegram Bot Simulator Trigger Button */}
        <button
          onClick={() => {
            onClose();
            onOpenSimulator();
          }}
          className="w-full mt-4 flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-blue-700 bg-blue-50/80 hover:bg-blue-100 transition-colors border border-blue-200/60"
        >
          <Bot className="w-5 h-5 text-blue-600" />
          <div className="text-left">
            <span className="block font-semibold">Simulator Bot</span>
            <span className="block text-[11px] text-blue-500">Tes chat & OCR struk</span>
          </div>
        </button>
      </nav>

      {/* Plan Card */}
      <div className="p-4 mx-4 mb-3 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-orange-800">Paket Akun</span>
          <Badge variant={profile.plan === "pro" ? "green" : "orange"}>
            {profile.plan === "pro" ? "PRO" : "STARTER"}
          </Badge>
        </div>
        <p className="text-xs text-orange-950/70 mb-3">
          {profile.plan === "pro"
            ? "Akses unlimited transaksi, AI Vision, dan full export."
            : "Maks 50 transaksi/bln, 3 dompet, dan 5 budget."}
        </p>
        {profile.plan === "starter" && (
          <Link
            href="/dashboard/settings"
            className="block text-center w-full py-1.5 px-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            Upgrade ke Pro (Rp99k)
          </Link>
        )}
      </div>

      {/* User Profile Footer */}
      <div className="p-4 border-t border-gray-100 flex items-center justify-between">
        <Link
          href="/dashboard/settings?tab=profile"
          className="flex items-center gap-3 group flex-1 mr-2 p-1.5 -ml-1.5 rounded-xl hover:bg-orange-50/70 transition-colors"
          title="Klik untuk ganti foto profil & data diri"
        >
          <div className="relative">
            <img
              src={
                profile.avatar_url ||
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
              }
              alt={profile.full_name}
              className="w-9 h-9 rounded-full object-cover border border-orange-200 group-hover:ring-2 group-hover:ring-orange-400 transition-all"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
          </div>
          <div className="overflow-hidden text-left">
            <p className="text-xs font-bold text-gray-900 truncate group-hover:text-orange-600 transition-colors">
              {profile.full_name}
            </p>
            <p className="text-[11px] text-gray-400 truncate">
              {profile.phone_number || "Belum verifikasi"}
            </p>
          </div>
        </Link>
        <button
          type="button"
          onClick={async () => {
            try {
              await fetch("/api/auth/logout", { method: "POST" });
            } catch {
              // ignore
            }
            document.cookie = "tatadana_session=; path=/; max-age=0";
            document.cookie = "tatadana_admin_auth=; path=/; max-age=0";
            window.location.href = "/login";
          }}
          title="Keluar"
          className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
          <div className="fixed inset-y-0 left-0 w-72 z-50 shadow-2xl animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
