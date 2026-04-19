"use client";
import { useEffect, useRef } from "react";

interface Blip {
  x: number; y: number; age: number; maxAge: number;
  size: number; label: string; color: string;
}

const COMPETITORS = ["Razorpay","PhonePe","Groww","Zerodha","Paytm","CRED","Slice","Jupiter"];
const BLIP_COLORS = ["#ff6b6b","#ff8c42","#ffd166","#06d6a0","#00eeff"];

export default function RadarAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let S = 0; // always square: S x S

    const setSize = () => {
      S = Math.min(canvas.parentElement?.offsetWidth ?? 500,
                   canvas.parentElement?.offsetHeight ?? 500);
      canvas.width = S;
      canvas.height = S;
      canvas.style.width = S + "px";
      canvas.style.height = S + "px";
    };
    setSize();
    window.addEventListener("resize", setSize);

    let sweepAngle = 0;
    const blips: Blip[] = [];
    let animId: number;
    let frame = 0;

    const spawnBlip = () => {
      const cx = S / 2, cy = S / 2;
      const R = S * 0.44;
      const dist = (0.25 + Math.random() * 0.65) * R;
      const a = sweepAngle + (Math.random() - 0.5) * 0.25;
      blips.push({
        x: cx + Math.cos(a) * dist,
        y: cy + Math.sin(a) * dist,
        age: 0,
        maxAge: 200 + Math.random() * 120,
        size: 3 + Math.random() * 5,
        label: COMPETITORS[Math.floor(Math.random() * COMPETITORS.length)],
        color: BLIP_COLORS[Math.floor(Math.random() * BLIP_COLORS.length)],
      });
    };

    const draw = () => {
      frame++;
      sweepAngle += 0.012;
      const cx = S / 2, cy = S / 2;
      const R = S * 0.44;

      ctx.fillStyle = "rgba(0,4,15,0.20)";
      ctx.fillRect(0, 0, S, S);

      // Concentric rings
      [1.0, 0.95, 0.7, 0.5, 0.35, 0.2, 0.1].forEach((f, i) => {
        ctx.beginPath();
        ctx.arc(cx, cy, R * f, 0, Math.PI * 2);
        ctx.strokeStyle = i === 0 ? "rgba(0,220,255,0.55)"
          : i === 1 ? "rgba(0,180,255,0.18)"
          : "rgba(0,180,255,0.07)";
        ctx.lineWidth = i === 0 ? 2 : 0.5;
        ctx.stroke();
      });

      // Crosshairs
      ctx.strokeStyle = "rgba(0,200,255,0.07)";
      ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R); ctx.stroke();

      // Radial ticks
      for (let i = 0; i < 36; i++) {
        const a = (i / 36) * Math.PI * 2;
        const inner = i % 3 === 0 ? R * 0.96 : R * 0.98;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
        ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
        ctx.strokeStyle = "rgba(0,200,255,0.22)";
        ctx.lineWidth = i % 3 === 0 ? 1 : 0.4;
        ctx.stroke();
      }

      // Sweep sector
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, R * 0.98, sweepAngle - Math.PI * 0.55, sweepAngle);
      ctx.closePath();
      const sg = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
      sg.addColorStop(0, "rgba(0,220,255,0.0)");
      sg.addColorStop(0.4, "rgba(0,220,255,0.05)");
      sg.addColorStop(1, "rgba(0,220,255,0.13)");
      ctx.fillStyle = sg;
      ctx.fill();
      ctx.restore();

      // Sweep beam
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(sweepAngle) * R * 0.98, cy + Math.sin(sweepAngle) * R * 0.98);
      const bg = ctx.createLinearGradient(cx, cy,
        cx + Math.cos(sweepAngle) * R, cy + Math.sin(sweepAngle) * R);
      bg.addColorStop(0, "rgba(0,240,255,0.95)");
      bg.addColorStop(0.6, "rgba(0,200,255,0.55)");
      bg.addColorStop(1, "rgba(0,180,255,0.0)");
      ctx.strokeStyle = bg;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = "#00eeff";
      ctx.shadowBlur = 20;
      ctx.stroke();
      ctx.restore();

      // Center dot
      const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 16);
      cg.addColorStop(0, "rgba(0,240,255,1)");
      cg.addColorStop(0.5, "rgba(0,200,255,0.6)");
      cg.addColorStop(1, "rgba(0,150,255,0)");
      ctx.beginPath();
      ctx.arc(cx, cy, 16, 0, Math.PI * 2);
      ctx.fillStyle = cg;
      ctx.fill();

      // Spawn blips
      if (frame % 45 === 0) spawnBlip();

      // Draw blips
      for (let i = blips.length - 1; i >= 0; i--) {
        const b = blips[i];
        b.age++;
        const life = 1 - b.age / b.maxAge;
        if (life <= 0) { blips.splice(i, 1); continue; }

        const pulse = (b.age % 40) / 40;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size + pulse * 12, 0, Math.PI * 2);
        ctx.strokeStyle = b.color + Math.floor(life * 80).toString(16).padStart(2, "0");
        ctx.lineWidth = 1;
        ctx.stroke();

        const dg = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.size * 2.5);
        dg.addColorStop(0, b.color);
        dg.addColorStop(1, b.color + "00");
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
        ctx.fillStyle = dg;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;

        if (life > 0.35) {
          ctx.font = `${Math.round(S * 0.022)}px monospace`;
          ctx.fillStyle = `rgba(200,240,255,${life * 0.85})`;
          ctx.fillText(b.label, b.x + b.size + 5, b.y + 4);
        }
      }

      // Scale ticks
      ctx.font = `${Math.round(S * 0.018)}px monospace`;
      ctx.fillStyle = "rgba(0,200,255,0.3)";
      for (let n = 0; n <= 6; n++) {
        const y = cy - R * 0.6 + n * (R * 1.2 / 6);
        ctx.fillText(String(n), cx + R + 8, y + 3);
        ctx.beginPath();
        ctx.moveTo(cx + R + 3, y);
        ctx.lineTo(cx + R + 7, y);
        ctx.strokeStyle = "rgba(0,200,255,0.25)";
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", setSize);
    };
  }, []);

  return (
    <canvas ref={canvasRef} style={{ display: "block" }} />
  );
}
