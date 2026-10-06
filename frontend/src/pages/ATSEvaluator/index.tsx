import { useState } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, ArrowRight, Sparkles } from 'lucide-react';
import {
  type ATSState,
  type ATSResult,
  atsEvaluatorService,
  ResumeUploadArea,
  JobDescriptionInput,
  HowItWorks,
  AnalyzingState,
  ResumePreview,
  ATSEvaluationResult,
} from '@/features/ats-evaluator';

export function ATSEvaluatorPage() {
  const [state, setState] = useState<ATSState>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState<string>('');
  const [result, setResult] = useState<ATSResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canAnalyze = Boolean(selectedFile && jobDescription.trim().length > 0);

  const handleAnalyze = async () => {
    if (!selectedFile || !jobDescription.trim()) return;

    setError(null);
    setState('analyzing');

    try {
      const evaluationResult = await atsEvaluatorService.analyzeResume({
        file: selectedFile,
        jobDescription: jobDescription.trim(),
      });
      setResult(evaluationResult);
      setState('result');
    } catch (err) {
      console.error('ATS evaluation error:', err);
      const msg = err instanceof Error ? err.message : 'Evaluation failed. Please verify your file format and try again.';
      setError(msg);
      setState('idle');
    }
  };

  const handleReset = () => {
    setState('idle');
    setResult(null);
    setError(null);
    setSelectedFile(null);
    setJobDescription('');
  };

  return (
    <div className="w-full min-h-screen bg-background text-foreground font-sans px-4 sm:px-6 lg:px-8 py-8 max-w-[1280px] mx-auto space-y-8">
      {/* PAGE HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="pb-5 border-b border-border/40 flex flex-col sm:flex-row sm:items-end justify-between gap-4"
      >
        <div className="space-y-1.5">
          <div className="text-xs sm:text-sm font-mono uppercase tracking-widest text-accent font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" />
            <span>ASCEND INTELLIGENCE</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-stardom text-foreground uppercase tracking-tight">
            ATS EVALUATOR
          </h1>
        </div>

        {state === 'result' && (
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 bg-surface hover:bg-surface-muted text-foreground border border-border/60 font-sans text-xs sm:text-sm font-semibold uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent self-start sm:self-auto rounded-lg shadow-xs"
          >
            <RotateCcw className="w-4 h-4 text-foreground-muted" />
            <span>New Analysis</span>
          </button>
        )}
      </motion.div>

      {/* STATE A: INPUT / UPLOAD */}
      {state === 'idle' && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-8"
        >
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-xs sm:text-sm font-mono rounded-lg">
              {error}
            </div>
          )}

          {/* TWO-COLUMN INPUT WORKSPACE */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <ResumeUploadArea
              selectedFile={selectedFile}
              onFileSelect={(file) => {
                setSelectedFile(file);
                if (result) setResult(null);
              }}
            />

            <JobDescriptionInput
              value={jobDescription}
              onChange={(val) => {
                setJobDescription(val);
                if (result) setResult(null);
              }}
            />
          </div>

          {/* INSTRUCTIONAL FOOTER */}
          <HowItWorks />

          {/* PRIMARY ACTION BUTTON */}
          <div className="pt-2 flex justify-center">
            <button
              type="button"
              disabled={!canAnalyze}
              onClick={handleAnalyze}
              className={`w-full sm:w-auto px-8 py-3.5 font-sans text-xs sm:text-sm font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all rounded-lg ${
                canAnalyze
                  ? 'bg-primary text-primary-foreground hover:opacity-90 cursor-pointer shadow-sm focus:ring-2 focus:ring-accent'
                  : 'bg-surface/40 text-foreground-muted/40 border border-border/20 cursor-not-allowed'
              }`}
            >
              <span>ANALYZE RESUME</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* STATE B: ANALYZING */}
      {state === 'analyzing' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <AnalyzingState />
        </motion.div>
      )}

      {/* STATE C: ANALYSIS RESULT */}
      {state === 'result' && result && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
        >
          {/* LEFT: RESUME PREVIEW (5 columns on desktop) */}
          <div className="lg:col-span-5">
            <div className="mb-2.5 text-xs sm:text-sm font-mono uppercase tracking-widest text-accent font-semibold">
              DOCUMENT PREVIEW
            </div>
            <ResumePreview
              fileName={result.resume.fileName}
              fileType={result.resume.fileType}
              fileUrl={result.resume.fileUrl}
              extractedText={result.resume.extractedText}
            />
          </div>

          {/* RIGHT: ATS EVALUATION (7 columns on desktop) */}
          <div className="lg:col-span-7 bg-surface/20 border border-border/50 p-6 sm:p-8 lg:p-9 rounded-2xl">
            <ATSEvaluationResult result={result} />
          </div>
        </motion.div>
      )}
    </div>
  );
}
