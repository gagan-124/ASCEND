-- Migration: 20261008000000_final_production_schema.sql
-- Description: Core schema, check constraints, storage provisioning, RLS, column privileges, and RPC functions for ASCEND

--------------------------------------------------------------------------------
-- 0. AUTOMATIC UPDATED_AT TRIGGER FUNCTION
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

--------------------------------------------------------------------------------
-- 1. PROFILES TABLE
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  headline TEXT DEFAULT NULL,
  location TEXT DEFAULT NULL,
  target_role TEXT DEFAULT NULL,
  experience_level TEXT DEFAULT NULL CHECK (experience_level IN ('student', 'entry', 'junior', 'mid', 'senior') OR experience_level IS NULL),
  difficulty TEXT DEFAULT NULL CHECK (difficulty IN ('easy', 'medium', 'hard') OR difficulty IS NULL),
  skills JSONB DEFAULT '[]'::jsonb,
  resume_file_name TEXT DEFAULT NULL,
  resume_uploaded_at TIMESTAMPTZ DEFAULT NULL,
  resume_file_size BIGINT DEFAULT NULL CHECK (resume_file_size >= 0 OR resume_file_size IS NULL),
  interview_duration INT DEFAULT 30 CHECK (interview_duration > 0),
  questions_per_session INT DEFAULT 10 CHECK (questions_per_session > 0),
  allow_hints BOOLEAN DEFAULT true,
  allow_follow_ups BOOLEAN DEFAULT true,
  enable_voice BOOLEAN DEFAULT false,
  email_notifications BOOLEAN DEFAULT true,
  weekly_digest BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

--------------------------------------------------------------------------------
-- HARDENED TRIGGER FUNCTION: Provision profile on auth.user creation
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

--------------------------------------------------------------------------------
-- 2. INTERVIEWS TABLE
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  role TEXT NOT NULL,
  interview_type TEXT DEFAULT 'role' CHECK (interview_type IN ('role', 'resume')),
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'cancelled')),
  experience_level TEXT CHECK (experience_level IN ('student', 'entry', 'junior', 'mid', 'senior') OR experience_level IS NULL),
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard') OR difficulty IS NULL),
  overall_score INT CHECK (overall_score >= 0 AND overall_score <= 100),
  ai_summary TEXT,
  general_performance JSONB DEFAULT '{}'::jsonb,
  role_specific_metrics JSONB DEFAULT '[]'::jsonb,
  started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_interviews_user_id ON public.interviews(user_id);
CREATE INDEX IF NOT EXISTS idx_interviews_user_status ON public.interviews(user_id, status);

ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_interviews_updated_at
  BEFORE UPDATE ON public.interviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

--------------------------------------------------------------------------------
-- 3. INTERVIEW QUESTIONS TABLE
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.interview_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID NOT NULL REFERENCES public.interviews(id) ON DELETE CASCADE,
  question_number INT NOT NULL CHECK (question_number > 0),
  question TEXT NOT NULL,
  category TEXT DEFAULT 'technical',
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  time_limit_seconds INT DEFAULT 180 CHECK (time_limit_seconds > 0),
  candidate_response TEXT,
  transcript_lines JSONB DEFAULT '[]'::jsonb,
  audio_path TEXT,
  score INT CHECK (score >= 0 AND score <= 100),
  status TEXT,
  short_feedback TEXT,
  metric_scores JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_questions_interview_id ON public.interview_questions(interview_id);
CREATE INDEX IF NOT EXISTS idx_questions_interview_num ON public.interview_questions(interview_id, question_number);

ALTER TABLE public.interview_questions ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_questions_updated_at
  BEFORE UPDATE ON public.interview_questions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

--------------------------------------------------------------------------------
-- 4. ATS EVALUATIONS TABLE
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ats_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resume_path TEXT,
  resume_file_name TEXT,
  resume_file_type TEXT,
  resume_file_size BIGINT CHECK (resume_file_size >= 0 OR resume_file_size IS NULL),
  job_description TEXT NOT NULL,
  score INT NOT NULL CHECK (score >= 0 AND score <= 100),
  score_explanation TEXT,
  keyword_match INT CHECK (keyword_match >= 0 AND keyword_match <= 100),
  skills_alignment INT CHECK (skills_alignment >= 0 AND skills_alignment <= 100),
  experience_relevance INT CHECK (experience_relevance >= 0 AND experience_relevance <= 100),
  resume_structure INT CHECK (resume_structure >= 0 AND resume_structure <= 100),
  ats_readability INT CHECK (ats_readability >= 0 AND ats_readability <= 100),
  strengths JSONB DEFAULT '[]'::jsonb,
  areas_to_improve JSONB DEFAULT '[]'::jsonb,
  skill_matches JSONB DEFAULT '[]'::jsonb,
  skill_gaps JSONB DEFAULT '[]'::jsonb,
  recommendations JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_ats_user_id ON public.ats_evaluations(user_id);

ALTER TABLE public.ats_evaluations ENABLE ROW LEVEL SECURITY;

--------------------------------------------------------------------------------
-- 5. COLUMN PRIVILEGES (GRANT / REVOKE)
--------------------------------------------------------------------------------
-- Profiles Column Privileges
REVOKE ALL ON public.profiles FROM authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (
  full_name,
  avatar_url,
  headline,
  location,
  target_role,
  experience_level,
  difficulty,
  skills,
  interview_duration,
  questions_per_session,
  allow_hints,
  allow_follow_ups,
  enable_voice,
  email_notifications,
  weekly_digest
) ON public.profiles TO authenticated;

-- Interviews Column Privileges (No UPDATE/DELETE for client)
REVOKE ALL ON public.interviews FROM authenticated;
GRANT SELECT ON public.interviews TO authenticated;
GRANT INSERT (
  user_id,
  title,
  role,
  interview_type,
  experience_level,
  difficulty
) ON public.interviews TO authenticated;

-- Interview Questions Column Privileges (No INSERT/DELETE for client)
REVOKE ALL ON public.interview_questions FROM authenticated;
GRANT SELECT ON public.interview_questions TO authenticated;
GRANT UPDATE (
  candidate_response,
  transcript_lines,
  audio_path
) ON public.interview_questions TO authenticated;

-- ATS Evaluations Column Privileges (No INSERT/UPDATE for client)
REVOKE ALL ON public.ats_evaluations FROM authenticated;
GRANT SELECT, DELETE ON public.ats_evaluations TO authenticated;

--------------------------------------------------------------------------------
-- 6. RLS ROW POLICIES
--------------------------------------------------------------------------------
-- Profiles RLS
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Interviews RLS
CREATE POLICY "Users can view own interviews"
  ON public.interviews FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own interview sessions"
  ON public.interviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Interview Questions RLS (Enforces Active Session In-Progress Immutability & Path Lock)
CREATE POLICY "Users can view questions of own interviews"
  ON public.interview_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.interviews
      WHERE id = interview_questions.interview_id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update response on own active interview questions"
  ON public.interview_questions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.interviews
      WHERE id = interview_questions.interview_id
        AND user_id = auth.uid()
        AND status = 'in_progress'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.interviews
      WHERE id = interview_questions.interview_id
        AND user_id = auth.uid()
        AND status = 'in_progress'
    )
    AND (
      audio_path IS NULL 
      OR split_part(audio_path, '/', 1) = auth.uid()::text
    )
  );

-- ATS Evaluations RLS
CREATE POLICY "Users can view own ATS evaluations"
  ON public.ats_evaluations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ATS evaluations"
  ON public.ats_evaluations FOR DELETE
  USING (auth.uid() = user_id);

--------------------------------------------------------------------------------
-- 7. CANDIDATE CANCELLATION RPC FUNCTION
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cancel_interview(p_interview_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_owner_id UUID;
  v_current_status TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required.' USING ERRCODE = '42501';
  END IF;

  -- Explicit row lock to prevent race conditions during concurrent cancellation/completion
  SELECT user_id, status INTO v_owner_id, v_current_status
  FROM public.interviews
  WHERE id = p_interview_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Interview session not found.' USING ERRCODE = 'P0002';
  END IF;

  IF v_owner_id <> auth.uid() THEN
    RAISE EXCEPTION 'Access denied. You do not own this interview session.' USING ERRCODE = '42501';
  END IF;

  IF v_current_status <> 'in_progress' THEN
    RAISE EXCEPTION 'Only active in-progress interviews can be cancelled.' USING ERRCODE = '22000';
  END IF;

  UPDATE public.interviews
  SET status = 'cancelled',
      updated_at = timezone('utc'::text, now())
  WHERE id = p_interview_id;
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_interview(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cancel_interview(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.cancel_interview(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_interview(UUID) TO service_role;

--------------------------------------------------------------------------------
-- 8. STORAGE BUCKET PROVISIONING & RLS POLICIES
--------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('resumes', 'resumes', false),
  ('interview-audio', 'interview-audio', false)
ON CONFLICT (id) DO NOTHING;

-- Resumes Storage Policies
CREATE POLICY "Users can read own resumes"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'resumes' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can upload own resumes"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'resumes' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own resumes"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'resumes' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Interview Audio Storage Policies
CREATE POLICY "Users can read own interview audio"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'interview-audio' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can upload own interview audio"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'interview-audio' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
