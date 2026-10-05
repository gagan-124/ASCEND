import type { DashboardData } from '../types/dashboard';

export const mockDashboardData: DashboardData = {
  userName: 'Alex',
  summary: {
    totalInterviews: 6,
    overallReadiness: 78,
    latestRoleTitle: 'Senior Software Engineer',
    latestScore: 78,
    latestDate: 'Sep 18, 2026',
    activeFocusAreasCount: 3,
    topFocusDomain: 'System Design & Scalability',
  },
  recentInterviews: [
    {
      id: 'int-2026-0918-78a',
      roleTitle: 'Senior Software Engineer',
      interviewType: 'Technical / System Design',
      dateFormatted: 'Sep 18, 2026',
      durationFormatted: '32 min',
      score: 78,
      totalPossibleScore: 100,
    },
    {
      id: 'int-2026-0914-84b',
      roleTitle: 'Full Stack Engineer',
      interviewType: 'API Architecture & REST',
      dateFormatted: 'Sep 14, 2026',
      durationFormatted: '28 min',
      score: 84,
      totalPossibleScore: 100,
    },
    {
      id: 'int-2026-0909-72c',
      roleTitle: 'Backend Architect',
      interviewType: 'Distributed Systems',
      dateFormatted: 'Sep 09, 2026',
      durationFormatted: '40 min',
      score: 72,
      totalPossibleScore: 100,
    },
    {
      id: 'int-2026-0902-81d',
      roleTitle: 'Senior Software Engineer',
      interviewType: 'Behavioral & Leadership',
      dateFormatted: 'Sep 02, 2026',
      durationFormatted: '25 min',
      score: 81,
      totalPossibleScore: 100,
    },
  ],
  strongDomains: [
    'Backend Fundamentals & API Design',
    'Communication & Structural Expression',
    'Problem Solving & Technical Analysis',
  ],
  focusAreas: [
    'Distributed System Design & Scalability',
    'Concurrency & Race Conditions',
    'Delivery Confidence',
  ],
  preparationTopics: [
    {
      id: 'prep-sys',
      title: 'SYSTEM DESIGN',
      description: 'Practice designing scalable services and explaining trade-offs.',
      concepts: [
        'scalability patterns',
        'caching strategies (invalidation, stampede)',
        'load balancing & dynamic routing',
        'failure handling & circuit breakers',
      ],
    },
    {
      id: 'prep-tech',
      title: 'TECHNICAL DEPTH',
      description: 'Strengthen database internals and architecture explanations.',
      concepts: [
        'database index structures & covering indexes',
        'concurrency primitives & atomic locks',
        'memory models & garbage collection',
      ],
    },
    {
      id: 'prep-comm',
      title: 'COMMUNICATION',
      description: 'Practice structuring technical answers more clearly.',
      concepts: [
        'structuring technical answers (PREP framework)',
        'summarizing high-level before implementation details',
        'deliberate pacing and vocal clarity',
      ],
    },
  ],
};

export const emptyDashboardData: DashboardData = {
  userName: 'Candidate',
  summary: {
    totalInterviews: 0,
    overallReadiness: 0,
    latestRoleTitle: 'None yet',
    latestScore: 0,
    latestDate: '—',
    activeFocusAreasCount: 1,
    topFocusDomain: 'First Practice Session',
  },
  recentInterviews: [],
  strongDomains: [],
  focusAreas: ['Complete baseline mock interview'],
  preparationTopics: [
    {
      id: 'prep-init',
      title: 'INITIAL PRACTICE',
      description: 'Complete your first practice interview to establish your telemetry.',
      concepts: [
        'select target role & experience level',
        'verify camera & microphone streams in pre-flight',
        'complete baseline questions with AI interviewer',
      ],
    },
  ],
};
