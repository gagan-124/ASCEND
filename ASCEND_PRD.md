<!-- ASCEND Backend PRD v2.0. Canonical Markdown source. Converted from ASCEND_Backend_PRD_Final_v2.docx; review any layout-sensitive tables before editing. -->

ASCEND

# Backend Product Requirements Document

Final Agent-Oriented Specification • Version 2.0 • 10 October 2026

Derived from the backend progress report and a read-only review of frontend workflow files available on the GitHub main branch.

## 0. How Agents Must Use This Document

This is the implementation contract for backend work. Agents must treat repository code and migrations as the source of truth for exact schema names and existing behavior. This document defines required behavior, not permission to guess missing schema or silently change product flow.

- Before editing, inspect the current branch, working tree, migrations, generated Supabase types, frontend call sites, Edge Functions, and tests.

- Work in small, reviewable phases. Produce a plan and list affected files before implementation; implement only the approved phase.

- Never invent database tables, columns, status values, function names, or API endpoints. Search migrations and types first; if a required contract is missing, propose it explicitly.

- Do not add mock/fallback interview data to an authenticated production path. Mock fixtures must be isolated to tests/demo mode and visibly labelled.

- Do not use localStorage or sessionStorage as the source of truth for private interview records, scores, or answer persistence. They may be used for non-sensitive UX state or retry drafts with clear rules.

- Do not commit, push, deploy, or modify production Supabase unless explicitly authorized. Local tests and local migrations are the default.

- Do not expose service-role keys or Gemini keys in client code, logs, prompts, test artifacts, or Git.

- Never claim browser, provider, production, or end-to-end verification from unit tests alone.

- After each phase, report exact files changed, migration changes, commands run, results, known gaps, and whether the working tree remains uncommitted.

## 1. Executive Summary

ASCEND's frontend workflow supports role-based and resume-based interview setup, role/difficulty configuration, a live voice interview room, question-by-question interaction, session termination, and a rich results page with an overall score, AI summary, performance dimensions, role-specific metrics, question breakdown, transcript, and preparation recommendations. The backend must make this experience secure, durable, and honest.

A review of the GitHub main branch exposed critical mismatches between the intended product experience and the current data path: the interview API can create fixed sample questions directly in Supabase; errors can fall back to a mock in-memory session; the generic API client uses a separately stored token; results are cached in localStorage and use mock fallbacks; and results persistence references tables/fields that have not been verified against migrations. These are not small implementation details: they can make the UI appear successful when no authoritative backend record exists.

Target principle: one canonical, authenticated, server-authoritative workflow from setup to interview creation, question generation, answer persistence, completion, evaluation, and historical results.

## 2. Repository Review Scope and Evidence Boundary

| Item | Finding / boundary |
| --- | --- |
| Repository reviewed | gagan-124/ASCEND, GitHub main branch files available to the connected GitHub integration. |
| Files reviewed | frontend/src/services/api/interviews.ts; frontend/src/stores/interviewStore.ts; frontend/src/pages/InterviewRoom/index.tsx; frontend/src/features/results/data/results.ts; frontend/src/pages/Results/index.tsx; frontend/src/pages/InterviewSetup/index.tsx; frontend/src/types/interview.ts; frontend/src/types/question.ts; frontend/src/services/api/client.ts; frontend/src/stores/authStore.ts; backend/supabase/config.toml; backend/supabase/tests/test_authorization.sql; frontend/package.json. |
| Branch limitation | The project feature branch `feat/interview-generation-flow` was not found on GitHub when fetched by ref. This review therefore reflects the accessible main branch, not the latest local unpushed working tree. |
| Known local test evidence | The previously reported local database authorization suite passed 42/42 assertions, and the local security-hardening migration was applied locally. |
| Not verified here | Exact current local diffs, complete route table, production database schema/state, live deployed Edge Function source/configuration, provider quota behavior, browser end-to-end behavior. |
| Agent requirement | Reconcile this PRD with the actual checked-out branch and all migrations before writing code; do not assume main-branch findings exactly match the local feature branch. |

## 3. Product Workflow — Canonical End-to-End Journey

| Step | Frontend workflow observed / expected | Backend responsibility |
| --- | --- | --- |
| 1. Authentication | User signs in through Supabase Auth; authenticated profile/session is available. | Validate JWT identity on protected operations; enforce ownership in RLS and server functions. |
| 2. Choose interview mode | Setup page chooses `role` or `resume`; mode is reflected in URL query parameter. | Accept only supported mode values; validate required fields for that mode. |
| 3. Role path | User chooses field, proceeds to roles, confirms a role, and then selects difficulty/configuration before starting. | Persist canonical role, difficulty, experience level, focus area, and any supported job-description metadata; reject incomplete configuration. |
| 4. Resume path | Resume flow supplies resume ID/file name, parsed resume/candidate intelligence, job description, experience level, focus area, and optional role title. | Validate ownership of resume ID; do not trust browser-supplied parsed intelligence as authoritative unless it is verified or stored by a trusted process. |
| 5. Create session | Interview room expects a session ID and question list. | Create exactly one owned interview session; no mock session fallback in production. |
| 6. Generate/persist questions | Questions appear in stable order and drive the live interview. | Generate through server-side provider integration; validate output; persist questions with stable IDs/order before marking session ready. |
| 7. Voice interview | Room uses browser media, speech recognition/TTS, transcript panel, timer, proctoring, and next-question/end controls. | Provide authoritative session/question identifiers; accept idempotent answer writes; do not rely on in-memory state for durable answers. |
| 8. Advance/submit answer | Candidate's transcript is associated with current question; advancing moves to next question. | Persist one canonical answer or explicit revision; validate ownership and question/session relationship; respond only after persistence outcome is known. |
| 9. Terminate/cancel | Room can terminate with reasons such as page reload, tab switch, fullscreen exit, inactivity, user ended, media failure, or session expired. | Validate termination reason against allow-list and lifecycle; make transition idempotent; do not silently fabricate a terminated session on API failure. |
| 10. Complete interview | User reaches results after interview completion. | Mark submitted only through an authorized server-side transition; preserve answers if evaluation fails. |
| 11. Evaluate | Results UI expects an overall score, AI summary, performance dimensions, domain metrics, question feedback, transcript, and preparation recommendations. | Evaluate persisted answers; persist validated, versioned result data; no mock score may be presented as real. |
| 12. View/reload results | Results route loads by interview ID and displays historical content. | Return only owner-authorized persisted results and transcript; return explicit pending/failed/not-found states instead of mock substitutions. |

## 4. Current Frontend Findings That Backend Agents Must Address

| Priority | Observed pattern on GitHub main | Required correction |
| --- | --- | --- |
| P0 | `interviewsApi.createSession` attempts direct client insert into `interviews`, then inserts three hardcoded starter questions. | Production session creation and question generation must follow one authoritative backend contract. If direct client inserts remain by design, remove hardcoded question generation and prove RLS/schema correctness; preferred design is trusted Edge Function orchestration for AI generation. |
| P0 | On Supabase failure, `createSession` falls through to generic API call and then creates an in-memory mock session. | No silent mock fallback for authenticated production flow. Return typed errors and display retry/recovery UI. Isolate mock fixtures behind explicit development/test mode. |
| P0 | `getSession` falls back to an in-memory Map. | Historical/reloaded sessions must be fetched from persisted backend state. In-memory cache may optimize but never substitute for missing server data. |
| P0 | `submitAnswer` and `completeSession` call generic `/interviews/...` endpoints, while create/read use Supabase directly. | Consolidate into one documented backend/API architecture. Every operation must use the same authenticated identity/session mechanism and canonical IDs. |
| P0 | Generic API client reads `ascend_auth_token` from localStorage, while the Supabase path uses the Supabase client/auth store. | Avoid split-brain authentication. Prefer Supabase client's current session/token and a single request helper; never accept a stale separately stored token as authoritative. |
| P0 | Results are stored in localStorage and Supabase persistence errors are caught/logged without being surfaced. | Backend persistence is canonical. Local cache can be a cache only. Failed persistence must produce an explicit state, not a false success. |
| P0 | Results writer updates `interviews` with status, completed_at, overall_score, ai_summary, transcript; writes `interview_metrics` and `interview_domain_scores`. | Verify every table/column against migrations and grants. Do not assume these tables/columns exist or that browser clients may write scores. Persist evaluation via trusted server-side logic. |
| P0 | Results retrieval substitutes mock overall score, summary, metrics, role-specific metrics, per-question scores and feedback when real values are missing. | Remove silent mock substitution from real interview routes. Return evaluation status/pending/failed and render honest empty/error states. |
| P1 | Results transcript falls back to mock transcript when stored transcript is missing. | Transcript must be reconstructed from canonical persisted questions/answers or explicit transcript records; missing data must be reported, not replaced. |
| P1 | Question feedback uses `q.answer` and generic defaults; schema audit indicates candidate response may be stored elsewhere. | Resolve canonical answer field from migrations/types and use it consistently. Never infer evaluation from a mismatched field. |
| P1 | Interview timer increments in component state and does not itself prove durable elapsed time. | Persist started/submitted timestamps and derive historical duration from server data; client timer is presentation only. |
| P1 | Session store persists only active session ID in sessionStorage; questions/config/index are in memory. | On mount, rehydrate canonical session, ordered questions, persisted answers, status and timestamps from backend. |

The findings above reflect the accessible GitHub main branch. The current local feature branch may already contain changes; agents must diff it before applying fixes and avoid reintroducing older behavior.

## 5. Goals and Non-Goals

### 5.1 Goals

- Securely connect authentication, interview setup, session creation, question generation, answer submission, completion, evaluation, and historical results.

- Make the backend authoritative for ownership, lifecycle state, persisted questions/answers, evaluation status and scores.

- Guarantee idempotent retry behavior for operations that can be triggered by double-clicks, refreshes, network retries or asynchronous voice events.

- Make all failures explicit and recoverable; never replace real user data with mock data silently.

- Preserve the current role-based and resume-based setup workflows and the results page's intended information architecture.

- Keep infrastructure within free-tier constraints where possible; do not add paid services or provider dependencies without approval.

- Use migrations and tests to make changes reproducible and reviewable.

### 5.2 Non-goals

- Redesigning the completed frontend screens unless a small UI change is necessary to represent real backend states.

- Adding Deepgram or a different speech provider before browser voice lifecycle is stable.

- Payments, subscriptions, organization administration, recruiter workflows, or enterprise multi-tenancy.

- Deploying migrations/functions or changing production data without explicit approval.

## 6. Architecture and Ownership Rules

| Layer | Responsibilities | Must not do |
| --- | --- | --- |
| React/Vite frontend on Vercel | Collect configuration; request operations; show state and errors; manage browser voice/media; display persisted results. | Enforce security by itself; invent scores; silently mock failed sessions; expose service keys. |
| Supabase Auth | Identity, session refresh, sign-in provider integration. | Be bypassed by a separate stale localStorage token path. |
| PostgreSQL + RLS | Canonical persistence, row ownership, constraints, lifecycle integrity where appropriate. | Allow arbitrary client writes to server-owned scores or state fields. |
| Supabase Edge Functions | Trusted orchestration for AI provider calls, validated lifecycle transitions and evaluation writes. | Trust browser-supplied owner IDs, scores, generated status, or answer/question relationships without validation. |
| Gemini | Generate questions and/or evaluate responses through server-side calls. | Be called with secrets from the browser or treated as a database of record. |
| Tests | Verify real production logic and database policies. | Only reimplement expected logic in test doubles and claim production behavior is proven. |

Prefer the simplest coherent architecture. Do not add a separate traditional backend server unless a concrete requirement cannot be served safely within the existing Supabase architecture and the user approves the trade-off.

## 7. Functional Requirements

### AUTH — Authentication and authorization

- AUTH-01: Protected operations require a valid Supabase-authenticated identity.

- AUTH-02: Derive the user identity from the verified JWT/session, never from a client-supplied user_id.

- AUTH-03: RLS protects profile, interview, question/answer, evaluation, and storage resources wherever client access is allowed.

- AUTH-04: Cross-user reads/writes fail; tests cover SELECT, INSERT, UPDATE, DELETE, RPC/function calls and storage access as applicable.

- AUTH-05: Server-role credentials and provider API keys exist only in trusted server-side secrets.

- AUTH-06: SECURITY DEFINER functions have controlled search_path and minimal EXECUTE grants.

- AUTH-07: Expired/invalid auth returns a stable unauthorized error; frontend can refresh/re-authenticate safely.

- AUTH-08: Profile creation trigger is idempotent and does not permit users to create arbitrary profiles.

### SETUP — Configuration validation

- SETUP-01: Support the frontend's `role` and `resume` modes.

- SETUP-02: Role mode validates selected field/role, difficulty, experience level and focus area against the accepted values defined in code/schema.

- SETUP-03: Resume mode validates resume ownership and job description/configuration; untrusted parsed resume content is not treated as privileged data.

- SETUP-04: Invalid/incomplete setup returns field-level validation errors before creating an interview.

- SETUP-05: Persist the configuration required to explain and recover the interview later.

### SESSION — Interview creation and lifecycle

- SESSION-01: Create one durable interview record per logical create request.

- SESSION-02: Use an idempotency key or an equivalent constraint for retryable creation operations.

- SESSION-03: Reconcile the lifecycle with actual schema before implementation. Proposed conceptual states: created, generating_questions, ready, in_progress, submitted, evaluating, completed, failed, cancelled/terminated. Do not introduce enum values without migration review.

- SESSION-04: State transitions are validated and server-authoritative; client cannot arbitrarily set completed status or scores.

- SESSION-05: Persist role/configuration, owner, stable timestamps and relevant terminal/termination reason.

- SESSION-06: Cancellation/termination validates allowed reasons and is safe when repeated.

- SESSION-07: Generation failure does not leave a session marked ready with incomplete questions.

- SESSION-08: No production fallback to fake IDs, fake questions or an in-memory session.

### GENERATION — Gemini question generation

- GEN-01: Gemini is called only server-side.

- GEN-02: Function verifies identity, session ownership, state and request schema.

- GEN-03: Validate provider output against a strict schema: non-empty questions, valid category/difficulty, bounded lengths/count, stable ordering.

- GEN-04: Persist questions atomically or use an explicit recoverable generation state.

- GEN-05: Duplicate retries do not create duplicate question sets.

- GEN-06: Configure a bounded timeout and handle rate limits, provider outages, malformed JSON, empty results and database write errors.

- GEN-07: Record safe provider/model/prompt version metadata where useful; never log keys or unnecessary raw resume/answer data.

- GEN-08: Reconcile local/Git/deployed function code and model configuration before release.

### VOICE/ANSWERS — Transcript and answer persistence

- ANS-01: Each submitted answer identifies interview_id and question_id and carries text plus duration/metadata supported by the schema.

- ANS-02: Verify that the question belongs to the interview and the interview belongs to the authenticated user.

- ANS-03: Define one canonical write contract: replaceable draft, final answer, or revision history. Do not leave retry semantics implicit.

- ANS-04: Use idempotency or a unique constraint so a retry/double-submit cannot duplicate the same logical answer.

- ANS-05: Persist the latest finalized transcript snapshot before advancing the UI; stale React state must not override the processor snapshot.

- ANS-06: Combine interim and finalized speech exactly once; do not submit placeholder text as a real answer.

- ANS-07: Failed persistence retains answer text for retry and does not falsely advance/completion-confirm the session.

- ANS-08: TTS preparation and playback are both considered AI-speaking states; recognition must not capture the AI voice.

- ANS-09: Recognition restarts only after unexpected termination and only when session/question is still current, unmuted, and active.

- ANS-10: Intentional mute/stop, question transition, terminal state and unmount must not restart recognition.

- ANS-11: Stale callbacks from older question/session/recognition instances must be ignored.

- ANS-12: Support explicit unsupported-browser, microphone-denied and recognition-error states.

### RECOVERY — Resume and history

- REC-01: On refresh, fetch canonical session, question order, answers, state and timestamps from Supabase/backend.

- REC-02: sessionStorage may remember an ID but is not authoritative proof that the session exists or belongs to the user.

- REC-03: Restore completed-session transcript/answers before rendering results.

- REC-04: Derive historical duration from persisted timestamps or a documented server model, not a timer reset to zero.

- REC-05: Distinguish active, submitted, evaluating, completed, failed, cancelled and terminated states according to actual schema.

- REC-06: Missing or inaccessible sessions show a clear not-found/unauthorized state; never synthesize a replacement session.

- REC-07: Protect against race conditions where results navigation occurs before data hydration completes.

### EVALUATION — Results and feedback

- EVAL-01: Never present mock scores/feedback as real results for a real interview.

- EVAL-02: Evaluation consumes the canonical persisted questions and candidate answers after valid submission.

- EVAL-03: Define a documented scoring rubric and validated result schema before implementation.

- EVAL-04: Persist overall score, summary, performance dimensions, role-specific domains, per-question scores/feedback and preparation recommendations only if actually produced and supported by the approved schema.

- EVAL-05: Evaluation writes happen in a trusted server-side operation; clients cannot forge scores or mark evaluation completed.

- EVAL-06: Evaluation has explicit pending/processing/completed/failed status and safe retry semantics.

- EVAL-07: Evaluation failures never delete or corrupt the interview and answers.

- EVAL-08: Results are queryable only by the owner and are reproducible from persisted data.

- EVAL-09: Transcript is derived from persisted transcript/answer records, not from a local-only cache or mock transcript.

- EVAL-10: Missing metrics remain unavailable/null with an honest UI state; do not substitute arbitrary constants such as 85 or 88.

- EVAL-11: Persist evaluator model/version and rubric/prompt version where feasible.

- EVAL-12: Prevent duplicate evaluation jobs/records for repeated submit or refresh operations.

### RESULTS — Frontend contract

- RESULT-01: Results retrieval returns canonical status plus result payload, or an explicit pending/failed/not-found outcome.

- RESULT-02: Frontend must not assume every result has all optional metrics; render empty/pending/error states safely.

- RESULT-03: The results page's overall performance, AI summary, radar/performance metrics, strong domains/focus areas, question breakdown, transcript, and preparation recommendations must be mapped to actual persisted fields.

- RESULT-04: Result cache is optional and never overrides a newer server response or grants access.

- RESULT-05: Completed timestamp and duration must be based on persisted values, not hardcoded presentation values.

- RESULT-06: Results loading must distinguish a missing result from a real score of zero.

## 8. Canonical Data Model — Design Before Migration

Do not assume table names in this proposal exist. Inspect all migrations and generated database types first. Preserve the current schema when sound; add migrations only for clearly defined gaps.

| Concept | Purpose | Rules / design notes |
| --- | --- | --- |
| profiles | Profile linked to auth.users | One row per auth user; profile trigger/function protected. |
| interviews | Interview configuration, owner, lifecycle and timestamps | Canonical owner and status; no browser-written evaluation fields unless explicitly authorized by schema design. |
| interview_questions | Persisted question set | Stable ID, interview FK, question number/order, prompt, category and difficulty; uniqueness of (interview_id, question_number). |
| answer storage (existing table/columns to discover) | Candidate answer for each question | Canonical answer contract and retry uniqueness; answer belongs to an interview question. |
| evaluation record (proposed) | Evaluation status and overall result | One canonical evaluation per submitted interview unless version history is an explicit requirement. |
| per-question evaluation (proposed row or validated JSON) | Question-level feedback and metrics | Choose normalized rows or JSON based on real query needs; do not create redundant tables speculatively. |
| transcript (existing answer records or explicit transcript table) | Historical speaker turns | Decide canonical storage; ensure order and timestamps; do not write arbitrary transcript blobs into an unverified column. |
| resume metadata/storage (if supported) | Resume-based interview context | Private storage, ownership checks, file constraints and retention/deletion policy. |

Critical schema gate: inspect migrations for `interviews`, `interview_questions`, answer fields, evaluation columns/tables, RLS and column grants. The accessible frontend code references `interview_metrics`, `interview_domain_scores`, `interviews.transcript`, `interviews.overall_score`, and `interviews.ai_summary`; the existence and client-write permissions of all of these must be verified. The code uses `q.answer` for feedback, but the canonical candidate response field must be determined from actual migrations and data flow.

## 9. Logical API Contracts

These are operations and behaviors, not prescribed endpoint names. Reuse the existing Supabase/Edge Function structure if appropriate. Do not introduce a parallel API route system without a documented reason.

| Operation | Input | Success response | Failure behavior |
| --- | --- | --- | --- |
| Create interview | Mode, role/resume references, experience, difficulty, focus, job description, idempotency key | Canonical interview ID/status/configuration | Validation/auth error; no fake session fallback. |
| Generate questions | Interview ID, generation version/options | Persisted ordered question list and ready status | Explicit failed/retryable status; no partial set presented as ready. |
| Get session | Interview ID | Owner-authorized session, ordered questions, persisted answers, timestamps/status | Not found/forbidden; no in-memory-only replacement. |
| Submit answer | Interview ID, question ID, answer snapshot, duration, idempotency key | Canonical answer ID, persisted status | Retryable error with answer retained client-side. |
| Terminate/cancel | Interview ID, validated reason, idempotency key if needed | Canonical terminal state and timestamp | Invalid transition or ownership error. |
| Submit interview | Interview ID | Submitted state and evaluation status | Do not discard answers; repeated request is idempotent. |
| Run evaluation | Interview ID / evaluation job ID | Persisted evaluation record/status | Failed status and safe retry; no fake scores. |
| Get results | Interview ID | Persisted evaluation, transcript and metadata/status | Pending, failed, not-found or forbidden state; never mock real result. |

Every operation must have a stable error envelope: machine-readable code, safe message, optional field errors, and correlation ID. Do not expose SQL errors, stack traces, JWTs, provider keys, or internal prompt contents.

## 10. Security and Privacy Requirements

- RLS must be tested for each user-owned table and every operation the client is allowed to perform.

- Derive identity from validated Supabase claims; never trust a submitted user_id.

- Keep service-role and Gemini secrets in Supabase Function secrets/environment configuration only.

- Use least-privilege grants; SECURITY DEFINER functions must have controlled search_path and narrow grants.

- Validate request body size, text lengths, question counts, enum values, and IDs.

- Treat candidate answers and resume content as untrusted input, including prompt-injection attempts. Delimit data from evaluator instructions.

- Log operation type, correlation ID, status, latency and safe error category. Do not log secrets or full transcript by default.

- Define data retention/deletion for profile, resume, interview, answers, evaluations and future recordings before adding those data types.

- Do not add external speech vendors, analytics data transfer, or paid infrastructure without user approval.

- Review CORS, JWT verification, function authentication settings and redirect configuration in the actual deployment configuration before release.

## 11. Reliability, Performance and Free-Tier Constraints

| Requirement | Acceptance criteria |
| --- | --- |
| Timeouts | Provider operations have bounded, configurable timeouts and end in explicit recoverable state. |
| Retries | Retries are bounded, idempotent and do not create duplicate sessions/questions/answers/evaluations. |
| Concurrency | Double-clicks and concurrent answer/evaluation requests cannot violate lifecycle or uniqueness rules. |
| Query efficiency | Review indexes for owner_id, interview_id, question order, answer lookup and evaluation lookup; add only justified indexes. |
| Consistency | Frontend success follows canonical server response; local optimistic state is reversible on failure. |
| Free-tier use | Avoid unbounded loops, uncontrolled retries, unnecessary provider calls and speculative paid dependencies. |
| Observability | Track generation and evaluation success/failure, latency, retries and common auth errors without unnecessary personal content. |
| No fabricated data | A backend/provider failure produces an error/pending state, never fake interview IDs, questions or scores. |

## 12. Testing Strategy and Release Gates

### 12.1 Database tests

- Keep the current authorization test suite as a baseline: 42 assertions passed locally in the reported run.

- Add tests for any new tables, columns, RLS policies, constraints, function grants and lifecycle transitions.

- Test cross-user isolation for interviews, questions, answers, evaluations, resumes and storage objects as applicable.

- Apply migrations to a fresh local Supabase database, then run the full database suite.

- Test transaction rollback and failure behavior for multi-step creation/generation/evaluation where applicable.

### 12.2 Function/API tests

- Valid and invalid JWT; owner mismatch; malformed payload; unsupported mode; invalid lifecycle transition.

- Gemini timeout, rate limit, provider error, malformed output, empty output and database persistence failure.

- Repeated create/generate/answer/submit/evaluate calls with the same idempotency identifier.

- Evaluation from real persisted answers and validation of output schema.

- Ensure failures never result in fabricated success data.

### 12.3 Frontend integration and browser tests

- Role flow: choose mode → choose field → select/confirm role → select difficulty/configuration → create interview → questions display.

- Resume flow: upload/parse/choose configuration → start interview → correct resume/job-description context is used.

- Complete a session end-to-end and confirm every answer persists under the correct question.

- Fast unmute during TTS preparation and playback; ensure no AI self-transcription.

- Recognition pause/restart; rapid mute toggles; question boundary submit; ensure no lost/duplicated transcript.

- Force answer persistence failure and retry; confirm no duplicate and no loss.

- Refresh active session and completed session; verify question order, answers, transcript, status and elapsed duration.

- Force Gemini and evaluation failure; verify explicit errors and recoverability.

- Results page displays only real persisted results; absent metrics do not become default numeric scores.

### 12.4 Release gate

- Typecheck, build, lint, unit tests, database tests and applicable integration tests pass.

- Critical browser scenarios are manually verified in supported browsers.

- No known P0/P1 defects remain in the release scope.

- Migration diff, RLS/function grants, secrets and environment configuration are reviewed.

- Exact local/Git/deployed Edge Function versions are reconciled.

- Production migration/deployment plan and rollback considerations are documented.

- Explicit user approval is obtained before production DB changes or deployment.

## 13. Implementation Plan for Agents

| Phase | Scope | Do not include | Exit criteria |
| --- | --- | --- | --- |
| 0 — Reconcile source | Inspect current branch/dirty tree, frontend callers, migrations, types, functions, environment config; map current schema and status values. | No code changes until a concise findings/plan is returned. | Approved implementation plan and verified schema map. |
| 1 — Unify session API | Remove production mock fallbacks; align create/get/submit/complete/terminate around one auth/session contract; preserve setup flow. | No evaluation schema work yet. | Session operations return canonical persisted data and typed errors. |
| 2 — Generation correctness | Server-side Gemini generation, validation, atomic persistence/retry, consistent model/config. | No frontend key/provider calls; no silent static questions. | Integration tests cover success/failure/retry. |
| 3 — Answer/voice reliability | Fix lifecycle races and authoritative transcript snapshot; idempotent answer persistence and recoverable errors. | No Deepgram integration. | Production-path tests and manual browser scenarios pass. |
| 4 — Recovery and completion | Restore historical sessions, timestamps, answers and transcript; implement valid completion/submission state. | No mock recovery. | Refresh/resume/completed-session tests pass. |
| 5 — Evaluation schema/design | Inspect actual schema; propose minimal result data model, rubric, statuses, ownership and API contract. | Do not create guessed tables or columns before design approval. | Design review approved. |
| 6 — Evaluation implementation | Trusted evaluation operation, validated output, persistence, retries and results retrieval. | No hardcoded scores or localStorage as source of truth. | Real-answer integration tests pass. |
| 7 — Release validation | Fresh DB migration test, complete test suite, browser smoke tests, secrets/config audit and release notes. | No production deploy without approval. | Explicit release decision. |

Agents must stop after each phase and report evidence. Do not silently continue to the next phase or combine unrelated refactors.

## 14. Definition of Done

- The role and resume frontend workflows create durable, owner-authorized sessions.

- Question generation is server-side, validated, persisted and retry-safe.

- Answer submissions are tied to the correct interview/question and safe under retries.

- Voice lifecycle does not capture AI speech or lose/duplicate candidate transcript in tested scenarios.

- Refresh and historical-session restoration are based on canonical backend data.

- Termination/completion use documented valid transitions.

- Results are computed from real persisted answers, with explicit pending/failed states and no mock scores in production.

- Every private resource is protected by RLS/server authorization and tested against cross-user access.

- All migrations work from a fresh local environment and tests pass.

- Environment/provider configuration is reviewed and aligned.

- All changes are diff-reviewed; no unrelated changes are committed or deployed.

- Production migration and deployment occur only after explicit approval.

## 15. Open Decisions That Require Review, Not Guessing

- Which exact interview status values and transition rules exist in the current migrations?

- Where is the canonical candidate answer stored today: a dedicated answers table, a column on interview_questions, or another structure?

- Are `interview_metrics`, `interview_domain_scores`, and `interviews.transcript` present in the current migration history and accessible under intended grants?

- Should evaluation be synchronous or queued/asynchronous? A persisted evaluation status is required either way.

- What scoring rubric maps to overall score, performance radar dimensions, role-specific metrics, question breakdown and preparation recommendations?

- Should answer updates replace a draft, preserve revisions, or be immutable once submitted?

- What are the resume file retention/deletion and privacy rules?

- What browsers are supported for voice interview functionality?

- Which Gemini model and request settings are approved for the intended free-tier usage?

## Appendix A — Reviewed GitHub Paths

- `frontend/src/pages/InterviewSetup/index.tsx` — role/resume mode and setup transitions.

- `frontend/src/pages/InterviewRoom/index.tsx` — live room lifecycle and frontend session orchestration.

- `frontend/src/services/api/interviews.ts` — direct Supabase creation, hardcoded initial questions, generic API calls and mock fallback behavior on accessible main.

- `frontend/src/services/api/client.ts` — generic API request helper and separately stored auth token.

- `frontend/src/stores/authStore.ts` — frontend auth state.

- `frontend/src/stores/interviewStore.ts` — setup config, active session ID in sessionStorage and in-memory question state.

- `frontend/src/types/interview.ts` and `frontend/src/types/question.ts` — frontend contract.

- `frontend/src/features/results/data/results.ts` — localStorage cache, Supabase result writes/reads, mock fallbacks and default scores.

- `frontend/src/pages/Results/index.tsx` — result sections expected by the UI.

- `backend/supabase/config.toml` — local Supabase/auth configuration.

- `backend/supabase/tests/test_authorization.sql` — current 42-assertion database security suite.

## Appendix B — Current Verified Baseline

| Item | Value |
| --- | --- |
| Repository | gagan-124/ASCEND |
| Accessible source branch | main |
| Feature branch review | The ref `feat/interview-generation-flow` was not available in GitHub fetch; local unpushed state remains unverified in this review. |
| Local database test baseline | 42 assertions passed, 0 failed, 0 skipped in reported local run. |
| Security-hardening migration | `20261009000000_security_advisor_remediation.sql`, applied and inspected locally only. |
| Deployment | This PRD does not authorize or imply any production migration, push, or deployment. |

## Appendix C — Required Agent Completion Report

- Phase and requirements addressed.

- Current branch and starting working-tree status.

- Files changed and why.

- Schema/migration changes and why each is needed.

- Exact commands run with pass/fail counts.

- Tests that exercise production logic versus mocks.

- Browser scenarios manually tested and those not tested.

- Known issues and risks remaining.

- Confirmation that no production DB, secrets, commit, push, or deployment were changed unless explicitly authorized.
