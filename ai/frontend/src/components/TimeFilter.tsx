"use client";

const OPTIONS = [
  { label: "24h", value: 24 },
  { label: "48h", value: 48 },
  { label: "7d", value: 168 },
  { label: "30d", value: 720 },
];

interface Props {
  value: number;
  onChange: (v: number) => void;
}

export default function TimeFilter({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-1 bg-gray-900 border border-gray-800 rounded-lg p-1">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
            value === o.value
              ? "bg-brand-600 text-white"
              : "text-gray-400 hover:text-white"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
