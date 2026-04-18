"use client";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import type { Signal } from "@/lib/types";

interface Props { signals: Signal[] }

const COLORS = [
  "#6366f1", "#8b5cf6", "#06b6d4", "#10b981",
  "#f59e0b", "#ef4444", "#ec4899",
];

export default function ActivityChart({ signals }: Props) {
  // Group by competitor
  const counts: Record<string, number> = {};
  for (const s of signals) {
    counts[s.competitor] = (counts[s.competitor] ?? 0) + 1;
  }

  const data = Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  if (!data.length) {
    return (
      <div className="h-40 flex items-center justify-center text-gray-600 text-sm">
        No signal data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <XAxis
          dataKey="name"
          tick={{ fill: "#6b7280", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#6b7280", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            background: "#111827",
            border: "1px solid #1f2937",
            borderRadius: 8,
            fontSize: 12,
          }}
          cursor={{ fill: "rgba(99,102,241,0.08)" }}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
