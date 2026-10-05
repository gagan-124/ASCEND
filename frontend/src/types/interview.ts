import type { InterviewState } from '@/config/interviewConfig';
import type { Question } from './question';

export type TerminationReason =
  | 'PAGE_RELOAD'
  | 'TAB_SWITCH'
  | 'FULLSCREEN_EXIT'
  | 'INACTIVITY'
  | 'USER_ENDED'
  | 'MEDIA_FAILURE'
  | 'SESSION_EXPIRED';

export interface InterviewSession {
  id: string;
  userId: string;
  roleTitle: string;
  experienceLevel: string;
  currentState: InterviewState;
  questions: Question[];
  currentQuestionIndex: number;
  startedAt: string;
  endedAt?: string;
  terminationReason?: TerminationReason;
}

export interface CreateInterviewPayload {
  mode: 'role' | 'resume';
  roleTitle: string;
  experienceLevel: string;
  selectedRoleId?: string;
  selectedField?: string;
  difficulty?: string;
  focusArea?: string;
  jobDescription?: string;
  resumeId?: string;
}

export interface SubmitAnswerPayload {
  questionId: string;
  transcriptText: string;
  durationSeconds: number;
}


