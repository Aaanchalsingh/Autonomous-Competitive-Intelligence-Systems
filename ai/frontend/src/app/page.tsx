"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Activity, AlertTriangle, TrendingUp, Users,
  Zap, BarChart2, Clock,
} from "lucide-react";

import Navbar from "@/components/Navbar";
import StatCard from "@/components/StatCard";
import InsightCard from "@/components/InsightCard";
import SignalRow from "@/components/SignalRow";
import CompetitorCard from "@/components/CompetitorCard";
import ActivityChart from "@/components/ActivityChart";
import TimeFilter from "@/components/TimeFilter";

import { api } from "@/lib/api";
import type { Signal, Insight, Competitor, DashboardStats } from "@/lib/types";

export default function Dashboard() {
  const [hours, setHours] = useState(168);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"insights" | "signals">("insights");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, sig, ins, comp] = await Promise.all([
        api.stats(hours),
        api.signals(hours),
        api.insights(hours),
        api.competitors(),
      ]);
      setStats(s);
      setSignals(sig);
      setInsights(ins);
      setCompetitors(comp);
    } catch (e) {
      console.error("Failed to load data:", e);
    } finally {
      setLoading(false);
    }
  }, [hours]);

  useEffect(() => { load(); }, [load]);

  const urgent = insights.filter((i) => i.is_urgent || i.importance_score >= 8);
  const highSignals = signals.filter((s) => s.importance >= 7);

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar onScanComplete={load} />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        {/* Header row */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-white">Intelligence Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Monitoring {competitors.length} Indian fintech competitors
            </p>
          </div>
          <TimeFilter value={hours} onChange={setHours} />
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Total Signals"
            value={loading ? "—" : (stats?.total_signals ?? signals.length)}
            icon={Activity}
            accent="indigo"
          />
          <StatCard
            label="Urgent Insights"
            value={loading ? "—" : urgent.length}
            icon={AlertTriangle}
            accent="red"
          />
          <StatCard
            label="High Priority"
            value={loading ? "—" : highSignals.length}
            icon={Zap}
            accent="yellow"
          />
          <StatCard
            label="Competitors Active"
            value={loading ? "—" : (stats?.competitors_active ?? competitors.length)}
            icon={Users}
            accent="green"
            sub={stats?.last_scan ? `Last scan ${stats.last_scan}` : undefined}
          />
        </div>

        {/* Urgent banner */}
        {urgent.length > 0 && (
          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={16} className="text-red-400" />
              <span className="text-sm font-semibold text-red-400">
                {urgent.length} urgent item{urgent.length > 1 ? "s" : ""} need attention
              </span>
            </div>
            <div className="space-y-2">
              {urgent.slice(0, 3).map((i) => (
                <InsightCard key={i.id} insight={i} />
              ))}
            </div>
          </div>
        )}

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Left — Insights + Signals */}
          <div className="lg:col-span-2 space-y-4">

            {/* Tab switcher */}
            <div className="flex items-center gap-1 border-b border-gray-800">
              {(["insights", "signals"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                    tab === t
                      ? "border-brand-500 text-white"
                      : "border-transparent text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {t}
                  <span className="ml-1.5 text-xs text-gray-600">
                    {t === "insights" ? insights.length : signals.length}
                  </span>
                </button>
              ))}
            </div>

            {tab === "insights" && (
              <div className="space-y-2">
                {loading ? (
                  <Skeleton rows={4} />
                ) : insights.length ? (
                  insights.map((i) => <InsightCard key={i.id} insight={i} />)
                ) : (
                  <Empty text="No insights yet — run a scan to generate intelligence." />
                )}
              </div>
            )}

            {tab === "signals" && (
              <div className="card divide-y divide-gray-800/60">
                {loading ? (
                  <Skeleton rows={6} />
                ) : signals.length ? (
                  signals.slice(0, 50).map((s) => <SignalRow key={s.id} signal={s} />)
                ) : (
                  <Empty text="No signals in this time window." />
                )}
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">

            {/* Activity chart */}
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <BarChart2 size={15} className="text-brand-400" />
                <span className="text-sm font-semibold text-white">Signal Volume</span>
              </div>
              <ActivityChart signals={signals} />
            </div>

            {/* Competitors */}
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={15} className="text-brand-400" />
                <span className="text-sm font-semibold text-white">Competitors</span>
              </div>
              <div className="space-y-2">
                {loading ? (
                  <Skeleton rows={3} />
                ) : competitors.length ? (
                  competitors.map((c) => <CompetitorCard key={c.key} comp={c} />)
                ) : (
                  <Empty text="No competitor data." />
                )}
              </div>
            </div>

            {/* Recent high-priority signals */}
            {highSignals.length > 0 && (
              <div className="card">
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={15} className="text-yellow-400" />
                  <span className="text-sm font-semibold text-white">Recent Alerts</span>
                </div>
                <div className="divide-y divide-gray-800/60">
                  {highSignals.slice(0, 5).map((s) => (
                    <SignalRow key={s.id} signal={s} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function Skeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 bg-gray-800/60 rounded-lg" />
      ))}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="py-10 text-center text-sm text-gray-600">{text}</div>
  );
}
