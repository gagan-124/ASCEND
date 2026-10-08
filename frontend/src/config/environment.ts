const isDev = import.meta.env.DEV;

export const env = {
  NODE_ENV: import.meta.env.MODE || 'development',
  IS_DEV: isDev,
  IS_PROD: import.meta.env.PROD,
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || (isDev ? 'http://localhost:8000/api/v1' : ''),
  REALTIME_WS_URL: import.meta.env.VITE_REALTIME_WS_URL || (isDev ? 'ws://localhost:8000/ws' : ''),
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'https://smartljzaenpqizvvmkf.supabase.co',
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_64O2DaVrcTSyNzcse_glUA_io-CvImn',
} as const;

