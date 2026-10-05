
interface JobDescriptionInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
}

export const JobDescriptionInput: React.FC<JobDescriptionInputProps> = ({
  value,
  onChange,
  error,
}) => {
  return (
    <div className="space-y-2 font-sans">
      <div className="flex items-center justify-between">
        <label
          htmlFor="job-description"
          className="text-xs font-mono uppercase tracking-widest text-accent font-semibold"
        >
          2. JOB DESCRIPTION (REQUIRED FOR EVALUATION)
        </label>
        <span className="text-xs font-mono text-foreground-muted">
          {value.trim().length} chars
        </span>
      </div>

      <div className="relative">
        <textarea
          id="job-description"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste the target job description here (e.g. Senior Software Engineer role requirements, responsibilities, and qualifications)..."
          rows={6}
          className="w-full p-4 bg-surface/20 border border-border/60 focus:border-accent text-sm text-foreground placeholder:text-foreground-muted/60 font-sans leading-relaxed focus:outline-none focus:ring-1 focus:ring-accent transition-colors resize-y min-h-[140px]"
        />
      </div>

      {error && (
        <p className="text-xs font-mono text-red-400 mt-1">
          {error}
        </p>
      )}
    </div>
  );
};
