import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useInterviewStore } from '@/stores/interviewStore';
import { INTERVIEW_FIELDS } from '@/pages/InterviewSetup/data/fields';
import { RoleCarousel } from '@/pages/InterviewSetup/components/RoleCarousel';
import { DifficultySection } from '@/pages/InterviewSetup/components/DifficultySection';
import type { InterviewRole } from '@/pages/InterviewSetup/data/roles';
import { ArrowLeft, Sparkles, Layers } from 'lucide-react';

export function InterviewRolesPage() {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const { setupConfig, setSetupConfig } = useInterviewStore();

  const difficultySectionRef = useRef<HTMLElement | null>(null);
  const isTransitioningRef = useRef<boolean>(false);
  const pendingScrollRef = useRef<boolean>(false);

  const selectedFieldId = setupConfig.selectedField || INTERVIEW_FIELDS[0].id;
  const currentField = INTERVIEW_FIELDS.find((f) => f.id === selectedFieldId);

  // Scroll to top on initial mount ONLY if role is not already confirmed
  useEffect(() => {
    if (!setupConfig.roleConfirmed) {
      window.scrollTo({ top: 0, behavior: shouldReduceMotion ? 'auto' : 'smooth' });
    }
  }, []);

  // Single controlled transition effect to perform auto-scroll strictly AFTER DOM layout paint
  useEffect(() => {
    if (setupConfig.roleConfirmed && pendingScrollRef.current) {
      pendingScrollRef.current = false;

      // Wait two animation frames to ensure React DOM mounting, animation layout, and reflow are committed
      const frameId1 = requestAnimationFrame(() => {
        const frameId2 = requestAnimationFrame(() => {
          if (difficultySectionRef.current) {
            const rect = difficultySectionRef.current.getBoundingClientRect();
            // Account for sticky/fixed navbar (72px) + breathing buffer (16px) = 88px
            const navbarOffset = 88;
            const targetY = Math.max(0, window.scrollY + rect.top - navbarOffset);

            window.scrollTo({
              top: targetY,
              behavior: shouldReduceMotion ? 'auto' : 'smooth',
            });
          }
          isTransitioningRef.current = false;
        });

        return () => cancelAnimationFrame(frameId2);
      });

      return () => cancelAnimationFrame(frameId1);
    }
  }, [setupConfig.roleConfirmed, shouldReduceMotion]);

  const handleBackToFields = () => {
    setSetupConfig({
      mode: 'role',
      selectedField: null,
      selectedRoleId: null,
      roleConfirmed: false,
      difficulty: undefined,
    });
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/interview/setup?mode=role');
    }
  };

  const handleConfirmRole = (role: InterviewRole) => {
    // Guard against duplicate rapid click transitions
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;
    pendingScrollRef.current = true;

    setSetupConfig({
      selectedRoleId: role.id,
      selectedRoleTitle: role.title,
      roleConfirmed: true,
    });
  };

  const handleChangeRole = () => {
    isTransitioningRef.current = false;
    pendingScrollRef.current = false;
    setSetupConfig({
      roleConfirmed: false,
    });
  };

  const handleStartInterview = () => {
    navigate('/interview/room');
  };

  return (
    <div className="flex-1 min-h-[calc(100vh-72px)] flex flex-col justify-start py-6 sm:py-10 bg-background text-foreground transition-colors duration-150 overflow-x-hidden relative">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 flex flex-col items-center">
        {/* Top Header Navigation */}
        <div className="w-full flex items-center justify-between mb-6 pb-4 border-b border-border/40">
          <button
            type="button"
            onClick={handleBackToFields}
            className="inline-flex items-center gap-2 text-xs font-mono font-medium uppercase tracking-wider text-foreground/70 hover:text-foreground transition-colors px-3 py-1.5 rounded-lg border border-border/60 bg-surface/60 hover:bg-surface cursor-pointer backdrop-blur-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Change Field</span>
          </button>

          <div className="flex items-center gap-2 font-mono text-xs text-foreground/50 uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>PROTOCOL: ASCEND-ROL-03</span>
          </div>
        </div>

        {/* Header Section */}
        <div className="w-full max-w-4xl text-center flex flex-col items-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/30 text-accent font-mono text-xs font-semibold uppercase tracking-widest mb-3">
            <Layers className="w-3.5 h-3.5" />
            <span>STEP 03 · ROLE PROTOCOL</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-stardom font-normal text-foreground uppercase tracking-tight mb-2">
            SELECT YOUR TARGET ROLE
          </h1>

          <p className="text-xs sm:text-sm font-sans text-foreground/70 max-w-xl leading-relaxed mb-4">
            Choose the specialized interview profile you want to practice. Each profile features calibrated technical competencies.
          </p>

          {/* Current Field Identifier Badge */}
          {currentField && (
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-xl bg-surface/90 border border-border/80 text-foreground text-xs font-mono font-medium shadow-sm backdrop-blur-sm">
              <span className="text-foreground/50 uppercase tracking-wider">DOMAIN:</span>
              <span className="font-semibold uppercase tracking-widest text-primary">
                {currentField.name}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-foreground/10 text-foreground/80 font-bold border border-border/40">
                {currentField.roleCount || 10} PROFILES
              </span>
            </div>
          )}
        </div>

        {/* Role Selection Spotlight Carousel */}
        <div className="w-full">
          <RoleCarousel
            selectedFieldId={selectedFieldId}
            selectedRoleId={setupConfig.selectedRoleId}
            roleConfirmed={setupConfig.roleConfirmed}
            onConfirmRole={handleConfirmRole}
            onChangeRole={handleChangeRole}
          />
        </div>

        {/* Smoothly Revealed Difficulty Calibration Section (Visible ONLY after role confirmation) */}
        <AnimatePresence>
          {setupConfig.roleConfirmed && (
            <motion.section
              ref={difficultySectionRef}
              id="difficulty-section"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : { duration: 0.3, ease: 'easeOut' }
              }
              className="w-full mt-6 pt-6 border-t border-border/40 scroll-mt-20 sm:scroll-mt-24 lg:scroll-mt-28"
            >
              <DifficultySection onStartInterview={handleStartInterview} />
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}


