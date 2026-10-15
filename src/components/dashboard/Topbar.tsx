"use client";

import React from "react";
import Link from "next/link";
import { Menu, Plus, Bot, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Profile } from "@/types";

interface TopbarProps {
  profile: Profile;
  onOpenMobileMenu: () => void;
  onOpenAddModal: () => void;
  onOpenSimulator: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  profile,
  onOpenMobileMenu,
  onOpenAddModal,
  onOpenSimulator,
}) => {
  const isConnected = !!profile.telegram_username || !!profile.telegram_id;

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 sm:px-8 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          aria-label="Buka menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Telegram Connection Badge */}
        <div className="hidden sm:flex items-center gap-2">
          {isConnected ? (
            <Badge variant="green" className="py-1 px-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Bot Terhubung: @{profile.telegram_username || "tatadana_bot"}
            </Badge>
          ) : (
            <Badge variant="orange" className="py-1 px-3">
              <span className="w-2 h-2 rounded-full bg-orange-400" />
              Bot Belum Terhubung
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <Button
          variant="secondary"
          size="sm"
          onClick={onOpenSimulator}
          className="hidden sm:inline-flex gap-1.5"
        >
          <Bot className="w-4 h-4 text-orange-600" />
          <span>Tes Chat Bot</span>
        </Button>

        <Button
          variant="primary"
          size="sm"
          onClick={onOpenAddModal}
          className="gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Catat Transaksi</span>
        </Button>

        <Link
          href="/dashboard/settings?tab=profile"
          className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full border border-gray-200 hover:border-orange-300 hover:bg-orange-50/60 transition-all ml-1 group"
          title="Pengaturan Profil & Foto"
        >
          <img
            src={
              profile.avatar_url ||
              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
            }
            alt={profile.full_name}
            className="w-7 h-7 rounded-full object-cover border border-orange-200 group-hover:scale-105 transition-transform"
          />
          <span className="hidden md:inline-block text-xs font-semibold text-gray-700 group-hover:text-orange-600 max-w-[90px] truncate">
            {profile.full_name ? profile.full_name.split(" ")[0] : "Akun"}
          </span>
        </Link>
      </div>
    </header>
  );
};
