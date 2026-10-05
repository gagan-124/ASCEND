export type QualitativeMatch = 'Exceptional Match' | 'Strong Match' | 'Good Match' | 'Potential Match';

export interface RoleRecommendation {
  roleId?: string;
  roleTitle: string;
  matchStrength: QualitativeMatch;
  conciseReasoning: string;
  supportingEvidence: string[];
}

export interface TargetRoles {
  explicit: string[];
  inferred: string[];
}

export interface ParsedResume {
  resumeId: string;
  fileName: string;
  fileSize?: number;
  uploadedAt?: string;
  contactInformation: {
    fullName?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
  summary?: string;
  experience: {
    title: string;
    company: string;
    duration?: string;
    description?: string;
    highlights?: string[];
  }[];
  projects: {
    name: string;
    technologies?: string[];
    description?: string;
    link?: string;
  }[];
  education: {
    institution: string;
    degree: string;
    fieldOfStudy?: string;
    year?: string;
  }[];
  skills: {
    category?: string;
    items: string[];
  }[];
  certifications?: string[];
  achievements?: string[];
}

export interface CandidateIntelligence {
  keyInfo: {
    candidateName: string;
    currentRecentRole: string;
    totalExperience: string;
    education: string;
    coreSkills: string[];
  };
  strongAreas: string[];
  targetRoles: TargetRoles;
  recommendedRoles: RoleRecommendation[];
  isSparseEvidence?: boolean;
}

export interface ResumeAnalysisResult {
  parsedResume: ParsedResume;
  intelligence: CandidateIntelligence;
}

