import { create } from 'zustand';
import type { InterviewState } from '@/config/interviewConfig';
import type { Question } from '@/types/question';
import type { ParsedResume, CandidateIntelligence } from '@/types/resume';

export interface InterviewSetupConfig {
  mode: 'role' | 'resume' | null;
  selectedField?: string | null;
  selectedRoleId?: string | null;
  selectedRoleTitle: string;
  roleConfirmed?: boolean;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  experienceLevel: 'Entry' | 'Mid' | 'Senior' | 'Lead';
  focusArea: 'Comprehensive' | 'Technical' | 'Behavioral';
  resumeFileName: string | null;
  resumeId: string | null;
  parsedResume?: ParsedResume | null;
  candidateIntelligence?: CandidateIntelligence | null;
  jobDescription: string | null;
}

interface InterviewSessionState {
  sessionId: string | null;
  currentState: InterviewState;
  questions: Question[];
  currentQuestionIndex: number;
  setupConfig: InterviewSetupConfig;
  setSetupConfig: (config: Partial<InterviewSetupConfig>) => void;
  setSession: (id: string, questions: Question[]) => void;
  setState: (state: InterviewState) => void;
  nextQuestion: () => void;
  resetSession: () => void;
}

const initialSetupConfig: InterviewSetupConfig = {
  mode: null,
  selectedField: null,
  selectedRoleId: null,
  selectedRoleTitle: 'SOFTWARE ENGINEER',
  roleConfirmed: false,
  difficulty: 'Medium',
  experienceLevel: 'Mid',
  focusArea: 'Comprehensive',
  resumeFileName: null,
  resumeId: null,
  parsedResume: null,
  candidateIntelligence: null,
  jobDescription: null,
};

export const useInterviewStore = create<InterviewSessionState>((set) => ({
  sessionId: null,
  currentState: 'SETUP',
  questions: [],
  currentQuestionIndex: 0,
  setupConfig: initialSetupConfig,
  setSetupConfig: (config) =>
    set((state) => ({ setupConfig: { ...state.setupConfig, ...config } })),
  setSession: (id, questions) => set({ sessionId: id, questions, currentQuestionIndex: 0, currentState: 'READY' }),
  setState: (currentState) => set({ currentState }),
  nextQuestion: () => set((state) => ({ currentQuestionIndex: Math.min(state.currentQuestionIndex + 1, state.questions.length - 1) })),
  resetSession: () => set({ sessionId: null, currentState: 'SETUP', questions: [], currentQuestionIndex: 0, setupConfig: initialSetupConfig }),
}));

