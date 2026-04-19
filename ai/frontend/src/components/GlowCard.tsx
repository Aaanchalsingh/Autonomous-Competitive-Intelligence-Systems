"use client";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}

export default function GlowCard({ children, className, glowColor = "rgba(99,102,241,0.15)" }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [glow, setGlow] = useState({ x: 0, y: 0, visible: false });

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    setGlow({ x: e.clientX - rect.left, y: e.clientY - rect.top, visible: true });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setGlow((g) => ({ ...g, visible: false }))}
      className={cn(
        "relative overflow-hidden bg-gray-900/80 border border-gray-800 rounded-xl backdrop-blur-sm transition-all duration-300 hover:border-gray-700",
        className
      )}
    >
      {/* Mouse glow */}
      {glow.visible && (
        <div
          className="pointer-events-none absolute rounded-full transition-opacity duration-300"
          style={{
            width: 300,
            height: 300,
            left: glow.x - 150,
            top: glow.y - 150,
            background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
          }}
        />
      )}
      {/* Top shimmer line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-500/40 to-transparent" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
