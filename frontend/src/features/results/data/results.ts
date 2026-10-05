import { supabase } from '@/lib/supabase';
import type { InterviewResult, RawInterviewEvaluationInput, TranscriptLine } from '../types/results';
import { mockInterviewResult, getRoleMetricsForRole } from './mockResults';

const RESULTS_STORAGE_KEY = 'ascend_interview_results';

export function getSavedInterviewResults(): Record<string, InterviewResult> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(RESULTS_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to load saved interview results:', err);
  }
  return {};
}

export function saveInterviewResult(result: InterviewResult): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getSavedInterviewResults();
    current[result.interviewId] = result;
    localStorage.setItem(RESULTS_STORAGE_KEY, JSON.stringify(current));
  } catch (err) {
    console.error('Failed to persist interview result:', err);
  }

  // Also persist to Supabase if connected
  if (supabase) {
    (async () => {
      try {
        await supabase
          .from('interviews')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            overall_score: result.overallScore,
            ai_summary: result.aiSummary,
            transcript: (result.transcript || []) as any,
          })
          .eq('id', result.interviewId);

        await supabase
          .from('interview_metrics')
          .upsert({
            interview_id: result.interviewId,
            answer_correctness: result.generalPerformance.answerCorrectness,
            communication: result.generalPerformance.communication,
            clarity: result.generalPerformance.clarity,
            delivery_confidence: result.generalPerformance.deliveryConfidence,
            problem_solving: result.generalPerformance.problemSolving,
          }, { onConflict: 'interview_id' });

        if (result.roleSpecificMetrics && result.roleSpecificMetrics.length > 0) {
          const domainRows = result.roleSpecificMetrics.map((r) => ({
            interview_id: result.interviewId,
            domain: r.name,
            score: r.score,
          }));
          await supabase.from('interview_domain_scores').delete().eq('interview_id', result.interviewId);
          await supabase.from('interview_domain_scores').insert(domainRows);
        }
      } catch (err) {
        console.error('Error saving result to Supabase:', err);
      }
    })();
  }
}

export function hasTranscriptAvailable(interviewId: string): boolean {
  const saved = getSavedInterviewResults();
  if (saved[interviewId]?.transcript && saved[interviewId].transcript!.length > 0) {
    return true;
  }
  if (interviewId === mockInterviewResult.interviewId && mockInterviewResult.transcript && mockInterviewResult.transcript.length > 0) {
    return true;
  }
  return false;
}

/**
 * Service/Data access abstraction for retrieving interview evaluation results.
 * Separate UI rendering from backend evaluation engine.
 */
export async function getInterviewResultById(
  interviewId?: string,
  roleTitle?: string
): Promise<InterviewResult> {
  if (interviewId && supabase) {
    try {
      const { data: interviewRow } = await supabase
        .from('interviews')
        .select('*')
        .eq('id', interviewId)
        .maybeSingle();

      if (interviewRow) {
        const { data: questionRows } = await supabase
          .from('interview_questions')
          .select('*')
          .eq('interview_id', interviewId)
          .order('question_number', { ascending: true });

        const { data: metricsRow } = await supabase
          .from('interview_metrics')
          .select('*')
          .eq('interview_id', interviewId)
          .maybeSingle();

        const { data: domainRows } = await supabase
          .from('interview_domain_scores')
          .select('*')
          .eq('interview_id', interviewId);

        const activeRole = interviewRow.role || roleTitle || mockInterviewResult.roleTitle;

        const roleSpecificMetrics = (domainRows && domainRows.length > 0)
          ? domainRows.map((d) => ({ name: d.domain, score: d.score }))
          : getRoleMetricsForRole(activeRole);

        const generalPerformance = metricsRow ? {
          answerCorrectness: metricsRow.answer_correctness,
          communication: metricsRow.communication,
          clarity: metricsRow.clarity,
          deliveryConfidence: metricsRow.delivery_confidence,
          problemSolving: metricsRow.problem_solving,
        } : mockInterviewResult.generalPerformance;

        const transcript = Array.isArray(interviewRow.transcript)
          ? (interviewRow.transcript as unknown as TranscriptLine[])
          : mockInterviewResult.transcript;

        const result: InterviewResult = {
          ...mockInterviewResult,
          interviewId,
          roleTitle: activeRole,
          experienceLevel: interviewRow.experience_level || 'Senior',
          completedAt: interviewRow.completed_at ? new Date(interviewRow.completed_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : mockInterviewResult.completedAt,
          overallScore: interviewRow.overall_score !== null ? Number(interviewRow.overall_score) : mockInterviewResult.overallScore,
          aiSummary: interviewRow.ai_summary || mockInterviewResult.aiSummary,
          roleSpecificMetrics,
          generalPerformance,
          transcript,
        };

        if (questionRows && questionRows.length > 0) {
          result.questionEvaluations = questionRows.map((q) => ({
            id: q.id,
            number: q.question_number,
            title: q.question,
            category: q.category || 'Technical',
            score: q.score !== null ? Number(q.score) : 85,
            status: q.status || 'Meets Expectations',
            shortFeedback: q.short_feedback || 'Solid response demonstrating good technical understanding.',
            metricScores: mockInterviewResult.questionEvaluations[0]?.metricScores || {
              'Answer Correctness': 85,
              'Technical Depth': 80,
              'Problem Solving': 85,
              'Communication': 90,
              'Delivery Confidence': 85,
              'Clarity': 88,
            },
            evaluatorFeedback: q.answer ? `Candidate responded: "${q.answer}"` : 'Clear response provided.',
          }));
        }

        return result;
      }
    } catch (err) {
      console.error('Failed to fetch interview result from Supabase:', err);
    }
  }

  if (interviewId) {
    const saved = getSavedInterviewResults();
    if (saved[interviewId]) {
      return saved[interviewId];
    }
  }

  const activeRole = roleTitle || mockInterviewResult.roleTitle;
  const roleSpecificMetrics = getRoleMetricsForRole(activeRole);

  if (interviewId && interviewId !== 'mock') {
    return {
      ...mockInterviewResult,
      interviewId,
      roleTitle: activeRole,
      roleSpecificMetrics,
    };
  }

  return {
    ...mockInterviewResult,
    roleSpecificMetrics,
  };
}

export function processRawEvaluationToResult(
  input: RawInterviewEvaluationInput & { transcript?: TranscriptLine[] }
): InterviewResult {
  const result: InterviewResult = {
    ...mockInterviewResult,
    interviewId: input.sessionId,
    roleTitle: input.roleTitle,
    experienceLevel: input.experienceLevel,
    roleSpecificMetrics: getRoleMetricsForRole(input.roleTitle),
    completedAt: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    transcript: input.transcript || [],
  };
  saveInterviewResult(result);
  return result;
}

