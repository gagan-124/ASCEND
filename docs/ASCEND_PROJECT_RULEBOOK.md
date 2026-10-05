# ASCEND — Master Project Rulebook v1.0 🔒

> **MASTER SOURCE OF TRUTH FOR ASCEND**
> All Antigravity agents working on the ASCEND project MUST read and strictly adhere to this rulebook BEFORE inspecting or modifying code.

---

## 1. Project Identity and Goals

ASCEND is a professional, AI-powered interview practice and career coaching platform.

### Core User Journey Flow
```text
OPENING ANIMATION
       ↓
  LANDING PAGE
       ↓
 AUTHENTICATION
       ↓
INTERVIEW SETUP  ───►  [ Resume Screening | Role Screening ]
       ↓
 INTERVIEW ROOM  ───►  [ Voice-based AI Interviewer + Media Signals ]
       ↓
    RESULTS      ───►  [ Single-interview Deep Performance Report ]
       ↓
   DASHBOARD     ───►  [ Cross-interview Progress & Tech News ]
```

### Supported Products
1. **Resume Screening Interviews**: Deep dive into actual resume claims, projects, technology choices, trade-offs, and architecture.
2. **Role Screening Interviews**: Adaptive progression from core fundamentals to medium/hard problem solving and scenarios.

### Core Product Directives
- Voice-based real-time interview experience with an AI interviewer.
- Mandatory camera and microphone streaming & signal processing.
- Dynamic adaptive question difficulty based on live response analysis.
- Live evaluation controls interview flow; deep evaluation produces authoritative final scoring.
- Professional, premium, technical aesthetic (NOT generic AI dashboard or "vibe-coded").

---

## 2. Non-Negotiable Engineering Principles

1. **Correctness → Simplicity → Maintainability → Security → Performance → UX**.
2. **Brutal Technical Honesty**: Reject over-engineering, premature abstractions, silent assumptions, and bad user ideas with clean technical alternatives.
3. **No Superficial Symptom Patches**: Always locate and fix root causes rather than masking symptoms or commenting out tests.
4. **Authoritative Server Control**: The backend owns business rules, state persistence, authorization, session lifecycles, and cheating verdicts. Never trust client claims.
5. **No AI Clichés**: Avoid neon glows, generic purple gradients, random glassmorphism, 3D avatars, and template UI cards.

---

## 3. Repository Structure and Ownership

```text
ascend/
├── frontend/             # React, Vite, TypeScript, Tailwind, Zustand, TanStack Query
├── backend/              # FastAPI, Python 3.12+, Supabase integration, AI Orchestration
├── docs/                 # Authoritative project documentation & rulebook
├── .github/              # CI/CD workflows and automation
├── .gitignore            # Git exclusion rules
├── README.md             # Project overview
└── LICENSE               # MIT License
```

### Absolute Ownership Boundaries
- **FRONTEND-ONLY (`frontend/`)**: React, TypeScript, Vite, Tailwind CSS, components, pages, browser state (Zustand), TanStack Query, browser media API, frontend services.
- **BACKEND-ONLY (`backend/`)**: FastAPI, Python, server business logic, AI provider orchestration, authorization checks, database persistence, worker jobs.
- **DOCUMENTATION (`docs/`)**: Architecture diagrams, decision records, and `ASCEND_PROJECT_RULEBOOK.md`.
- **CI/CD (`.github/`)**: Workflows, linting, build pipelines.

**RULE**: Never put frontend code in `backend/`. Never put backend code in `frontend/`. Never put secrets in `frontend/`.

---

## 4. Frontend Architecture Rules

The frontend uses a **feature-oriented architecture** with a bounded shared layer.

```text
frontend/
├── public/
├── src/
│   ├── app/              # Router, providers, root App initialization
│   ├── assets/           # Static icons, branding assets, illustrations
│   ├── components/       # Shared presentation primitives ONLY
│   │   ├── ui/           # Button, Input, Card, Dialog, Badge, Tooltip
│   │   ├── branding/     # AscendLogo, OpeningAnimation
│   │   ├── navigation/   # Navbar, Sidebar, MobileNav
│   │   └── feedback/     # Loading, ErrorState, EmptyState, Toast
│   ├── features/         # Bounded product capabilities
│   │   ├── auth/         # Login/signup logic, user session
│   │   ├── interview/    # AIInterviewer, QuestionPanel, AnswerArea, VoiceIndicator
│   │   ├── resume/       # ResumeUploader, ResumeAnalysis, RoleRecommendations
│   │   ├── integrity/    # IntegrityIndicator, integrity signals
│   │   ├── evaluation/   # CompetencyBreakdown, ReadinessScore, EvidenceTimeline
│   │   ├── dashboard/    # MetricCard, PerformanceChart, ProgressSummary
│   │   └── news/         # Personalized tech/AI news feed
│   ├── layouts/          # Shell layouts (PublicLayout, AuthLayout, InterviewLayout, DashboardLayout)
│   ├── pages/            # Route containers (Opening, Landing, Auth, InterviewSetup, InterviewRoom, Results, Dashboard)
│   ├── hooks/            # Global reusable utility hooks
│   ├── stores/           # Zustand client-side global stores
│   ├── services/         # External communication (api/, realtime/, media/)
│   ├── types/            # Pure TypeScript domain interfaces
│   ├── schemas/          # Zod validation schemas
│   ├── config/           # Environment variables & constants
│   ├── lib/              # Utilities (cn, queryClient)
│   └── styles/           # CSS theme tokens and keyframes
└── tests/                # Unit, integration, and E2E tests
```

### Feature Boundary Rule
If a component is specific to a feature (e.g., `AIInterviewer` or `VoiceIndicator`), it MUST sit inside `features/interview/components/`, NEVER inside shared `components/`.

---

## 5. Backend Architecture Rules

The FastAPI backend must maintain strict separation between layers:
- `app/api/`: Route handlers and endpoint controllers.
- `app/schemas/`: Pydantic request/response schemas.
- `app/models/`: Database ORM/table models.
- `app/services/`: Core application services and business logic.
- `app/repositories/`: Data access abstraction for Supabase/PostgreSQL.
- `app/ai/`: Gemini AI provider orchestration, prompt templates, and output parsers.
- `app/core/`: Configuration, security, JWT handling, logging.
- `app/workers/`: Background evaluation or cleanup tasks.

---

## 6. Database and Supabase Rules

- **Platform**: Supabase / PostgreSQL.
- **Access Pattern**: All database queries from backend must pass through repositories.
- **Row Level Security (RLS)**: Enforce RLS on all tables in Supabase.
- **Migrations**: Database schema changes must be versioned with SQL migration scripts. Never mutate production databases manually.
- **Client Access**: Browser code NEVER communicates directly with Supabase using privileged keys. Service role keys stay on backend.

---

## 7. API and Cross-Stack Contracts

- **Protocol**: REST over HTTPS for standard CRUD; WebSockets for real-time voice & session signals.
- **HTTP Client**: Use **native `fetch`** on frontend (`src/services/api/client.ts`). Do NOT introduce Axios.
- **Contract Synchronization**: Frontend `src/types/` and `src/schemas/` must strictly match FastAPI Pydantic schemas.
- **Error Responses**: All API errors must return structured JSON: `{ "status": number, "message": string, "code": string, "details": any }`.

---

## 8. AI/Gemini Architecture

- **Initial Provider**: Google Gemini (`google-genai` / `@google/genai`).
- **Provider Abstraction**: All AI interactions must hide behind an `AIProvider` interface (e.g., `generateQuestion()`, `evaluateAnswer()`, `analyzeResume()`) to allow future provider replacements.
- **Prompt Discipline**: Keep system instructions deterministic and versioned in `app/ai/prompts/`.
- **Parsing**: Require structured JSON output from Gemini models with Pydantic validation on response.

---

## 9. Interview Lifecycle

```text
[Candidate Configures] ──► SETUP ──► READY ──► QUESTION ──► LISTENING ──► EVALUATING
                                                  ▲           │            │
                                                  │           ▼            │
                                                  └── FOLLOW_UP / NEXT ◄───┘
                                                             │
                                                             ▼
                                                         COMPLETE
```

---

## 10. Interview State Machine

The explicit state transitions are:
`SETUP` → `READY` → `QUESTION` → `LISTENING` → `EVALUATING` → `FOLLOW_UP` / `NEXT_QUESTION` → `COMPLETE`.

### Exceptional States
- `PAUSED`: Interview manually or system paused.
- `RECONNECTING`: Temporary WebSocket or WebRTC disruption.
- `SILENCE_WARNING`: Final 10 seconds of candidate response window.
- `TERMINATED`: Aborted due to critical integrity failure or user exit.
- `INVALID_CHEATING`: Session flagged and closed due to confirmed violation.
- `SESSION_EXPIRED`: Timeout expired without candidate input.

---

## 11. Adaptive Questioning

- Question selection is contextual based on:
  1. Candidate's previous answers & demonstrated technical depth.
  2. Strengths and weaknesses identified during live evaluation.
  3. Already covered topic nodes.
  4. Current difficulty curve (fundamentals → medium → hard).
- **Probes**: A "probe" is a targeted follow-up question digging into a specific claim or concept (e.g., *"Why PostgreSQL over MongoDB for this specific transaction boundary?"*).

---

## 12. Resume Screening Interview

1. Candidate uploads resume (PDF/Docx).
2. Backend parses resume and extracts technologies, projects, roles, and experience.
3. System generates role recommendations with match reasoning.
4. Candidate confirms target role.
5. AI Interviewer executes a deep claim-verification interview investigating actual projects, architecture, trade-offs, alternatives, scalability, and benchmarks.

---

## 13. Role Screening Interview

1. Begins with core domain fundamentals.
2. If candidate demonstrates competence: progresses smoothly to medium difficulty → hard technical challenges → system design & scenarios.
3. If candidate struggles with fundamentals: remains focused on fundamental concepts with targeted coaching questions.

---

## 14. Live Evaluation

- **Purpose**: Controls interview flow in real-time (determines whether to probe, pivot topic, increase difficulty, or transition).
- **Output**: Correctness score, relevance flag, concept coverage, probe trigger.
- **Rule**: Live numerical scores are strictly hidden from the candidate during the interview.

---

## 15. Final Evaluation

Executed asynchronously post-interview. Generates an authoritative evaluation report covering:
- Technical Depth & Correctness
- Communication Clarity
- Problem-Solving & Architecture
- Role Knowledge & Consistency
- Confidence & Presentation (observable behavioral traits ONLY)
- Overall Score & Readiness Index
- Actionable Strengths & Weaknesses
- Specific Topics to Revisit with Evidence Timelines

---

## 16. Scoring and Readiness

- **Overall Score**: Weighted aggregate of technical correctness, communication, and problem-solving depth (0–100).
- **Readiness Score**: Role-benchmarked probability rating indicating candidate's readiness for target role interviews.

---

## 17. Integrity / Anti-Cheating System

Anti-cheating uses multi-signal detection. It measures anomalies, not definitive intent.

| Level | Severity | Triggers | Action |
|---|---|---|---|
| **Level 0** | Normal | Expected behavior | Record normal state |
| **Level 1** | Informational | Brief tab blur, brief gaze away, single fullscreen exit | Log event quietly |
| **Level 2** | Suspicious | Repeated tab switching, prolonged gaze away, copy/paste | Log risk signal, increase monitoring |
| **Level 3** | Critical | Sustained second speaker, persistent absent face, multiple faces | Terminate session with clear message |

**Rule**: Never insult, harass, or humiliate candidate. Single weak signals must NEVER trigger immediate termination.

---

## 18. Camera and Microphone Behavior

- Media devices (camera & microphone) are mandatory prerequisites.
- System must explicitly distinguish **candidate silence** from **hardware/browser media failure**.
- If camera or microphone disconnects mid-interview, transition state to `PAUSED` or `RECONNECTING` and prompt user to re-enable device.

---

## 19. Media and Privacy

- **No Continuous Raw Video Uploads**: Do not stream raw HD video to backend by default. Perform browser-side signal extraction (e.g. face mesh / audio level detection) and send derived event signals.
- **Stored Data**: Transcripts, timestamps, question audio/text, evaluation scores, and integrity signal logs.

---

## 20. Network Failure and Recovery

- **Transient Disruption**: Automatically attempt WebSocket/media reconnection (`RECONNECTING` state).
- **Page Refresh**: Session state must be recoverable from backend using `sessionId`.
- **Unrecoverable Failure**: Gracefully save current valid progress, transition to `TERMINATED`, and provide clear explanation to candidate.

---

## 21. Authentication and Authorization

- JWT-based authentication issued by FastAPI / Supabase Auth.
- Tokens stored securely in localStorage (`ascend_auth_token`) and passed via `Authorization: Bearer <token>` headers.
- All backend routes verify user ownership of session resources.

---

## 22. Data Persistence

- Persistent entities: Users, Resumes, Role Profiles, Interview Sessions, Questions, Answers, Transcripts, Integrity Signals, Evaluation Reports.
- Client state in Zustand is transient; authoritative data persists in Supabase via backend APIs.

---

## 23. UI/UX Design System

### ASCEND Core Palette
```text
ASCEND IVORY   #F8F0E5   (Warm light background)
ASCEND BEIGE   #EADBC8   (Subtle container background)
ASCEND SAND    #DAC0A3   (Warm accent & highlights)
ASCEND NAVY    #102C57   (Deep primary brand & dark mode background)
```

### Typography
- **Primary Body & UI**: `Satoshi` (80–90% usage).
- **Display & Accent**: `Stardom` (10–20% usage for major headings and logo).

---

## 24. Accessibility

- Semantic HTML5 structure throughout (`<main>`, `<nav>`, `<header>`, `<section>`, `<article>`).
- Full keyboard navigation support and focus rings.
- ARIA live regions for realtime transcript and voice status alerts.
- WCAG AA color contrast compliance across light and dark themes.

---

## 25. Responsive Design

- Mobile-first responsive layouts using Tailwind CSS breakpoints (`sm:`, `md:`, `lg:`, `xl:`).
- Dedicated `MobileNavigation` and full-screen tailored layouts for `InterviewRoom`.

---

## 26. Performance

- Route code splitting with React `lazy()` and `Suspense`.
- Debounced resize, scroll, and media signal listeners.
- Media stream optimizations to prevent memory leaks and thread lag.

---

## 27. Dependency Management

- Use **native `fetch`** for HTTP calls.
- State: Zustand (client), TanStack Query (server).
- Forms & Validation: React Hook Form + Zod.
- Styling & Motion: Tailwind CSS, Framer Motion, Lucide icons.
- Charts: Recharts.
- **Rule**: Evaluate dependencies before adding. No duplicate HTTP or utility libraries.

---

## 28. Testing

- **Unit**: Vitest / React Testing Library for isolated components, hooks, and helpers.
- **Integration**: Feature boundary and API service integration tests.
- **E2E**: Playwright for critical user journeys (Auth, Setup, Interview Room, Results, Dashboard).

---

## 29. Debugging Protocol for Antigravity Agents

Before making code edits:
1. Inspect authoritative source files and types.
2. Read full untruncated error logs.
3. Identify stack layer (frontend vs backend).
4. Establish root cause before mutating code.
5. Implement minimal clean architectural fix.
6. Run build/typecheck and verify in browser.

---

## 30. Git and Commit Discipline

- Conventional commit format (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`).
- Small, focused atomic commits. Never commit `.env`, secrets, or build artifacts.

---

## 31. Environment Variables and Secrets

- Managed via `.env` files with `.env.example` templates.
- Secret keys (`SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `TAVILY_API_KEY`) MUST remain on backend.

---

## 32. Deployment

- Frontend: Vercel / Netlify static build deployment.
- Backend: Containerized FastAPI server on Railway / Render / AWS.
- Database: Supabase Cloud.

---

## 33. Security

- Input validation via Zod (frontend) and Pydantic (backend).
- Content Security Policy (CSP), CORS restriction, rate limiting on FastAPI endpoints.

---

## 34. Error Handling

- Global React Error Boundaries.
- Structured API error handling via `ApiError` class in `services/api/client.ts`.
- Clear, user-friendly error fallback views (`components/feedback/ErrorState`).

---

## 35. Definition of Done

A task is COMPLETE only when:
- Correct stack owns the code (frontend vs backend separation).
- Code passes type checking (`npx tsc --noEmit` / Pyright).
- Build succeeds cleanly.
- Error, loading, and edge states are handled.
- No secrets exposed.
- Browser/runtime verification performed.

---

## 36. Antigravity Agent Operating Protocol

1. Read `docs/ASCEND_PROJECT_RULEBOOK.md` before making architectural changes.
2. Respect stack ownership boundaries strictly.
3. Apply brutal technical honesty when evaluating requirements or user suggestions.
4. Verify changes with actual build/typecheck commands before claiming completion.

---

## 37. Forbidden Agent Behaviors

Antigravity agents MUST NOT:
- Put frontend code inside `backend/` or backend code inside `frontend/`.
- Introduce Axios or extra HTTP libraries.
- Expose Gemini or Supabase service keys to frontend.
- Silently invent new folder structures outside the feature-first specification.
- Expose live evaluation scores to candidates.
- Treat a single anti-cheating anomaly as proof of cheating.
- Implement premature mock UI or generic "vibe-coded" pages.
