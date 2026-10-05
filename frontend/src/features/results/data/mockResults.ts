import type { InterviewResult, RoleSpecificMetric, GeneralPerformanceMetrics } from '../types/results';

export const mockGeneralPerformance: GeneralPerformanceMetrics = {
  answerCorrectness: 82,
  communication: 88,
  clarity: 84,
  deliveryConfidence: 71,
  problemSolving: 79,
};

export const defaultSoftwareEngineerMetrics: RoleSpecificMetric[] = [
  { name: 'System Design', score: 85 },
  { name: 'Data Structures & Algorithms', score: 78 },
  { name: 'Backend Architecture', score: 84 },
  { name: 'Database Design', score: 80 },
  { name: 'API Design', score: 88 },
  { name: 'Scalability', score: 76 },
];

export function getRoleMetricsForRole(roleTitle?: string): RoleSpecificMetric[] {
  if (!roleTitle) return defaultSoftwareEngineerMetrics;
  const lower = roleTitle.toLowerCase();

  if (lower.includes('full stack')) {
    return [
      { name: 'System Design', score: 82 },
      { name: 'Frontend Performance', score: 86 },
      { name: 'API Architecture & REST', score: 88 },
      { name: 'Database & ORM', score: 80 },
      { name: 'State Management', score: 84 },
      { name: 'Security & Auth', score: 78 },
    ];
  }

  if (lower.includes('architect') || lower.includes('backend')) {
    return [
      { name: 'Distributed Systems', score: 88 },
      { name: 'Concurrency Primitives', score: 72 },
      { name: 'Event-Driven Architecture', score: 84 },
      { name: 'Fault Tolerance', score: 80 },
      { name: 'Database Internals', score: 78 },
      { name: 'High Availability', score: 86 },
    ];
  }

  if (lower.includes('behavioral') || lower.includes('leadership')) {
    return [
      { name: 'Stakeholder Alignment', score: 84 },
      { name: 'Strategic Problem Solving', score: 88 },
      { name: 'Conflict Resolution', score: 82 },
      { name: 'Execution & Delivery', score: 86 },
      { name: 'Team Mentorship', score: 80 },
      { name: 'Operational Maturity', score: 78 },
    ];
  }

  return defaultSoftwareEngineerMetrics;
}

export const mockInterviewResult: InterviewResult = {
  interviewId: 'int-2026-0918-78a',
  roleTitle: 'Senior Software Engineer',
  experienceLevel: 'Mid-Senior Level',
  completedAt: 'September 18, 2026',
  overallScore: 78,
  totalPossibleScore: 100,
  aiSummary:
    'Your strongest performance was in communication and backend fundamentals. Your main development areas are system-design depth and concurrency reasoning.',
  transcript: [
    { id: 't1', speaker: 'IRA', text: 'Welcome Alex. Let us start by discussing how you architect distributed in-memory cache systems.', timestamp: '00:12' },
    { id: 't2', speaker: 'CANDIDATE', text: 'In my previous role, we implemented LRU eviction with Redis cluster nodes and write-through caching to maintain data consistency.', timestamp: '01:05' },
    { id: 't3', speaker: 'IRA', text: 'How did you handle idempotency keys in payment processing workflows?', timestamp: '05:40' },
    { id: 't4', speaker: 'CANDIDATE', text: 'We generated unique UUID v4 idempotency keys per transaction request and enforced database unique constraints with transactional outbox patterns.', timestamp: '06:15' },
  ],
  roleSpecificMetrics: defaultSoftwareEngineerMetrics,
  generalPerformance: mockGeneralPerformance,
  metrics: [
    {
      name: 'Answer Correctness',
      score: 82,
      definition: 'Factual accuracy, domain correctness, and precise technical statements in responses.',
    },
    {
      name: 'Technical Depth',
      score: 74,
      definition: 'Depth of domain knowledge, understanding of underlying runtime mechanics, and trade-off awareness.',
    },
    {
      name: 'Problem Solving',
      score: 79,
      definition: 'Analytical approach, structured breakdown of ambiguous requirements, and solution optimization.',
    },
    {
      name: 'Communication',
      score: 88,
      definition: 'Clarity of explanation, structured response framework (STAR/PREP), and logical flow.',
    },
    {
      name: 'Delivery Confidence',
      score: 71,
      definition: 'Observable interview delivery characteristics (vocal fluency, pace, structural articulation) during live responses.',
    },
    {
      name: 'Clarity',
      score: 84,
      definition: 'Conciseness, effective use of precise terminology, and avoidance of unnecessary filler.',
    },
  ],
  strongDomains: [
    {
      domain: 'Backend Fundamentals & API Design',
      explanation: 'Demonstrated clear mastery of RESTful contract design, HTTP status sematics, and idempotency guarantees.',
      evidence: 'Articulated idempotent retry strategies using UUID request headers and transactional DB outboxes in Q02.',
    },
    {
      domain: 'Communication & Structural Expression',
      explanation: 'Exhibited exceptional clarity and structured problem decomposition throughout technical explanations.',
      evidence: 'Consistently structured responses with high-level summaries before drilling into implementation specifics.',
    },
  ],
  focusAreas: [
    {
      domain: 'Distributed System Design & Scalability',
      level: 'Focus Area',
      explanation: 'Would benefit from deeper elaboration on cache stampede mitigation and horizontal partition strategies.',
      evidence: 'In Q04, solution relied on basic Redis expiration without considering distributed locking or probabilistic early expiration.',
    },
    {
      domain: 'Concurrency & Race Condition Handling',
      level: 'Needs Development',
      explanation: 'Requires stronger precision when explaining multi-threaded synchronization primitives and deadlocks.',
      evidence: 'In Q07, mutex lock granularity was described loosely, omitting optimistic concurrency control alternatives.',
    },
  ],
  questionEvaluations: [
    {
      id: 'q1',
      number: 1,
      title: 'Architecting a Distributed In-Memory Cache System',
      category: 'System Design',
      score: 82,
      status: 'Strong',
      shortFeedback: 'Solid explanation of cache invalidation strategies and eviction policies.',
      metricScores: {
        'Answer Correctness': 85,
        'Technical Depth': 78,
        'Problem Solving': 80,
        'Communication': 90,
        'Delivery Confidence': 74,
        'Clarity': 86,
      },
      evaluatorFeedback:
        'You clearly outlined LRU eviction and write-through caching. To elevate this response to staff level, detail cache stampede prevention (mutex vs probabilistic early expiration).',
    },
    {
      id: 'q2',
      number: 2,
      title: 'Ensuring API Idempotency in Payment Processing',
      category: 'Backend Architecture',
      score: 88,
      status: 'Strong',
      shortFeedback: 'Excellent analysis of idempotency keys, DB transactions, and deduplication logic.',
      metricScores: {
        'Answer Correctness': 90,
        'Technical Depth': 84,
        'Problem Solving': 88,
        'Communication': 92,
        'Delivery Confidence': 85,
        'Clarity': 89,
      },
      evaluatorFeedback:
        'Comprehensive answer covering client-side idempotency keys, unique index constraints, and atomic database state transitions.',
    },
    {
      id: 'q3',
      number: 3,
      title: 'Database Indexing Strategies for High-Throughput Queries',
      category: 'Database Systems',
      score: 76,
      status: 'Meets Expectations',
      shortFeedback: 'Good overview of B-Tree vs Hash indexes; light on composite index column ordering rules.',
      metricScores: {
        'Answer Correctness': 80,
        'Technical Depth': 70,
        'Problem Solving': 75,
        'Communication': 84,
        'Delivery Confidence': 70,
        'Clarity': 80,
      },
      evaluatorFeedback:
        'Covered basic index mechanics well. Be explicit about left-most prefix rule in composite indexes and covering index optimization to prevent table heap lookups.',
    },
    {
      id: 'q4',
      number: 4,
      title: 'Designing a Rate Limiter Service for Multi-Tenant APIs',
      category: 'System Design',
      score: 71,
      status: 'Needs Focus',
      shortFeedback: 'Identified Token Bucket algorithm, but struggled with distributed Redis cluster synchronization.',
      metricScores: {
        'Answer Correctness': 72,
        'Technical Depth': 65,
        'Problem Solving': 70,
        'Communication': 80,
        'Delivery Confidence': 65,
        'Clarity': 75,
      },
      evaluatorFeedback:
        'Token bucket theory was accurate. However, handling clock drift across Redis nodes and handling network partitions required deeper technical detail.',
    },
    {
      id: 'q5',
      number: 5,
      title: 'Handling Async Task Queues with Retry Backoff',
      category: 'Distributed Systems',
      score: 84,
      status: 'Strong',
      shortFeedback: 'Clear breakdown of exponential backoff, jitter, and dead-letter queues.',
      metricScores: {
        'Answer Correctness': 86,
        'Technical Depth': 82,
        'Problem Solving': 84,
        'Communication': 89,
        'Delivery Confidence': 78,
        'Clarity': 85,
      },
      evaluatorFeedback:
        'Strong understanding of message durability, poison pill message handling, and adding randomized jitter to avoid thundering herd failures.',
    },
    {
      id: 'q6',
      number: 6,
      title: 'Microservices Communication: gRPC vs REST vs Event-Driven',
      category: 'Architecture',
      score: 80,
      status: 'Strong',
      shortFeedback: 'Thoughtful trade-off comparison between synchronous HTTP/2 and async message brokers.',
      metricScores: {
        'Answer Correctness': 83,
        'Technical Depth': 78,
        'Problem Solving': 80,
        'Communication': 87,
        'Delivery Confidence': 75,
        'Clarity': 82,
      },
      evaluatorFeedback:
        'Well-balanced view on binary protobuf serialization efficiency versus HTTP REST developer ergonomics. Good distinction between orchestration and choreography.',
    },
    {
      id: 'q7',
      number: 7,
      title: 'Debugging Concurrency & Race Conditions in Distributed State',
      category: 'Concurrency',
      score: 68,
      status: 'Needs Focus',
      shortFeedback: 'Correctly identified state corruption risk; missed optimistic locking vs pessimistic locking nuances.',
      metricScores: {
        'Answer Correctness': 70,
        'Technical Depth': 62,
        'Problem Solving': 68,
        'Communication': 78,
        'Delivery Confidence': 60,
        'Clarity': 72,
      },
      evaluatorFeedback:
        'You correctly flagged shared state mutability. To improve, discuss database version field checks (optimistic locking) and compare against Redis distributed locks (Redlock).',
    },
    {
      id: 'q8',
      number: 8,
      title: 'Handling Production Incidents Under High Load',
      category: 'Behavioral & Operational',
      score: 86,
      status: 'Strong',
      shortFeedback: 'Calm, structured incident response methodology using metrics, triage, and rollback.',
      metricScores: {
        'Answer Correctness': 88,
        'Technical Depth': 80,
        'Problem Solving': 86,
        'Communication': 92,
        'Delivery Confidence': 82,
        'Clarity': 88,
      },
      evaluatorFeedback:
        'Demonstrated strong engineering maturity. Emphasized mitigation (circuit breakers, load shedding) before root-cause analysis.',
    },
    {
      id: 'q9',
      number: 9,
      title: 'Security Practices for Cloud Application Deployment',
      category: 'Security & DevOps',
      score: 79,
      status: 'Meets Expectations',
      shortFeedback: 'Good mention of TLS, secret managers, and zero-trust; missed mTLS between internal microservices.',
      metricScores: {
        'Answer Correctness': 82,
        'Technical Depth': 72,
        'Problem Solving': 78,
        'Communication': 86,
        'Delivery Confidence': 73,
        'Clarity': 83,
      },
      evaluatorFeedback:
        'Solid baseline security answers. Expand on automated static analysis (SAST/DAST) in CI/CD pipelines and mutual TLS in service meshes.',
    },
    {
      id: 'q10',
      number: 10,
      title: 'Optimizing Frontend API Payload Hydration & Performance',
      category: 'Full Stack Performance',
      score: 81,
      status: 'Strong',
      shortFeedback: 'Effective strategy on GraphQL field masking, pagination, and client-side caching.',
      metricScores: {
        'Answer Correctness': 83,
        'Technical Depth': 76,
        'Problem Solving': 81,
        'Communication': 88,
        'Delivery Confidence': 76,
        'Clarity': 84,
      },
      evaluatorFeedback:
        'Good response covering network waterfall reduction, CDN caching headers, and incremental static generation payload patterns.',
    },
  ],
  preparationFocus: [
    {
      category: 'SYSTEM DESIGN',
      leadInText: 'Your responses would benefit from deeper understanding of:',
      bulletPoints: [
        'scalability patterns',
        'caching strategies (invalidation, stampede prevention)',
        'load balancing & dynamic routing',
        'failure handling & circuit breakers',
        'architectural trade-offs under heavy load',
      ],
    },
    {
      category: 'CONCURRENCY',
      leadInText: 'Focus on:',
      bulletPoints: [
        'synchronization primitives & atomic operations',
        'race condition detection & prevention',
        'pessimistic vs optimistic locking models',
        'deadlock resolution & lock ordering rules',
        'distributed state consistency guarantees',
      ],
    },
  ],
};
