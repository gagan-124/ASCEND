import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ScreeningModeSelector } from './components/ScreeningModeSelector';
import { FieldDisplay } from './components/FieldDisplay';
import { ResumeScreeningFlow } from './components/ResumeScreeningFlow';
import { useInterviewStore } from '@/stores/interviewStore';
import type { InterviewField } from './data/fields';
import type { ParsedResume, CandidateIntelligence } from '@/types/resume';
import { RotateCcw } from 'lucide-react';


export function InterviewSetupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setupConfig, setSetupConfig } = useInterviewStore();

  const modeParam = searchParams.get('mode') as 'role' | 'resume' | null;

  // Selected mode is strictly driven by the URL search parameter
  const selectedMode = modeParam;

  // Sync store with URL searchParams on navigation
  useEffect(() => {
    if (modeParam !== setupConfig.mode) {
      setSetupConfig({ mode: modeParam });
    }
  }, [modeParam, setupConfig.mode, setSetupConfig]);

  const handleSelectMode = (mode: 'role' | 'resume') => {
    setSetupConfig({ mode });
    navigate(`/interview/setup?mode=${mode}`);
  };

  const handleBackToModeSelection = () => {
    setSetupConfig({
      mode: null,
      selectedField: null,
      selectedRoleId: null,
      roleConfirmed: false,
      difficulty: undefined,
    });
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/interview/setup');
    }
  };

  const handleSelectField = (field: InterviewField) => {
    setSetupConfig({
      selectedField: field.id,
      selectedRoleId: null,
      roleConfirmed: false,
    });
  };

  const handleProceedToRoles = (field: InterviewField) => {
    setSetupConfig({
      selectedField: field.id,
      selectedRoleId: null,
      roleConfirmed: false,
    });
    navigate('/interview/roles');
  };

  const handleStartResumeInterview = (config: {
    resumeFileName: string;
    resumeId?: string;
    parsedResume?: ParsedResume;
    candidateIntelligence?: CandidateIntelligence;
    jobDescription: string;
    experienceLevel: 'Entry' | 'Mid' | 'Senior' | 'Lead';
    focusArea: 'Comprehensive' | 'Technical' | 'Behavioral';
    selectedRoleTitle?: string;
  }) => {
    setSetupConfig({
      mode: 'resume',
      resumeFileName: config.resumeFileName,
      resumeId: config.resumeId || setupConfig.resumeId || null,
      parsedResume: config.parsedResume || setupConfig.parsedResume || null,
      candidateIntelligence: config.candidateIntelligence || setupConfig.candidateIntelligence || null,
      jobDescription: config.jobDescription,
      experienceLevel: config.experienceLevel,
      focusArea: config.focusArea,
      selectedRoleTitle: config.selectedRoleTitle || setupConfig.selectedRoleTitle || 'SOFTWARE ENGINEER',
    });
    navigate('/interview/room');
  };


  return (
    <div className="flex-1 min-h-[calc(100vh-72px)] flex flex-col justify-start py-2 sm:py-3 lg:py-4 bg-background text-foreground transition-colors duration-150 overflow-x-hidden relative">
      <ScreeningModeSelector
        selectedMode={selectedMode}
        onSelectMode={handleSelectMode}
        roleContent={
          <div className="w-full flex flex-col items-center">
            {/* Protocol Top Navigation Controls */}
            <div className="w-full max-w-[1440px] 2xl:max-w-[1600px] px-4 sm:px-6 md:px-8 lg:px-10 flex items-center justify-between mb-2 sm:mb-3 lg:mb-3">
              <button
                type="button"
                onClick={handleBackToModeSelection}
                className="inline-flex items-center gap-2 text-xs font-mono font-medium uppercase tracking-wider text-foreground/60 hover:text-foreground transition-colors px-3 py-1.5 rounded-lg border border-border/40 bg-surface/50 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Change Mode</span>
              </button>

              <span className="font-mono text-xs text-foreground/50 uppercase tracking-widest">
                PROTOCOL: ASCEND-FLD-01
              </span>
            </div>

            {/* Step 2: Field Display Section */}
            <FieldDisplay
              selectedFieldId={setupConfig.selectedField}
              onSelectField={handleSelectField}
              onProceedToRoles={handleProceedToRoles}
            />
          </div>
        }
        resumeContent={
          <div className="w-full">
            <ResumeScreeningFlow
              onStartResumeInterview={handleStartResumeInterview}
              onBack={handleBackToModeSelection}
            />
          </div>
        }
      />
    </div>
  );
}
