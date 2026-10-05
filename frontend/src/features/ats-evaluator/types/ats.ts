export type ATSState = 'idle' | 'analyzing' | 'result';

export type ATSEvaluationStage =
  | 'reading'
  | 'comparing'
  | 'evaluating'
  | 'recommending';

export interface ATSInput {
  file: File;
  jobDescription: string;
}

export interface SkillMatch {
  name: string;
  evidence?: string;
}

export interface SkillGap {
  name: string;
  status: 'missing' | 'underrepresented';
  evidence?: string;
}

export interface EvaluationDimensions {
  keywordMatch: number;
  skillsAlignment: number;
  experienceRelevance: number;
  resumeStructure: number;
  atsReadability: number;
}

export interface ATSResult {
  overallScore: number;
  scoreExplanation: string;
  jobContext?: {
    title?: string;
    company?: string;
  };
  resume: {
    fileName: string;
    fileType: 'pdf' | 'docx' | 'unknown';
    fileSize: number;
    fileUrl?: string;
    extractedText?: string;
  };
  evaluation: EvaluationDimensions;
  matchedSkills: SkillMatch[];
  missingSkills: SkillGap[];
  strengths: string[];
  areasToImprove: string[];
  recommendations: string[];
}
