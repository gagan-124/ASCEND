# ASCEND Security & Authorization Test Suite

This directory contains the automated pgTAP and PostgreSQL authorization test suite for ASCEND.

---

## 1. Prerequisites

1. **Docker Engine / Docker Desktop**:
   - Must be running and healthy.
2. **Node.js & Supabase CLI**:
   - Installed locally or invoked via `npx supabase`.
3. **Canonical Project Root**:
   - The Supabase configuration resides at `backend/supabase/config.toml`. All CLI commands must target `--workdir ./backend`.

---

## 2. Verified Local Execution Commands

### Step 1: Start the Local Supabase Stack
Starts PostgreSQL (port 54322), Kong API Gateway (port 54321), Auth, Storage, and Studio:
```bash
npx supabase start --workdir ./backend
```

### Step 2: Reset Database & Apply Migrations
Recreates the database from scratch and cleanly applies `migrations/20261008000000_final_production_schema.sql`:
```bash
npx supabase db reset --workdir ./backend
```

### Step 3: Execute the Security Test Suite
Runs the 42 pgTAP security tests using the official Supabase pgTAP test runner:
```bash
npx supabase test db --workdir ./backend
```
Alternatively, execute directly via `docker exec`:
```bash
docker exec -i supabase_db_backend psql -U postgres -d postgres < backend/supabase/tests/test_authorization.sql
```

---

## 3. Test Architecture & Execution Contexts

The test suite ([`test_authorization.sql`](file:///c:/Users/gagan/OneDrive/Documents/AI_COACH/backend/supabase/tests/test_authorization.sql)) evaluates 42 individual authorization checkpoints:

### Context A: Candidate Context (`authenticated`)
Simulates an authenticated candidate session in PostgreSQL:
```sql
SET LOCAL ROLE authenticated;
PERFORM set_config('request.jwt.claim.sub', p_user_id::text, true);
PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
PERFORM set_config('request.jwt.claims', json_build_object('sub', p_user_id::text, 'role', 'authenticated')::text, true);
```
Validates:
- Row-level security (RLS) ownership filtering.
- Column-level privilege revocation (`GRANT UPDATE (...)`).
- Strict prohibition of direct mutations on scores, AI feedback, and interview status.
- Immutability of candidate answers once an interview is `completed`.
- Controlled transition via `cancel_interview(UUID)` RPC only.

### Context B: Server-Authoritative Context (`service_role`)
Simulates trusted Edge Function backend processes:
```sql
SET LOCAL ROLE service_role;
PERFORM set_config('request.jwt.claim.sub', '', true);
PERFORM set_config('request.jwt.claim.role', 'service_role', true);
PERFORM set_config('request.jwt.claims', '{"role":"service_role"}'::text, true);
```
Validates:
- Authoritative assignment of scores, AI summaries, and evaluation metrics.
- Transition of interviews from `in_progress` to `completed`.

---

## 4. Real Storage Operations Testing

The test suite directly exercises the `storage.objects` table against active RLS storage policies:
- **Resumes Bucket (`resumes`)**:
  - Alice uploads and reads `1111.../resumes/alice_resume.pdf`.
  - Alice is blocked from writing to Bob's folder (`2222.../resumes/...`).
  - Bob cannot read or delete Alice's resume.
- **Interview Audio Bucket (`interview-audio`)**:
  - Alice uploads audio to `1111.../audio/q1.webm`.
  - Bob cannot access Alice's audio.
  - Direct `UPDATE` operations on `storage.objects` are rejected.
- **Storage Deletion Session Flag**:
  - When evaluating DELETE policies, `PERFORM set_config('storage.allow_delete_query', 'true', true);` is set to satisfy the `storage.protect_delete()` safety trigger while exercising RLS policies.

---

## 5. Controlled Regression Verification Procedure

To verify that the test suite detects real security regressions:

1. **Inject a Temporary Vulnerability**:
   ```sql
   docker exec supabase_db_backend psql -U postgres -d postgres -c "GRANT UPDATE (overall_score) ON public.interviews TO authenticated;"
   ```
2. **Execute Test Runner**:
   ```bash
   npx supabase test db --workdir ./backend
   ```
   **Observed Result**: Test 11 fails immediately with exit code 1 (`Failed 1/42 subtests`).
3. **Restore Clean State**:
   ```bash
   npx supabase db reset --workdir ./backend
   npx supabase test db --workdir ./backend
   ```
   **Observed Result**: All 42 tests pass cleanly with exit code 0 (`Result: PASS`).

---

## 6. Rollback & Isolation Guarantee

The entire test file is wrapped in a `BEGIN; ... ROLLBACK;` transaction block. When executed, **0 residual rows** are retained in PostgreSQL, maintaining complete isolation across test executions.
