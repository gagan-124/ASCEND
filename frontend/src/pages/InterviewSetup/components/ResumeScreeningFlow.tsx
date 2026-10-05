import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, FileText, CheckCircle2, RotateCcw, ArrowRight, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { resumeUploadSchema } from '@/schemas/resume';
import { resumesApi } from '@/services/api/resumes';
import type { ParsedResume, CandidateIntelligence } from '@/types/resume';
import { ResumeParsingProgress, CandidateIntelligenceView } from '@/features/resume';
import { useInterviewStore } from '@/stores/interviewStore';

export interface ResumeScreeningFlowProps {
  onStartResumeInterview: (config: {
    resumeFileName: string;
    resumeId?: string;
    parsedResume?: ParsedResume;
    candidateIntelligence?: CandidateIntelligence;
    jobDescription: string;
    experienceLevel: 'Entry' | 'Mid' | 'Senior' | 'Lead';
    focusArea: 'Comprehensive' | 'Technical' | 'Behavioral';
    selectedRoleTitle?: string;
  }) => void;
  onBack: () => void;
  className?: string;
}

export const ResumeScreeningFlow: React.FC<ResumeScreeningFlowProps> = ({
  onStartResumeInterview,
  onBack,
  className,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setSetupConfig, setupConfig } = useInterviewStore();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [demoFileName, setDemoFileName] = useState<string | null>(setupConfig.resumeFileName || null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Flow Processing States
  const [isParsing, setIsParsing] = useState(false);
  const [parsedResume, setParsedResume] = useState<ParsedResume | null>(setupConfig.parsedResume || null);
  const [intelligence, setIntelligence] = useState<CandidateIntelligence | null>(
    setupConfig.candidateIntelligence || null
  );
  const [selectedRoleTitle, setSelectedRoleTitle] = useState<string>(
    setupConfig.selectedRoleTitle || setupConfig.candidateIntelligence?.recommendedRoles[0]?.roleTitle || 'Lead Frontend Engineer'
  );

  // Configuration Inputs
  const [jobDescription, setJobDescription] = useState(setupConfig.jobDescription || '');
  const [experienceLevel, setExperienceLevel] = useState<'Entry' | 'Mid' | 'Senior' | 'Lead'>(
    setupConfig.experienceLevel || 'Senior'
  );
  const [focusArea, setFocusArea] = useState<'Comprehensive' | 'Technical' | 'Behavioral'>(
    setupConfig.focusArea || 'Comprehensive'
  );

  // Rehydrate state when setupConfig changes externally or on route mount
  React.useEffect(() => {
    if (setupConfig.parsedResume && !parsedResume) {
      setParsedResume(setupConfig.parsedResume);
    }
    if (setupConfig.candidateIntelligence && !intelligence) {
      setIntelligence(setupConfig.candidateIntelligence);
    }
    if (setupConfig.resumeFileName && !demoFileName && !selectedFile) {
      setDemoFileName(setupConfig.resumeFileName);
    }
  }, [setupConfig]);

  const processResumePipeline = async (file: File | null, isSample: boolean = false) => {
    setErrorMessage(null);
    setIsParsing(true);

    try {
      if (isSample) {
        const result = await resumesApi.getSampleResumeAnalysis(jobDescription);
        setParsedResume(result.parsedResume);
        setIntelligence(result.intelligence);
        const firstRole = result.intelligence.recommendedRoles[0]?.roleTitle || 'Lead Frontend Engineer';
        setSelectedRoleTitle(firstRole);
        setSetupConfig({
          resumeFileName: result.parsedResume.fileName,
          resumeId: result.parsedResume.resumeId,
          parsedResume: result.parsedResume,
          candidateIntelligence: result.intelligence,
          selectedRoleTitle: firstRole,
        });
      } else if (file) {
        // Step 1: Validate
        const validation = resumeUploadSchema.safeParse({ file });
        if (!validation.success) {
          const firstError = validation.error.errors[0]?.message || 'Invalid resume file.';
          setErrorMessage(firstError);
          setIsParsing(false);
          return;
        }

        // Step 2: Upload & Parse
        const uploadRes = await resumesApi.uploadResume(file);
        const result = await resumesApi.parseAndAnalyze(uploadRes.resumeId, file, jobDescription, experienceLevel);

        setParsedResume(result.parsedResume);
        setIntelligence(result.intelligence);
        const firstRole = result.intelligence.recommendedRoles[0]?.roleTitle || 'Lead Frontend Engineer';
        setSelectedRoleTitle(firstRole);
        setSetupConfig({
          resumeFileName: result.parsedResume.fileName,
          resumeId: result.parsedResume.resumeId,
          parsedResume: result.parsedResume,
          candidateIntelligence: result.intelligence,
          selectedRoleTitle: firstRole,
        });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to process resume document. Please try again.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setDemoFileName(file.name);
      processResumePipeline(file, false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setDemoFileName(file.name);
      processResumePipeline(file, false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleUseDemoResume = () => {
    setSelectedFile(null);
    setDemoFileName('alex_morgan_senior_engineer_resume.pdf');
    processResumePipeline(null, true);
  };

  const handleClearResume = () => {
    setSelectedFile(null);
    setDemoFileName(null);
    setParsedResume(null);
    setIntelligence(null);
    setErrorMessage(null);
    setSetupConfig({
      resumeFileName: null,
      resumeId: null,
      parsedResume: null,
      candidateIntelligence: null,
      selectedRoleTitle: 'SOFTWARE ENGINEER',
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSelectRole = (title: string, roleId?: string) => {
    setSelectedRoleTitle(title);
    setSetupConfig({
      selectedRoleTitle: title,
      selectedRoleId: roleId || null,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalFileName = selectedFile?.name || demoFileName || parsedResume?.fileName || 'candidate_resume.pdf';
    onStartResumeInterview({
      resumeFileName: finalFileName,
      resumeId: parsedResume?.resumeId,
      parsedResume: parsedResume || undefined,
      candidateIntelligence: intelligence || undefined,
      jobDescription,
      experienceLevel,
      focusArea,
      selectedRoleTitle,
    });
  };

  const isResumeLoaded = Boolean(selectedFile || demoFileName || parsedResume);


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={cn('w-full max-w-[1320px] 2xl:max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10 py-3 sm:py-4 lg:py-6 text-left select-none', className)}
    >
      {/* Top Navigation & Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 lg:mb-8 gap-4 pb-4 border-b border-border/40">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono text-[10px] sm:text-xs font-semibold uppercase tracking-widest px-2.5 py-0.5 rounded-full border border-border/60 bg-surface/50 text-foreground/70 inline-flex items-center gap-1.5">
              <span>Step 02 · Protocol ASCEND-RES-02</span>
            </span>
            <span className="font-mono text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-foreground/50 hidden sm:inline">
              • RESUME-DRIVEN SETUP
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-stardom text-foreground uppercase tracking-tight leading-none">
            Resume Screening Configuration
          </h2>
          <p className="text-xs sm:text-sm font-sans text-foreground/70 mt-1.5 max-w-2xl">
            Upload your CV to let ASCEND parse your experience and tailor dynamic questions.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-mono font-medium uppercase tracking-wider text-foreground/70 hover:text-foreground transition-colors px-3.5 py-2 rounded-xl border border-border/60 bg-surface/60 hover:bg-surface hover:border-border cursor-pointer shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Change Mode</span>
          </button>
        </div>
      </div>

      {/* Actionable User Error Display */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/30 flex items-center justify-between gap-3 text-destructive text-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-[11px] font-mono underline hover:opacity-80 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Parsing Progress Screen */}
      {isParsing ? (
        <ResumeParsingProgress fileName={selectedFile?.name || demoFileName || 'resume.pdf'} />
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-8 font-sans">
          {/* Section 1: Resume Upload Dropzone */}
          <div className="flex flex-col gap-2.5">
            <label className="text-xs font-mono font-medium uppercase tracking-wider text-foreground/70 flex items-center justify-between">
              <span>1. Upload Resume (PDF / DOCX)</span>
              {!isResumeLoaded && (
                <button
                  type="button"
                  onClick={handleUseDemoResume}
                  className="text-[11px] font-mono text-foreground/60 hover:text-foreground underline cursor-pointer"
                >
                  Use sample candidate resume
                </button>
              )}
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc"
              onChange={handleFileChange}
              className="hidden"
            />

            {!isResumeLoaded ? (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'w-full min-h-[160px] sm:min-h-[180px] rounded-2xl border-2 border-dashed p-6 sm:p-8 flex flex-col items-center justify-center gap-3 text-center cursor-pointer transition-all duration-200',
                  'bg-surface/50 border-border/60 hover:border-foreground/40 hover:bg-surface/80',
                  isDragOver && 'border-foreground bg-surface ring-2 ring-foreground/20'
                )}
              >
                <div className="w-12 h-12 rounded-xl bg-foreground/5 border border-border/40 flex items-center justify-center text-foreground">
                  <UploadCloud className="w-6 h-6 stroke-[1.75]" />
                </div>
                <div>
                  <p className="text-sm sm:text-base font-medium text-foreground">
                    Drag and drop your resume here, or <span className="underline">browse</span>
                  </p>
                  <p className="text-xs text-foreground/50 mt-1">
                    Supports PDF, DOCX (Max 10MB)
                  </p>
                </div>
              </div>
            ) : (
              /* Selected File State / Parsing Chip */
              <div className="w-full p-4 sm:p-5 rounded-2xl bg-surface border border-border/60 flex items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-foreground/10 flex items-center justify-center text-foreground shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm sm:text-base font-semibold text-foreground truncate">
                        {demoFileName || selectedFile?.name}
                      </p>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    </div>
                    <p className="text-xs text-foreground/60 font-mono mt-0.5">
                      Parsed: {parsedResume?.skills?.length || 3} skill categories,{' '}
                      {parsedResume?.experience?.length || 2} work experiences
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleClearResume}
                  className="p-2 rounded-lg border border-border/40 hover:border-border text-foreground/70 hover:text-foreground transition-colors cursor-pointer shrink-0"
                  aria-label="Remove uploaded resume"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* CANDIDATE INTELLIGENCE EXTENSION VIEW */}
          {intelligence && (
            <CandidateIntelligenceView
              intelligence={intelligence}
              selectedRoleTitle={selectedRoleTitle}
              onSelectRole={(title, roleId) => handleSelectRole(title, roleId)}
            />
          )}

          {/* Section 2: Target Job Description */}
          <div className="flex flex-col gap-2.5">
            <label htmlFor="job-description" className="text-xs font-mono font-medium uppercase tracking-wider text-foreground/70">
              2. Target Job Description <span className="text-foreground/40 font-sans lowercase">(optional)</span>
            </label>
            <textarea
              id="job-description"
              rows={4}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste role description or key requirements to tailor technical evaluation..."
              className={cn(
                'w-full p-4 rounded-2xl bg-surface/50 border border-border/60 text-foreground text-xs sm:text-sm',
                'placeholder:text-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 transition-all'
              )}
            />
          </div>

          {/* Section 3: Interview Parameters Configuration - 2-Column Desktop Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Experience Level Selector */}
            <div className="flex flex-col gap-2.5 p-5 rounded-2xl bg-surface border border-border/60 shadow-xs">
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
                3. Experience Level
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                {(['Entry', 'Mid', 'Senior', 'Lead'] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setExperienceLevel(level)}
                    className={cn(
                      'py-2.5 px-3 text-xs font-mono uppercase tracking-wider rounded-xl border transition-all cursor-pointer text-center',
                      experienceLevel === level
                        ? 'bg-foreground text-background border-foreground font-bold shadow-xs'
                        : 'bg-background/50 border-border/40 text-foreground/70 hover:border-border hover:text-foreground'
                    )}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Focus Area Selector */}
            <div className="flex flex-col gap-2.5 p-5 rounded-2xl bg-surface border border-border/60 shadow-xs">
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
                4. Evaluation Focus
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                {(['Comprehensive', 'Technical', 'Behavioral'] as const).map((focus) => (
                  <button
                    key={focus}
                    type="button"
                    onClick={() => setFocusArea(focus)}
                    className={cn(
                      'py-2.5 px-3 text-xs font-sans rounded-xl border transition-all cursor-pointer text-center flex items-center justify-center gap-1.5',
                      focusArea === focus
                        ? 'bg-foreground text-background border-foreground font-semibold shadow-xs'
                        : 'bg-background/50 border-border/40 text-foreground/70 hover:border-border hover:text-foreground'
                    )}
                  >
                    <span>{focus}</span>
                    {focusArea === focus && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Primary Action Button */}
          <button
            type="submit"
            disabled={!isResumeLoaded}
            className={cn(
              'mt-2 h-13 sm:h-14 w-full rounded-2xl font-mono text-xs sm:text-sm font-bold uppercase tracking-widest text-background bg-foreground',
              'shadow-[0_8px_20px_rgba(16,44,87,0.2)] hover:opacity-95 active:scale-[0.99] transition-all duration-150',
              'flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <span>START RESUME INTERVIEW</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}
    </motion.div>
  );
};

