# ASCEND Final Production Fixes & Deployment Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement true production-grade fixes for Supabase Auth hydration, PDF/DOCX parsing via pdfjs-dist & mammoth, proctoring capability enforcement, session persistence, result write awaiting, audit fixes, git push, and deployment.

**Architecture:**
1. **Auth Hydration:** Single source of truth via Supabase `onAuthStateChange` + `getSession()` + `AppSessionLoader` + `useAuthStore` (NO `ascend_auth_user` in localStorage).
2. **ATS Document Parser:** Dynamic import of `pdfjs-dist` (PDF text extraction) and `mammoth` (DOCX raw text extraction). Hard error on invalid/empty/corrupted/unsupported files. Zero fake mock data fallbacks.
3. **Proctoring Enforcement:** Explicit capability check before starting interview session. If fullscreen is unsupported or rejected, render `UNSUPPORTED_ENVIRONMENT` state without starting interview.
4. **Session Persistence:** Keep `sessionId` in `sessionStorage` until interview completes/terminates.
5. **Persistence Awaiting:** Update caller flow in `InterviewRoom` to await `saveInterviewResult()` before navigating to `/results`.
6. **Vercel & Build:** Clean build, lint, typecheck, commit, push, deploy.

---

### Task 1: Clean Up Duplicate `ascend_auth_user` & Implement Proper Supabase Auth Session Hydration
**Files:**
- Modify: `frontend/src/stores/authStore.ts`
- Modify: `frontend/src/features/auth/services/authService.ts`
- Modify: `frontend/src/app/providers/AppProviders.tsx` or create `frontend/src/components/auth/AuthInitializer.tsx`
- Modify: `frontend/src/components/common/AppSessionLoader.tsx`

**Step 1:** In `authStore.ts`, remove `ascend_auth_user` and `USER_STORAGE_KEY` completely. Keep store reactive (`user`, `token`, `isAuthenticated`, `isLoading`, `isInitialized`, `setAuth`, `setLoading`, `clearAuth`).
**Step 2:** Update `authService.ts` to sync with Supabase `onAuthStateChange` and `getSession()`.
**Step 3:** Add `AuthInitializer` or mount effect in root provider to subscribe to `supabase.auth.onAuthStateChange()` and hydrate `authStore`.
**Step 4:** Render `AppSessionLoader` while `!isInitialized`.

---

### Task 2: Install and Implement Real PDF/DOCX Parsers (`pdfjs-dist` & `mammoth`)
**Files:**
- Check/Install: `pdfjs-dist`, `mammoth` in `frontend/package.json`
- Modify: `frontend/src/features/ats-evaluator/services/atsEvaluatorService.ts`

**Step 1:** Install `pdfjs-dist` and `mammoth` (or check if available).
**Step 2:** Dynamically import `pdfjs-dist` for `.pdf` text extraction across all pages.
**Step 3:** Dynamically import `mammoth` for `.docx` raw text extraction.
**Step 4:** Throw clear, actionable errors on empty, corrupt, unreadable, or unsupported documents. Remove ALL fake mock resume strings.

---

### Task 3: Proctoring Capability Check & Pre-Interview Blocking
**Files:**
- Modify: `frontend/src/pages/InterviewRoom/index.tsx`

**Step 1:** Add environment capability check in `PreFlightDeviceCheck` / `InterviewRoomPage`.
**Step 2:** If fullscreen is unsupported or rejected by browser policy, present an explicit error screen ("Fullscreen Environment Required") blocking the active interview from starting.

---

### Task 4: Active Interview Session Persistence & Awaited Result Persistence
**Files:**
- Modify: `frontend/src/stores/interviewStore.ts`
- Modify: `frontend/src/features/results/data/results.ts`
- Modify: `frontend/src/pages/InterviewRoom/index.tsx`

**Step 1:** Ensure `sessionId` survives refresh during active sessions and is removed on completion/termination.
**Step 2:** Ensure `handleFinishInterview` in `InterviewRoom/index.tsx` awaits `saveInterviewResult()` before triggering `navigate('/interview/.../results')`.

---

### Task 5: Package Audit, Build, Quality Gate & Deployment
**Files:**
- Audit: `npm audit --workspace=frontend`
- Verify: `npm run lint --workspace=frontend`, `npm run typecheck`, `npm run build`
- Git: Stage, commit (`fix: resolve production release gate issues`), push to `origin/main`.
- Deploy: Deploy frontend to Vercel.
