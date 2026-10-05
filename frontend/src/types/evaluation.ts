export interface CompetencyScore {
  name: string;
  score: number;
  feedback: string;
}

export interface EvaluationReport {
  interviewId: string;
  overallScore: number;
  readinessScore: number;
  competencies: CompetencyScore[];
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  topicsToRevisit: string[];
  evaluatedAt: string;
}
