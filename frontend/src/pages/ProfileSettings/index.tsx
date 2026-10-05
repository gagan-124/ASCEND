import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles } from 'lucide-react';
import {
  SettingsNav,
  type SettingsTabId,
} from './components/SettingsNav';
import { PersonalProfileSection } from './components/PersonalProfileSection';
import { InterviewProfileSection } from './components/InterviewProfileSection';
import { ResumeSection } from './components/ResumeSection';
import { PreferencesSection } from './components/PreferencesSection';
import { AccountSection } from './components/AccountSection';
import { SuccessToast } from './components/SuccessToast';

export function ProfileSettingsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = (searchParams.get('tab') as SettingsTabId) || 'profile';

  const [activeTab, setActiveTab] = useState<SettingsTabId>(tabParam);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('Changes saved successfully');

  const handleSelectTab = (tabId: SettingsTabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId }, { replace: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const triggerSaveSuccess = (customMsg?: string) => {
    if (customMsg) setToastMessage(customMsg);
    else setToastMessage('Changes saved successfully');
    setShowToast(true);
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="w-full min-h-screen bg-background text-foreground font-sans px-4 sm:px-6 lg:px-12 py-8 max-w-[1250px] mx-auto space-y-8 select-none">
      {/* 1. TOP HEADER & NAVIGATION */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="pb-5 border-b border-border/40 flex flex-col sm:flex-row sm:items-end justify-between gap-4"
      >
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 text-xs font-mono text-foreground/60 hover:text-foreground transition-colors cursor-pointer px-2.5 py-1 rounded-lg border border-border/40 bg-surface/40 hover:bg-surface"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <span className="text-xs font-mono uppercase tracking-widest text-accent font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span>YOUR INTERVIEW IDENTITY</span>
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-stardom text-foreground uppercase tracking-tight">
            PROFILE SETTINGS
          </h1>
          <p className="text-xs sm:text-sm font-sans text-foreground/60 leading-relaxed max-w-xl">
            Manage the information ASCEND uses to personalize your interview practice, qualification scoring, and telemetry.
          </p>
        </div>
      </motion.div>

      {/* 2. TWO-COLUMN DESKTOP / STACKED MOBILE LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT SIDEBAR NAVIGATION (4 cols on desktop) */}
        <div className="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-8">
          <SettingsNav
            activeTab={activeTab}
            onSelectTab={handleSelectTab}
          />
        </div>

        {/* RIGHT CONTENT PANEL (8 cols on desktop) */}
        <div className="lg:col-span-8 xl:col-span-9 w-full">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {activeTab === 'profile' && (
              <PersonalProfileSection
                onSaveSuccess={() => triggerSaveSuccess('Profile information updated')}
              />
            )}

            {activeTab === 'interview' && (
              <InterviewProfileSection
                onSaveSuccess={() => triggerSaveSuccess('Interview calibration profile saved')}
              />
            )}

            {activeTab === 'resume' && (
              <ResumeSection
                onSaveSuccess={() => triggerSaveSuccess('Resume document updated')}
              />
            )}

            {activeTab === 'preferences' && (
              <PreferencesSection
                onSaveSuccess={() => triggerSaveSuccess('Interview session preferences saved')}
              />
            )}

            {activeTab === 'account' && (
              <AccountSection
                onSaveSuccess={() => triggerSaveSuccess('Account security settings updated')}
              />
            )}
          </motion.div>
        </div>
      </div>

      {/* RESTRAINED SUCCESS FEEDBACK TOAST */}
      <SuccessToast
        isVisible={showToast}
        message={toastMessage}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
}
