import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TataDana — Catat Keuangan Semudah Chat Langsung dari Telegram",
  description:
    "Aplikasi manajemen keuangan pribadi terintegrasi Telegram Bot. Catat pemasukan, pengeluaran, struk belanja via AI, dan pantau budget secara otomatis.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-[#FDFBF7] text-gray-900 font-sans selection:bg-orange-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
