"use client";

import React, { useEffect, useState } from "react";
import { FileCode, RefreshCw, Cpu, CheckCircle2, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatWIBShort } from "@/lib/utils/date-wib";
import { AILog } from "@/types";

export default function AdminAILogsPage() {
  const [logs, setLogs] = useState<AILog[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/ai-settings");
      const d = await res.json();
      if (d.ok && Array.isArray(d.logs)) {
        setLogs(d.logs);
      }
    } catch (err) {
      console.error("Failed to load AI logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            📑 Log Pemanggilan AI & Analisis Biaya
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Audit latency, token usage, dan histori inferensi model LLM/Vision/STT secara real-time.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadLogs}
          isLoading={loading}
          className="gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Segarkan Log ({logs.length})</span>
        </Button>
      </div>

      <Card className="p-0 border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-500 font-semibold uppercase">
              <tr>
                <th className="py-3 px-4">Waktu (WIB)</th>
                <th className="py-3 px-4">Tipe Task</th>
                <th className="py-3 px-4">Provider & Model</th>
                <th className="py-3 px-4 text-center">Prompt Tok</th>
                <th className="py-3 px-4 text-center">Compl Tok</th>
                <th className="py-3 px-4 text-center">Latency</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-sans">
                    Belum ada log aktivitas pemanggilan AI.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isSuccess = log.status === "success";

                  return (
                    <tr key={log.id} className="hover:bg-slate-50 font-sans">
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap font-sans text-xs">
                        {formatWIBShort(log.created_at)}
                      </td>
                      <td className="py-3 px-4 font-bold font-sans">
                        <Badge
                          variant={
                            log.task_type === "receipt_ocr"
                              ? "orange"
                              : log.task_type === "voice_stt"
                              ? "blue"
                              : log.task_type === "advisor"
                              ? "purple"
                              : "gray"
                          }
                        >
                          {log.task_type}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-800 text-xs">
                        <span className="font-semibold capitalize">{log.provider}</span>{" "}
                        <span className="text-slate-400 font-mono text-[11px]">({log.model})</span>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-600 font-mono text-xs">
                        {log.prompt_tokens}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-600 font-mono text-xs">
                        {log.completion_tokens}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-emerald-600 font-mono text-xs">
                        {log.latency_ms}ms
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Badge variant={isSuccess ? "green" : "red"}>
                          {log.status.toUpperCase()}
                        </Badge>
                        {log.error_message && (
                          <div className="text-[10px] text-red-500 mt-0.5 truncate max-w-xs text-right" title={log.error_message}>
                            {log.error_message}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
