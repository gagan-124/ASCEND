import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

export interface SuccessToastProps {
  isVisible: boolean;
  message?: string;
  onClose: () => void;
}

export const SuccessToast: React.FC<SuccessToastProps> = ({
  isVisible,
  message = 'Changes saved successfully',
  onClose,
}) => {
  useEffect(() => {
    if (!isVisible) return;
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [isVisible, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.95 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-surface border border-emerald-500/40 text-foreground text-xs font-mono shadow-2xl flex items-center gap-2.5 backdrop-blur-md"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="font-medium tracking-wide">{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
