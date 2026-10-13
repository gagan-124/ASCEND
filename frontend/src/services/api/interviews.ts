import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import type { InterviewSession, CreateInterviewPayload, SubmitAnswerPayload, TerminationReason } from '@/types/interview';
import { calculateSessionRecoveryState } from './sessionRecovery.ts';

/**
 * Normalizes user-facing experience level to PostgreSQL check constraint:
 * ('student', 'entry', 'junior', 'mid', 'senior')
 */
function normalizeExperienceLevel(level?: string): 'student' | 'entry' | 'junior' | 'mid' | 'senior' {
  if (!level) return 'mid';
  const lower = level.toLowerCase().trim();
  if (lower === 'lead' || lower === 'staff' || lower === 'principal') return 'senior';
  if (['student', 'entry', 'junior', 'mid', 'senior'].includes(lower)) {
    return lower as 'student' | 'entry' | 'junior' | 'mid' | 'senior';
  }
  return 'mid';
}

/**
 * Normalizes difficulty to PostgreSQL check constraint:
 * ('easy', 'medium', 'hard')
 */
function normalizeDifficulty(diff?: string): 'easy' | 'medium' | 'hard' {
  if (!diff) return 'medium';
  const lower = diff.toLowerCase().trim();
  if (['easy', 'medium', 'hard'].includes(lower)) {
    return lower as 'easy' | 'medium' | 'hard';
  }
  return 'medium';
}

export const interviewsApi = {
  /**
   * Authoritative interview creation & question generation flow.
   * Invokes the protected Supabase Edge Function 'generate-interview-questions'.
   * Throws explicit actionable errors on failure. Never returns fabricated mock data.
   */
  createSession: async (payload: CreateInterviewPayload): Promise<InterviewSession> => {
    const authUser = useAuthStore.getState().user;
    if (!authUser?.id) {
      throw new Error('Authentication required: please sign in before starting an interview session.');
    }

    const normalizedRole = (payload.roleTitle || 'Software Engineer').trim();
    const normalizedExp = normalizeExperienceLevel(payload.experienceLevel);
    const normalizedDiff = normalizeDifficulty(payload.difficulty);
    const normalizedType = payload.mode === 'resume' ? 'resume' : 'role';

    console.log(`[INTERVIEWS] Requesting interview question generation for "${normalizedRole}" (${normalizedExp}, ${normalizedDiff})`);

    const { data, error } = await supabase.functions.invoke('generate-interview-questions', {
      body: {
        role: normalizedRole,
        experienceLevel: normalizedExp,
        difficulty: normalizedDiff,
        interviewType: normalizedType,
        questionCount: 3,
        ...(payload.interviewId ? { interviewId: payload.interviewId } : {}),
      },
    });

    if (error) {
      console.error('[INTERVIEWS] Edge Function generation failed:', error);

      let serverErrorMessage = '';
      if (error && typeof error === 'object' && 'context' in error && error.context) {
        try {
          const res = error.context as Response;
          const cloned = typeof res.clone === 'function' ? res.clone() : res;
          const json = await cloned.json();
          serverErrorMessage = json?.message || json?.error || '';
        } catch {
          try {
            const res = error.context as Response;
            serverErrorMessage = await res.text();
          } catch {
            // Safely ignore parse failure
          }
        }
      }

      const rawMsg =
        serverErrorMessage ||
        (data as { message?: string })?.message ||
        (error as { message?: string })?.message ||
        (error instanceof Error ? error.message : String(error)) ||
        'Server failed to generate interview questions. Please try again.';

      let userFacingMessage = rawMsg;
      if (typeof rawMsg === 'string') {
        if (rawMsg.includes('non-2xx status code')) {
          userFacingMessage =
            'AI Interviewer service timed out or was temporarily unreachable. Please click "Retry Initialization" to connect.';
        } else if (
          rawMsg.includes('experiencing high demand') ||
          rawMsg.includes('UNAVAILABLE') ||
          rawMsg.includes('503')
        ) {
          userFacingMessage =
            'The AI interviewer service is currently experiencing high demand. Please click "Retry Initialization" to reconnect.';
        }
      }

      throw new Error(userFacingMessage);
    }

    const sessionData = (data as { session?: InterviewSession })?.session;
    if (!sessionData || !sessionData.id || !Array.isArray(sessionData.questions)) {
      throw new Error('Malformed response from interview generation service.');
    }

    return sessionData;
  },

  /**
   * Retrieves an interview session and its questions directly from Supabase PostgreSQL.
   */
  getSession: async (interviewId: string): Promise<InterviewSession> => {
    const { data: interview, error: intError } = await supabase
      .from('interviews')
      .select('*')
      .eq('id', interviewId)
      .maybeSingle();

    if (intError) {
      throw new Error(`Failed to load interview: ${intError.message}`);
    }

    if (!interview) {
      throw new Error(`Interview session not found (${interviewId})`);
    }

    const { data: questions, error: qError } = await supabase
      .from('interview_questions')
      .select('*')
      .eq('interview_id', interviewId)
      .order('question_number', { ascending: true });

    if (qError) {
      throw new Error(`Failed to load interview questions: ${qError.message}`);
    }

    const recovery = calculateSessionRecoveryState(interview.status, questions);

    return {
      id: interview.id,
      userId: interview.user_id,
      roleTitle: interview.role,
      experienceLevel: interview.experience_level || 'mid',
      currentState: recovery.currentState,
      terminationReason: interview.status === 'cancelled' ? 'USER_ENDED' : undefined,
      startedAt: interview.started_at,
      currentQuestionIndex: recovery.currentQuestionIndex,
      questions: recovery.mappedQuestions,
    };
  },

  /**
   * Submits candidate response directly to public.interview_questions using column UPDATE permissions.
   */
  submitAnswer: async (_interviewId: string, payload: SubmitAnswerPayload): Promise<void> => {
    const durationSec = Math.max(0, Math.floor(payload.durationSeconds || 0));
    const timestamp = `${Math.floor(durationSec / 60)
      .toString()
      .padStart(2, '0')}:${(durationSec % 60).toString().padStart(2, '0')}`;

    const { error } = await supabase
      .from('interview_questions')
      .update({
        candidate_response: payload.transcriptText || null,
        transcript_lines: [
          {
            speaker: 'candidate',
            text: payload.transcriptText || '',
            timestamp,
            duration_seconds: durationSec,
          },
        ],
      })
      .eq('id', payload.questionId);

    if (error) {
      console.error('[INTERVIEWS] Failed to persist candidate response:', error.message);
      throw new Error(`Failed to submit response: ${error.message}`);
    }
  },

  /**
   * Concludes the interview session in the database.
   */
  completeSession: async (_interviewId: string): Promise<void> => {
    // Note: Completed state is finalized by evaluate-interview-session Edge Function
    console.log(`[INTERVIEWS] Concluding interview session ${_interviewId}`);
  },

  /**
   * Cancels an active in-progress interview session via Layer 5 Controlled RPC.
   */
  terminateSession: async (
    interviewId: string,
    reason: TerminationReason,
    useKeepalive: boolean = false
  ): Promise<InterviewSession> => {
    void useKeepalive;
    try {
      const { error } = await supabase.rpc('cancel_interview', {
        p_interview_id: interviewId,
      });

      if (error) {
        console.warn('[INTERVIEWS] cancel_interview RPC warning:', error.message);
      }
    } catch (rpcErr) {
      console.error('[INTERVIEWS] Failed to invoke cancel_interview RPC:', rpcErr);
    }

    return {
      id: interviewId,
      userId: useAuthStore.getState().user?.id || '',
      roleTitle: 'SOFTWARE ENGINEER',
      experienceLevel: 'Mid',
      currentState: 'TERMINATED',
      terminationReason: reason,
      questions: [],
      currentQuestionIndex: 0,
      startedAt: new Date().toISOString(),
      endedAt: new Date().toISOString(),
    };
  },
};
