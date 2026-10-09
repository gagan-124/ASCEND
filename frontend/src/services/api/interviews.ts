import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import type { InterviewSession, CreateInterviewPayload, SubmitAnswerPayload, TerminationReason } from '@/types/interview';
import type { QuestionCategory, QuestionDifficulty } from '@/types/question';

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
      },
    });

    if (error) {
      console.error('[INTERVIEWS] Edge Function generation failed:', error);
      const errorMessage =
        (data as { message?: string })?.message ||
        error.message ||
        'Server failed to generate interview questions. Please try again.';
      throw new Error(errorMessage);
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

    const currentState =
      interview.status === 'cancelled'
        ? 'TERMINATED'
        : interview.status === 'completed'
        ? 'COMPLETE'
        : 'READY';

    return {
      id: interview.id,
      userId: interview.user_id,
      roleTitle: interview.role,
      experienceLevel: interview.experience_level || 'mid',
      currentState,
      terminationReason: interview.status === 'cancelled' ? 'USER_ENDED' : undefined,
      startedAt: interview.started_at,
      currentQuestionIndex: 0,
      questions: (questions || []).map((q) => ({
        id: q.id,
        text: q.question,
        category: (q.category as QuestionCategory) || 'technical',
        difficulty: (q.difficulty as QuestionDifficulty) || 'medium',
        timeLimitSeconds: q.time_limit_seconds || 180,
      })),
    };
  },

  /**
   * Submits candidate response directly to public.interview_questions using column UPDATE permissions.
   */
  submitAnswer: async (_interviewId: string, payload: SubmitAnswerPayload): Promise<void> => {
    const { error } = await supabase
      .from('interview_questions')
      .update({
        candidate_response: payload.transcriptText || null,
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
    _useKeepalive: boolean = false
  ): Promise<InterviewSession> => {
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
