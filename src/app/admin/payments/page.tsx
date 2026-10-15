"use client";

import React, { useEffect, useState } from "react";
import { CreditCard, Check, X, ExternalLink, Image, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/utils/currency";
import { formatWIBShort } from "@/lib/utils/date-wib";
import { PaymentTransaction } from "@/types";

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadPayments = async () => {
    try {
      const res = await fetch("/api/admin/payments");
      const d = await res.json();
      if (d.ok) setPayments(d.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const handleUpdateStatus = async (paymentId: string, status: "approved" | "rejected") => {
    const confirmMsg =
      status === "approved"
        ? "Apakah kamu yakin ingin menyetujui pembayaran ini? Akun pengguna akan otomatis diaktifkan dan disetujui."
        : "Tolak bukti pembayaran ini?";
    if (!confirm(confirmMsg)) return;

    setProcessingId(paymentId);
    try {
      const res = await fetch("/api/admin/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, status }),
      });
      if (res.ok) {
        await loadPayments();
      }
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          💳 Persetujuan & Riwayat Pembayaran
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Verifikasi manual transfer bank dan pantau status transaksi Midtrans.
        </p>
      </div>

      <Card className="p-0 border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-500 font-semibold uppercase">
              <tr>
                <th className="py-3 px-4">Order ID & Tanggal</th>
                <th className="py-3 px-4">Pengguna</th>
                <th className="py-3 px-4">Paket & Metode</th>
                <th className="py-3 px-4">Bukti Transfer</th>
                <th className="py-3 px-4 text-right">Nominal</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Tindakan Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map((p) => {
                const isPending = p.status === "pending";

                return (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-slate-900">{p.order_id}</div>
                      <div className="text-[11px] text-slate-400">{formatWIBShort(p.created_at)}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{p.user?.full_name || p.user_id}</div>
                      <div className="text-[11px] text-slate-400">{p.user?.phone_number || "-"}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 uppercase">{p.plan}</div>
                      <div className="text-[11px] text-slate-500 capitalize">{p.method.replace("_", " ")}</div>
                    </td>
                    <td className="py-3 px-4">
                      {p.proof_image_url ? (
                        <a
                          href={p.proof_image_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-600 hover:underline"
                        >
                          <Image className="w-3.5 h-3.5" />
                          <span>Lihat Bukti Transfer</span>
                        </a>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Otomatis Midtrans</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-slate-900">
                      {formatRupiah(p.amount)}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          p.status === "approved" || p.status === "settlement"
                            ? "green"
                            : p.status === "pending"
                            ? "orange"
                            : "red"
                        }
                      >
                        {p.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {isPending ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleUpdateStatus(p.id, "approved")}
                            disabled={processingId === p.id}
                            className="px-2.5 py-1 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Setujui</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleUpdateStatus(p.id, "rejected")}
                            disabled={processingId === p.id}
                            className="px-2.5 py-1 text-xs gap-1"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Tolak</span>
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">Selesai diproses</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
