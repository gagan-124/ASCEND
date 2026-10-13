import type { QuestionCategory, QuestionDifficulty } from '../../types/question.ts';

export interface RawInterviewQuestion {
  id: string;
  question: string;
  category?: string | null;
  difficulty?: string | null;
  time_limit_seconds?: number | null;
  candidate_response?: string | null;
}

export interface MappedSessionQuestion {
  id: string;
  text: string;
  category: QuestionCategory;

  
  difficulty: QuestionDifficulty;
  timeLimitSeconds: number;
  candidateResponse: string | null;
}

export interface SessionRecoveryResult {
  currentState: 'TERMINATED' | 'COMPLETE' | 'READY';
  currentQuestionIndex: number;
  mappedQuestions: MappedSessionQuestion[];
  allAnswered: boolean;
  firstUnansweredIndex: number;
}

/**
 * Authoritative production session recovery calculation helper.
 * Determines the current question index, session completion state, and mapped question list
 * based on the database interview record and question response history.
 */
export function calculateSessionRecoveryState(
  interviewStatus?: string | null,
  questions?: RawInterviewQuestion[] | null
): SessionRecoveryResult {
  const mappedQuestions: MappedSessionQuestion[] = (questions || []).map((q) => ({
    id: q.id,
    text: q.question,
    category: (q.category as QuestionCategory) || 'technical',
    difficulty: (q.difficulty as QuestionDifficulty) || 'medium',
    timeLimitSeconds: q.time_limit_seconds || 180,
    candidateResponse: q.candidate_response ?? null,
  }));

  // Find the first question that does not yet have a non-empty candidate response
  const firstUnansweredIndex = mappedQuestions.findIndex(
    (q) => !q.candidateResponse || q.candidateResponse.trim().length === 0
  );

  const allAnswered = mappedQuestions.length > 0 && firstUnansweredIndex === -1;

  let currentState: 'TERMINATED' | 'COMPLETE' | 'READY' = 'READY';
  if (interviewStatus === 'cancelled') {
    currentState = 'TERMINATED';
  } else if (interviewStatus === 'completed' || allAnswered) {
    currentState = 'COMPLETE';
  }

  const currentQuestionIndex = allAnswered
    ? Math.max(0, mappedQuestions.length - 1)
    : firstUnansweredIndex >= 0
    ? firstUnansweredIndex
    : 0;

  return {
    currentState,
    currentQuestionIndex,
    mappedQuestions,
    allAnswered,
    firstUnansweredIndex,
  };
}
