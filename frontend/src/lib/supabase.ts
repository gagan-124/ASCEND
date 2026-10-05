import { createClient } from '@supabase/supabase-js';
import { env } from '@/config/environment';

// Client-safe Supabase instance using anon key ONLY
export const supabase = (env.SUPABASE_URL && env.SUPABASE_ANON_KEY)
  ? createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY)
  : null;
