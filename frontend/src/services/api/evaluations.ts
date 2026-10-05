import { apiClient } from './client';
import type { EvaluationReport } from '@/types/evaluation';

export const evaluationsApi = {
  getEvaluationReport: (interviewId: string) => apiClient.get<EvaluationReport>(`/evaluations/${interviewId}`),
};
