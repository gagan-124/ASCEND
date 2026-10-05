export interface MetricSummary {
  totalInterviews: number;
  averageScore: number;
  readinessPercentage: number;
}

export interface DashboardOverview {
  metrics: MetricSummary;
  recentInterviews: Array<{
    id: string;
    roleTitle: string;
    date: string;
    score: number;
  }>;
}
