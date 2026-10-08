import { createClient } from '@supabase/supabase-js';
import { env } from '@/config/environment';

// Client-safe Supabase instance using public anon/publishable key ONLY
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
