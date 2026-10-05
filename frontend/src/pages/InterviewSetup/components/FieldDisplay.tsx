import React, { useState, useEffect, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { INTERVIEW_FIELDS, type InterviewField } from '../data/fields';
import { Spotlight } from '@/components/ui/spotlight';
import { ArrowRight, CheckCircle2, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/uiStore';

export interface FieldDisplayProps {
  selectedFieldId?: string | null;
  onSelectField?: (field: InterviewField) => void;
  onProceedToRoles?: (field: InterviewField) => void;
  className?: string;
}

export const FieldDisplay: React.FC<FieldDisplayProps> = ({
  selectedFieldId,
  onSelectField,
  onProceedToRoles,
  className,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const theme = useUIStore((state) => state.theme);
  const isDark = theme === 'dark';

  const [activeId, setActiveId] = useState<string>(
    selectedFieldId || INTERVIEW_FIELDS[0].id
  );
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedFieldId) {
      setActiveId(selectedFieldId);
    }
  }, [selectedFieldId]);

  const handleFieldClick = useCallback(
    (field: InterviewField) => {
      setActiveId(field.id);
      onSelectField?.(field);
    },
    [onSelectField]
  );

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleFieldClick(INTERVIEW_FIELDS[index]);
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (index + 1) % INTERVIEW_FIELDS.length;
      handleFieldClick(INTERVIEW_FIELDS[nextIndex]);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = (index - 1 + INTERVIEW_FIELDS.length) % INTERVIEW_FIELDS.length;
      handleFieldClick(INTERVIEW_FIELDS[prevIndex]);
    }
  };

  const currentActiveField =
    INTERVIEW_FIELDS.find((f) => f.id === activeId) || INTERVIEW_FIELDS[0];

  return (
    <div
      className={cn(
        'w-full max-w-[1440px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10 py-1 sm:py-2 select-none relative flex flex-col justify-between',
        className
      )}
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-3 lg:mb-4 gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] sm:text-xs font-semibold uppercase tracking-widest px-2.5 py-0.5 rounded-full border border-border/60 bg-surface/50 text-foreground/70 inline-flex items-center gap-1.5">
              <Filter className="w-3 h-3 text-accent" />
              <span>Step 02 · Domain Protocol</span>
            </span>
          </div>
          <h2 className="text-xl sm:text-3xl lg:text-4xl font-stardom font-normal text-foreground uppercase tracking-tight leading-none">
            Select Technical Field
          </h2>
          <p className="text-xs sm:text-sm font-sans text-foreground/70 mt-1 max-w-xl">
            Choose your core domain. Each field configures a specialized technical matrix.
          </p>
        </div>

        {/* Selected Field Indicator */}
        <div className="flex items-center gap-3 px-3.5 py-2 rounded-xl bg-surface/90 border border-border/80 shadow-sm backdrop-blur-sm self-start md:self-auto shrink-0">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <div className="text-left">
            <span className="font-mono text-[9px] uppercase tracking-wider text-foreground/60 block">
              Active Selection
            </span>
            <span className="font-stardom text-xs sm:text-sm font-normal uppercase text-foreground">
              {currentActiveField.name}
            </span>
          </div>
        </div>
      </div>

      {/* Primary Field Row (FLD-01 to FLD-08): Fixed-Height Controlled Stage */}
      <div className="hidden lg:flex items-stretch gap-3 xl:gap-4 h-[250px] lg:h-[280px] xl:h-[310px] 2xl:h-[340px] w-full py-1 pt-4">
        {INTERVIEW_FIELDS.slice(0, 8).map((field, index) => {
          const isSelected = activeId === field.id;
          const isHovered = hoveredId === field.id;
          const isFocused = focusedId === field.id;
          const isInteract = isHovered || isFocused;
          const Icon = field.icon;

          // Width ratio is strictly driven by selection, NEVER by hover
          const flexGrow = isSelected ? 3.2 : 1.0;

          return (
            <motion.div
              key={field.id}
              onClick={() => handleFieldClick(field)}
              onMouseEnter={() => setHoveredId(field.id)}
              onMouseLeave={() => setHoveredId(null)}
              onFocus={() => setFocusedId(field.id)}
              onBlur={() => setFocusedId(null)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              tabIndex={0}
              role="button"
              aria-selected={isSelected}
              aria-label={`${field.code}: ${field.name} - ${field.description}`}
              animate={{
                flex: `${flexGrow} 1 0%`,
              }}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : {
                      duration: 0.35,
                      ease: [0.16, 1, 0.3, 1],
                    }
              }
              className={cn(
                'relative overflow-hidden rounded-2xl cursor-pointer text-left flex flex-col justify-between group border select-none transition-colors duration-200 h-full p-3.5 sm:p-4 xl:p-5 outline-none',
                isDark ? 'bg-slate-950/90 shadow-2xl' : 'bg-slate-900/90 shadow-xl',
                isSelected
                  ? 'border-white/90 ring-2 ring-white/30 shadow-2xl'
                  : isInteract
                  ? 'border-white/60 shadow-xl ring-1 ring-white/20'
                  : 'border-white/15 hover:border-white/40'
              )}
            >
              {/* Background Visual Layer */}
              <div className="absolute inset-0 z-0 overflow-hidden rounded-2xl pointer-events-none">
                <motion.img
                  src={field.image}
                  alt=""
                  animate={{
                    scale: isSelected ? 1.0 : isInteract ? 1.03 : 1.0,
                    opacity: isSelected ? 0.95 : isInteract ? 0.65 : 0.55,
                  }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="w-full h-full object-cover select-none brightness-95 contrast-110"
                />
                <motion.div
                  animate={{
                    opacity: isSelected ? 0.65 : isInteract ? 0.92 : 0.82,
                  }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/70 to-black/20 pointer-events-none"
                />
              </div>

              {/* Spotlight Highlight */}
              <Spotlight size={280} className="from-accent/25 via-accent/10 to-transparent relative z-10" />

              {/* Top Header: Code & Icon */}
              <div className="flex items-center justify-between w-full relative z-10 gap-1.5 shrink-0">
                <span
                  className={cn(
                    'font-mono text-[9px] xl:text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full font-semibold border backdrop-blur-md shrink-0 transition-colors duration-200',
                    isSelected || isInteract
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                      : 'bg-black/60 text-white/80 border-white/20'
                  )}
                >
                  {field.code}
                </span>
                <div
                  className={cn(
                    'w-7 h-7 xl:w-8 xl:h-8 rounded-xl border flex items-center justify-center transition-all duration-200 backdrop-blur-md shrink-0',
                    isSelected
                      ? 'bg-white text-black border-white shadow-md scale-105'
                      : isInteract
                      ? 'bg-white/20 border-white/40 text-white scale-105'
                      : 'bg-black/40 border-white/20 text-white'
                  )}
                >
                  <Icon className="w-3.5 h-3.5 xl:w-4 xl:h-4 stroke-[1.75]" />
                </div>
              </div>

              {/* Bottom Content Area: Field Name is ALWAYS VISIBLE */}
              <div className="mt-auto relative z-10 w-full flex flex-col justify-end">
                <div className="flex items-start justify-between gap-1.5">
                  <h3
                    className={cn(
                      'font-stardom font-normal uppercase tracking-tight transition-all duration-200 drop-shadow-md text-white',
                      isSelected
                        ? 'text-base sm:text-lg xl:text-2xl 2xl:text-3xl'
                        : isInteract
                        ? 'text-xs xl:text-sm text-emerald-300 font-medium leading-tight'
                        : 'text-xs xl:text-sm font-normal leading-tight text-white/95'
                    )}
                  >
                    {field.name}
                  </h3>

                  {isSelected && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 drop-shadow mt-0.5" />
                  )}
                </div>

                {/* Hover / Selected Contextual Information Reveal */}
                <motion.div
                  initial={false}
                  animate={{
                    height: isSelected || isInteract ? 'auto' : 0,
                    opacity: isSelected || isInteract ? 1 : 0,
                  }}
                  transition={
                    shouldReduceMotion
                      ? { duration: 0 }
                      : { duration: 0.2, ease: 'easeOut' }
                  }
                  className="overflow-hidden"
                >
                  <div className="pt-2 space-y-2">
                    <p
                      className={cn(
                        'text-xs xl:text-sm font-sans text-white/90 leading-snug drop-shadow-sm',
                        isSelected ? 'line-clamp-3' : 'line-clamp-2'
                      )}
                    >
                      {field.description}
                    </p>

                    {field.tags && field.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {field.tags.map((tag) => (
                          <span
                            key={tag}
                            className="font-mono text-[9px] xl:text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/20 text-white font-medium border border-white/25 backdrop-blur-md shadow-sm"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Action Prompt */}
                <div className="mt-2.5 pt-2 border-t border-white/20 flex items-center justify-between text-[10px] xl:text-xs font-mono font-medium uppercase tracking-wider text-white/90 shrink-0">
                  <span className="truncate">{isSelected ? 'Selected Domain' : 'Select Field'}</span>
                  <ArrowRight
                    className={cn(
                      'w-3.5 h-3.5 shrink-0 transition-transform duration-200 ml-1 text-white',
                      isSelected || isInteract ? 'translate-x-1 text-emerald-400' : ''
                    )}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Secondary Field Row (FLD-09 to FLD-14): Stable 6-Column Grid */}
      <div className="hidden lg:grid grid-cols-6 gap-3 lg:gap-4 mt-3 lg:mt-4">
        {INTERVIEW_FIELDS.slice(8).map((field, index) => {
          const secondaryIndex = index + 8;
          const isSelected = activeId === field.id;
          const isHovered = hoveredId === field.id;
          const isFocused = focusedId === field.id;
          const isInteract = isHovered || isFocused;
          const Icon = field.icon;

          return (
            <motion.div
              key={field.id}
              onClick={() => handleFieldClick(field)}
              onMouseEnter={() => setHoveredId(field.id)}
              onMouseLeave={() => setHoveredId(null)}
              onFocus={() => setFocusedId(field.id)}
              onBlur={() => setFocusedId(null)}
              onKeyDown={(e) => handleKeyDown(e, secondaryIndex)}
              tabIndex={0}
              role="button"
              aria-selected={isSelected}
              aria-label={`${field.code}: ${field.name} - ${field.description}`}
              className={cn(
                'relative overflow-hidden p-3 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between h-[92px] lg:h-[100px] xl:h-[108px] group bg-slate-950/90 cursor-pointer select-none outline-none',
                isSelected
                  ? 'border-white ring-2 ring-white/30 shadow-lg'
                  : isInteract
                  ? 'border-white/60 ring-1 ring-white/20 shadow-md'
                  : 'border-white/15 hover:border-white/40'
              )}
            >
              {/* Background Visual Layer */}
              <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none rounded-2xl">
                <img
                  src={field.image}
                  alt=""
                  className={cn(
                    'w-full h-full object-cover transition-all duration-200 select-none brightness-95 contrast-110',
                    isSelected
                      ? 'scale-105 opacity-90'
                      : isInteract
                      ? 'scale-105 opacity-70'
                      : 'scale-100 opacity-55'
                  )}
                />
                <div
                  className={cn(
                    'absolute inset-0 transition-opacity duration-200 bg-gradient-to-t from-black/95 via-black/70 to-black/20',
                    isSelected ? 'opacity-70' : isInteract ? 'opacity-90' : 'opacity-82'
                  )}
                />
              </div>

              {/* Top Header: Code & Icon */}
              <div className="relative z-10 flex items-center justify-between w-full">
                <span
                  className={cn(
                    'font-mono text-[9px] xl:text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-semibold border backdrop-blur-md transition-colors duration-200',
                    isSelected || isInteract
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                      : 'bg-black/60 text-white/70 border-white/20'
                  )}
                >
                  {field.code}
                </span>
                <Icon className={cn("w-3.5 h-3.5 xl:w-4 xl:h-4 transition-colors", isSelected || isInteract ? "text-emerald-300" : "text-white/80")} />
              </div>

              {/* Bottom Header: Field Name & Contextual Tags */}
              <div className="relative z-10 flex flex-col justify-end mt-auto">
                <h3 className={cn(
                  "font-stardom text-xs xl:text-sm font-normal uppercase tracking-tight line-clamp-1 drop-shadow-md transition-colors",
                  isSelected || isInteract ? "text-emerald-300" : "text-white"
                )}>
                  {field.name}
                </h3>

                <motion.div
                  initial={false}
                  animate={{
                    height: isSelected || isInteract ? 'auto' : 0,
                    opacity: isSelected || isInteract ? 1 : 0,
                  }}
                  transition={
                    shouldReduceMotion
                      ? { duration: 0 }
                      : { duration: 0.2, ease: 'easeOut' }
                  }
                  className="overflow-hidden"
                >
                  <div className="pt-1 flex flex-wrap gap-1">
                    {field.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="font-mono text-[8px] xl:text-[9px] uppercase tracking-wider px-1.5 py-0.2 rounded bg-white/20 text-white border border-white/20 backdrop-blur-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Mobile & Tablet Layout (< 1024px): Touch-Friendly Grid showing Full Names */}
      <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-2">
        {INTERVIEW_FIELDS.map((field, index) => {
          const isSelected = activeId === field.id;
          const Icon = field.icon;

          return (
            <motion.div
              key={field.id}
              onClick={() => handleFieldClick(field)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              tabIndex={0}
              role="button"
              aria-selected={isSelected}
              aria-label={`${field.code}: ${field.name} - ${field.description}`}
              className={cn(
                'relative overflow-hidden rounded-2xl p-5 cursor-pointer text-left transition-all duration-200 bg-slate-950/90 border outline-none',
                isSelected
                  ? 'border-white ring-2 ring-white/30 shadow-lg'
                  : 'border-white/15 hover:border-white/40 focus:border-white/60'
              )}
            >
              <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <img
                  src={field.image}
                  alt=""
                  className={cn(
                    'w-full h-full object-cover transition-all duration-200 select-none brightness-95 contrast-110',
                    isSelected ? 'scale-105 opacity-90' : 'scale-100 opacity-60'
                  )}
                />
                <div
                  className={cn(
                    'absolute inset-0 transition-opacity duration-200 bg-gradient-to-t from-black/95 via-black/70 to-black/20',
                    isSelected ? 'opacity-70' : 'opacity-85'
                  )}
                />
              </div>

              <div className="relative z-10 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-xl border flex items-center justify-center backdrop-blur-md',
                      isSelected
                        ? 'bg-white text-black border-white'
                        : 'bg-black/40 border-white/20 text-white'
                    )}
                  >
                    <Icon className="w-5 h-5 stroke-[1.75]" />
                  </div>
                  <div>
                    <span className="font-mono text-[10px] uppercase text-white/70 font-semibold block">
                      {field.code}
                    </span>
                    <h3 className="font-stardom text-base font-normal uppercase tracking-tight text-white drop-shadow-md">
                      {field.name}
                    </h3>
                  </div>
                </div>
                {isSelected && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 drop-shadow" />
                )}
              </div>

              <p className="relative z-10 text-xs font-sans text-white/90 mt-3 leading-relaxed drop-shadow-sm">
                {field.description}
              </p>

              <div className="relative z-10 flex flex-wrap gap-1.5 mt-3">
                {field.tags.map((tag) => (
                  <span
                    key={tag}
                    className="font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded bg-white/20 text-white font-medium border border-white/25"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Action CTA: PROCEED TO ROLE SELECTION */}
      {currentActiveField && (
        <div
          className="mt-3 lg:mt-4 pt-3 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0"
        >
          <div className="flex items-center gap-2.5 text-xs font-mono uppercase tracking-wider text-foreground/70">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Selected Domain:</span>
            <span className="font-stardom font-normal text-foreground text-sm sm:text-base uppercase">
              {currentActiveField.name}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onProceedToRoles?.(currentActiveField)}
            className="w-full sm:w-auto px-5 py-2.5 sm:py-3 rounded-xl bg-foreground text-background font-mono text-xs font-semibold uppercase tracking-widest hover:opacity-90 active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 shadow-md group cursor-pointer"
          >
            <span>Proceed to Role Selection</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
          </button>
        </div>
      )}
    </div>
  );
};

