-- ============================================================================
-- ASCEND Security & Authorization Test Suite (Local Supabase Environment)
-- ============================================================================
-- File: backend/supabase/tests/test_authorization.sql
-- Purpose: Exhaustive pgTAP validation of candidate restrictions, column privileges,
--          server-authoritative execution, cross-user isolation, and real storage RLS.
-- ============================================================================

BEGIN;

-- Ensure pgTAP extension is available for pg_prove / supabase test db
CREATE EXTENSION IF NOT EXISTS pgtap;

-- Declare test plan: exactly 42 tests
SELECT plan(42);

-- ----------------------------------------------------------------------------
-- STEP 0: ENVIRONMENT & PREREQUISITE VALIDATION
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    RAISE EXCEPTION 'PREREQUISITE FAILED: "service_role" role does not exist.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    RAISE EXCEPTION 'PREREQUISITE FAILED: "authenticated" role does not exist.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    RAISE EXCEPTION 'PREREQUISITE FAILED: public.profiles table not found.';
  END IF;
END;
$$;

-- ----------------------------------------------------------------------------
-- STEP 1: TEST HARNESS HELPER FUNCTIONS (TRANSACTION-SCOPED IN pg_temp)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION pg_temp.set_candidate_context(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql AS $$
BEGIN
  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claim.sub', p_user_id::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', p_user_id::text, 'role', 'authenticated')::text, true);
END;
$$;

CREATE OR REPLACE FUNCTION pg_temp.set_server_context()
RETURNS VOID
LANGUAGE plpgsql AS $$
BEGIN
  SET LOCAL ROLE service_role;
  PERFORM set_config('request.jwt.claim.sub', '', true);
  PERFORM set_config('request.jwt.claim.role', 'service_role', true);
  PERFORM set_config('request.jwt.claims', '{"role":"service_role"}'::text, true);
END;
$$;

-- ----------------------------------------------------------------------------
-- STEP 2: DETERMINISTIC TEST IDENTITIES & PROFILES SETUP
-- ----------------------------------------------------------------------------
-- Alice: 11111111-1111-1111-1111-111111111111
-- Bob:   22222222-2222-2222-2222-222222222222
DO $$
DECLARE
  v_alice_id UUID := '11111111-1111-1111-1111-111111111111';
  v_bob_id   UUID := '22222222-2222-2222-2222-222222222222';
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_alice_id,
      'authenticated',
      'authenticated',
      'alice@test.local',
      crypt('testpassword', gen_salt('bf')),
      timezone('utc'::text, now()),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Alice Candidate"}'::jsonb,
      timezone('utc'::text, now()),
      timezone('utc'::text, now())
    ),
    (
      '00000000-0000-0000-0000-000000000000',
      v_bob_id,
      'authenticated',
      'authenticated',
      'bob@test.local',
      crypt('testpassword', gen_salt('bf')),
      timezone('utc'::text, now()),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Bob Candidate"}'::jsonb,
      timezone('utc'::text, now()),
      timezone('utc'::text, now())
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;

  INSERT INTO public.profiles (id, full_name)
  VALUES 
    (v_alice_id, 'Alice Candidate'),
    (v_bob_id, 'Bob Candidate')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'buckets') THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES 
      ('resumes', 'resumes', false),
      ('interview-audio', 'interview-audio', false)
    ON CONFLICT (id) DO NOTHING;
  END IF;
END;
$$;

-- ----------------------------------------------------------------------------
-- STEP 3: RUN THE 42 AUTHORIZATION & SECURITY TESTS
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION pg_temp.run_ascend_security_suite()
RETURNS SETOF text
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INT;
  v_updated INT;
  v_inserted INT;
  v_deleted INT;
  v_caught BOOLEAN;
  v_name TEXT;
  v_status TEXT;
  v_score INT;
  v_alice_interview_id UUID;
  v_active_interview_id UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  v_question_id UUID := 'cccccccc-cccc-cccc-cccc-cccccccccccc';
  v_bob_interview_id UUID := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  v_ats_id UUID := 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
BEGIN
  -- ==========================================================================
  -- SECTION 1: PROFILE AUTHORIZATION & COLUMN RESTRICTIONS
  -- ==========================================================================
  PERFORM pg_temp.set_candidate_context('11111111-1111-1111-1111-111111111111');

  -- Test 1: Alice can SELECT own profile
  SELECT full_name INTO v_name FROM public.profiles WHERE id = '11111111-1111-1111-1111-111111111111';
  RETURN NEXT ok(v_name IS NOT NULL, '1. Alice can SELECT own profile');

  -- Test 2: Alice CANNOT SELECT Bob profile
  SELECT count(*) INTO v_count FROM public.profiles WHERE id = '22222222-2222-2222-2222-222222222222';
  RETURN NEXT ok(v_count = 0, '2. Alice CANNOT SELECT Bob profile (cross-user isolation)');

  -- Test 3: Alice can UPDATE allowed profile columns
  UPDATE public.profiles
  SET full_name = 'Alice Smith',
      headline = 'Senior Backend Engineer',
      location = 'San Francisco, CA',
      interview_duration = 45
  WHERE id = '11111111-1111-1111-1111-111111111111';
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN NEXT ok(v_updated = 1, '3. Alice can UPDATE user-editable profile columns');

  -- Test 4: Alice CANNOT INSERT a profile directly
  v_caught := false;
  BEGIN
    INSERT INTO public.profiles (id, full_name) VALUES ('33333333-3333-3333-3333-333333333333', 'Eve');
  EXCEPTION WHEN SQLSTATE '42501' THEN
    v_caught := true;
  END;
  RETURN NEXT ok(v_caught, '4. Alice CANNOT INSERT profile directly (client INSERT revoked)');

  -- Test 5: Alice CANNOT modify resume_file_name
  v_caught := false;
  BEGIN
    UPDATE public.profiles SET resume_file_name = 'forged.pdf' WHERE id = '11111111-1111-1111-1111-111111111111';
  EXCEPTION WHEN SQLSTATE '42501' THEN
    v_caught := true;
  END;
  RETURN NEXT ok(v_caught, '5. Alice CANNOT modify resume_file_name (column privilege revoked)');

  -- Test 6: Alice CANNOT modify resume_uploaded_at
  v_caught := false;
  BEGIN
    UPDATE public.profiles SET resume_uploaded_at = now() WHERE id = '11111111-1111-1111-1111-111111111111';
  EXCEPTION WHEN SQLSTATE '42501' THEN
    v_caught := true;
  END;
  RETURN NEXT ok(v_caught, '6. Alice CANNOT modify resume_uploaded_at (column privilege revoked)');

  -- Test 7: Alice CANNOT modify resume_file_size
  v_caught := false;
  BEGIN
    UPDATE public.profiles SET resume_file_size = 500000 WHERE id = '11111111-1111-1111-1111-111111111111';
  EXCEPTION WHEN SQLSTATE '42501' THEN
    v_caught := true;
  END;
  RETURN NEXT ok(v_caught, '7. Alice CANNOT modify resume_file_size (column privilege revoked)');

  -- Test 8: Alice CANNOT modify created_at
  v_caught := false;
  BEGIN
    UPDATE public.profiles SET created_at = '2020-01-01'::timestamptz WHERE id = '11111111-1111-1111-1111-111111111111';
  EXCEPTION WHEN SQLSTATE '42501' THEN
    v_caught := true;
  END;
  RETURN NEXT ok(v_caught, '8. Alice CANNOT modify created_at (column privilege revoked)');

  -- ==========================================================================
  -- SECTION 2: INTERVIEWS AUTHORIZATION & IMMUTABILITY
  -- ==========================================================================
  -- Test 9: Alice can INSERT interview owned by Alice (using granted configuration columns)
  INSERT INTO public.interviews (
    user_id,
    title,
    role,
    interview_type,
    experience_level,
    difficulty
  ) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Full Stack Assessment',
    'Software Engineer',
    'role',
    'senior',
    'medium'
  ) RETURNING id INTO v_alice_interview_id;
  RETURN NEXT ok(v_alice_interview_id IS NOT NULL, '9. Alice can INSERT interview session owned by Alice');

  -- Test 10: Alice CANNOT INSERT an interview owned by Bob
  v_caught := false;
  BEGIN
    INSERT INTO public.interviews (
      user_id,
      title,
      role
    ) VALUES (
      '22222222-2222-2222-2222-222222222222',
      'Bob Stolen Interview',
      'Software Engineer'
    );
  EXCEPTION WHEN SQLSTATE '42501' THEN
    v_caught := true;
  END;
  RETURN NEXT ok(v_caught, '10. Alice CANNOT INSERT interview owned by Bob (cross-user RLS check)');

  -- Test 11: Alice CANNOT UPDATE overall_score directly
  v_caught := false;
  BEGIN
    UPDATE public.interviews SET overall_score = 100 WHERE id = v_alice_interview_id;
  EXCEPTION WHEN SQLSTATE '42501' THEN
    v_caught := true;
  END;
  RETURN NEXT ok(v_caught, '11. Alice CANNOT UPDATE overall_score directly (UPDATE privilege revoked)');

  -- Test 12: Alice CANNOT UPDATE ai_summary directly
  v_caught := false;
  BEGIN
    UPDATE public.interviews SET ai_summary = 'Tampered AI summary' WHERE id = v_alice_interview_id;
  EXCEPTION WHEN SQLSTATE '42501' THEN
    v_caught := true;
  END;
  RETURN NEXT ok(v_caught, '12. Alice CANNOT UPDATE ai_summary directly (UPDATE privilege revoked)');

  -- Test 13: Alice CANNOT UPDATE status directly
  v_caught := false;
  BEGIN
    UPDATE public.interviews SET status = 'completed' WHERE id = v_alice_interview_id;
  EXCEPTION WHEN SQLSTATE '42501' THEN
    v_caught := true;
  END;
  RETURN NEXT ok(v_caught, '13. Alice CANNOT UPDATE status directly (UPDATE privilege revoked)');

  -- Test 14: Alice CANNOT DELETE interview directly
  v_caught := false;
  BEGIN
    DELETE FROM public.interviews WHERE id = v_alice_interview_id;
  EXCEPTION WHEN SQLSTATE '42501' THEN
    v_caught := true;
  END;
  RETURN NEXT ok(v_caught, '14. Alice CANNOT DELETE interview directly (DELETE privilege revoked)');

  -- ==========================================================================
  -- SECTION 3: CANCELLATION RPC (cancel_interview)
  -- ==========================================================================
  -- Test 15: Alice can cancel own in_progress interview via RPC
  PERFORM public.cancel_interview(v_alice_interview_id);
  SELECT status INTO v_status FROM public.interviews WHERE id = v_alice_interview_id;
  RETURN NEXT ok(v_status = 'cancelled', '15. Alice can cancel own in_progress interview via cancel_interview()');

  -- Test 16: Cancelled interview cannot be cancelled again
  v_caught := false;
  BEGIN
    PERFORM public.cancel_interview(v_alice_interview_id);
  EXCEPTION WHEN SQLSTATE '22000' THEN
    v_caught := true;
  END;
  RETURN NEXT ok(v_caught, '16. Already cancelled interview cannot be re-cancelled (lifecycle validation)');

  -- Seed Bob's interview under service_role
  PERFORM pg_temp.set_server_context();
  INSERT INTO public.interviews (
    id,
    user_id,
    title,
    role,
    status
  ) VALUES (
    v_bob_interview_id,
    '22222222-2222-2222-2222-222222222222',
    'Bob Distributed Systems',
    'Software Engineer',
    'in_progress'
  );

  -- Switch back to Alice
  PERFORM pg_temp.set_candidate_context('11111111-1111-1111-1111-111111111111');

  -- Test 17: Alice CANNOT cancel Bob's interview
  v_caught := false;
  BEGIN
    PERFORM public.cancel_interview(v_bob_interview_id);
  EXCEPTION WHEN SQLSTATE '42501' THEN
    v_caught := true;
  END;
  RETURN NEXT ok(v_caught, '17. Alice CANNOT cancel Bob interview (ownership check)');

  -- ==========================================================================
  -- SECTION 4: INTERVIEW QUESTIONS & IMMUTABILITY LIFECYCLE
  -- ==========================================================================
  -- Seed Alice active interview & question under service_role
  PERFORM pg_temp.set_server_context();
  INSERT INTO public.interviews (
    id,
    user_id,
    title,
    role,
    status
  ) VALUES (
    v_active_interview_id,
    '11111111-1111-1111-1111-111111111111',
    'Active System Architecture Interview',
    'Software Engineer',
    'in_progress'
  );

  INSERT INTO public.interview_questions (
    id,
    interview_id,
    question_number,
    question,
    category,
    difficulty,
    time_limit_seconds
  ) VALUES (
    v_question_id,
    v_active_interview_id,
    1,
    'Explain database sharding strategies and consistent hashing.',
    'technical',
    'medium',
    180
  );

  -- Switch back to Alice
  PERFORM pg_temp.set_candidate_context('11111111-1111-1111-1111-111111111111');

  -- Test 18: Alice can SELECT questions of own interview
  SELECT question INTO v_name FROM public.interview_questions WHERE id = v_question_id;
  RETURN NEXT ok(v_name IS NOT NULL, '18. Alice can SELECT questions of own interview session');

  -- Test 19: Alice can UPDATE candidate_response, transcript_lines, and audio_path while in_progress
  UPDATE public.interview_questions
  SET candidate_response = 'Consistent hashing minimizes key remapping on node scaling.',
      transcript_lines = '[{"speaker":"candidate","text":"Consistent hashing minimizes remapping","timestamp":"00:15"}]'::jsonb,
      audio_path = '11111111-1111-1111-1111-111111111111/audio/q1.webm'
  WHERE id = v_question_id;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN NEXT ok(v_updated = 1, '19. Alice can update responses while interview is in_progress');

  -- Test 20: Alice CANNOT set audio_path pointing to Bob folder
  v_caught := false;
  BEGIN
    UPDATE public.interview_questions
    SET audio_path = '22222222-2222-2222-2222-222222222222/audio/forged.webm'
    WHERE id = v_question_id;
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    IF v_updated = 0 THEN
      v_caught := true;
    END IF;
  EXCEPTION WHEN SQLSTATE '42501' THEN
    v_caught := true;
  END;
  RETURN NEXT ok(v_caught, '20. Alice CANNOT set audio_path pointing to Bob namespace (audio path lock)');

  -- Test 21: Alice CANNOT update question text or score directly
  v_caught := false;
  BEGIN
    UPDATE public.interview_questions SET question = 'Modified question text' WHERE id = v_question_id;
  EXCEPTION WHEN SQLSTATE '42501' THEN
    v_caught := true;
  END;
  RETURN NEXT ok(v_caught, '21. Alice CANNOT update question text (column privilege revoked)');

  -- Test 22: Alice CANNOT INSERT or DELETE questions
  v_caught := false;
  BEGIN
    INSERT INTO public.interview_questions (interview_id, question_number, question)
    VALUES (v_active_interview_id, 2, 'Injected question');
  EXCEPTION WHEN SQLSTATE '42501' THEN
    v_caught := true;
  END;
  RETURN NEXT ok(v_caught, '22. Alice CANNOT INSERT question directly (INSERT revoked)');

  -- Complete interview under service_role
  PERFORM pg_temp.set_server_context();
  UPDATE public.interviews
  SET status = 'completed',
      completed_at = now(),
      overall_score = 92
  WHERE id = v_active_interview_id;

  -- Switch back to Alice
  PERFORM pg_temp.set_candidate_context('11111111-1111-1111-1111-111111111111');

  -- Test 23: Alice CANNOT modify answers after interview completion (immutability)
  UPDATE public.interview_questions
  SET candidate_response = 'Tampered answer after completion'
  WHERE id = v_question_id;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN NEXT ok(v_updated = 0, '23. Alice CANNOT modify answers after interview is completed (immutability enforced)');

  -- ==========================================================================
  -- SECTION 5: CROSS-USER ISOLATION (BOB CONTEXT)
  -- ==========================================================================
  PERFORM pg_temp.set_candidate_context('22222222-2222-2222-2222-222222222222');

  -- Test 24: Bob CANNOT SELECT Alice's interview
  SELECT count(*) INTO v_count FROM public.interviews WHERE id = v_active_interview_id;
  RETURN NEXT ok(v_count = 0, '24. Bob CANNOT SELECT Alice interview (cross-user isolation)');

  -- Test 25: Bob CANNOT SELECT Alice's question
  SELECT count(*) INTO v_count FROM public.interview_questions WHERE id = v_question_id;
  RETURN NEXT ok(v_count = 0, '25. Bob CANNOT SELECT Alice question (cross-user isolation)');

  -- Test 26: Bob CANNOT UPDATE Alice's question
  UPDATE public.interview_questions
  SET candidate_response = 'Bob overwrite'
  WHERE id = v_question_id;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN NEXT ok(v_updated = 0, '26. Bob CANNOT UPDATE Alice question (0 rows affected)');

  -- Test 27: Bob CANNOT cancel Alice's interview
  v_caught := false;
  BEGIN
    PERFORM public.cancel_interview(v_active_interview_id);
  EXCEPTION WHEN SQLSTATE '42501' THEN
    v_caught := true;
  END;
  RETURN NEXT ok(v_caught, '27. Bob CANNOT cancel Alice interview via cancel_interview()');

  -- ==========================================================================
  -- SECTION 6: ATS EVALUATIONS AUTHORIZATION
  -- ==========================================================================
  -- Seed ATS evaluation under service_role
  PERFORM pg_temp.set_server_context();
  INSERT INTO public.ats_evaluations (
    id,
    user_id,
    resume_path,
    resume_file_name,
    job_description,
    score
  ) VALUES (
    v_ats_id,
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111/resumes/alice_resume.pdf',
    'alice_resume.pdf',
    'Senior Backend Engineer',
    88
  );

  -- Switch to Alice
  PERFORM pg_temp.set_candidate_context('11111111-1111-1111-1111-111111111111');

  -- Test 28: Alice can SELECT own ATS evaluation
  SELECT score INTO v_score FROM public.ats_evaluations WHERE id = v_ats_id;
  RETURN NEXT ok(v_score = 88, '28. Alice can SELECT own ATS evaluation');

  -- Test 29: Alice CANNOT INSERT ATS evaluation directly
  v_caught := false;
  BEGIN
    INSERT INTO public.ats_evaluations (user_id, job_description, score)
    VALUES ('11111111-1111-1111-1111-111111111111', 'Fake Job', 100);
  EXCEPTION WHEN SQLSTATE '42501' THEN
    v_caught := true;
  END;
  RETURN NEXT ok(v_caught, '29. Alice CANNOT INSERT ATS evaluation directly (INSERT revoked)');

  -- Test 30: Alice CANNOT UPDATE ATS evaluation directly
  v_caught := false;
  BEGIN
    UPDATE public.ats_evaluations SET score = 100 WHERE id = v_ats_id;
  EXCEPTION WHEN SQLSTATE '42501' THEN
    v_caught := true;
  END;
  RETURN NEXT ok(v_caught, '30. Alice CANNOT UPDATE ATS evaluation directly (UPDATE revoked)');

  -- Switch to Bob
  PERFORM pg_temp.set_candidate_context('22222222-2222-2222-2222-222222222222');

  -- Test 31: Bob CANNOT read or delete Alice's ATS evaluation
  SELECT count(*) INTO v_count FROM public.ats_evaluations WHERE id = v_ats_id;
  DELETE FROM public.ats_evaluations WHERE id = v_ats_id;
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN NEXT ok(v_count = 0 AND v_deleted = 0, '31. Bob CANNOT SELECT or DELETE Alice ATS evaluation');

  -- Switch to Alice
  PERFORM pg_temp.set_candidate_context('11111111-1111-1111-1111-111111111111');

  -- Test 32: Alice can DELETE own ATS evaluation
  DELETE FROM public.ats_evaluations WHERE id = v_ats_id;
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN NEXT ok(v_deleted = 1, '32. Alice can DELETE own ATS evaluation');

  -- ==========================================================================
  -- SECTION 7: REAL STORAGE (storage.objects) POLICIES
  -- ==========================================================================
  -- Enable Storage DELETE session flag required by storage.protect_delete() trigger
  PERFORM set_config('storage.allow_delete_query', 'true', true);

  -- Test 33: Alice can upload (INSERT) own resume into resumes bucket
  INSERT INTO storage.objects (
    id,
    bucket_id,
    name,
    owner
  ) VALUES (
    '11111111-0000-0000-0000-000000000001',
    'resumes',
    '11111111-1111-1111-1111-111111111111/resumes/alice_resume.pdf',
    '11111111-1111-1111-1111-111111111111'
  );
  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  RETURN NEXT ok(v_inserted = 1, '33. Alice can upload (INSERT) own resume to resumes bucket');

  -- Test 34: Alice can read (SELECT) own resume from resumes bucket
  SELECT count(*) INTO v_count 
  FROM storage.objects 
  WHERE bucket_id = 'resumes' AND name = '11111111-1111-1111-1111-111111111111/resumes/alice_resume.pdf';
  RETURN NEXT ok(v_count = 1, '34. Alice can read (SELECT) own resume from storage.objects');

  -- Test 35: Alice CANNOT upload (INSERT) resume into Bob folder namespace
  v_caught := false;
  BEGIN
    INSERT INTO storage.objects (
      id,
      bucket_id,
      name,
      owner
    ) VALUES (
      '11111111-0000-0000-0000-000000000002',
      'resumes',
      '22222222-2222-2222-2222-222222222222/resumes/forged_into_bob.pdf',
      '11111111-1111-1111-1111-111111111111'
    );
  EXCEPTION WHEN SQLSTATE '42501' THEN
    v_caught := true;
  END;
  RETURN NEXT ok(v_caught, '35. Alice CANNOT upload resume into Bob storage namespace (RLS prefix check)');

  -- Switch to Bob
  PERFORM pg_temp.set_candidate_context('22222222-2222-2222-2222-222222222222');
  PERFORM set_config('storage.allow_delete_query', 'true', true);

  -- Test 36: Bob CANNOT read (SELECT) Alice's resume
  SELECT count(*) INTO v_count 
  FROM storage.objects 
  WHERE bucket_id = 'resumes' AND name = '11111111-1111-1111-1111-111111111111/resumes/alice_resume.pdf';
  RETURN NEXT ok(v_count = 0, '36. Bob CANNOT read Alice resume in storage.objects');

  -- Test 37: Bob CANNOT delete (DELETE) Alice's resume
  DELETE FROM storage.objects 
  WHERE bucket_id = 'resumes' AND name = '11111111-1111-1111-1111-111111111111/resumes/alice_resume.pdf';
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN NEXT ok(v_deleted = 0, '37. Bob CANNOT delete Alice resume in storage.objects');

  -- Switch to Alice
  PERFORM pg_temp.set_candidate_context('11111111-1111-1111-1111-111111111111');
  PERFORM set_config('storage.allow_delete_query', 'true', true);

  -- Test 38: Alice can delete (DELETE) own resume
  DELETE FROM storage.objects 
  WHERE bucket_id = 'resumes' AND name = '11111111-1111-1111-1111-111111111111/resumes/alice_resume.pdf';
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN NEXT ok(v_deleted = 1, '38. Alice can delete own resume from storage.objects');

  -- Test 39: Alice can upload (INSERT) audio into interview-audio bucket
  INSERT INTO storage.objects (
    id,
    bucket_id,
    name,
    owner
  ) VALUES (
    '11111111-0000-0000-0000-000000000003',
    'interview-audio',
    '11111111-1111-1111-1111-111111111111/audio/q1.webm',
    '11111111-1111-1111-1111-111111111111'
  );
  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  RETURN NEXT ok(v_inserted = 1, '39. Alice can upload own interview audio to interview-audio bucket');

  -- Switch to Bob
  PERFORM pg_temp.set_candidate_context('22222222-2222-2222-2222-222222222222');

  -- Test 40: Bob CANNOT read Alice's interview audio
  SELECT count(*) INTO v_count 
  FROM storage.objects 
  WHERE bucket_id = 'interview-audio' AND name = '11111111-1111-1111-1111-111111111111/audio/q1.webm';
  RETURN NEXT ok(v_count = 0, '40. Bob CANNOT read Alice interview audio in storage.objects');

  -- Switch to Alice
  PERFORM pg_temp.set_candidate_context('11111111-1111-1111-1111-111111111111');

  -- Test 41: Storage UPDATE restriction (UPDATE is denied as designed)
  UPDATE storage.objects 
  SET name = '11111111-1111-1111-1111-111111111111/audio/q1_renamed.webm'
  WHERE id = '11111111-0000-0000-0000-000000000003';
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN NEXT ok(v_updated = 0, '41. Storage object UPDATE denied (0 rows affected)');

  -- ==========================================================================
  -- SECTION 8: SERVICE_ROLE AUTHORITATIVE ELEVATED WRITES
  -- ==========================================================================
  PERFORM pg_temp.set_server_context();

  -- Test 42: service_role can update AI evaluation metrics and overall scores
  UPDATE public.interviews
  SET overall_score = 95,
      ai_summary = 'Authoritative AI score generated by Edge Function.'
  WHERE id = v_active_interview_id;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN NEXT ok(v_updated = 1, '42. service_role has authoritative write access to scoring & AI metrics');

END;
$$;

-- Execute the suite and output standard pgTAP results
SELECT * FROM pg_temp.run_ascend_security_suite();

-- Conclude pgTAP plan
SELECT * FROM finish();

-- Roll back transaction so 0 test data remains
ROLLBACK;
