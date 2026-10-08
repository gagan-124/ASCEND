import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AscendLogo } from '@/components/branding';
import { LoadingButton } from '@/components/common';
import { useAuthStore } from '@/stores/authStore';
import { useProfileStore, UserProfileData } from '@/stores/profileStore';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import {
  User,
  Briefcase,
  FileText,
  Sliders,
  Check,
  ChevronRight,
  ChevronLeft,
  UploadCloud,
  CheckCircle2,
  Trash2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

const PRESET_ROLES = [
  'Software Engineer',
  'AI/ML Engineer',
  'Backend Engineer',
  'Frontend Engineer',
  'Full Stack Developer',
  'Data Scientist',
  'DevOps & Cloud Engineer',
  'Product Manager',
  'Cybersecurity Specialist',
  'System Architect',
];

const EXPERIENCE_LEVELS: { id: UserProfileData['experienceLevel']; label: string; desc: string }[] = [
  { id: 'Student', label: 'Student / Intern', desc: 'Currently studying or pursuing internships' },
  { id: 'Entry', label: 'Entry Level (0-2 yrs)', desc: 'Early career transitioning into tech' },
  { id: 'Junior', label: 'Junior (1-3 yrs)', desc: 'Hands-on practical development experience' },
  { id: 'Mid', label: 'Mid Level (3-5 yrs)', desc: 'Independent system and feature ownership' },
  { id: 'Senior', label: 'Senior (5+ yrs)', desc: 'Architecture, technical leadership, and scale' },
];

const DIFFICULTY_LEVELS: { id: UserProfileData['difficulty']; label: string; desc: string }[] = [
  { id: 'Easy', label: 'Easy', desc: 'Foundational concepts & syntax fundamentals' },
  { id: 'Medium', label: 'Medium', desc: 'Standard industry bar & realistic scenarios' },
  { id: 'Hard', label: 'Hard', desc: 'Staff / Tech Lead rigor & edge cases' },
];

const DURATIONS = [15, 30, 45, 60] as const;
const QUESTION_COUNTS = [5, 10, 15, 20] as const;

export function OnboardingPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { profile, completeOnboarding } = useProfileStore();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Step 1: About You
  const [fullName, setFullName] = useState(profile.fullName || user?.fullName || '');
  const [location, setLocation] = useState(profile.location || '');

  // Step 2: Interview Goal
  const [targetRole, setTargetRole] = useState(profile.targetRole || '');
  const [experienceLevel, setExperienceLevel] = useState<UserProfileData['experienceLevel']>(
    profile.experienceLevel || 'Entry'
  );
  const [difficulty, setDifficulty] = useState<UserProfileData['difficulty']>(
    profile.difficulty || 'Medium'
  );

  // Step 3: Resume
  const [resumeFileName, setResumeFileName] = useState<string | null>(profile.resumeFileName);
  const [resumeFileSize, setResumeFileSize] = useState<string | null>(profile.resumeFileSize);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 4: Preferences
  const [duration, setDuration] = useState<UserProfileData['interviewDuration']>(
    profile.interviewDuration || 30
  );
  const [questionCount, setQuestionCount] = useState<UserProfileData['questionsPerSession']>(
    profile.questionsPerSession || 10
  );
  const [allowHints, setAllowHints] = useState<boolean>(profile.allowHints ?? true);
  const [allowFollowUps, setAllowFollowUps] = useState<boolean>(profile.allowFollowUps ?? true);
  const [enableVoice, setEnableVoice] = useState<boolean>(profile.enableVoice ?? false);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleProcessResumeFile = async (file: File) => {
    setErrorMessage(null);
    const validExtensions = ['pdf', 'docx', 'doc'];
    const ext = file.name.toLowerCase().split('.').pop() || '';

    if (!validExtensions.includes(ext)) {
      setErrorMessage('Please upload a valid PDF or DOCX file.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('File exceeds 10MB limit. Please upload a smaller document.');
      return;
    }

    const formatted = formatFileSize(file.size);
    setResumeFileName(file.name);
    setResumeFileSize(formatted);

    // If authenticated, upload to Supabase storage 'resumes' bucket
    if (user?.id) {
      setIsUploadingResume(true);
      try {
        const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const storagePath = `${user.id}/${Date.now()}_${cleanName}`;
        const { error } = await supabase.storage.from('resumes').upload(storagePath, file, {
          upsert: true,
        });
        if (error) {
          console.warn('[STORAGE] Resume upload warning:', error.message);
        }
      } catch (err) {
        console.warn('[STORAGE] Resume upload exception:', err);
      } finally {
        setIsUploadingResume(false);
      }
    }
  };

  const handleRemoveResume = () => {
    setResumeFileName(null);
    setResumeFileSize(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validateStep = (step: number): boolean => {
    setErrorMessage(null);
    if (step === 1) {
      if (!fullName.trim()) {
        setErrorMessage('Please enter your full name.');
        return false;
      }
    }
    if (step === 2) {
      if (!targetRole.trim()) {
        setErrorMessage('Please select or specify the role you are preparing for.');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 4) {
        setCurrentStep((prev) => (prev + 1) as 1 | 2 | 3 | 4);
      }
    }
  };

  const handleBack = () => {
    setErrorMessage(null);
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3 | 4);
    }
  };

  const handleComplete = async () => {
    if (!validateStep(1) || !validateStep(2)) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const success = await completeOnboarding({
        fullName: fullName.trim(),
        location: location.trim(),
        targetRole: targetRole.trim(),
        experienceLevel,
        difficulty,
        resumeFileName: resumeFileName || null,
        resumeFileSize: resumeFileSize || null,
        interviewDuration: duration,
        questionsPerSession: questionCount,
        allowHints,
        allowFollowUps,
        enableVoice,
      });

      if (success) {
        navigate('/interview/setup', { replace: true });
      } else {
        setErrorMessage('Unable to save your profile. Please check your connection and try again.');
        setIsSubmitting(false);
      }
    } catch {
      setErrorMessage('An unexpected error occurred while saving your profile.');
      setIsSubmitting(false);
    }
  };

  const steps = [
    { num: 1, title: 'About You', icon: User },
    { num: 2, title: 'Target Role', icon: Briefcase },
    { num: 3, title: 'Resume (Optional)', icon: FileText },
    { num: 4, title: 'Preferences', icon: Sliders },
  ];

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8 selection:bg-amber-500/30 selection:text-amber-200">
      {/* Header */}
      <header className="max-w-3xl w-full mx-auto flex items-center justify-between py-4 border-b border-slate-800/80">
        <AscendLogo size="md" />
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-slate-400">
          <span>STEP {currentStep} OF 4</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl w-full mx-auto my-6 sm:my-8">
        {/* Progress Pills */}
        <nav aria-label="Onboarding Progress" className="grid grid-cols-4 gap-2 sm:gap-3 mb-8">
          {steps.map((s) => {
            const Icon = s.icon;
            const isDone = currentStep > s.num;
            const isCurrent = currentStep === s.num;
            return (
              <div
                key={s.num}
                className={cn(
                  'flex items-center gap-2 p-2.5 sm:p-3 rounded-xl border text-xs font-mono transition-all',
                  isCurrent
                    ? 'bg-[#0f172a] border-amber-500/60 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                    : isDone
                    ? 'bg-slate-900/60 border-slate-700 text-slate-300'
                    : 'bg-slate-950/40 border-slate-800/60 text-slate-600'
                )}
              >
                <div
                  className={cn(
                    'w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0',
                    isDone
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : isCurrent
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : 'bg-slate-800 text-slate-500'
                  )}
                >
                  {isDone ? <Check className="w-3 h-3 stroke-[3]" /> : <Icon className="w-3 h-3" />}
                </div>
                <span className="hidden md:inline truncate">{s.title}</span>
              </div>
            );
          })}
        </nav>

        {/* Card Body */}
        <div className="p-6 sm:p-8 rounded-2xl bg-[#0c1322] border border-slate-800/90 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-950/50 border border-red-800/60 text-red-300 text-xs font-sans flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: ABOUT YOU */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <span className="text-[11px] font-mono text-amber-400 uppercase tracking-widest block mb-1">
                  01. PROFILE SETUP
                </span>
                <h1 className="text-xl sm:text-2xl font-stardom text-slate-100 uppercase tracking-tight">
                  TELL US ABOUT YOURSELF
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 font-sans mt-1">
                  Set up your identity so ASCEND can personalize your interview experience.
                </p>
              </div>

              <div className="space-y-4 font-sans">
                <div className="space-y-1.5">
                  <label htmlFor="onboarding-name" className="text-xs font-mono uppercase tracking-wider text-slate-300 block">
                    Full Name <span className="text-amber-400">*</span>
                  </label>
                  <input
                    id="onboarding-name"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Maya Chen"
                    className="w-full h-11 px-3.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="onboarding-location" className="text-xs font-mono uppercase tracking-wider text-slate-300 block">
                    Location <span className="text-slate-500 font-normal">(Optional)</span>
                  </label>
                  <input
                    id="onboarding-location"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. San Francisco, CA or Bengaluru, India"
                    className="w-full h-11 px-3.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: TARGET ROLE & CALIBRATION */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <span className="text-[11px] font-mono text-amber-400 uppercase tracking-widest block mb-1">
                  02. TARGET CALIBRATION
                </span>
                <h1 className="text-xl sm:text-2xl font-stardom text-slate-100 uppercase tracking-tight">
                  WHAT ARE YOU PREPARING FOR?
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 font-sans mt-1">
                  Select your target role and seniority to calibrate interview scenarios.
                </p>
              </div>

              <div className="space-y-5 font-sans">
                {/* Target Role Input */}
                <div className="space-y-2">
                  <label htmlFor="onboarding-role" className="text-xs font-mono uppercase tracking-wider text-slate-300 block">
                    Target Role <span className="text-amber-400">*</span>
                  </label>
                  <input
                    id="onboarding-role"
                    type="text"
                    required
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="e.g. AI/ML Engineer or Backend Engineer"
                    className="w-full h-11 px-3.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all"
                  />

                  {/* Preset Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mr-1">
                      QUICK SELECT:
                    </span>
                    {PRESET_ROLES.map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setTargetRole(role)}
                        className={cn(
                          'px-2.5 py-1 text-xs font-mono rounded-lg border transition-all cursor-pointer select-none',
                          targetRole === role
                            ? 'bg-amber-400/15 border-amber-400/50 text-amber-300 font-semibold'
                            : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        )}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Experience Level */}
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-wider text-slate-300 block">
                    Experience Level
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {EXPERIENCE_LEVELS.map((lvl) => {
                      const isSelected = experienceLevel === lvl.id;
                      return (
                        <button
                          key={lvl.id}
                          type="button"
                          onClick={() => setExperienceLevel(lvl.id)}
                          className={cn(
                            'p-3 rounded-xl border text-left transition-all cursor-pointer select-none',
                            isSelected
                              ? 'bg-amber-400/10 border-amber-400/50 shadow-sm'
                              : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'
                          )}
                        >
                          <span
                            className={cn(
                              'text-xs font-mono font-semibold block',
                              isSelected ? 'text-amber-300' : 'text-slate-200'
                            )}
                          >
                            {lvl.label}
                          </span>
                          <span className="text-[11px] text-slate-400 font-sans block mt-0.5 leading-snug">
                            {lvl.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Difficulty */}
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-wider text-slate-300 block">
                    Interview Difficulty Baseline
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {DIFFICULTY_LEVELS.map((diff) => {
                      const isSelected = difficulty === diff.id;
                      return (
                        <button
                          key={diff.id}
                          type="button"
                          onClick={() => setDifficulty(diff.id)}
                          className={cn(
                            'p-3 rounded-xl border text-left transition-all cursor-pointer select-none',
                            isSelected
                              ? 'bg-amber-400/10 border-amber-400/50 shadow-sm'
                              : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'
                          )}
                        >
                          <span
                            className={cn(
                              'text-xs font-mono font-semibold block',
                              isSelected ? 'text-amber-300' : 'text-slate-200'
                            )}
                          >
                            {diff.label}
                          </span>
                          <span className="text-[11px] text-slate-400 font-sans block mt-0.5 leading-snug">
                            {diff.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: RESUME UPLOAD (OPTIONAL) */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-mono text-amber-400 uppercase tracking-widest">
                    03. CURRICULUM VITAE
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 uppercase font-semibold">
                    OPTIONAL
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-stardom text-slate-100 uppercase tracking-tight">
                  UPLOAD YOUR RESUME
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 font-sans mt-1">
                  Optional: Let ASCEND generate personalized questions referencing your past projects and skills.
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleProcessResumeFile(f);
                }}
                className="hidden"
              />

              {!resumeFileName ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    const f = e.dataTransfer.files?.[0];
                    if (f) handleProcessResumeFile(f);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    'w-full min-h-[200px] rounded-2xl border-2 border-dashed p-8 flex flex-col items-center justify-center gap-3 text-center cursor-pointer transition-all select-none',
                    isDragOver
                      ? 'border-amber-400 bg-amber-400/5'
                      : 'border-slate-700 bg-slate-900/40 hover:border-slate-600 hover:bg-slate-900/60'
                  )}
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-amber-400 shadow-sm">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-semibold text-slate-100 block">
                      Choose a file or drag &amp; drop
                    </span>
                    <span className="text-xs text-slate-400 block font-sans">
                      PDF, DOC, or DOCX (Max 10MB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="mt-1 px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Select File
                  </button>
                </div>
              ) : (
                <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-700/80 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-100 truncate block">
                          {resumeFileName}
                        </span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      </div>
                      <span className="text-xs font-mono text-slate-400 block mt-0.5">
                        {resumeFileSize || 'Ready for screening'}
                        {isUploadingResume && ' • Uploading to secure cloud...'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRemoveResume}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-colors cursor-pointer"
                    title="Remove file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: SESSION PREFERENCES */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <span className="text-[11px] font-mono text-amber-400 uppercase tracking-widest block mb-1">
                  04. SESSION PARAMETERS
                </span>
                <h1 className="text-xl sm:text-2xl font-stardom text-slate-100 uppercase tracking-tight">
                  SESSION PREFERENCES
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 font-sans mt-1">
                  Configure default duration, pacing, and assistance settings. You can modify these anytime in Settings.
                </p>
              </div>

              <div className="space-y-5 font-sans">
                {/* Duration */}
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-wider text-slate-300 block">
                    Default Session Duration
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {DURATIONS.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDuration(d)}
                        className={cn(
                          'p-3 rounded-xl border text-center transition-all cursor-pointer select-none',
                          duration === d
                            ? 'bg-amber-400/15 border-amber-400/60 text-amber-300 font-semibold'
                            : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200'
                        )}
                      >
                        <span className="font-mono text-sm block">{d} Mins</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {d === 15 ? 'Express' : d === 30 ? 'Standard' : d === 45 ? 'In-depth' : 'Full loop'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Questions Per Session */}
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-wider text-slate-300 block">
                    Questions Per Session
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {QUESTION_COUNTS.map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setQuestionCount(count)}
                        className={cn(
                          'p-3 rounded-xl border text-center transition-all cursor-pointer select-none',
                          questionCount === count
                            ? 'bg-amber-400/15 border-amber-400/60 text-amber-300 font-semibold'
                            : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200'
                        )}
                      >
                        <span className="font-mono text-sm block">{count} Questions</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {count === 5 ? 'Rapid' : count === 10 ? 'Recommended' : count === 15 ? 'Deep' : 'Exhaustive'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Toggles */}
                <div className="space-y-3 pt-2">
                  {/* Hints Toggle */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 gap-4">
                    <div className="space-y-0.5">
                      <span className="text-xs sm:text-sm font-semibold text-slate-200 block">
                        Allow hints during interviews
                      </span>
                      <p className="text-[11px] text-slate-400 font-sans">
                        Provides optional conceptual tips when you request guidance.
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={allowHints}
                      onClick={() => setAllowHints(!allowHints)}
                      className={cn(
                        'w-11 h-6 rounded-full transition-colors p-1 cursor-pointer shrink-0 relative',
                        allowHints ? 'bg-emerald-500' : 'bg-slate-800 border border-slate-700'
                      )}
                    >
                      <div
                        className={cn(
                          'w-4 h-4 rounded-full bg-white transition-transform shadow-xs',
                          allowHints ? 'translate-x-5' : 'translate-x-0'
                        )}
                      />
                    </button>
                  </div>

                  {/* Follow-ups Toggle */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 gap-4">
                    <div className="space-y-0.5">
                      <span className="text-xs sm:text-sm font-semibold text-slate-200 block">
                        Allow IRA to ask follow-up questions
                      </span>
                      <p className="text-[11px] text-slate-400 font-sans">
                        Enables the AI interviewer to probe deeper into technical trade-offs.
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={allowFollowUps}
                      onClick={() => setAllowFollowUps(!allowFollowUps)}
                      className={cn(
                        'w-11 h-6 rounded-full transition-colors p-1 cursor-pointer shrink-0 relative',
                        allowFollowUps ? 'bg-emerald-500' : 'bg-slate-800 border border-slate-700'
                      )}
                    >
                      <div
                        className={cn(
                          'w-4 h-4 rounded-full bg-white transition-transform shadow-xs',
                          allowFollowUps ? 'translate-x-5' : 'translate-x-0'
                        )}
                      />
                    </button>
                  </div>

                  {/* Voice Toggle */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 gap-4">
                    <div className="space-y-0.5">
                      <span className="text-xs sm:text-sm font-semibold text-slate-200 block">
                        Enable voice interviews
                      </span>
                      <p className="text-[11px] text-slate-400 font-sans">
                        Audio streaming and speech evaluation during interview questions.
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={enableVoice}
                      onClick={() => setEnableVoice(!enableVoice)}
                      className={cn(
                        'w-11 h-6 rounded-full transition-colors p-1 cursor-pointer shrink-0 relative',
                        enableVoice ? 'bg-emerald-500' : 'bg-slate-800 border border-slate-700'
                      )}
                    >
                      <div
                        className={cn(
                          'w-4 h-4 rounded-full bg-white transition-transform shadow-xs',
                          enableVoice ? 'translate-x-5' : 'translate-x-0'
                        )}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 flex items-center justify-between gap-4 font-mono text-xs">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer uppercase tracking-wider disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3">
              {currentStep === 3 && (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-4 py-2.5 rounded-xl border border-slate-700/60 hover:bg-slate-800/60 text-slate-400 hover:text-slate-200 transition-colors uppercase tracking-wider cursor-pointer"
                >
                  Skip for now
                </button>
              )}

              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2.5 rounded-xl bg-[#fef3c7] hover:bg-[#fde68a] text-slate-950 font-bold uppercase tracking-widest transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <span>Continue</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <LoadingButton
                  type="button"
                  onClick={handleComplete}
                  isLoading={isSubmitting}
                  loadingText="SAVING PROFILE..."
                  className="px-6 py-2.5 rounded-xl bg-[#fef3c7] hover:bg-[#fde68a] text-slate-950 font-bold uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>COMPLETE SETUP</span>
                </LoadingButton>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-3xl w-full mx-auto text-center text-xs font-sans text-slate-500 py-2">
        <span>ASCEND AI Mock Interview Platform • All profile preferences can be updated anytime in Settings</span>
      </footer>
    </div>
  );
}
