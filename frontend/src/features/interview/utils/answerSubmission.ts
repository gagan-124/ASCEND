export interface CaptureAnswerParams {
  flushedSpeech?: string;
  candidateLiveAnswer?: string;
  speechTranscript?: string;
  questionElapsedSeconds?: number;
}

export interface PreparedAnswer {
  answer: string;
  duration: number;
  isRetried: boolean;
}

export interface CandidateTranscriptEntry {
  id: string;
  speaker: 'candidate';
  speakerName: 'You';
  text: string;
  timestamp: string;
}

/**
 * Authoritative production coordinator for candidate answer submission.
 * Enforces:
 * 1. Single in-flight submission (prevents concurrent submissions).
 * 2. Retention of captured answer and duration across submission failures.
 * 3. Prevention of placeholder fallback when legitimate speech is present.
 * 4. Safe retry using retained snapshot rather than stale React state.
 * 5. Clean state release only upon confirmed persistence success.
 */
export class AnswerSubmissionCoordinator {
  private isSubmitting = false;
  private retainedAnswer: string | null = null;
  private retainedDuration: number | null = null;
  private error: string | null = null;

  isCurrentlySubmitting(): boolean {
    return this.isSubmitting;
  }

  getRetainedAnswer(): string | null {
    return this.retainedAnswer;
  }

  getRetainedDuration(): number | null {
    return this.retainedDuration;
  }

  getError(): string | null {
    return this.error;
  }

  /**
   * Prepares the answer snapshot for submission.
   * If a previous submission failed on this question, reuses the retained answer and duration.
   * Otherwise, captures authoritative answer from speech sources:
   * (flushed speech -> live answer -> speech transcript).
   * A placeholder is ONLY used if no candidate speech was captured anywhere.
   */
  prepareAnswer(params: CaptureAnswerParams = {}): PreparedAnswer {
    if (this.retainedAnswer !== null) {
      return {
        answer: this.retainedAnswer,
        duration: this.retainedDuration ?? Math.max(0, Math.floor(params.questionElapsedSeconds || 0)),
        isRetried: true,
      };
    }

    const flushed = (params.flushedSpeech || '').trim();
    const live = (params.candidateLiveAnswer || '').trim();
    const transcript = (params.speechTranscript || '').trim();

    // Priority: flushed speech (immediate authoritative flush) -> live answer state -> raw transcript
    const speechCandidates = [flushed, live, transcript];
    const legitimateAnswer = speechCandidates.find((s) => s.length > 0);

    const answer = legitimateAnswer || 'Candidate advanced to next question.';
    const duration = Math.max(0, Math.floor(params.questionElapsedSeconds || 0));

    this.retainedAnswer = answer;
    this.retainedDuration = duration;

    return {
      answer,
      duration,
      isRetried: false,
    };
  }

  /**
   * Begins a submission attempt.
   * Returns true if lock was acquired, false if another submission is already in progress.
   */
  startSubmission(): boolean {
    if (this.isSubmitting) {
      return false;
    }
    this.isSubmitting = true;
    this.error = null;
    return true;
  }

  /**
   * Marks submission as failed.
   * Preserves retained answer and duration for retry.
   * Clears submission lock and records error.
   */
  handleFailure(errorMessage: string): void {
    this.isSubmitting = false;
    this.error = errorMessage;
  }

  /**
   * Marks submission as successful.
   * Releases retained answer, duration, and lock.
   */
  handleSuccess(): void {
    this.isSubmitting = false;
    this.retainedAnswer = null;
    this.retainedDuration = null;
    this.error = null;
  }

  /**
   * Resets coordinator state completely (e.g., when transitioning to a new question).
   */
  reset(): void {
    this.isSubmitting = false;
    this.retainedAnswer = null;
    this.retainedDuration = null;
    this.error = null;
  }
}

/**
 * Creates an authoritative candidate transcript entry keyed by question ID.
 */
export function createCandidateTranscriptEntry(
  questionId: string,
  answerText: string,
  timestamp?: string
): CandidateTranscriptEntry {
  return {
    id: `tx-ans-${questionId}`,
    speaker: 'candidate',
    speakerName: 'You',
    text: answerText,
    timestamp: timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
}

/**
 * Appends a transcript entry preventing duplicate entries with the same ID.
 */
export function appendTranscriptEntryDedup<T extends { id: string }>(
  existing: T[],
  newEntry: T
): T[] {
  if (existing.some((e) => e.id === newEntry.id)) {
    return existing;
  }
  return [...existing, newEntry];
}
