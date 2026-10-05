import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  getInterviewResultById,
  type InterviewResult,
  OverallPerformance,
  AISummary,
  PerformanceRadarChart,
  DomainAnalysisSection,
  QuestionBreakdown,
  WhatToPrepareNext,
  ActionFooter,
  TranscriptViewer,
  ResultsSkeleton,
} from '@/features/results';
import { Clock, Calendar } from 'lucide-react';

export function ResultsPage() {
  const { interviewId } = useParams<{ interviewId?: string }>();
  const [result, setResult] = useState<InterviewResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    async function loadResults() {
      setLoading(true);
      try {
        const data = await getInterviewResultById(interviewId);
        if (isMounted) {
          setResult(data);
        }
      } catch (err) {
        console.error('Failed to load interview results:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    loadResults();
    return () => {
      isMounted = false;
    };
  }, [interviewId]);

  if (loading || !result) {
    return <ResultsSkeleton />;
  }

  return (
    <div className="w-full min-h-screen bg-background text-foreground font-sans px-4 sm:px-6 lg:px-8 py-8 max-w-[1150px] mx-auto space-y-10">
      {/* 1. VIEWPORT 1: HEADER & METADATA */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="pb-5 border-b border-border/40 flex flex-col md:flex-row md:items-end justify-between gap-4"
      >
        <div className="space-y-1">
          <div className="text-xs font-mono uppercase tracking-widest text-accent font-semibold">
            INTERVIEW RESULTS
          </div>
          <h1 className="text-3xl sm:text-4xl font-stardom text-foreground uppercase tracking-tight">
            {result.roleTitle}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-foreground-muted">
          <span className="px-2.5 py-1 bg-surface border border-border/40 text-foreground font-medium">
            {result.experienceLevel}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-accent" />
            {result.completedAt}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-accent" />
            32 min
          </span>
        </div>
      </motion.div>

      {/* 2. VIEWPORT 1: PERFORMANCE SUMMARY & AI SYNTHESIS */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-8 border-b border-border/40"
      >
        {/* Left Column: Dominant 64px Overall Score */}
        <div className="lg:col-span-5">
          <OverallPerformance
            score={result.overallScore}
            maxScore={result.totalPossibleScore}
          />
        </div>

        {/* Right Column: AI Evaluator Interpretation */}
        <div className="lg:col-span-7">
          <AISummary summary={result.aiSummary} />
        </div>
      </motion.div>

      {/* 3. PERFORMANCE PROFILE (REDESIGNED RADAR CHART WITH VISIBLE NUMERIC SCORES) */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="pb-8 border-b border-border/40"
      >
        <PerformanceRadarChart metrics={result.metrics} />
      </motion.div>

      {/* 4. WHAT YOU DID WELL / WHERE TO FOCUS (QUALITATIVE ANALYSIS & EVIDENCE DRAWERS) */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="pb-8 border-b border-border/40"
      >
        <DomainAnalysisSection
          strongDomains={result.strongDomains}
          focusAreas={result.focusAreas}
        />
      </motion.div>

      {/* 5. QUESTION BREAKDOWN (10 COMPACT DEFAULT-COLLAPSED ROWS) */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="pb-8 border-b border-border/40"
      >
        <QuestionBreakdown questions={result.questionEvaluations} />
      </motion.div>

      {/* 5.5. INTERVIEW TRANSCRIPT LOG & EXPORT */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.22 }}
        className="pb-8 border-b border-border/40"
      >
        <TranscriptViewer result={result} />
      </motion.div>

      {/* 6. WHAT TO PREPARE NEXT */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.25 }}
        className="pb-6 border-b border-border/40"
      >
        <WhatToPrepareNext topics={result.preparationFocus} />
      </motion.div>

      {/* 7. ACTIONS */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25, delay: 0.3 }}
      >
        <ActionFooter />
      </motion.div>
    </div>
  );
}
