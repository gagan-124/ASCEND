import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { apiClient } from './client';
import type { InterviewSession, CreateInterviewPayload, SubmitAnswerPayload, TerminationReason } from '@/types/interview';

// In-memory backend session store for development mode fallback
const mockSessionStore = new Map<string, InterviewSession>();

export const interviewsApi = {
  createSession: async (payload: CreateInterviewPayload): Promise<InterviewSession> => {
    const authUser = useAuthStore.getState().user;

    if (supabase && authUser?.id) {
      try {
        const title = `${payload.roleTitle || 'SOFTWARE ENGINEER'} Interview - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

        const { data: interviewRow, error: interviewError } = await supabase
          .from('interviews')
          .insert({
            user_id: authUser.id,
            title,
            role: payload.roleTitle || 'SOFTWARE ENGINEER',
            interview_type: payload.mode || 'role',
            status: 'in_progress',
            experience_level: payload.experienceLevel || 'Senior',
            difficulty: payload.difficulty || 'Medium',
            started_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (!interviewError && interviewRow) {
          const initialQuestions = [
            {
              interview_id: interviewRow.id,
              question_number: 1,
              question: `Welcome! Let's start with your background as a ${payload.roleTitle || 'SOFTWARE ENGINEER'}. What is the most challenging technical project you've led recently?`,
              category: 'technical',
            },
            {
              interview_id: interviewRow.id,
              question_number: 2,
              question: 'How do you approach system architecture design decisions when faced with trade-offs between performance, maintainability, and delivery speed?',
              category: 'system_design',
            },
            {
              interview_id: interviewRow.id,
              question_number: 3,
              question: 'Describe a situation where you had a major disagreement with a team member or stakeholder regarding a key technical direction.',
              category: 'behavioral',
            },
          ];

          const { data: questionRows } = await supabase
            .from('interview_questions')
            .insert(initialQuestions)
            .select();

          const questionsList = (questionRows || []).map((q) => ({
            id: q.id,
            text: q.question,
            category: (q.category as any) || 'technical',
            difficulty: 'medium' as const,
            timeLimitSeconds: 180,
          }));

          const session: InterviewSession = {
            id: interviewRow.id,
            userId: authUser.id,
            roleTitle: interviewRow.role,
            experienceLevel: interviewRow.experience_level || 'Senior',
            currentState: 'READY',
            startedAt: interviewRow.started_at,
            currentQuestionIndex: 0,
            questions: questionsList,
          };

          mockSessionStore.set(session.id, session);
          return session;
        }
      } catch (err) {
        console.error('Supabase interview creation failed, using fallback:', err);
      }
    }

    try {
      const session = await apiClient.post<InterviewSession>('/interviews', payload);
      mockSessionStore.set(session.id, session);
      return session;
    } catch {
      // Fallback session generator for dev environment testing
      const mockSessionId = 'sess_' + Math.random().toString(36).substring(2, 9);
      const session: InterviewSession = {
        id: mockSessionId,
        userId: authUser?.id || 'usr_current_user',
        roleTitle: payload.roleTitle || 'SOFTWARE ENGINEER',
        experienceLevel: payload.experienceLevel || 'Senior',
        currentState: 'READY',
        startedAt: new Date().toISOString(),
        currentQuestionIndex: 0,
        questions: [
          {
            id: 'q1',
            text: `Welcome! Let's start with your background as a ${payload.roleTitle}. What is the most challenging technical project you've led recently?`,
            category: 'technical',
            difficulty: 'medium',
            timeLimitSeconds: 180,
          },
          {
            id: 'q2',
            text: 'How do you approach system architecture design decisions when faced with trade-offs between performance, maintainability, and delivery speed?',
            category: 'system_design',
            difficulty: 'hard',
            timeLimitSeconds: 240,
          },
          {
            id: 'q3',
            text: 'Describe a situation where you had a major disagreement with a team member or stakeholder regarding a key technical direction.',
            category: 'behavioral',
            difficulty: 'medium',
            timeLimitSeconds: 180,
          },
        ],
      };
      mockSessionStore.set(mockSessionId, session);
      return session;
    }
  },
  getSession: async (interviewId: string): Promise<InterviewSession> => {
    try {
      return await apiClient.get<InterviewSession>(`/interviews/${interviewId}`);
    } catch {
      const stored = mockSessionStore.get(interviewId);
      if (stored) return stored;
      throw new Error('Session not found');
    }
  },
  submitAnswer: (interviewId: string, payload: SubmitAnswerPayload) =>
    apiClient.post<void>(`/interviews/${interviewId}/answers`, payload),
  completeSession: (interviewId: string) => apiClient.post<void>(`/interviews/${interviewId}/complete`),
  terminateSession: async (
    interviewId: string,
    reason: TerminationReason,
    useKeepalive: boolean = false
  ): Promise<InterviewSession> => {
    // Idempotent local store check first
    const stored = mockSessionStore.get(interviewId);
    if (stored && stored.currentState === 'TERMINATED') {
      return stored;
    }

    const payload = { reason, endedAt: new Date().toISOString() };

    if (useKeepalive && typeof fetch !== 'undefined') {
      try {
        const url = `/api/interviews/${interviewId}/terminate`;
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true,
        }).catch(() => {});
      } catch {
        // Fallback silently if fetch fails
      }
    } else {
      try {
        await apiClient.post<void>(`/interviews/${interviewId}/terminate`, payload);
      } catch {
        // Fallback for dev mode
      }
    }

    if (stored) {
      stored.currentState = 'TERMINATED';
      stored.terminationReason = stored.terminationReason || reason;
      stored.endedAt = payload.endedAt;
      mockSessionStore.set(interviewId, stored);
      return stored;
    }

    const terminatedSession: InterviewSession = {
      id: interviewId,
      userId: 'usr_current_user',
      roleTitle: 'SOFTWARE ENGINEER',
      experienceLevel: 'Senior',
      currentState: 'TERMINATED',
      terminationReason: reason,
      questions: [],
      currentQuestionIndex: 0,
      startedAt: new Date().toISOString(),
      endedAt: payload.endedAt,
    };
    mockSessionStore.set(interviewId, terminatedSession);
    return terminatedSession;
  },
};


