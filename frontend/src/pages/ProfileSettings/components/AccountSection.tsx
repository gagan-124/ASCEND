import React, { useState } from 'react';
import { ShieldAlert, Bell, Key, AlertTriangle, X } from 'lucide-react';
import { useProfileStore } from '@/stores/profileStore';
import { useAuthStore } from '@/stores/authStore';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export interface AccountSectionProps {
  onSaveSuccess: () => void;
  className?: string;
}

export const AccountSection: React.FC<AccountSectionProps> = ({
  onSaveSuccess,
  className,
}) => {
  const { profile, updateProfile } = useProfileStore();
  const { clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const [emailNotifications, setEmailNotifications] = useState(profile.emailNotifications);
  const [weeklyDigest, setWeeklyDigest] = useState(profile.weeklyDigest);

  // Modals state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    // Success feedback
    setShowPasswordModal(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    onSaveSuccess();
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmationInput.trim() !== 'DELETE') return;
    setIsDeleting(true);

    setTimeout(() => {
      clearAuth();
      setShowDeleteModal(false);
      navigate('/');
    }, 400);
  };

  return (
    <div
      className={cn(
        'p-6 sm:p-8 rounded-2xl bg-surface/30 border border-border/40 space-y-8 font-sans',
        className
      )}
    >
      {/* Section Header */}
      <div className="border-b border-border/40 pb-5">
        <span className="text-xs font-mono uppercase tracking-widest text-accent font-semibold block mb-1">
          05. SECURITY & CREDENTIALS
        </span>
        <h2 className="text-xl sm:text-2xl font-stardom text-foreground uppercase tracking-tight">
          Account Settings
        </h2>
        <p className="text-xs sm:text-sm font-sans text-foreground/60 mt-1">
          Manage authentication credentials, notification preferences, and account deletion protocols.
        </p>
      </div>

      {/* 1. Account Identity & Password Security */}
      <div className="p-5 rounded-xl bg-surface/40 border border-border/40 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-mono font-medium uppercase tracking-wider text-foreground/50 block">
              PRIMARY ACCOUNT IDENTIFIER
            </span>
            <span className="text-base font-semibold text-foreground font-sans block">
              {profile.email}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setPasswordError(null);
              setShowPasswordModal(true);
            }}
            className="px-4 py-2 rounded-xl border border-border/60 bg-surface/60 hover:bg-surface text-foreground font-mono text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer self-start sm:self-auto"
          >
            <Key className="w-3.5 h-3.5 text-foreground/60" />
            <span>Change Password</span>
          </button>
        </div>
      </div>

      {/* 2. Notification Preferences */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-mono uppercase tracking-wider font-semibold text-foreground">
            Notification Preferences
          </h3>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-xl bg-surface/40 border border-border/40 gap-4">
            <div className="space-y-0.5">
              <span className="text-sm font-semibold text-foreground block">
                Session Telemetry Emails
              </span>
              <p className="text-xs text-foreground/60 font-sans">
                Receive completed interview performance scores and radar breakdown reports via email.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={emailNotifications}
              onClick={() => {
                const nextVal = !emailNotifications;
                setEmailNotifications(nextVal);
                updateProfile({ emailNotifications: nextVal });
                onSaveSuccess();
              }}
              className={cn(
                'w-12 h-6 rounded-full transition-colors p-1 cursor-pointer shrink-0 relative',
                emailNotifications ? 'bg-emerald-500' : 'bg-surface/80 border border-border/60'
              )}
            >
              <div
                className={cn(
                  'w-4 h-4 rounded-full bg-white transition-transform shadow-xs',
                  emailNotifications ? 'translate-x-6' : 'translate-x-0'
                )}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-surface/40 border border-border/40 gap-4">
            <div className="space-y-0.5">
              <span className="text-sm font-semibold text-foreground block">
                Weekly Practice Digest
              </span>
              <p className="text-xs text-foreground/60 font-sans">
                Weekly summary of technical readiness score progression and recommended topics.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={weeklyDigest}
              onClick={() => {
                const nextVal = !weeklyDigest;
                setWeeklyDigest(nextVal);
                updateProfile({ weeklyDigest: nextVal });
                onSaveSuccess();
              }}
              className={cn(
                'w-12 h-6 rounded-full transition-colors p-1 cursor-pointer shrink-0 relative',
                weeklyDigest ? 'bg-emerald-500' : 'bg-surface/80 border border-border/60'
              )}
            >
              <div
                className={cn(
                  'w-4 h-4 rounded-full bg-white transition-transform shadow-xs',
                  weeklyDigest ? 'translate-x-6' : 'translate-x-0'
                )}
              />
            </button>
          </div>
        </div>
      </div>

      {/* 3. DANGER ZONE — Visually Separated Destructive Action Box */}
      <div className="mt-10 p-6 rounded-2xl bg-red-500/5 border border-red-500/30 space-y-4">
        <div className="flex items-center gap-2 text-red-400">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <h3 className="text-sm font-mono uppercase tracking-wider font-bold">
            Danger Zone
          </h3>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-sm font-semibold text-foreground block">
              Delete Account
            </span>
            <p className="text-xs text-foreground/60 font-sans max-w-lg leading-relaxed">
              Permanently delete your account, saved resume, interview history telemetry, and evaluation scores.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setDeleteConfirmationInput('');
              setShowDeleteModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-mono text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
          >
            Delete Account
          </button>
        </div>
      </div>

      {/* CHANGE PASSWORD MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-2xl bg-surface border border-border/60 text-foreground shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div className="flex items-center gap-2 font-stardom text-base uppercase font-bold tracking-tight">
                <Key className="w-4 h-4 text-accent" />
                <span>Change Password</span>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="p-1 rounded hover:bg-foreground/10 text-foreground/60 hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {passwordError && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                {passwordError}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase tracking-wider text-foreground/70 block">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-background/60 border border-border/40 text-sm font-sans text-foreground"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase tracking-wider text-foreground/70 block">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-background/60 border border-border/40 text-sm font-sans text-foreground"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase tracking-wider text-foreground/70 block">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-background/60 border border-border/40 text-sm font-sans text-foreground"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 rounded-xl border border-border/40 hover:bg-surface-muted text-foreground/70 hover:text-foreground cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-foreground text-background font-bold tracking-wider uppercase cursor-pointer shadow-md"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE ACCOUNT CONFIRMATION DIALOG */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-2xl bg-[#0e131d] border border-red-500/40 text-white shadow-2xl space-y-5">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="font-stardom text-base uppercase font-bold tracking-tight">
                Confirm Account Deletion
              </h3>
            </div>

            <p className="text-xs text-white/70 leading-relaxed">
              This action is permanent and cannot be undone. All your practice data, interview scores, and telemetry will be erased.
            </p>

            <div className="space-y-2 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs">
              <label className="text-[11px] font-mono text-red-200 block uppercase">
                Type <span className="font-bold text-white font-mono">DELETE</span> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmationInput}
                onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                placeholder="DELETE"
                className="w-full h-9 px-3 rounded-lg bg-black/50 border border-red-500/30 text-white font-mono text-xs focus:outline-none focus:border-red-400"
              />
            </div>

            <div className="pt-1 flex items-center justify-end gap-3 font-mono text-xs">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-white/70 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmationInput.trim() !== 'DELETE' || isDeleting}
                onClick={handleDeleteAccount}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold tracking-wider uppercase transition-colors cursor-pointer shadow-lg shadow-red-600/30"
              >
                {isDeleting ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
