-- Migration: 20261009000000_security_advisor_remediation.sql
-- Description: Remediates Supabase Security Advisor warnings by pinning search_path to 'public, pg_temp'
--              and enforcing strict least-privilege EXECUTE grants on SECURITY DEFINER functions.

BEGIN;

--------------------------------------------------------------------------------
-- 1. HARDEN handle_new_user()
-- Trigger function invoked only upon auth.users INSERT. Direct client execution
-- must be revoked from PUBLIC, anon, and authenticated.
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

-- Revoke direct execution permissions from client-accessible roles
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM authenticated;


--------------------------------------------------------------------------------
-- 2. HARDEN cancel_interview(UUID)
-- Controlled candidate RPC function for transitioning in-progress interviews to cancelled.
-- Direct execution revoked from PUBLIC and anon; granted only to authenticated and service_role.
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

-- Revoke unauthenticated access, grant to authenticated and service_role
REVOKE ALL ON FUNCTION public.cancel_interview(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cancel_interview(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.cancel_interview(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_interview(UUID) TO service_role;

COMMIT;
