import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, Calendar, Clock, Play } from 'lucide-react';
import {
  getDashboardData,
  type DashboardData,
  DashboardHeader,
  UnifiedSummaryRow,
  PastInterviewsList,
  PerformanceMetricsView,
  QuestionAnalysisSection,
  GeneralPerformanceSection,
  EmptyDashboardState,
  DashboardSkeleton,
} from '@/features/dashboard';
import { getInterviewResultById, type InterviewResult } from '@/features/results';
import { useAuthStore } from '@/stores/authStore';

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const shouldReduceMotion = useReducedMotion();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Selected interview state for in-place State A <-> State B transition
  const [selectedInterviewId, setSelectedInterviewId] = useState<string | null>(null);
  const [selectedResult, setSelectedResult] = useState<InterviewResult | null>(null);
  const [resultLoading, setResultLoading] = useState<boolean>(false);

  // Load overall Dashboard data
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const result = await getDashboardData(user?.id);
        if (isMounted) {
          setData(result);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Find active selected interview metadata from list if available
  const activeInterviewItem = data?.recentInterviews.find((i) => i.id === selectedInterviewId);

  // Load detailed interview analysis when an interview is selected
  useEffect(() => {
    if (!selectedInterviewId) {
      setSelectedResult(null);
      return;
    }

    let isMounted = true;
    async function loadResult() {
      setResultLoading(true);
      try {
        const res = await getInterviewResultById(
          selectedInterviewId || undefined,
          activeInterviewItem?.roleTitle
        );
        if (isMounted) {
          setSelectedResult(res);
        }
      } catch (err) {
        console.error('Failed to load selected interview result:', err);
      } finally {
        if (isMounted) {
          setResultLoading(false);
        }
      }
    }
    loadResult();
    return () => {
      isMounted = false;
    };
  }, [selectedInterviewId, activeInterviewItem]);

  if (loading || !data) {
    return <DashboardSkeleton />;
  }

  const displayName = user?.fullName || data.userName || 'Candidate';
  const hasInterviews = data.summary.totalInterviews > 0;

  return (
    <div className="w-full min-h-screen bg-background text-foreground font-sans px-4 sm:px-6 lg:px-12 py-8 max-w-[1150px] mx-auto space-y-8">
      {!selectedInterviewId ? (
        /* ==================================================
           STATE A — DEFAULT DASHBOARD OVERVIEW
           ================================================== */
        <motion.div
          key="state-a"
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="space-y-8"
        >
          {/* Workspace Header */}
          <DashboardHeader userName={displayName} />

          {!hasInterviews ? (
            <EmptyDashboardState />
          ) : (
            <>
              {/* Restrained Unified Summary Information Row (No Card Grid!) */}
              <UnifiedSummaryRow
                summary={data.summary}
                strongDomain={data.strongDomains[0]}
                focusArea={data.focusAreas[0]}
              />

              {/* Past Interviews List (Selectable) */}
              <PastInterviewsList
                interviews={data.recentInterviews}
                onSelectInterview={(id) => setSelectedInterviewId(id)}
                selectedInterviewId={selectedInterviewId}
              />
            </>
          )}
        </motion.div>
      ) : (
        /* ==================================================
           STATE B — SELECTED INTERVIEW ANALYSIS
           ================================================== */
        <motion.div
          key="state-b"
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="space-y-8"
        >
          {/* 1. TOP HEADER & NAVIGATION */}
          <div className="space-y-3 pb-4 border-b border-border/40 font-sans">
            <button
              type="button"
              onClick={() => setSelectedInterviewId(null)}
              className="inline-flex items-center gap-2 text-[13px] font-mono text-accent hover:text-foreground hover:underline cursor-pointer transition-colors focus:outline-none focus:ring-1 focus:ring-accent self-start"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>← All Interviews</span>
            </button>

            {activeInterviewItem && (
              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-stardom text-foreground uppercase tracking-tight">
                  {activeInterviewItem.roleTitle}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-[13px] font-mono text-foreground-muted">
                  <span>{activeInterviewItem.interviewType}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-accent" />
                    {activeInterviewItem.dateFormatted}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-accent" />
                    {activeInterviewItem.durationFormatted}
                  </span>
                </div>
              </div>
            )}
          </div>

          {resultLoading || !selectedResult ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center font-mono text-xs text-foreground-muted uppercase tracking-widest animate-pulse">
                Loading interview evaluation...
              </div>
            </div>
          ) : (
            <div className="space-y-10">
              {/* 2. TWO-COLUMN ANALYSIS */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
                {/* LEFT COLUMN: Interview Score + Role-Specific Spider Chart */}
                <div className="lg:col-span-5">
                  <PerformanceMetricsView
                    score={selectedResult.overallScore}
                    maxScore={selectedResult.totalPossibleScore}
                    roleSpecificMetrics={selectedResult.roleSpecificMetrics}
                  />
                </div>

                {/* RIGHT COLUMN: Question Analysis */}
                <div className="lg:col-span-7">
                  <QuestionAnalysisSection
                    questions={selectedResult.questionEvaluations}
                  />
                </div>
              </div>

              {/* 3. GENERAL PERFORMANCE SECTION (BELOW TWO-COLUMN ANALYSIS) */}
              <GeneralPerformanceSection
                metrics={selectedResult.generalPerformance}
              />

              {/* 4. PRACTICE AGAIN BUTTON (BOTTOM CTA -> /role) */}
              <div className="pt-6 flex justify-center border-t border-border/30">
                <button
                  type="button"
                  onClick={() => navigate('/role')}
                  className="px-8 py-3.5 bg-primary text-primary-foreground font-sans text-xs font-semibold uppercase tracking-widest hover:opacity-90 transition-opacity flex items-center justify-center gap-2.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent shadow-sm"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>PRACTICE AGAIN</span>
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
