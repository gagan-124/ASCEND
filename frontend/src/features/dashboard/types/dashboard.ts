export interface RecentInterviewItem {
  id: string;
  roleTitle: string;
  interviewType: string;
  dateFormatted: string;
  durationFormatted: string;
  score: number;
  totalPossibleScore: number;
}

export interface PrepareNextTopic {
  id: string;
  title: string;
  description: string;
  concepts: string[];
}

export interface WorkspaceSummary {
  totalInterviews: number;
  overallReadiness: number;
  latestRoleTitle: string;
  latestScore: number;
  latestDate: string;
  activeFocusAreasCount: number;
  topFocusDomain: string;
}

export interface DashboardData {
  userName: string;
  summary: WorkspaceSummary;
  recentInterviews: RecentInterviewItem[];
  strongDomains: string[];
  focusAreas: string[];
  preparationTopics: PrepareNextTopic[];
}
