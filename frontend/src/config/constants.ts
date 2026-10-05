export const APP_NAME = 'ASCEND';

export const ROUTES = {
  HOME: '/',
  OPENING: '/opening',
  AUTH: {
    ROOT: '/auth',
    LOGIN: '/auth/login',
    SIGNUP: '/auth/signup',
    FORGOT_PASSWORD: '/auth/forgot-password',
  },
  INTERVIEW: {
    ROOT: '/interview',
    SETUP: '/interview/setup',
    ROOM: (interviewId: string = ':interviewId') => `/interview/${interviewId}`,
    RESULTS: (interviewId: string = ':interviewId') => `/interview/${interviewId}/results`,
  },
  DASHBOARD: '/dashboard',
} as const;

export const LOCAL_STORAGE_KEYS = {
  AUTH_TOKEN: 'ascend_auth_token',
  THEME_MODE: 'ascend_theme_mode',
} as const;
