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
  updateProfile: (updates: Partial<UserProfileData>) => void;
  addSkill: (skill: string) => void;
  removeSkill: (skill: string) => void;
  setResume: (fileName: string, fileSize: string) => void;
  removeResume: () => void;
  resetProfile: () => void;
}

const STORAGE_KEY = 'ascend_profile_settings';

const initialProfile: UserProfileData = {
  fullName: 'Alex Morgan',
  email: 'candidate@company.com',
  avatarUrl: null,
  headline: 'Senior Full Stack Engineer',
  location: 'Chennai, India',
  targetRole: 'Software Engineer',
  experienceLevel: 'Senior',
  difficulty: 'Medium',
  skills: ['React', 'TypeScript', 'Node.js', 'Python', 'System Design'],
  resumeFileName: 'alex_morgan_senior_engineer_resume.pdf',
  resumeUploadDate: 'Sep 24, 2026',
  resumeFileSize: '1.2 MB',
  interviewDuration: 30,
  questionsPerSession: 10,
  allowHints: true,
  allowFollowUps: true,
  enableVoice: false,
  emailNotifications: true,
  weeklyDigest: true,
};

function getSavedProfile(): UserProfileData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...initialProfile, ...parsed };
    }
  } catch (err) {
    console.error('Failed to load saved profile settings:', err);
  }
  return initialProfile;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: getSavedProfile(),

  updateProfile: (updates) => {
    set((state) => {
      const newProfile = { ...state.profile, ...updates };

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newProfile));
      } catch (err) {
        console.error('Failed to save profile settings:', err);
      }

      // Sync with Auth Store if fullName or avatar changes
      const authUser = useAuthStore.getState().user;
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

      // Sync with Supabase if connected
      if (supabase && authUser?.id) {
        (async () => {
          try {
            await supabase.from('profiles').upsert({
              id: authUser.id,
              full_name: newProfile.fullName,
              avatar_path: newProfile.avatarUrl,
              target_role: newProfile.targetRole,
              experience_level: newProfile.experienceLevel,
              headline: newProfile.headline,
              location: newProfile.location,
              skills: newProfile.skills,
              resume_file_name: newProfile.resumeFileName,
              resume_upload_date: newProfile.resumeUploadDate,
              resume_file_size: newProfile.resumeFileSize,
              interview_duration: newProfile.interviewDuration,
              questions_per_session: newProfile.questionsPerSession,
              allow_hints: newProfile.allowHints,
              allow_follow_ups: newProfile.allowFollowUps,
              enable_voice: newProfile.enableVoice,
              email_notifications: newProfile.emailNotifications,
              weekly_digest: newProfile.weeklyDigest,
            });
          } catch (err) {
            console.error('Failed to sync profile update to Supabase:', err);
          }
        })();
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

      return { profile: newProfile };
    });
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
    localStorage.removeItem(STORAGE_KEY);
    set({ profile: initialProfile });
  },
}));

