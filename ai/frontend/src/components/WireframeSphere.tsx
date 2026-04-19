"use client";
import { useEffect, useRef } from "react";

export default function WireframeSphere() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 600, H = 600;
    canvas.width = W;
    canvas.height = H;

    const cx = W / 2, cy = H / 2;
    const R = 180;
    let angle = 0;

    // Generate wireframe points on sphere
    const points: [number, number, number][] = [];
    const LAT = 14, LON = 18;
    for (let i = 0; i <= LAT; i++) {
      const phi = (Math.PI * i) / LAT;
      for (let j = 0; j <= LON; j++) {
        const theta = (2 * Math.PI * j) / LON;
        points.push([
          Math.sin(phi) * Math.cos(theta),
          Math.cos(phi),
          Math.sin(phi) * Math.sin(theta),
        ]);
      }
    }

    // Floating orbs
    const orbs = Array.from({ length: 12 }, (_, i) => ({
      phi: Math.random() * Math.PI,
      theta: Math.random() * Math.PI * 2,
      r: R + 30 + Math.random() * 80,
      size: 6 + Math.random() * 18,
      speed: 0.003 + Math.random() * 0.005,
      offset: Math.random() * Math.PI * 2,
    }));

    const project = (x: number, y: number, z: number, rot: number) => {
      const cosR = Math.cos(rot), sinR = Math.sin(rot);
      const rx = x * cosR - z * sinR;
      const rz = x * sinR + z * cosR;
      const scale = 1 + rz * 0.0008;
      return { sx: cx + rx * R * scale, sy: cy - y * R * scale, z: rz };
    };

    let animId: number;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      angle += 0.004;

      // Draw wireframe latitude lines
      for (let i = 0; i <= LAT; i++) {
        const phi = (Math.PI * i) / LAT;
        ctx.beginPath();
        for (let j = 0; j <= LON; j++) {
          const theta = (2 * Math.PI * j) / LON;
          const x = Math.sin(phi) * Math.cos(theta);
          const y = Math.cos(phi);
          const z = Math.sin(phi) * Math.sin(theta);
          const p = project(x, y, z, angle);
          if (j === 0) ctx.moveTo(p.sx, p.sy);
          else ctx.lineTo(p.sx, p.sy);
        }
        ctx.strokeStyle = `rgba(180,180,180,${0.12 + i * 0.01})`;
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }

      // Draw longitude lines
      for (let j = 0; j <= LON; j++) {
        const theta = (2 * Math.PI * j) / LON;
        ctx.beginPath();
        for (let i = 0; i <= LAT; i++) {
          const phi = (Math.PI * i) / LAT;
          const x = Math.sin(phi) * Math.cos(theta);
          const y = Math.cos(phi);
          const z = Math.sin(phi) * Math.sin(theta);
          const p = project(x, y, z, angle);
          if (i === 0) ctx.moveTo(p.sx, p.sy);
          else ctx.lineTo(p.sx, p.sy);
        }
        ctx.strokeStyle = "rgba(180,180,180,0.10)";
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }

      // Draw intersection dots
      for (let i = 0; i <= LAT; i += 2) {
        for (let j = 0; j <= LON; j += 2) {
          const phi = (Math.PI * i) / LAT;
          const theta = (2 * Math.PI * j) / LON;
          const x = Math.sin(phi) * Math.cos(theta);
          const y = Math.cos(phi);
          const z = Math.sin(phi) * Math.sin(theta);
          const p = project(x, y, z, angle);
          if (p.z > -0.2) {
            ctx.beginPath();
            ctx.arc(p.sx, p.sy, 1.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(220,220,220,${0.4 + p.z * 0.3})`;
            ctx.fill();
          }
        }
      }

      // Draw floating orbs
      orbs.forEach((orb, idx) => {
        const t = angle * orb.speed * 200 + orb.offset;
        const ox = Math.sin(orb.phi + t * 0.3) * Math.cos(orb.theta + t * 0.2);
        const oy = Math.cos(orb.phi + t * 0.1);
        const oz = Math.sin(orb.phi + t * 0.3) * Math.sin(orb.theta + t * 0.2);
        const px = cx + ox * orb.r;
        const py = cy - oy * orb.r * 0.8;

        // Orb shadow
        ctx.beginPath();
        ctx.ellipse(px, py + orb.size * 0.8, orb.size * 0.6, orb.size * 0.15, 0, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0,0,0,0.08)";
        ctx.fill();

        // Orb body
        const grad = ctx.createRadialGradient(
          px - orb.size * 0.3, py - orb.size * 0.3, orb.size * 0.1,
          px, py, orb.size
        );
        grad.addColorStop(0, "rgba(255,255,255,0.95)");
        grad.addColorStop(0.5, "rgba(220,220,220,0.7)");
        grad.addColorStop(1, "rgba(160,160,160,0.3)");

        ctx.beginPath();
        ctx.arc(px, py, orb.size, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full object-contain"
      style={{ maxWidth: 600, maxHeight: 600 }}
    />
  );
}
