import { ExternalLink } from "lucide-react";
import { cn, signalTypeLabel, signalTypeColor, importanceDot, timeAgo } from "@/lib/utils";
import type { Signal } from "@/lib/types";

export default function SignalRow({ signal }: { signal: Signal }) {
  const text = signal.summary || signal.title || "—";

  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-800/60 last:border-0">
      {/* importance dot */}
      <span className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", importanceDot(signal.importance))} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span className="text-xs font-semibold text-white">{signal.competitor}</span>
          <span className={cn("badge", signalTypeColor(signal.signal_type))}>
            {signalTypeLabel(signal.signal_type)}
          </span>
          <span className="text-xs text-gray-600">{timeAgo(signal.timestamp)}</span>
        </div>
        <p className="text-sm text-gray-400 leading-snug line-clamp-2">{text}</p>
      </div>

      {signal.url && (
        <a
          href={signal.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-600 hover:text-brand-400 transition-colors shrink-0 mt-0.5"
        >
          <ExternalLink size={14} />
        </a>
      )}
    </div>
  );
}
