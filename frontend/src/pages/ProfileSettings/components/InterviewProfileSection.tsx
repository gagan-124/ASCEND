import React, { useState } from 'react';
import { Check, Plus, X, Sparkles } from 'lucide-react';
import { useProfileStore } from '@/stores/profileStore';
import { cn } from '@/lib/utils';

export interface InterviewProfileSectionProps {
  onSaveSuccess: () => void;
  className?: string;
}

const PRESET_ROLES = [
  'Software Engineer',
  'AI/ML Engineer',
  'Backend Engineer',
  'Frontend Engineer',
  'Data Scientist',
  'Full Stack Developer',
  'DevOps & Cloud Engineer',
  'Cybersecurity Specialist',
  'Product Manager',
  'System Architect',
];

const EXPERIENCE_LEVELS = [
  { id: 'Student', label: 'Student' },
  { id: 'Entry', label: 'Entry Level' },
  { id: 'Junior', label: 'Junior' },
  { id: 'Mid', label: 'Mid Level' },
  { id: 'Senior', label: 'Senior' },
] as const;

const DIFFICULTY_LEVELS = [
  { id: 'Easy', label: 'Easy', desc: 'Foundational concepts' },
  { id: 'Medium', label: 'Medium', desc: 'Standard industry bar' },
  { id: 'Hard', label: 'Hard', desc: 'Staff / Tech Lead rigor' },
] as const;

export const InterviewProfileSection: React.FC<InterviewProfileSectionProps> = ({
  onSaveSuccess,
  className,
}) => {
  const { profile, updateProfile, addSkill, removeSkill } = useProfileStore();

  const [targetRole, setTargetRole] = useState(profile.targetRole);
  const [experienceLevel, setExperienceLevel] = useState(profile.experienceLevel);
  const [difficulty, setDifficulty] = useState(profile.difficulty);
  const [newSkillInput, setNewSkillInput] = useState('');

  const handleSelectRole = (role: string) => {
    setTargetRole(role);
    updateProfile({ targetRole: role });
    onSaveSuccess();
  };

  const handleRoleBlur = () => {
    const clean = targetRole.trim();
    if (clean && clean !== profile.targetRole) {
      updateProfile({ targetRole: clean });
      onSaveSuccess();
    }
  };

  const handleSelectLevel = (level: typeof profile.experienceLevel) => {
    setExperienceLevel(level);
    updateProfile({ experienceLevel: level });
    onSaveSuccess();
  };

  const handleSelectDifficulty = (diff: typeof profile.difficulty) => {
    setDifficulty(diff);
    updateProfile({ difficulty: diff });
    onSaveSuccess();
  };

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSkillInput.trim()) {
      addSkill(newSkillInput.trim());
      setNewSkillInput('');
      onSaveSuccess();
    }
  };

  const handleRemoveSkill = (skill: string) => {
    removeSkill(skill);
    onSaveSuccess();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      targetRole: targetRole.trim() || 'Software Engineer',
      experienceLevel,
      difficulty,
    });
    onSaveSuccess();
  };

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
          02. INTERVIEW CALIBRATION
        </span>
        <h2 className="text-xl sm:text-2xl font-stardom text-foreground uppercase tracking-tight">
          Interview Profile
        </h2>
        <p className="text-xs sm:text-sm font-sans text-foreground/60 mt-1">
          Define target role profiles, difficulty baseline, and technical skill stacks for ASCEND mock interview generation.
        </p>
      </div>

      {/* Target Role Selector */}
      <div className="space-y-3">
        <label htmlFor="target-role" className="block text-xs font-mono font-medium uppercase tracking-wider text-foreground/70">
          Target Role Profile
        </label>
        <div className="relative">
          <input
            id="target-role"
            type="text"
            required
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            onBlur={handleRoleBlur}
            placeholder="e.g. AI/ML Engineer"
            className="w-full h-11 px-3.5 rounded-xl bg-background/60 dark:bg-background/30 border border-border/40 text-foreground text-sm font-sans focus:outline-none focus:ring-2 focus:ring-foreground/40 transition-all"
          />
        </div>

        {/* Quick Role Suggestions */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-mono text-foreground/40 uppercase tracking-widest mr-1">
            PRESETS:
          </span>
          {PRESET_ROLES.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => handleSelectRole(role)}
              className={cn(
                'px-2.5 py-1 text-[11px] font-mono rounded-lg border transition-all cursor-pointer select-none',
                targetRole === role
                  ? 'bg-foreground text-background border-foreground font-semibold shadow-xs'
                  : 'bg-surface/50 border-border/40 text-foreground/70 hover:border-border hover:text-foreground'
              )}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Experience Level Selector */}
      <div className="space-y-3">
        <label className="block text-xs font-mono font-medium uppercase tracking-wider text-foreground/70">
          Experience Level
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {EXPERIENCE_LEVELS.map((level) => {
            const isSelected = experienceLevel === level.id;
            return (
              <button
                key={level.id}
                type="button"
                onClick={() => handleSelectLevel(level.id as any)}
                className={cn(
                  'py-2.5 px-3 text-xs font-mono uppercase tracking-wider rounded-xl border transition-all cursor-pointer text-center select-none',
                  isSelected
                    ? 'bg-foreground text-background border-foreground font-bold shadow-xs'
                    : 'bg-surface/50 border-border/40 text-foreground/70 hover:border-border hover:text-foreground'
                )}
              >
                {level.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Interview Difficulty */}
      <div className="space-y-3">
        <label className="block text-xs font-mono font-medium uppercase tracking-wider text-foreground/70">
          Interview Difficulty Calibration
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {DIFFICULTY_LEVELS.map((diff) => {
            const isSelected = difficulty === diff.id;
            return (
              <button
                key={diff.id}
                type="button"
                onClick={() => handleSelectDifficulty(diff.id as any)}
                className={cn(
                  'p-3.5 rounded-xl border text-left transition-all cursor-pointer select-none space-y-1',
                  isSelected
                    ? 'bg-surface border-foreground text-foreground shadow-sm ring-1 ring-foreground/20'
                    : 'bg-surface/30 border-border/40 text-foreground/70 hover:border-border hover:text-foreground'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider">
                    {diff.label}
                  </span>
                  {isSelected && <Sparkles className="w-3.5 h-3.5 text-accent" />}
                </div>
                <p className="text-[11px] font-sans text-foreground/50">
                  {diff.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Primary Technical Skills Tag List */}
      <div className="space-y-3">
        <label className="block text-xs font-mono font-medium uppercase tracking-wider text-foreground/70">
          Primary Skills Stack
        </label>

        {/* Existing Skills Chips */}
        <div className="flex flex-wrap gap-2 p-4 rounded-xl bg-surface/40 border border-border/40 min-h-[64px] items-center">
          {profile.skills.length === 0 ? (
            <span className="text-xs font-sans text-foreground/40 italic">
              No skills added yet. Add your core technical competencies below.
            </span>
          ) : (
            profile.skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface border border-border/60 text-foreground text-xs font-mono font-medium uppercase tracking-wider shadow-xs"
              >
                <span>{skill}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="p-0.5 rounded hover:bg-foreground/10 text-foreground/50 hover:text-foreground transition-colors cursor-pointer"
                  title={`Remove ${skill}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))
          )}
        </div>

        {/* Add Skill Form */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newSkillInput}
            onChange={(e) => setNewSkillInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddSkill(e);
              }
            }}
            placeholder="Add new skill (e.g. FastAPI, Docker, PyTorch)..."
            className="flex-1 h-10 px-3.5 rounded-xl bg-background/60 dark:bg-background/30 border border-border/40 text-foreground text-xs font-sans focus:outline-none focus:ring-2 focus:ring-foreground/40 transition-all"
          />
          <button
            type="button"
            onClick={handleAddSkill}
            disabled={!newSkillInput.trim()}
            className="h-10 px-4 rounded-xl border border-border/60 bg-surface hover:bg-surface-muted disabled:opacity-40 text-foreground font-mono text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Skill</span>
          </button>
        </div>
      </div>

      {/* Save Action */}
      <div className="pt-4 border-t border-border/30 flex items-center justify-between">
        <span className="text-xs font-mono text-foreground/50">
          Calibration options update immediately.
        </span>
        <button
          type="submit"
          className="px-6 py-2.5 rounded-xl bg-foreground text-background font-mono text-xs font-bold uppercase tracking-widest hover:opacity-90 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
        >
          <Check className="w-4 h-4" />
          <span>SAVE PROFILE</span>
        </button>
      </div>
    </form>
  );
};
