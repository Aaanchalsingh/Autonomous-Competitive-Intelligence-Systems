"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import RadarAnimation from "@/components/RadarAnimation";
import { Sun, Moon } from "lucide-react";

const STATS = [
  { value: "6+",   label: "Competitors tracked" },
  { value: "24/7", label: "Autonomous monitoring" },
  { value: "60s",  label: "Alert response time" },
];

const FEATURES = [
  { icon: "◎", label: "Website changes" },
  { icon: "◈", label: "Funding rounds" },
  { icon: "◉", label: "Hiring surges" },
  { icon: "◍", label: "Product launches" },
];

const MARQUEE = ["RAZORPAY","PHONPE","GROWW","ZERODHA","PAYTM","CRED","SLICE","JUPITER"];

function useTypewriter(text: string, speed = 55) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    setDisplayed("");
    let i = 0;
    const t = setInterval(() => {
      setDisplayed(text.slice(0, ++i));
      if (i >= text.length) clearInterval(t);
    }, speed);
    return () => clearInterval(t);
  }, [text, speed]);
  return displayed;
}

export default function LandingPage() {
  const router = useRouter();
  const typed = useTypewriter("Competitive Intelligence.", 55);
  const [cursor, setCursor] = useState(true);
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const t = setInterval(() => setCursor(c => !c), 530);
    return () => clearInterval(t);
  }, []);

  const bg = dark ? "bg-[#00040f]" : "bg-[#f0f4ff]";
  const text = dark ? "text-white" : "text-gray-900";
  const sub = dark ? "text-gray-400" : "text-gray-500";
  const border = dark ? "border-white/10" : "border-gray-200";
  const pill = dark ? "bg-white/5 border-white/10 text-gray-300" : "bg-gray-100 border-gray-200 text-gray-600";
  const navBg = dark ? "bg-transparent" : "bg-white/80 backdrop-blur";
  const cardBg = dark ? "bg-white/5 backdrop-blur-md border-white/10" : "bg-white/80 backdrop-blur-md border-gray-200";
  const marqueeText = dark ? "text-gray-600" : "text-gray-400";

  return (
    <div className={`min-h-screen ${bg} ${text} overflow-hidden relative transition-colors duration-300`}
      style={{ fontFamily: "'Space Grotesk','Inter',sans-serif" }}>

      {/* Background blobs + dot grid */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Dot grid */}
        <div className="absolute inset-0"
          style={{
            backgroundImage: dark
              ? "radial-gradient(circle, rgba(99,102,241,0.18) 1px, transparent 1px)"
              : "radial-gradient(circle, rgba(99,102,241,0.10) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }} />
        {dark && <>
          <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(120,40,200,0.18) 0%, transparent 70%)" }} />
          <div className="absolute top-[10%] right-[-5%] w-[500px] h-[500px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(0,180,255,0.12) 0%, transparent 70%)" }} />
          <div className="absolute bottom-[-10%] left-[30%] w-[400px] h-[400px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(180,40,255,0.10) 0%, transparent 70%)" }} />
          {Array.from({ length: 80 }).map((_, i) => (
            <div key={i} className="absolute rounded-full bg-white"
              style={{
                width: Math.random() * 2 + 0.5, height: Math.random() * 2 + 0.5,
                left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.4 + 0.1,
              }} />
          ))}
        </>}
        {!dark && (
          <div className="absolute inset-0"
            style={{ background: "radial-gradient(ellipse at 60% 0%, rgba(99,102,241,0.08) 0%, transparent 60%)" }} />
        )}
      </div>

      {/* Navbar */}
      <nav className={`relative z-20 flex items-center justify-between px-8 py-5 border-b ${border} ${navBg}`}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-white" />
          </div>
          <span className="font-bold tracking-tight">
            Fintech<span className="text-cyan-500">Intel</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm">
          {["Features","Competitors","How it works","Docs"].map(l => (
            <button key={l} onClick={() => router.push("/dashboard")}
              className={`${sub} hover:${text} transition-colors`}>{l}</button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {/* Light/dark toggle */}
          <button onClick={() => setDark(d => !d)}
            className={`w-9 h-9 rounded-lg border ${border} flex items-center justify-center ${sub} hover:${text} transition-all`}>
            {dark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <button onClick={() => router.push("/dashboard")}
            className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-all hover:opacity-90 shadow-lg shadow-purple-900/30">
            Launch App
          </button>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 max-w-7xl mx-auto px-8 pt-12 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center min-h-[82vh]">

          {/* Left */}
          <div className="space-y-7">
            <div className={`inline-flex items-center gap-2 ${pill} border rounded-full px-4 py-1.5`}>
              <span className="text-yellow-400 text-xs">⚡</span>
              <span className="text-xs tracking-wide">AI-POWERED FINTECH SURVEILLANCE</span>
            </div>

            <h1 className="text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight">
              <span>Know Every</span><br />
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent">
                Competitor Move.
              </span><br />
              <span>Before Anyone.</span>
            </h1>

            <p className={`text-lg ${sub} leading-relaxed max-w-md`}>
              Autonomous{" "}
              <span className="text-cyan-500 font-medium">
                {typed}<span style={{ opacity: cursor ? 1 : 0 }}>|</span>
              </span>
              <br />Monitors Razorpay, Groww, Zerodha & more — 24/7.
            </p>

            <div className="flex flex-wrap gap-2">
              {FEATURES.map(f => (
                <span key={f.label} className={`flex items-center gap-1.5 ${pill} border rounded-full px-3 py-1 text-xs`}>
                  <span className="text-cyan-400">{f.icon}</span>{f.label}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <button onClick={() => router.push("/dashboard")}
                className="group bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold px-8 py-3.5 rounded-xl text-sm transition-all hover:shadow-2xl hover:shadow-purple-900/40 hover:scale-105 flex items-center gap-2">
                Open Dashboard
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </button>
              <button onClick={() => router.push("/dashboard")}
                className={`text-sm ${sub} hover:${text} transition-colors flex items-center gap-2`}>
                <span className={`w-8 h-8 rounded-full border ${border} flex items-center justify-center text-xs`}>▶</span>
                See how it works
              </button>
            </div>

            <div className={`flex gap-8 pt-4 border-t ${border}`}>
              {STATS.map(s => (
                <div key={s.label}>
                  <p className="text-2xl font-black bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">{s.value}</p>
                  <p className={`text-xs ${sub} mt-0.5`}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right — perfect square radar */}
          <div className="relative flex items-center justify-center">
            <div className="relative w-full" style={{ paddingBottom: "100%", maxWidth: 520 }}>
              <div className="absolute inset-0">
                <RadarAnimation />
              </div>

              {/* Glass card — signal */}
              <div className={`absolute bottom-6 left-0 ${cardBg} border rounded-2xl p-4 w-52 shadow-2xl z-10`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                  </span>
                  <span className="text-xs text-gray-300 font-medium">Signal Detected</span>
                </div>
                <p className="text-xs text-white font-semibold">Razorpay pricing changed</p>
                <p className="text-xs text-gray-500 mt-1">2 min ago · Score 8/10</p>
              </div>

              {/* Glass card — hiring */}
              <div className={`absolute top-6 right-0 ${cardBg} border rounded-2xl p-4 w-48 shadow-2xl z-10`}>
                <p className="text-xs text-cyan-400 font-semibold mb-1">⚡ Hiring Surge</p>
                <p className="text-xs text-white">Groww +80% ML engineers</p>
                <p className="text-xs text-gray-500 mt-1">AI product incoming</p>
              </div>
            </div>
          </div>
        </div>

        {/* Marquee */}
        <div className={`mt-6 border-t border-b ${border} py-3 overflow-hidden`}>
          <div className="flex gap-10 animate-marquee whitespace-nowrap">
            {[...MARQUEE, ...MARQUEE].map((name, i) => (
              <span key={i} className={`text-xs tracking-[0.3em] ${marqueeText} font-medium uppercase`}>
                {name} <span className="text-purple-700 mx-3">·</span>
              </span>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
