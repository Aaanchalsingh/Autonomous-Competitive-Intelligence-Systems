import type { Signal, Insight, Competitor, DashboardStats, ScanResult } from "./types";

const BASE = "/api/py";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

async function post<T>(path: string, body?: object): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export const api = {
  stats: (hours = 168) =>
    get<DashboardStats>(`/stats?hours=${hours}`),

  signals: (hours = 168, competitor?: string, minImportance = 0) =>
    get<Signal[]>(
      `/signals?hours=${hours}${competitor ? `&competitor=${competitor}` : ""}&min_importance=${minImportance}`
    ),

  insights: (hours = 168) =>
    get<Insight[]>(`/insights?hours=${hours}`),

  competitors: () =>
    get<Competitor[]>("/competitors"),

  runScan: (weekly = false) =>
    post<ScanResult>(`/scan?weekly=${weekly}`),

  sendAlerts: () =>
    post<{ sent: number }>("/alerts/send"),

  generateReport: () =>
    fetch(`${BASE}/report/generate`, { method: "POST" }),
};
