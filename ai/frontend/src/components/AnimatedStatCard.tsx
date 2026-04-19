"use client";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import GlowCard from "./GlowCard";

interface Props {
  label: string;
  value: number | string;
  icon: LucideIcon;
  accent?: "red" | "yellow" | "green" | "indigo";
  sub?: string;
}

const accents = {
  red:    { text: "text-red-400",    bg: "bg-red-400/10",    glow: "rgba(248,113,113,0.15)",  ring: "shadow-red-500/20" },
  yellow: { text: "text-yellow-400", bg: "bg-yellow-400/10", glow: "rgba(250,204,21,0.15)",   ring: "shadow-yellow-500/20" },
  green:  { text: "text-green-400",  bg: "bg-green-400/10",  glow: "rgba(74,222,128,0.15)",   ring: "shadow-green-500/20" },
  indigo: { text: "text-brand-400",  bg: "bg-brand-400/10",  glow: "rgba(99,102,241,0.15)",   ring: "shadow-brand-500/20" },
};

function useCountUp(target: number, duration = 1000) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (typeof target !== "number") return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(timer); }
      else setVal(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return val;
}

export default function AnimatedStatCard({ label, value, icon: Icon, accent = "indigo", sub }: Props) {
  const a = accents[accent];
  const numVal = typeof value === "number" ? value : parseInt(value as string) || 0;
  const displayed = useCountUp(numVal);

  return (
    <GlowCard className="p-4" glowColor={a.glow}>
      <div className="flex items-center gap-4">
        <div className={cn("p-2.5 rounded-xl shadow-lg", a.bg, a.ring)}>
          <Icon size={20} className={a.text} />
        </div>
        <div>
          <p className={cn("text-2xl font-bold tabular-nums", a.text)}>
            {typeof value === "number" ? displayed : value}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{label}</p>
          {sub && <p className="text-xs text-gray-600 mt-0.5">{sub}</p>}
        </div>
      </div>
      {/* Bottom pulse bar */}
      <div className="mt-3 h-0.5 bg-gray-800 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full animate-pulse", a.bg.replace("/10", "/60"))}
          style={{ width: `${Math.min(100, (numVal / 50) * 100)}%` }} />
      </div>
    </GlowCard>
  );
}
