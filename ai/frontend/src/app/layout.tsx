import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FintechIntel — Competitive Intelligence",
  description: "Autonomous competitive intelligence for Indian fintechs",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
