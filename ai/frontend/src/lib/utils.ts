import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function importanceColor(score: number) {
  if (score >= 8) return "text-red-400 bg-red-400/10 border-red-400/20";
  if (score >= 5) return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
  return "text-green-400 bg-green-400/10 border-green-400/20";
}

export function importanceDot(score: number) {
  if (score >= 8) return "bg-red-400";
  if (score >= 5) return "bg-yellow-400";
  return "bg-green-400";
}

export function signalTypeLabel(type: string) {
  const map: Record<string, string> = {
    news_article: "News",
    blog_post: "Blog",
    content_change: "Site Change",
    hiring_trend: "Hiring",
  };
  return map[type] ?? type;
}

export function signalTypeColor(type: string) {
  const map: Record<string, string> = {
    news_article: "text-blue-400 bg-blue-400/10",
    blog_post: "text-purple-400 bg-purple-400/10",
    content_change: "text-orange-400 bg-orange-400/10",
    hiring_trend: "text-teal-400 bg-teal-400/10",
  };
  return map[type] ?? "text-gray-400 bg-gray-400/10";
}
