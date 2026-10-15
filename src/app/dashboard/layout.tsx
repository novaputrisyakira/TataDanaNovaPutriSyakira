"use client";

import React, { useState, useEffect, createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { TelegramSimulator } from "@/components/dashboard/TelegramSimulator";
import { TransactionModal } from "@/components/transactions/TransactionModal";
import { Profile, Wallet, Category, Transaction, Budget } from "@/types";

interface DashboardContextType {
  profile: Profile;
  wallets: Wallet[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  refreshData: () => Promise<void>;
  openSimulator: (action?: string) => void;
  openTransactionModal: () => void;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export const useDashboard = () => {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used within DashboardLayout");
  return ctx;
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);

  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [simulatorAction, setSimulatorAction] = useState<string | undefined>(undefined);
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [bannerMsg, setBannerMsg] = useState<{ text: string; type: "error" | "success" } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("denied") === "admin_only") {
        setBannerMsg({
          text: "Akses Ditolak: Halaman Administrator (/admin) hanya dapat diakses oleh akun Admin. Anda telah diarahkan kembali ke Dashboard Pengguna.",
          type: "error",
        });
      } else if (urlParams.get("auth") === "magic_success") {
        setBannerMsg({
          text: "Selamat datang kembali! Anda berhasil masuk menggunakan tautan sekali pakai tanpa kata sandi.",
          type: "success",
        });
      }
    }
  }, []);

  const loadData = async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("tatadana_session") : null;
      const authHeaders: Record<string, string> = { "Cache-Control": "no-store" };
      if (token) {
        authHeaders["Authorization"] = `Bearer ${token}`;
      }

      // 1. Verify user session from backend
      const meRes = await fetch("/api/auth/me", {
        headers: authHeaders,
        cache: "no-store",
        credentials: "include",
      });
      if (!meRes.ok) {
        window.location.href = "/login";
        return;
      }

      const meData = await meRes.json();
      if (!meData.ok || !meData.user) {
        window.location.href = "/login";
        return;
      }

      // 1. Admin is STRICTLY forbidden from accessing user dashboard
      if (meData.isAdmin) {
        window.location.href = "/admin?denied=user_only";
        return;
      }

      // 2. Unverified users must wait on verification page
      const vStatus = meData.user.verification_status || "pending";
      if (vStatus !== "approved") {
        window.location.href = "/verification-pending";
        return;
      }

      let activeProfile: Profile = meData.user;

      // Sync with localStorage overrides if present (e.g. avatar/name edits)
      if (typeof window !== "undefined") {
        const savedAvatar = localStorage.getItem("tatadana_user_avatar");
        if (savedAvatar !== null) {
          activeProfile = { ...activeProfile, avatar_url: savedAvatar };
        }
        const savedName = localStorage.getItem("tatadana_user_fullname");
        if (savedName) {
          activeProfile = { ...activeProfile, full_name: savedName };
        }
      }

      setProfile(activeProfile);

      // 2. Fetch authenticated user's isolated data without caching
      const fetchOpts = { headers: authHeaders, cache: "no-store" as RequestCache, credentials: "include" as RequestCredentials };
      const [walletsRes, categoriesRes, transactionsRes, budgetsRes] = await Promise.all([
        fetch(`/api/wallets?userId=${activeProfile.id}`, fetchOpts).then((r) => r.json()).catch(() => ({ data: [] })),
        fetch(`/api/categories?userId=${activeProfile.id}`, fetchOpts).then((r) => r.json()).catch(() => ({ data: [] })),
        fetch(`/api/transactions?userId=${activeProfile.id}`, fetchOpts).then((r) => r.json()).catch(() => ({ data: [] })),
        fetch(`/api/budgets?userId=${activeProfile.id}`, fetchOpts).then((r) => r.json()).catch(() => ({ data: [] })),
      ]);

      setWallets(walletsRes.data || []);
      setCategories(categoriesRes.data || []);
      setTransactions(transactionsRes.data || []);
      setBudgets(budgetsRes.data || []);
    } catch {
      window.location.href = "/login";
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center text-gray-500">
        <div className="w-10 h-10 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mb-4" />
        <span className="text-xs font-semibold tracking-wider uppercase text-gray-400">
          Memverifikasi Sesi Pengguna...
        </span>
      </div>
    );
  }

  return (
    <DashboardContext.Provider
      value={{
        profile,
        wallets,
        categories,
        transactions,
        budgets,
        refreshData: loadData,
        openSimulator: (action?: string) => {
          setSimulatorAction(action);
          setSimulatorOpen(true);
        },
        openTransactionModal: () => setTransactionModalOpen(true),
      }}
    >
      <div className="min-h-screen bg-[#FDFBF7]">
        {/* Sidebar */}
        <Sidebar
          profile={profile}
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          onOpenSimulator={() => {
            setSimulatorAction(undefined);
            setSimulatorOpen(true);
          }}
        />

        {/* Main Content Area */}
        <div className="lg:pl-64 flex flex-col min-h-screen">
          <Topbar
            profile={profile}
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
            onOpenAddModal={() => setTransactionModalOpen(true)}
            onOpenSimulator={() => {
              setSimulatorAction(undefined);
              setSimulatorOpen(true);
            }}
          />

          <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto space-y-6">
            {bannerMsg && (
              <div
                className={`p-4 rounded-xl border flex items-start justify-between gap-3 text-xs shadow-sm animate-in slide-in-from-top-2 duration-200 ${
                  bannerMsg.type === "error"
                    ? "bg-rose-50 border-rose-300 text-rose-800"
                    : "bg-emerald-50 border-emerald-300 text-emerald-800"
                }`}
              >
                <div className="flex items-center gap-2 font-medium">
                  <span className="text-base">{bannerMsg.type === "error" ? "⚠️" : "🎉"}</span>
                  <span>{bannerMsg.text}</span>
                </div>
                <button
                  onClick={() => setBannerMsg(null)}
                  className="font-bold ml-2 hover:opacity-75"
                >
                  ✕
                </button>
              </div>
            )}
            {children}
          </main>
        </div>

        {/* Global Modals */}
        <TelegramSimulator
          isOpen={simulatorOpen}
          onClose={() => {
            setSimulatorOpen(false);
            setSimulatorAction(undefined);
          }}
          userId={profile.id}
          initialAction={simulatorAction}
          onTransactionCreated={loadData}
        />

        <TransactionModal
          isOpen={transactionModalOpen}
          onClose={() => setTransactionModalOpen(false)}
          wallets={wallets}
          categories={categories}
          userId={profile.id}
          onSuccess={loadData}
        />
      </div>
    </DashboardContext.Provider>
  );
}
