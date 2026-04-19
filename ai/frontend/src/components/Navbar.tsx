"use client";
import { useState } from "react";
import { Search, Bell, RefreshCw, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

interface Props {
  onScanComplete?: () => void;
}

export default function Navbar({ onScanComplete }: Props) {
  const [scanning, setScan] = useState(false);
  const [alerting, setAlerting] = useState(false);
  const [msg, setMsg] = useState("");

  async function runScan() {
    setScan(true);
    setMsg("");
    try {
      const res = await api.runScan();
      setMsg(`✓ ${res.signals_collected} signals, ${res.insights_generated} insights`);
      onScanComplete?.();
    } catch {
      setMsg("Scan failed — is the Python API running?");
    } finally {
      setScan(false);
    }
  }

  async function sendAlerts() {
    setAlerting(true);
    try {
      const res = await api.sendAlerts();
      setMsg(`✓ ${res.sent} alerts sent`);
    } catch {
      setMsg("Alert failed");
    } finally {
      setAlerting(false);
    }
  }

  return (
    <header className="sticky top-0 z-30 bg-gray-950/60 backdrop-blur-xl border-b border-gray-800/50">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-3">
        {/* Logo */}
        <div className="flex items-center gap-2 mr-4">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-lg shadow-brand-900/50">
            <Search size={13} className="text-white" />
          </div>
          <span className="font-bold text-white text-sm hidden sm:block tracking-tight">
            Fintech<span className="text-brand-400">Intel</span>
          </span>
        </div>

        {/* Status msg */}
        {msg && (
          <span className="text-xs text-gray-400 flex-1 truncate">{msg}</span>
        )}
        <div className="flex-1" />

        {/* Actions */}
        <button
          onClick={sendAlerts}
          disabled={alerting}
          className="btn-ghost text-xs"
        >
          {alerting ? <Loader2 size={14} className="animate-spin" /> : <Bell size={14} />}
          <span className="hidden sm:inline">Alerts</span>
        </button>

        <a
          href="/api/py/report/download"
          target="_blank"
          className="btn-ghost text-xs"
        >
          <FileText size={14} />
          <span className="hidden sm:inline">PDF</span>
        </a>

        <button
          onClick={runScan}
          disabled={scanning}
          className="btn-primary text-xs"
        >
          {scanning
            ? <Loader2 size={14} className="animate-spin" />
            : <RefreshCw size={14} />}
          {scanning ? "Scanning…" : "Run Scan"}
        </button>
      </div>
    </header>
  );
}
