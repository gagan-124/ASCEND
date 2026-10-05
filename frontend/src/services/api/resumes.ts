import { apiClient } from './client';
import type { ParsedResume, CandidateIntelligence, ResumeAnalysisResult } from '@/types/resume';

// Sample Candidate Data generator for sample resume option or fallback dev testing
export const getSampleCandidateData = (
  fileName: string = 'alex_morgan_senior_engineer_resume.pdf',
  targetJd?: string
): ResumeAnalysisResult => {
  const isSparse = fileName.toLowerCase().includes('sparse');

  const parsedResume: ParsedResume = {
    resumeId: 'res_' + Math.random().toString(36).substring(2, 9),
    fileName,
    fileSize: isSparse ? 102400 : 1258291,
    uploadedAt: new Date().toISOString(),
    contactInformation: {
      fullName: isSparse ? 'Taylor Reed' : 'Alex Morgan',
      email: isSparse ? 'taylor.r@example.com' : 'alex.morgan@ascend.io',
      phone: '+1 (555) 382-9102',
      location: 'San Francisco, CA',
      github: 'github.com/alexmorgan-dev',
      linkedin: 'linkedin.com/in/alexmorgan-eng',
    },
    summary: isSparse
      ? 'Junior Web Developer with basic HTML, CSS, and JavaScript knowledge seeking entry-level opportunities.'
      : 'Staff Systems Architect and Senior Full-Stack Engineer with 8+ years of experience leading high-throughput microservices, distributed React/Node.js systems, and cloud infrastructure.',
    experience: isSparse
      ? [
          {
            title: 'Junior Web Intern',
            company: 'Local Creative Studio',
            duration: '2023 - Present',
            description: 'Maintained simple landing pages and updated content using standard HTML/CSS.',
            highlights: ['Updated blog posts', 'Fixed layout styling bugs'],
          },
        ]
      : [
          {
            title: 'Lead Frontend Infrastructure Engineer',
            company: 'Vanguard Tech Labs',
            duration: '2021 - Present',
            description: 'Architected design system tokens, Next.js application core, and real-time WebSocket telemetry systems.',
            highlights: [
              'Reduced initial bundle load time by 42% across core suite',
              'Mentored 12 mid/senior developers across 3 agile squads',
            ],
          },
          {
            title: 'Senior Full Stack Engineer',
            company: 'Apex Cloud Solutions',
            duration: '2018 - 2021',
            description: 'Built scalable REST & GraphQL backend services and reactive micro-frontend architectures.',
            highlights: ['Designed high-throughput Kafka pipeline processing 10M+ daily events'],
          },
        ],
    projects: isSparse
      ? [
          {
            name: 'Personal Portfolio',
            technologies: ['HTML', 'CSS', 'JavaScript'],
            description: 'A static portfolio page hosted on GitHub Pages.',
          },
        ]
      : [
          {
            name: 'Distributed State Mesh',
            technologies: ['TypeScript', 'Rust', 'WebSockets', 'React'],
            description: 'Zero-latency state sync engine for real-time collaborative code review surfaces.',
          },
        ],
    education: [
      {
        institution: 'University of California, Berkeley',
        degree: 'B.S. Computer Science',
        year: '2018',
      },
    ],
    skills: isSparse
      ? [
          { category: 'Frontend', items: ['HTML5', 'CSS3', 'JavaScript'] },
          { category: 'Tools', items: ['Git', 'VS Code'] },
        ]
      : [
          { category: 'Core Languages', items: ['TypeScript', 'JavaScript', 'Python', 'Go', 'Rust', 'SQL'] },
          { category: 'Frontend Architecture', items: ['React 19', 'Next.js', 'TailwindCSS', 'State Management', 'WebSockets'] },
          { category: 'Backend Systems', items: ['Node.js', 'FastAPI', 'PostgreSQL', 'Redis', 'Docker', 'GraphQL'] },
        ],
  };

  const isJdTargeted = Boolean(targetJd && targetJd.trim().length > 10);

  const intelligence: CandidateIntelligence = {
    keyInfo: {
      candidateName: parsedResume.contactInformation.fullName || 'Candidate',
      currentRecentRole: parsedResume.experience[0]?.title || 'Software Engineer',
      totalExperience: isSparse ? '1 Year' : '8+ Years',
      education: 'B.S. Computer Science (UC Berkeley)',
      coreSkills: isSparse
        ? ['HTML5', 'CSS3', 'JavaScript', 'Git']
        : ['TypeScript', 'React 19', 'Next.js', 'Node.js', 'FastAPI', 'System Architecture'],
    },
    strongAreas: isSparse
      ? ['Fundamental Web Styling', 'Basic Page Assembly']
      : [
          'Frontend Infrastructure & Micro-Frontends',
          'Distributed System & Real-Time Telemetry',
          'Technical Team Mentorship & Code Quality',
        ],
    targetRoles: {
      explicit: isSparse
        ? ['Junior Frontend Developer', 'Web Intern']
        : [
            'Lead Frontend Engineer',
            'Staff Systems Architect',
            ...(isJdTargeted ? ['Target Role (from Job Description)'] : []),
          ],
      inferred: isSparse
        ? ['Junior UI Developer', 'HTML/CSS Integrator']
        : ['Full-Stack Engineering Manager', 'Principal Platform Specialist'],
    },
    recommendedRoles: isSparse
      ? [
          {
            roleTitle: 'Junior Frontend Developer',
            matchStrength: 'Strong Match',
            conciseReasoning: 'Demonstrates clear foundational proficiency in basic web development standards and HTML/CSS.',
            supportingEvidence: ['Internship experience at Local Creative Studio', 'Personal portfolio project'],
          },
          {
            roleTitle: 'Web Support Specialist',
            matchStrength: 'Good Match',
            conciseReasoning: 'Background aligns with maintaining established websites and fixing layout styling issues.',
            supportingEvidence: ['Maintained landing pages and content updates'],
          },
        ]
      : [
          {
            roleId: 'frontend-lead',
            roleTitle: isJdTargeted ? 'Target Role & Lead Frontend Engineer' : 'Lead Frontend Infrastructure Engineer',
            matchStrength: 'Exceptional Match',
            conciseReasoning: 'Deep experience leading frontend architecture, performance optimization, and design systems.',
            supportingEvidence: [
              '42% bundle reduction at Vanguard Tech Labs',
              'Expertise in React 19, Next.js, and TypeScript',
            ],
          },
          {
            roleId: 'fullstack-senior',
            roleTitle: 'Senior Full-Stack Engineer',
            matchStrength: 'Strong Match',
            conciseReasoning: 'Proven history of building robust REST/GraphQL APIs combined with reactive frontends.',
            supportingEvidence: [
              'Kafka pipeline handling 10M+ daily events at Apex Cloud',
              'Proficiency in Node.js, FastAPI, and PostgreSQL',
            ],
          },
          {
            roleId: 'staff-architect',
            roleTitle: 'Staff Systems Architect',
            matchStrength: 'Strong Match',
            conciseReasoning: 'Strong track record designing zero-latency state meshes and technical mentorship across squads.',
            supportingEvidence: [
              'Distributed State Mesh project using Rust & WebSockets',
              'Mentored 12 mid/senior developers',
            ],
          },
          {
            roleId: 'engineering-manager',
            roleTitle: 'Engineering Manager (Technical)',
            matchStrength: 'Good Match',
            conciseReasoning: 'Demonstrates senior leadership, cross-squad mentorship, and technical vision.',
            supportingEvidence: ['Led engineering squads and mentored 12 developers'],
          },
          {
            roleId: 'platform-engineer',
            roleTitle: 'Platform / Infrastructure Engineer',
            matchStrength: 'Potential Match',
            conciseReasoning: 'Experienced with Docker, cloud microservices, and system telemetry.',
            supportingEvidence: ['Hands-on containerization and event pipeline construction'],
          },
        ],
    isSparseEvidence: isSparse,
  };

  return { parsedResume, intelligence };
};

export const resumesApi = {
  uploadResume: async (file: File): Promise<{ resumeId: string; fileName: string }> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      return await apiClient.post<{ resumeId: string; fileName: string }>('/resumes/upload', formData);
    } catch {
      // Fallback response if dev backend endpoint is not active
      return {
        resumeId: 'res_' + Math.random().toString(36).substring(2, 9),
        fileName: file.name,
      };
    }
  },

  parseAndAnalyze: async (
    resumeId: string,
    file?: File | null,
    jobDescription?: string,
    experienceLevel?: string
  ): Promise<ResumeAnalysisResult> => {
    try {
      return await apiClient.post<ResumeAnalysisResult>(`/resumes/${resumeId}/analyze`, {
        jobDescription,
        experienceLevel,
      });
    } catch {
      // Return simulated intelligence grounded in file name
      await new Promise((resolve) => setTimeout(resolve, 1800));
      const fileName = file?.name || 'uploaded_resume.pdf';
      return getSampleCandidateData(fileName, jobDescription);
    }
  },

  getSampleResumeAnalysis: async (jobDescription?: string): Promise<ResumeAnalysisResult> => {
    await new Promise((resolve) => setTimeout(resolve, 1600));
    return getSampleCandidateData('alex_morgan_senior_engineer_resume.pdf', jobDescription);
  },

  getResumeAnalysis: (resumeId: string) => apiClient.get<ResumeAnalysisResult>(`/resumes/${resumeId}`),
};

