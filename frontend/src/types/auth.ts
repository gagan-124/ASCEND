export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface LoginCredentials {
  email: string;
  passwordHash: string;
}

export interface SignupPayload {
  email: string;
  passwordHash: string;
  fullName: string;
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
}
