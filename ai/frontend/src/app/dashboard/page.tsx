"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Activity, AlertTriangle, TrendingUp, Users,
  Zap, BarChart2, Clock, ArrowLeft, Sun, Moon,
  RefreshCw, Bell, FileText, Loader2,
} from "lucide-react";

import InsightCard from "@/components/InsightCard";
import SignalRow from "@/components/SignalRow";
import CompetitorCard from "@/components/CompetitorCard";
import ActivityChart from "@/components/ActivityChart";
import TimeFilter from "@/components/TimeFilter";

import { api } from "@/lib/api";
import type { Signal, Insight, Competitor, DashboardStats } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const router = useRouter();
  const [dark, setDark] = useState(true);
  const [hours, setHours] = useState(168);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScan] = useState(false);
  const [alerting, setAlerting] = useState(false);
  const [msg, setMsg] = useState("");
  const [tab, setTab] = useState<"insights" | "signals">("signals");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, sig, ins, comp] = await Promise.all([
        api.stats(hours), api.signals(hours), api.insights(hours), api.competitors(),
      ]);
      setStats(s); setSignals(sig); setInsights(ins); setCompetitors(comp);
    } catch { /* API not running */ }
    finally { setLoading(false); }
  }, [hours]);

  useEffect(() => { load(); }, [load]);

  const urgent = insights.filter(i => i.is_urgent || i.importance_score >= 8);
  const highSignals = signals.filter(s => s.importance >= 7);

  async function runScan() {
    setScan(true); setMsg("");
    try {
      const res = await api.runScan();
      setMsg(`✓ ${res.signals_collected} signals, ${res.insights_generated} insights`);
      load();
    } catch { setMsg("Scan failed — is the Python API running?"); }
    finally { setScan(false); }
  }

  async function sendAlerts() {
    setAlerting(true);
    try {
      const res = await api.sendAlerts();
      setMsg(`✓ ${res.sent} alerts sent via Telegram`);
    } catch { setMsg("Alert failed"); }
    finally { setAlerting(false); }
  }

  // Theme tokens
  const bg = dark ? "bg-[#00040f]" : "bg-[#f0f4ff]";
  const surface = dark ? "bg-white/5 border-white/10" : "bg-white border-gray-200";
  const text = dark ? "text-white" : "text-gray-900";
  const sub = dark ? "text-gray-400" : "text-gray-500";
  const border = dark ? "border-white/10" : "border-gray-200";
  const navBg = dark ? "bg-[#00040f]/80 backdrop-blur-xl border-white/5" : "bg-white/90 backdrop-blur-xl border-gray-200";
  const tabActive = dark ? "border-cyan-400 text-white" : "border-indigo-500 text-gray-900";
  const tabInactive = dark ? "border-transparent text-gray-500 hover:text-gray-300" : "border-transparent text-gray-400 hover:text-gray-600";

  const KPI = [
    { label: "Total Signals",      value: loading ? "—" : (stats?.total_signals ?? signals.length), icon: Activity,      color: "text-cyan-400",   glow: "shadow-cyan-900/30" },
    { label: "Urgent Insights",    value: loading ? "—" : urgent.length,                            icon: AlertTriangle, color: "text-red-400",    glow: "shadow-red-900/30" },
    { label: "High Priority",      value: loading ? "—" : highSignals.length,                       icon: Zap,           color: "text-yellow-400", glow: "shadow-yellow-900/30" },
    { label: "Active Competitors", value: loading ? "—" : (stats?.competitors_active ?? competitors.length), icon: Users, color: "text-purple-400", glow: "shadow-purple-900/30" },
  ];

  return (
    <div className={`min-h-screen ${bg} ${text} transition-colors duration-300`}
      style={{ fontFamily: "'Space Grotesk','Inter',sans-serif" }}>

      {/* Background blobs + dot grid */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0"
          style={{
            backgroundImage: dark
              ? "radial-gradient(circle, rgba(99,102,241,0.18) 1px, transparent 1px)"
              : "radial-gradient(circle, rgba(99,102,241,0.10) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }} />
        {dark && <>
          <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(99,40,200,0.12) 0%, transparent 70%)" }} />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(0,180,255,0.08) 0%, transparent 70%)" }} />
        </>}
      </div>

      {/* Navbar */}
      <header className={`sticky top-0 z-30 border-b ${navBg}`}>
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => router.push("/landing")}
            className={`${sub} hover:${text} transition-colors mr-1`}>
            <ArrowLeft size={16} />
          </button>

          <div className="flex items-center gap-2 mr-4">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-white" />
            </div>
            <span className="font-bold text-sm tracking-tight">
              Fintech<span className="text-cyan-500">Intel</span>
            </span>
          </div>

          {msg && <span className={`text-xs ${sub} flex-1 truncate`}>{msg}</span>}
          <div className="flex-1" />

          <button onClick={() => setDark(d => !d)}
            className={cn("w-8 h-8 rounded-lg border flex items-center justify-center transition-all", border, sub)}>
            {dark ? <Sun size={14} /> : <Moon size={14} />}
          </button>

          <button onClick={sendAlerts} disabled={alerting}
            className={cn("btn-ghost text-xs", dark ? "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10" : "bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200", "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all")}>
            {alerting ? <Loader2 size={13} className="animate-spin" /> : <Bell size={13} />}
            <span className="hidden sm:inline">Alerts</span>
          </button>

          <a href="/api/py/report/download" target="_blank"
            className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all", dark ? "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10" : "bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200")}>
            <FileText size={13} />
            <span className="hidden sm:inline">PDF</span>
          </a>

          <button onClick={runScan} disabled={scanning}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-500 to-purple-600 text-white hover:opacity-90 transition-all shadow-lg shadow-purple-900/30">
            {scanning ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
            {scanning ? "Scanning…" : "Run Scan"}
          </button>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 py-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
              </span>
              <span className="text-xs text-cyan-400 tracking-widest uppercase font-medium">Live Intelligence</span>
            </div>
            <h1 className="text-2xl font-black">Intelligence Dashboard</h1>
            <p className={`text-sm ${sub} mt-0.5`}>Monitoring {competitors.length} Indian fintech competitors</p>
          </div>
          <TimeFilter value={hours} onChange={setHours} />
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {KPI.map(({ label, value, icon: Icon, color, glow }) => (
            <div key={label}
              className={cn("rounded-xl p-4 border transition-all hover:scale-[1.02] shadow-lg", surface, glow)}>
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg", dark ? "bg-white/5" : "bg-gray-50")}>
                  <Icon size={18} className={color} />
                </div>
                <div>
                  <p className={cn("text-2xl font-black", color)}>{value}</p>
                  <p className={`text-xs ${sub} mt-0.5`}>{label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Urgent banner */}
        {urgent.length > 0 && (
          <div className={cn("rounded-xl p-4 border", dark ? "bg-red-500/5 border-red-500/20" : "bg-red-50 border-red-200")}>
            <div className="flex items-center gap-2 mb-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
              </span>
              <span className="text-sm font-semibold text-red-400">
                {urgent.length} urgent item{urgent.length > 1 ? "s" : ""} detected
              </span>
            </div>
            <div className="space-y-2">
              {urgent.slice(0, 3).map(i => <InsightCard key={i.id} insight={i} />)}
            </div>
          </div>
        )}

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            {/* Tabs */}
            <div className={`flex items-center gap-1 border-b ${border}`}>
              {(["insights","signals"] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={cn("px-4 py-2.5 text-sm font-medium capitalize transition-all border-b-2 -mb-px",
                    tab === t ? tabActive : tabInactive)}>
                  {t}
                  <span className={cn("ml-1.5 text-xs px-1.5 py-0.5 rounded-full", dark ? "bg-white/5 text-gray-500" : "bg-gray-100 text-gray-400")}>
                    {t === "insights" ? insights.length : signals.length}
                  </span>
                </button>
              ))}
            </div>

            {tab === "insights" && (
              <div className="space-y-2">
                {loading ? <Skeleton dark={dark} rows={4} /> : insights.length
                  ? insights.map(i => <InsightCard key={i.id} insight={i} />)
                  : <Empty dark={dark} text="No insights yet — run a scan to generate intelligence." />}
              </div>
            )}
            {tab === "signals" && (
              <div className={cn("rounded-xl border divide-y", surface, dark ? "divide-white/5" : "divide-gray-100")}>
                {loading ? <Skeleton dark={dark} rows={6} /> : signals.length
                  ? signals.slice(0, 50).map(s => (
                      <div key={s.id} className="px-4">
                        <SignalRow signal={s} />
                      </div>
                    ))
                  : <Empty dark={dark} text="No signals in this time window." />}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className={cn("rounded-xl border p-4", surface)}>
              <div className="flex items-center gap-2 mb-3">
                <BarChart2 size={14} className="text-cyan-400" />
                <span className="text-sm font-semibold">Signal Volume</span>
              </div>
              <ActivityChart signals={signals} />
            </div>

            <div className={cn("rounded-xl border p-4", surface)}>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={14} className="text-purple-400" />
                <span className="text-sm font-semibold">Competitors</span>
              </div>
              <div className="space-y-2">
                {loading ? <Skeleton dark={dark} rows={3} /> : competitors.length
                  ? competitors.map(c => <CompetitorCard key={c.key} comp={c} />)
                  : <Empty dark={dark} text="No data." />}
              </div>
            </div>

            {highSignals.length > 0 && (
              <div className={cn("rounded-xl border p-4", surface)}>
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={14} className="text-yellow-400" />
                  <span className="text-sm font-semibold">Recent Alerts</span>
                </div>
                <div className={cn("divide-y", dark ? "divide-white/5" : "divide-gray-100")}>
                  {highSignals.slice(0, 5).map(s => <SignalRow key={s.id} signal={s} />)}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function Skeleton({ rows, dark }: { rows: number; dark: boolean }) {
  return (
    <div className="space-y-2 p-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={cn("h-12 rounded-lg animate-pulse", dark ? "bg-white/5" : "bg-gray-100")} />
      ))}
    </div>
  );
}

function Empty({ text, dark }: { text: string; dark: boolean }) {
  return <div className={cn("py-12 text-center text-sm", dark ? "text-gray-600" : "text-gray-400")}>{text}</div>;
}
