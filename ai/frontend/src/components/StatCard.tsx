import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface Props {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: "red" | "yellow" | "green" | "indigo";
  sub?: string;
}

const accents = {
  red: "text-red-400 bg-red-400/10",
  yellow: "text-yellow-400 bg-yellow-400/10",
  green: "text-green-400 bg-green-400/10",
  indigo: "text-brand-400 bg-brand-400/10",
};

export default function StatCard({ label, value, icon: Icon, accent = "indigo", sub }: Props) {
  return (
    <div className="card flex items-center gap-4">
      <div className={cn("p-2.5 rounded-lg", accents[accent])}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-white leading-none">{value}</p>
        <p className="text-xs text-gray-400 mt-1">{label}</p>
        {sub && <p className="text-xs text-gray-600 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
