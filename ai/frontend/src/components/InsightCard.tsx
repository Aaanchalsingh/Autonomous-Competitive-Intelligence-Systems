"use client";
import { useState } from "react";
import { ChevronDown, ChevronUp, Zap, TrendingUp } from "lucide-react";
import { cn, importanceColor, timeAgo } from "@/lib/utils";
import type { Insight } from "@/lib/types";

export default function InsightCard({ insight }: { insight: Insight }) {
  const [open, setOpen] = useState(insight.is_urgent);
  const colorClass = importanceColor(insight.importance_score);

  return (
    <div className={cn("card border transition-all", insight.is_urgent && "border-red-500/30")}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start gap-3 text-left"
      >
        {/* Score badge */}
        <span className={cn("badge border mt-0.5 shrink-0", colorClass)}>
          {insight.importance_score}/10
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500 font-medium">{insight.competitor}</span>
            {insight.is_urgent && (
              <span className="badge bg-red-500/20 text-red-400 border border-red-500/30">
                <Zap size={10} /> Urgent
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-white mt-0.5 leading-snug">
            {insight.insight_title}
          </p>
        </div>

        <span className="text-gray-600 shrink-0 mt-0.5">
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {open && (
        <div className="mt-3 space-y-3 border-t border-gray-800 pt-3">
          <p className="text-sm text-gray-300 leading-relaxed">{insight.insight_body}</p>

          {insight.so_what && (
            <div className="bg-brand-900/30 border border-brand-700/30 rounded-lg p-3">
              <p className="text-xs font-semibold text-brand-400 mb-1">What to do</p>
              <p className="text-sm text-gray-300">{insight.so_what}</p>
            </div>
          )}

          {insight.predicted_move && (
            <div className="flex items-start gap-2 text-sm text-yellow-300/80">
              <TrendingUp size={14} className="mt-0.5 shrink-0 text-yellow-400" />
              <span>{insight.predicted_move}</span>
            </div>
          )}

          <p className="text-xs text-gray-600">{timeAgo(insight.generated_at)}</p>
        </div>
      )}
    </div>
  );
}
