"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ShieldAlert,
  LayoutDashboard,
  Cpu,
  Users,
  Eye,
  CreditCard,
  FileCode,
  Download,
  ArrowLeft,
  Menu,
  Sparkles,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [adminUser, setAdminUser] = useState<any>(null);

  const [accessDeniedMsg, setAccessDeniedMsg] = useState<string | null>(null);

  // Jika sedang di halaman login admin, langsung render tanpa sidebar/auth guard
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    // Check if redirected here due to denied access
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("denied") === "user_only") {
        setAccessDeniedMsg("Akses Ditolak: Administrator tidak diperkenankan mengakses Dashboard Pengguna. Anda diarahkan kembali ke Dashboard Admin.");
      }
    }

    if (isLoginPage) {
      setIsCheckingAuth(false);
      return;
    }

    const verifyServerAdminSession = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("tatadana_session") : null;
        const authHeaders: Record<string, string> = { "Cache-Control": "no-store" };
        if (token) {
          authHeaders["Authorization"] = `Bearer ${token}`;
        }

        const res = await fetch("/api/auth/me", {
          headers: authHeaders,
          cache: "no-store",
          credentials: "include",
        });
        if (!res.ok) {
          window.location.href = "/login";
          return;
        }

        const data = await res.json();
        if (!data.ok || !data.isAdmin) {
          // User is authenticated but NOT an administrator -> redirect to user dashboard with notification
          if (data.user?.verification_status === "pending" || data.user?.verification_status === "rejected") {
            window.location.href = "/verification-pending";
          } else {
            window.location.href = "/dashboard?denied=admin_only";
          }
          return;
        }

        setAdminUser(data.user);
        setIsCheckingAuth(false);
      } catch {
        window.location.href = "/login";
      }
    };

    verifyServerAdminSession();
  }, [pathname, isLoginPage, router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    localStorage.removeItem("tatadana_admin_session");
    document.cookie = "tatadana_session=; path=/; max-age=0";
    document.cookie = "tatadana_admin_auth=; path=/; max-age=0";
    router.push("/login");
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <div className="w-10 h-10 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mb-4" />
        <span className="text-xs font-semibold tracking-wider uppercase text-slate-500">
          Memverifikasi Sesi Superadmin...
        </span>
      </div>
    );
  }

  const navigation = [
    { name: "Ringkasan Admin", href: "/admin", icon: LayoutDashboard },
    { name: "Kelola AI Provider", href: "/admin/ai-providers", icon: Cpu },
    { name: "Manajemen User", href: "/admin/users", icon: Users },
    { name: "Inspeksi Transaksi (Audit)", href: "/admin/transactions", icon: Eye },
    { name: "Persetujuan Pembayaran", href: "/admin/payments", icon: CreditCard },
    { name: "Log Pemanggilan AI", href: "/admin/ai-logs", icon: FileCode },
    { name: "Export Data Sistem", href: "/admin/export", icon: Download },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center font-black text-white text-base shadow-md shadow-orange-500/30">
            T
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-white block">
              Tata<span className="text-orange-400">Dana</span> Admin
            </span>
            <span className="text-[10px] text-orange-400 font-bold tracking-wider uppercase">
              Superadmin Portal
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? "bg-orange-600 text-white shadow-md shadow-orange-600/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <item.icon className="w-4 h-4" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Admin User Info & Logout */}
      <div className="p-4 border-t border-slate-800 space-y-2">
        <div className="px-2 py-1.5 flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/40 flex items-center justify-center font-bold text-xs">
            SA
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white truncate">
              {adminUser?.full_name || "Super Admin Nova"}
            </p>
            <p className="text-[10px] text-slate-400 font-mono truncate">
              {adminUser?.email || "novaputrisyakira648@gmail.com"}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 p-2.5 rounded-xl transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar Superadmin</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 z-50 shadow-2xl animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col flex-1 min-w-0">
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Badge variant="purple" className="py-1 px-3">
                <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />
                Mode Superadmin Aktif
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
              Superadmin Portal
            </span>
            <button
              onClick={handleLogout}
              title="Keluar Superadmin"
              className="text-xs font-bold text-slate-500 hover:text-rose-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto space-y-6">
          {accessDeniedMsg && (
            <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-xl shadow-sm flex items-start justify-between gap-3 text-amber-900 text-xs animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-2 font-medium">
                <span className="text-base">⚠️</span>
                <span>{accessDeniedMsg}</span>
              </div>
              <button
                onClick={() => setAccessDeniedMsg(null)}
                className="text-amber-700 hover:text-amber-900 font-bold ml-2"
              >
                ✕
              </button>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
