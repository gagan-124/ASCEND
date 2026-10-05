import { supabase } from '@/lib/supabase';
import type { DashboardData } from '../types/dashboard';
import { mockDashboardData, emptyDashboardData } from './mockDashboard';

/**
 * Service abstraction layer for candidate dashboard statistics.
 * Decouples React presentation from Supabase / API backend calls.
 */
export async function getDashboardData(userId?: string): Promise<DashboardData> {
  if (userId === 'empty') {
    return emptyDashboardData;
  }

  if (supabase && userId && userId !== 'dev_user_1') {
    try {
      const { data: interviews } = await supabase
        .from('interviews')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (interviews && interviews.length > 0) {
        const completed = interviews.filter((i) => i.status === 'completed' && i.overall_score !== null);
        const totalInterviews = interviews.length;

        const totalScoreSum = completed.reduce((acc, curr) => acc + Number(curr.overall_score || 0), 0);
        const overallReadiness = completed.length > 0 ? Math.round(totalScoreSum / completed.length) : 80;

        const latest = interviews[0];
        const latestScore = latest.overall_score !== null ? Number(latest.overall_score) : 85;
        const latestDate = new Date(latest.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        const recentInterviews = interviews.slice(0, 5).map((item) => ({
          id: item.id,
          roleTitle: item.role,
          interviewType: item.interview_type === 'resume' ? 'Resume Screening' : 'Role Screening',
          dateFormatted: new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          durationFormatted: '25 min',
          score: item.overall_score !== null ? Number(item.overall_score) : 85,
          totalPossibleScore: Number(item.total_possible_score || 100),
        }));

        const profileName = (await supabase.from('profiles').select('full_name').eq('id', userId).maybeSingle())?.data?.full_name || 'Candidate';

        return {
          userName: profileName,
          summary: {
            totalInterviews,
            overallReadiness,
            latestRoleTitle: latest.role,
            latestScore,
            latestDate,
            activeFocusAreasCount: mockDashboardData.summary.activeFocusAreasCount,
            topFocusDomain: mockDashboardData.summary.topFocusDomain,
          },
          recentInterviews,
          strongDomains: mockDashboardData.strongDomains,
          focusAreas: mockDashboardData.focusAreas,
          preparationTopics: mockDashboardData.preparationTopics,
        };
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data from Supabase:', err);
    }
  }

  return mockDashboardData;
}

