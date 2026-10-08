import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from './authStore';
import { useInterviewStore } from './interviewStore';

export interface UserProfileData {
  // Personal Profile
  fullName: string;
  email: string;
  avatarUrl: string | null;
  headline: string;
  location: string;

  // Interview Profile
  targetRole: string;
  experienceLevel: 'Student' | 'Entry' | 'Junior' | 'Mid' | 'Senior';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  skills: string[];

  // Resume Section
  resumeFileName: string | null;
  resumeUploadDate: string | null;
  resumeFileSize: string | null;

  // Interview Preferences
  interviewDuration: 15 | 30 | 45 | 60;
  questionsPerSession: 5 | 10 | 15 | 20;
  allowHints: boolean;
  allowFollowUps: boolean;
  enableVoice: boolean;

  // Account Preferences
  emailNotifications: boolean;
  weeklyDigest: boolean;
}

interface ProfileState {
  profile: UserProfileData;
  isOnboarded: boolean;
  isLoaded: boolean;
  isSaving: boolean;
  fetchProfile: (userId: string, email: string, userMetadata?: Record<string, unknown>) => Promise<void>;
  updateProfile: (updates: Partial<UserProfileData>) => Promise<boolean>;
  completeOnboarding: (data: Partial<UserProfileData>) => Promise<boolean>;
  addSkill: (skill: string) => void;
  removeSkill: (skill: string) => void;
  setResume: (fileName: string, fileSize: string) => void;
  removeResume: () => void;
  resetProfile: () => void;
}

const STORAGE_KEY = 'ascend_profile_settings';

const defaultEmptyProfile: UserProfileData = {
  fullName: '',
  email: '',
  avatarUrl: null,
  headline: '',
  location: '',
  targetRole: '',
  experienceLevel: 'Entry',
  difficulty: 'Medium',
  skills: [],
  resumeFileName: null,
  resumeUploadDate: null,
  resumeFileSize: null,
  interviewDuration: 30,
  questionsPerSession: 10,
  allowHints: true,
  allowFollowUps: true,
  enableVoice: false,
  emailNotifications: true,
  weeklyDigest: true,
};

function formatLevel(level: string | null | undefined): UserProfileData['experienceLevel'] {
  if (!level) return 'Entry';
  const lower = level.toLowerCase();
  if (lower === 'student') return 'Student';
  if (lower === 'entry') return 'Entry';
  if (lower === 'junior') return 'Junior';
  if (lower === 'mid') return 'Mid';
  if (lower === 'senior') return 'Senior';
  return 'Entry';
}

function formatDifficulty(diff: string | null | undefined): UserProfileData['difficulty'] {
  if (!diff) return 'Medium';
  const lower = diff.toLowerCase();
  if (lower === 'easy') return 'Easy';
  if (lower === 'medium') return 'Medium';
  if (lower === 'hard') return 'Hard';
  return 'Medium';
}

function formatBytes(bytes: number | null | undefined): string | null {
  if (!bytes) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: defaultEmptyProfile,
  isOnboarded: false,
  isLoaded: false,
  isSaving: false,

  fetchProfile: async (userId: string, email: string, userMetadata?: Record<string, unknown>) => {
    try {
      const metaName = typeof userMetadata?.full_name === 'string' ? userMetadata.full_name : '';
      const metaAvatar = typeof userMetadata?.avatar_url === 'string' ? userMetadata.avatar_url : null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.warn('[PROFILE] Error fetching profile from Supabase:', error.message);
      }

      if (data) {
        const loadedProfile: UserProfileData = {
          fullName: data.full_name || metaName || email.split('@')[0] || '',
          email: email || '',
          avatarUrl: data.avatar_url || metaAvatar || null,
          headline: data.headline || '',
          location: data.location || '',
          targetRole: data.target_role || '',
          experienceLevel: formatLevel(data.experience_level),
          difficulty: formatDifficulty(data.difficulty),
          skills: Array.isArray(data.skills) ? data.skills : [],
          resumeFileName: data.resume_file_name || null,
          resumeUploadDate: data.resume_uploaded_at
            ? new Date(data.resume_uploaded_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
            : null,
          resumeFileSize: formatBytes(data.resume_file_size),
          interviewDuration: (data.interview_duration as 15 | 30 | 45 | 60) || 30,
          questionsPerSession: (data.questions_per_session as 5 | 10 | 15 | 20) || 10,
          allowHints: data.allow_hints ?? true,
          allowFollowUps: data.allow_follow_ups ?? true,
          enableVoice: data.enable_voice ?? false,
          emailNotifications: data.email_notifications ?? true,
          weeklyDigest: data.weekly_digest ?? true,
        };

        const onboarded = Boolean(data.target_role && data.target_role.trim().length > 0 && data.experience_level);

        set({
          profile: loadedProfile,
          isOnboarded: onboarded,
          isLoaded: true,
        });

        // Sync setup config with Interview Store
        if (loadedProfile.targetRole) {
          useInterviewStore.getState().setSetupConfig({
            selectedRoleTitle: loadedProfile.targetRole,
            experienceLevel:
              loadedProfile.experienceLevel === 'Student' || loadedProfile.experienceLevel === 'Junior'
                ? 'Entry'
                : loadedProfile.experienceLevel === 'Senior'
                ? 'Senior'
                : 'Mid',
            difficulty: loadedProfile.difficulty,
            resumeFileName: loadedProfile.resumeFileName,
          });
        }
      } else {
        // Fallback if trigger record is still being created
        const fallbackProfile: UserProfileData = {
          ...defaultEmptyProfile,
          fullName: metaName || email.split('@')[0] || '',
          email: email || '',
          avatarUrl: metaAvatar || null,
        };

        set({
          profile: fallbackProfile,
          isOnboarded: false,
          isLoaded: true,
        });
      }
    } catch (err) {
      console.error('[PROFILE] Unexpected error loading profile:', err);
      set({ isLoaded: true });
    }
  },

  updateProfile: async (updates) => {
    const current = get().profile;
    const newProfile = { ...current, ...updates };
    const authUser = useAuthStore.getState().user;

    set({ profile: newProfile, isSaving: true });

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newProfile));
    } catch (err) {
      console.error('Failed to cache profile in local storage:', err);
    }

    // Sync auth store metadata if fullName or avatar changes
    if (authUser && (updates.fullName || updates.avatarUrl !== undefined)) {
      useAuthStore.getState().setAuth(
        {
          ...authUser,
          fullName: newProfile.fullName,
          avatarUrl: newProfile.avatarUrl || undefined,
        },
        useAuthStore.getState().token || ''
      );
    }

    // Sync to Supabase PostgreSQL profiles table
    if (authUser?.id) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: newProfile.fullName.trim() || null,
            avatar_url: newProfile.avatarUrl || null,
            headline: newProfile.headline.trim() || null,
            location: newProfile.location.trim() || null,
            target_role: newProfile.targetRole.trim() || null,
            experience_level: newProfile.experienceLevel.toLowerCase(),
            difficulty: newProfile.difficulty.toLowerCase(),
            skills: newProfile.skills || [],
            interview_duration: newProfile.interviewDuration,
            questions_per_session: newProfile.questionsPerSession,
            allow_hints: newProfile.allowHints,
            allow_follow_ups: newProfile.allowFollowUps,
            enable_voice: newProfile.enableVoice,
            email_notifications: newProfile.emailNotifications,
            weekly_digest: newProfile.weeklyDigest,
            updated_at: new Date().toISOString(),
          })
          .eq('id', authUser.id);

        if (error) {
          console.error('[PROFILE] Failed to update profile in Supabase:', error.message);
          set({ isSaving: false });
          return false;
        }
      } catch (err) {
        console.error('[PROFILE] Exception updating profile in Supabase:', err);
        set({ isSaving: false });
        return false;
      }
    }

    // Sync with Interview Store
    useInterviewStore.getState().setSetupConfig({
      selectedRoleTitle: newProfile.targetRole,
      experienceLevel:
        newProfile.experienceLevel === 'Student' || newProfile.experienceLevel === 'Junior'
          ? 'Entry'
          : newProfile.experienceLevel === 'Senior'
          ? 'Senior'
          : 'Mid',
      difficulty: newProfile.difficulty,
      resumeFileName: newProfile.resumeFileName,
    });

    const isComplete = Boolean(newProfile.targetRole && newProfile.targetRole.trim().length > 0 && newProfile.experienceLevel);
    set({ isOnboarded: isComplete, isSaving: false });
    return true;
  },

  completeOnboarding: async (data) => {
    return get().updateProfile(data);
  },

  addSkill: (skill) => {
    const cleanSkill = skill.trim();
    if (!cleanSkill) return;
    const currentSkills = get().profile.skills;
    if (currentSkills.some((s) => s.toLowerCase() === cleanSkill.toLowerCase())) return;
    get().updateProfile({ skills: [...currentSkills, cleanSkill] });
  },

  removeSkill: (skillToRemove) => {
    const currentSkills = get().profile.skills;
    get().updateProfile({
      skills: currentSkills.filter((s) => s !== skillToRemove),
    });
  },

  setResume: (fileName, fileSize) => {
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    get().updateProfile({
      resumeFileName: fileName,
      resumeUploadDate: formattedDate,
      resumeFileSize: fileSize,
    });
  },

  removeResume: () => {
    get().updateProfile({
      resumeFileName: null,
      resumeUploadDate: null,
      resumeFileSize: null,
    });
  },

  resetProfile: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
    set({
      profile: defaultEmptyProfile,
      isOnboarded: false,
      isLoaded: false,
      isSaving: false,
    });
  },
}));
