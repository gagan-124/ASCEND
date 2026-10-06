# Production Frontend Verification Fixes Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Resolve all identified audit findings to make the ASCEND frontend application fully production-grade, highly resilient, and ready for future backend/database integration.

**Architecture:** Fix root build scripts, auth persistence, ATS document parsing, proctoring mobile compatibility, session state survival across reloads, SPA hosting rewrites, React error boundaries, and TTS audio visualizer fallbacks.

**Tech Stack:** React 19, TypeScript, Vite, Zustand, React Router 7, Supabase JS client, Vercel host config.

---

### Task 1: Fix Root Build Reproducibility (`package.json`)
**Files:**
- Modify: `package.json:12`

**Step 1:** Modify root `package.json` line 12 to target `frontend` workspace only.
**Step 2:** Run `cmd /c "npm run typecheck"` from root and verify exit code is 0.

---

### Task 2: Fix Auth Store Persistence & User Re-hydration
**Files:**
- Modify: `frontend/src/stores/authStore.ts`
- Modify: `frontend/src/features/auth/services/authService.ts`

**Step 1:** Add `ascend_auth_user` storage key to `authStore.ts`.
**Step 2:** Initialize `user` state by parsing `localStorage.getItem('ascend_auth_user')`.
**Step 3:** Save user object in `setAuth` and remove in `clearAuth`.
**Step 4:** Run typecheck to verify interface compatibility.

---

### Task 3: Fix ATS Resume Parser & Eliminate Silent Mock Substitution
**Files:**
- Modify: `frontend/src/features/ats-evaluator/services/atsEvaluatorService.ts`
- Modify: `frontend/src/pages/ATSEvaluator/index.tsx`

**Step 1:** Update `extractResumeText` to parse plain text/PDF text arrays cleanly.
**Step 2:** Throw an explicit, descriptive user-facing error when text extraction yields unparseable binary content instead of substituting hardcoded Senior Software Engineer mock text.
**Step 3:** Catch parsing errors in ATS Evaluator UI and present error feedback banner to the candidate.

---

### Task 4: Fix Proctoring Fullscreen Enforcement for Mobile & Unsupported Browsers
**Files:**
- Modify: `frontend/src/pages/InterviewRoom/index.tsx:220`

**Step 1:** Add browser capability check (`document.fullscreenEnabled`).
**Step 2:** Track whether fullscreen request actually succeeded before enforcing `handleTerminate('FULLSCREEN_EXIT')`.

---

### Task 5: Fix Active Interview Session Routing (`InterviewSessionRoute`)
**Files:**
- Modify: `frontend/src/stores/interviewStore.ts`
- Modify: `frontend/src/app/router.tsx:39`

**Step 1:** Persist `sessionId` in `sessionStorage` inside `interviewStore`.
**Step 2:** Restore `sessionId` on store initialization.

---

### Task 6: Fix Vercel SPA Routing Configuration (`vercel.json`)
**Files:**
- Modify: `frontend/vercel.json`

**Step 1:** Exclude static assets (`/assets/*` and files with extensions) from SPA HTML rewrites.

---

### Task 7: Add Top-Level React Error Boundary
**Files:**
- Create: `frontend/src/components/common/ErrorBoundary.tsx`
- Modify: `frontend/src/components/common/index.ts`
- Modify: `frontend/src/app/App.tsx`

**Step 1:** Implement `ErrorBoundary` class component with user-friendly recovery UI.
**Step 2:** Wrap `RouterProvider` in `App.tsx`.

---

### Task 8: Fix VoiceOrb Visualizer Audio Level on Web Speech Fallback
**Files:**
- Modify: `frontend/src/features/interview/hooks/useVoiceSynthesizer.ts`

**Step 1:** Add interval procedural frequency simulation when `window.speechSynthesis` is active so `audioLevel` animates smoothly.

---

### Task 9: Await Supabase Persistence in `saveInterviewResult`
**Files:**
- Modify: `frontend/src/features/results/data/results.ts`

**Step 1:** Return `Promise<void>` from `saveInterviewResult` and await internal Supabase queries.
