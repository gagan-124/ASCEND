export type MetricType =
  | 'Answer Correctness'
  | 'Technical Depth'
  | 'Problem Solving'
  | 'Communication'
  | 'Delivery Confidence'
  | 'Clarity';

export interface EvaluationMetric {
  name: MetricType;
  score: number; // 0 - 100
  definition: string;
}

export interface RoleSpecificMetric {
  name: string;
  score: number; // 0 - 100
}

export interface GeneralPerformanceMetrics {
  answerCorrectness: number;
  communication: number;
  clarity: number;
  deliveryConfidence: number;
  problemSolving: number;
}

export interface DomainPerformance {
  domain: string;
  explanation: string;
  evidence?: string;
}

export type FocusAreaLevel = 'Focus Area' | 'Needs Development' | 'Further Preparation';

export interface FocusAreaItem {
  domain: string;
  level: FocusAreaLevel;
  explanation: string;
  evidence?: string;
}

export type QuestionStatus = 'Strong' | 'Meets Expectations' | 'Needs Focus';

export interface QuestionEvaluation {
  id: string;
  number: number; // 1..10
  title: string;
  category: string;
  score: number; // 0 - 100
  status: QuestionStatus;
  shortFeedback: string;
  metricScores: Record<MetricType, number>;
  evaluatorFeedback: string;
}

export interface PreparationTopic {
  category: string;
  leadInText: string;
  bulletPoints: string[];
}

export interface TranscriptLine {
  id?: string;
  speaker: 'IRA' | 'CANDIDATE';
  speakerName?: string;
  text: string;
  timestamp?: string;
}

export interface RawQuestionAnswer {
  questionId: string;
  questionText: string;
  category: string;
  transcriptText: string;
  audioDurationSeconds?: number;
}

export interface RawInterviewEvaluationInput {
  sessionId: string;
  roleTitle: string;
  experienceLevel: string;
  rawAnswers: RawQuestionAnswer[];
}

export interface InterviewResult {
  interviewId: string;
  roleTitle: string;
  experienceLevel: string;
  completedAt: string;
  overallScore: number;
  totalPossibleScore: number;
  aiSummary: string;
  roleSpecificMetrics: RoleSpecificMetric[];
  generalPerformance: GeneralPerformanceMetrics;
  metrics: EvaluationMetric[];
  strongDomains: DomainPerformance[];
  focusAreas: FocusAreaItem[];
  questionEvaluations: QuestionEvaluation[];
  preparationFocus: PreparationTopic[];
  transcript?: TranscriptLine[];
}
