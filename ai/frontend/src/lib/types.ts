export interface Signal {
  id: string;
  competitor: string;
  competitor_key: string;
  signal_type: "news_article" | "blog_post" | "content_change" | "hiring_trend";
  source: string;
  importance: number;
  is_high_priority: boolean;
  summary?: string;
  title?: string;
  url?: string;
  published?: string;
  timestamp: string;
}

export interface Insight {
  id: string;
  competitor: string;
  insight_title: string;
  insight_body: string;
  so_what: string;
  importance_score: number;
  is_urgent: boolean;
  predicted_move?: string;
  supporting_signals?: string[];
  generated_at: string;
}

export interface Competitor {
  key: string;
  name: string;
  category: string;
  website: string;
  signal_count: number;
  urgent_count: number;
  last_seen?: string;
}

export interface DashboardStats {
  total_signals: number;
  urgent_insights: number;
  high_priority_signals: number;
  competitors_active: number;
  last_scan?: string;
}

export interface ScanResult {
  signals_collected: number;
  insights_generated: number;
  urgent_count: number;
  duration_seconds: number;
}
