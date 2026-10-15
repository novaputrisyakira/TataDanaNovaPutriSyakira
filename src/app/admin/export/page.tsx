"use client";

import React, { useState } from "react";
import { Download, FileSpreadsheet, FileJson, Shield, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminExportPage() {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = (format: "csv" | "json") => {
    window.open(`/api/admin/export-system?format=${format}`, "_blank");
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          📥 Export Data Sistem & Analisis Internal
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Unduh dataset komprehensif pengguna, status langganan, dan transaksi untuk kebutuhan laporan internal.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CSV Card */}
        <Card className="p-6 border-slate-200 flex flex-col justify-between space-y-4">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Format CSV Spreadsheet</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Format tabular yang langsung kompatibel dengan Microsoft Excel, Google Sheets, atau Tableau untuk analisis metrik pertumbuhan user dan plan.
            </p>
          </div>

          <Button
            onClick={() => handleDownload("csv")}
            className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
          >
            <Download className="w-4 h-4" />
            <span>Unduh CSV Pengguna (.csv)</span>
          </Button>
        </Card>

        {/* JSON Card */}
        <Card className="p-6 border-slate-200 flex flex-col justify-between space-y-4">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <FileJson className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Format JSON Terstruktur</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Format data mentah lengkap dengan struktur relasi dompet, transaksi, dan setting pengguna untuk migrasi database atau backup sistem.
            </p>
          </div>

          <Button
            onClick={() => handleDownload("json")}
            variant="outline"
            className="w-full gap-2 border-slate-300"
          >
            <Download className="w-4 h-4" />
            <span>Unduh JSON Lengkap (.json)</span>
          </Button>
        </Card>
      </div>
    </div>
  );
}
