import React, { useState, useRef } from 'react';
import { Camera, Lock, Check, RefreshCw, X, AlertCircle } from 'lucide-react';
import { useProfileStore } from '@/stores/profileStore';
import { LoadingButton } from '@/components/common';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

export interface PersonalProfileSectionProps {
  onSaveSuccess: () => void;
  className?: string;
}

const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024; // 5MB limit
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

export const PersonalProfileSection: React.FC<PersonalProfileSectionProps> = ({
  onSaveSuccess,
  className,
}) => {
  const { profile, updateProfile } = useProfileStore();

  const [fullName, setFullName] = useState(profile.fullName);
  const [headline, setHeadline] = useState(profile.headline);
  const [location, setLocation] = useState(profile.location);

  // Local state for avatar preview & pending file selection BEFORE save
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(profile.avatarUrl);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewAvatarUrl, setPreviewAvatarUrl] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAvatarError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate image format
    if (!ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase())) {
      setAvatarError('Please select a valid PNG, JPG, or WebP image file.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validate size limit
    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      setAvatarError('Image file size must be less than 5MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Immediate local preview ONLY — DO NOT upload before Save Profile
    setSelectedFile(file);
    const localPreview = URL.createObjectURL(file);
    setPreviewAvatarUrl(localPreview);
  };

  const handleRemoveAvatar = () => {
    setSelectedFile(null);
    setPreviewAvatarUrl(null);
    setCurrentAvatarUrl(null);
    setAvatarError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setAvatarError(null);

    let finalAvatarUrl = currentAvatarUrl;

    try {
      if (selectedFile) {
        if (supabase) {
          const fileExt = selectedFile.name.split('.').pop() || 'png';
          const filePath = `avatars/${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
          const { error: uploadErr } = await supabase.storage.from('avatars').upload(filePath, selectedFile, {
            upsert: true,
          });

          if (!uploadErr) {
            const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
            finalAvatarUrl = publicUrlData?.publicUrl || null;
          } else {
            console.warn('Supabase storage upload error, using local data fallback:', uploadErr);
            finalAvatarUrl = await fileToBase64(selectedFile);
          }
        } else {
          // Fallback to Base64 DataURL for local prototype persistence
          finalAvatarUrl = await fileToBase64(selectedFile);
        }
      }

      updateProfile({
        fullName: fullName.trim() || profile.fullName,
        headline: headline.trim(),
        location: location.trim(),
        avatarUrl: finalAvatarUrl,
      });

      setCurrentAvatarUrl(finalAvatarUrl);
      setSelectedFile(null);
      setPreviewAvatarUrl(null);
      onSaveSuccess();
    } catch (err) {
      console.error('Failed to save profile avatar:', err);
      setAvatarError('An error occurred while uploading your avatar image.');
    } finally {
      setIsSaving(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const displayAvatarUrl = previewAvatarUrl || currentAvatarUrl;
  const userInitial = (fullName.trim() || profile.fullName || 'U').charAt(0).toUpperCase();

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'p-6 sm:p-8 rounded-2xl bg-surface/30 border border-border/40 space-y-8 font-sans',
        className
      )}
    >
      {/* Section Header */}
      <div className="border-b border-border/40 pb-5">
        <span className="text-xs font-mono uppercase tracking-widest text-accent font-semibold block mb-1">
          01. PERSONAL INFORMATION
        </span>
        <h2 className="text-xl sm:text-2xl font-stardom text-foreground uppercase tracking-tight">
          Personal Profile
        </h2>
        <p className="text-xs sm:text-sm font-sans text-foreground/60 mt-1">
          Configure your primary identification metadata displayed across ASCEND interview reports and telemetry.
        </p>
      </div>

      {/* Profile Avatar Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-5 rounded-xl bg-surface/40 border border-border/40">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          onChange={handleAvatarSelect}
          className="hidden"
        />

        <div className="relative group shrink-0">
          {displayAvatarUrl ? (
            <img
              src={displayAvatarUrl}
              alt="Profile Avatar Preview"
              className="w-20 h-20 rounded-2xl object-cover border border-border/80 shadow-sm"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-foreground/10 border border-border/60 flex items-center justify-center text-foreground text-2xl font-stardom font-bold shadow-sm">
              {userInitial}
            </div>
          )}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-1 -right-1 p-2 rounded-xl bg-foreground text-background border border-background hover:opacity-90 transition-opacity shadow-md cursor-pointer"
            title="Upload profile picture"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">Profile Avatar</h3>
            {previewAvatarUrl && (
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-accent/20 text-foreground font-bold border border-accent/40">
                Preview (Unsaved)
              </span>
            )}
          </div>
          <p className="text-xs text-foreground/60 font-sans max-w-sm">
            PNG, JPG or WebP up to 5MB. Rendered in lockup header and report metrics.
          </p>
          {avatarError && (
            <p className="text-xs text-red-400 font-mono flex items-center gap-1.5 mt-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{avatarError}</span>
            </p>
          )}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-1.5 rounded-lg border border-border/60 bg-surface/60 hover:bg-surface text-foreground font-mono text-xs font-medium uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3 text-foreground/60" />
              <span>{displayAvatarUrl ? 'Change Avatar' : 'Upload Avatar'}</span>
            </button>

            {displayAvatarUrl && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                className="px-3 py-1.5 rounded-lg border border-border/40 hover:border-red-500/40 text-red-400 hover:bg-red-500/10 font-mono text-xs font-medium uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <X className="w-3 h-3" />
                <span>Remove</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Form Fields Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Full Name */}
        <div className="space-y-2">
          <label htmlFor="full-name" className="block text-xs font-mono font-medium uppercase tracking-wider text-foreground/70">
            Full Name
          </label>
          <div className="relative">
            <input
              id="full-name"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Alex Morgan"
              className="w-full h-11 px-3.5 rounded-xl bg-background/60 dark:bg-background/30 border border-border/40 text-foreground text-sm font-sans focus:outline-none focus:ring-2 focus:ring-foreground/40 transition-all"
            />
          </div>
        </div>

        {/* Email Address (Visually Distinct Read-Only Field) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="email" className="block text-xs font-mono font-medium uppercase tracking-wider text-foreground/70">
              Email Address
            </label>
            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-foreground/50 uppercase tracking-widest px-2 py-0.5 rounded bg-surface border border-border/40">
              <Lock className="w-2.5 h-2.5" />
              <span>Read-Only</span>
            </span>
          </div>
          <div className="relative">
            <input
              id="email"
              type="email"
              readOnly
              disabled
              value={profile.email}
              className="w-full h-11 px-3.5 rounded-xl bg-surface/50 border border-border/30 text-foreground/60 text-sm font-sans cursor-not-allowed select-none opacity-80"
            />
          </div>
          <p className="text-[11px] font-sans text-foreground/40">
            Email authentication key cannot be changed directly. Contact support if needed.
          </p>
        </div>

        {/* Professional Headline */}
        <div className="space-y-2">
          <label htmlFor="headline" className="block text-xs font-mono font-medium uppercase tracking-wider text-foreground/70">
            Professional Headline
          </label>
          <input
            id="headline"
            type="text"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="e.g. Senior Full Stack Engineer"
            className="w-full h-11 px-3.5 rounded-xl bg-background/60 dark:bg-background/30 border border-border/40 text-foreground text-sm font-sans focus:outline-none focus:ring-2 focus:ring-foreground/40 transition-all"
          />
        </div>

        {/* Location */}
        <div className="space-y-2">
          <label htmlFor="location" className="block text-xs font-mono font-medium uppercase tracking-wider text-foreground/70">
            Location
          </label>
          <input
            id="location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Chennai, India"
            className="w-full h-11 px-3.5 rounded-xl bg-background/60 dark:bg-background/30 border border-border/40 text-foreground text-sm font-sans focus:outline-none focus:ring-2 focus:ring-foreground/40 transition-all"
          />
        </div>
      </div>

      {/* Primary Action Button / Explicit Save Trigger */}
      <div className="pt-4 border-t border-border/30 flex items-center justify-between">
        <span className="text-xs font-mono text-foreground/50">
          Click Save Profile to persist changes.
        </span>
        <LoadingButton
          type="submit"
          isLoading={isSaving}
          loadingText="SAVING..."
          className="px-6 py-2.5 rounded-xl bg-foreground text-background font-mono text-xs font-bold uppercase tracking-widest hover:opacity-90 active:scale-[0.99] shadow-md"
        >
          <Check className="w-4 h-4" />
          <span>SAVE PROFILE</span>
        </LoadingButton>
      </div>
    </form>
  );
};
