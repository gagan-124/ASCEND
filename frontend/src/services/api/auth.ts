import { apiClient } from './client';
import type { LoginCredentials, SignupPayload, AuthResponse, UserProfile } from '@/types/auth';

export const authApi = {
  login: (credentials: LoginCredentials) => apiClient.post<AuthResponse>('/auth/login', credentials),
  signup: (payload: SignupPayload) => apiClient.post<AuthResponse>('/auth/signup', payload),
  getMe: () => apiClient.get<UserProfile>('/auth/me'),
  logout: () => apiClient.post<void>('/auth/logout'),
};
