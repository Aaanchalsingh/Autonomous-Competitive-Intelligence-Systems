import { cn } from "@/lib/utils";
import type { Competitor } from "@/lib/types";

const categoryColors: Record<string, string> = {
  Payments: "text-blue-400 bg-blue-400/10",
  "Payments/UPI": "text-blue-400 bg-blue-400/10",
  "Payments/Finance": "text-blue-400 bg-blue-400/10",
  Investing: "text-green-400 bg-green-400/10",
  "Stock Broking": "text-green-400 bg-green-400/10",
  "Credit/Rewards": "text-purple-400 bg-purple-400/10",
  "Credit Card": "text-purple-400 bg-purple-400/10",
};

export default function CompetitorCard({ comp }: { comp: Competitor }) {
  const catColor = categoryColors[comp.category] ?? "text-gray-400 bg-gray-400/10";
  const barWidth = Math.min(100, (comp.signal_count / 20) * 100);

  return (
    <div className="card hover:border-gray-700 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <p className="font-semibold text-white text-sm">{comp.name}</p>
          <span className={cn("badge mt-1", catColor)}>{comp.category}</span>
        </div>
        {comp.urgent_count > 0 && (
          <span className="badge bg-red-500/20 text-red-400 border border-red-500/30 shrink-0">
            {comp.urgent_count} urgent
          </span>
        )}
      </div>

      {/* Signal bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-gray-500">
          <span>Signals</span>
          <span className="text-white font-medium">{comp.signal_count}</span>
        </div>
        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-500 rounded-full transition-all duration-500"
            style={{ width: `${barWidth}%` }}
          />
        </div>
      </div>
    </div>
  );
}
