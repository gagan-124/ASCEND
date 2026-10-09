# ASCEND Authentication & Authorization Security Guide

This document defines the configuration, redirect URLs, provider settings, and multi-layered authorization model for the ASCEND platform.

---

## 1. Authentication Architecture ("Who is this user?")

Supabase Auth is the canonical and exclusive authentication authority for ASCEND. No custom password hashing, sessions tables, or JWT generation are implemented.

### Supported Methods
1. **Google OAuth**
2. **GitHub OAuth**
3. **Email / Password**

*(Microsoft, phone OTP, and other third-party providers are explicitly out of scope).*

---

## 2. Environment Variables & Secrets Separation

### Frontend Environment (`frontend/.env`)
The frontend contains only public, client-safe configuration:
```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<public-anon-key>
```
*Note: The frontend must **NEVER** receive `SUPABASE_SERVICE_ROLE_KEY`, database passwords, or OAuth client secrets.*

### Backend / Server Environment (Secret)
Server-side Edge Functions and administrative workflows consume elevated secrets:
```env
SUPABASE_SERVICE_ROLE_KEY=<service-role-secret>
GOOGLE_CLIENT_ID=<google-client-id>
GOOGLE_CLIENT_SECRET=<google-client-secret>
GITHUB_CLIENT_ID=<github-client-id>
GITHUB_CLIENT_SECRET=<github-client-secret>
```

---

## 3. OAuth & Redirect URL Configuration

### Approved Redirect URIs & URL Configuration

In **Supabase Dashboard > Authentication > URL Configuration**:

* **Site URL**: `https://ascend-sigma-one.vercel.app` (or your active production domain)
* **Redirect URLs (Allowlist)**:
  - `https://ascend-sigma-one.vercel.app/**`
  - `https://ascend-sigma-one.vercel.app/auth/callback`
  - `https://ascend-sigma-one.vercel.app/interview/setup`
  - `https://ascend-sigma-one.vercel.app/auth/recovery`
  - `https://ascend-sigma-one.vercel.app/auth/login`
  - `http://localhost:3000/**`
  - `http://localhost:5173/**`
  - `http://127.0.0.1:3000/**`
  - `http://127.0.0.1:5173/**`

### Supabase Auth Callback Endpoint
* **Canonical Callback**: `https://<project-ref>.supabase.co/auth/v1/callback`
  (e.g., `https://smartljzaenpqizvvmkf.supabase.co/auth/v1/callback`)

### Provider Dashboard Setup

#### Google Cloud Console (OAuth 2.0 Client IDs)
1. **Authorized JavaScript origins**:
   - `https://ascend-sigma-one.vercel.app`
   - `http://localhost:3000`
   - `http://localhost:5173`
2. **Authorized redirect URIs**:
   - `https://smartljzaenpqizvvmkf.supabase.co/auth/v1/callback`

#### GitHub Developer Settings (OAuth Apps)
1. **Homepage URL**: `https://ascend-sigma-one.vercel.app`
2. **Authorization callback URL**: `https://smartljzaenpqizvvmkf.supabase.co/auth/v1/callback`

---

## 4. Multi-Layer Authorization Model ("What can this user do?")

| Layer | Responsibility | Mechanism |
| :--- | :--- | :--- |
| **Layer 1: Identity** | Validates credentials and issues session JWT | Supabase Auth (`auth.users`) |
| **Layer 2: Row Ownership** | Restricts records to user namespace (`auth.uid() = user_id`) | PostgreSQL Row Level Security (RLS) |
| **Layer 3: Column Privileges** | Blocks client writes to scores, metrics, summaries & metadata | PostgreSQL Column-level `GRANT` / `REVOKE` |
| **Layer 4: Storage RLS** | Restricts resume and audio files to `<user_id>/...` path prefixes | `storage.objects` RLS Policies |
| **Layer 5: Controlled RPC** | Enforces atomic status transition (`in_progress` → `cancelled`) | `public.cancel_interview(UUID)` SECURITY DEFINER |
| **Layer 6: Server Authoritative** | AI question creation, scoring, metrics, and completion writes | Supabase Edge Functions (`service_role`) |

---

## 5. Storage Security (Private Buckets)

1. **`resumes` Bucket (Private)**:
   - Object Path: `<user_id>/resumes/<timestamp>_<filename>`
   - Permissions: Candidate `SELECT`, `INSERT`, `DELETE` on own folder.
2. **`interview-audio` Bucket (Private)**:
   - Object Path: `<user_id>/audio/<question_id>.webm`
   - Permissions: Candidate `SELECT`, `INSERT` on own folder.

---

## 6. Edge Function Boundaries

1. **`generate-interview-questions`**: Authenticates candidate session, generates questions via AI engine, and inserts records into `public.interview_questions`.
2. **`evaluate-interview-session`**: Triggered upon completion. Analyzes responses/audio, calculates scores, writes question feedback, sets `interviews.overall_score`, `general_performance`, `role_specific_metrics`, and transitions `status` to `completed`.
3. **`evaluate-ats-resume`**: Parses candidate resume from storage, calculates keyword and skill alignments, updates profile resume metadata, and inserts evaluation records into `public.ats_evaluations`.
