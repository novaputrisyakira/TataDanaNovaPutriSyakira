"use client";

import React from "react";
import { Modal } from "@/components/ui/modal";
import { Transaction } from "@/types";
import { formatRupiah } from "@/lib/utils/currency";
import { formatWIBShort } from "@/lib/utils/date-wib";
import { Receipt, Calendar, Store, Layers } from "lucide-react";

interface ReceiptDetailModalProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export const ReceiptDetailModal: React.FC<ReceiptDetailModalProps> = ({
  transaction,
  onClose,
}) => {
  if (!transaction) return null;

  const items = transaction.receipt_items || [];

  return (
    <Modal
      isOpen={!!transaction}
      onClose={onClose}
      title="Rincian Item Struk Belanja"
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Receipt Header Card */}
        <div className="bg-orange-50/70 border border-orange-200/80 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-orange-600" />
              <h4 className="font-bold text-gray-900">{transaction.description}</h4>
            </div>
            <span className="text-xs font-bold text-orange-700 bg-orange-100 px-2.5 py-0.5 rounded-full">
              {items.length} Item
            </span>
          </div>

          <div className="text-xs text-gray-600 space-y-1">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <span>{formatWIBShort(transaction.transaction_date)}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-orange-200/60 font-medium">
              <span>Total Tagihan:</span>
              <span className="text-base font-extrabold text-orange-700">
                {formatRupiah(transaction.amount)}
              </span>
            </div>
          </div>
        </div>

        {/* Itemized list */}
        <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Nama Barang</th>
                <th className="py-2.5 px-3">Kategori</th>
                <th className="py-2.5 px-3 text-center">Qty</th>
                <th className="py-2.5 px-3 text-right">Harga</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50/60">
                  <td className="py-2.5 px-3 font-medium text-gray-900">{item.name}</td>
                  <td className="py-2.5 px-3 text-gray-500">{item.category || "Kebutuhan"}</td>
                  <td className="py-2.5 px-3 text-center text-gray-600">{item.qty || 1}</td>
                  <td className="py-2.5 px-3 text-right font-semibold text-gray-900">
                    {formatRupiah(item.price)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="text-[11px] text-gray-400 text-center">
          Dianalisis secara otomatis menggunakan AI Vision TataDana OCR
        </div>
      </div>
    </Modal>
  );
};
