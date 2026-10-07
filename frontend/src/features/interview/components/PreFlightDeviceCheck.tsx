import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Camera,
  Mic,
  CheckCircle2,
  AlertCircle,
  Video,
  MicOff,
  RotateCcw,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserMedia } from '../hooks/useUserMedia';
import { useAudioMeter } from '../hooks/useAudioMeter';
import { useFaceDetection } from '../hooks/useFaceDetection';

export interface PreFlightDeviceCheckProps {
  onComplete: () => Promise<void> | void;
  onCancel: () => void;
  className?: string;
  media?: ReturnType<typeof useUserMedia>;
}

export const PreFlightDeviceCheck: React.FC<PreFlightDeviceCheckProps> = ({
  onComplete,
  onCancel,
  className,
  media,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasConsentedToProctoring, setHasConsentedToProctoring] = useState(false);

  const localMedia = useUserMedia();
  const {
    stream,
    cameraGranted,
    micGranted,
    isMicHardwareMuted,
    cameraError,
    isLoading,
    devices,
    selectedCameraId,
    selectedMicId,
    requestMedia,
    stopTracks,
  } = media || localMedia;


  const {
    audioLevel,
    isTesting,
    countdown,
    testPassed,
    errorMessage: audioTestError,
    startMicTest,
    resetTest,
    cleanupAudio,
  } = useAudioMeter(stream);

  // Request permissions & media on mount
  useEffect(() => {
    requestMedia();
  }, [requestMedia]);

  // Connect MediaStream to video element for live camera preview
  useEffect(() => {
    const videoElement = videoRef.current;
    if (videoElement && stream) {
      videoElement.srcObject = stream;
      videoElement.play().catch(() => {});
    }
    return () => {
      if (videoElement) {
        videoElement.srcObject = null;
      }
    };
  }, [stream]);

  const handleDeviceChange = (type: 'camera' | 'mic', deviceId: string) => {
    resetTest();
    if (type === 'camera') {
      requestMedia(deviceId, selectedMicId);
    } else {
      requestMedia(selectedCameraId, deviceId);
    }
  };

  const handleRetryPermissions = () => {
    resetTest();
    requestMedia(selectedCameraId, selectedMicId);
  };

  const handleContinue = async () => {
    if (isSubmitting || !hasConsentedToProctoring) return;
    setIsSubmitting(true);
    cleanupAudio();
    if (!media) {
      stopTracks();
    }

    try {
      await onComplete();
    } catch {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    cleanupAudio();
    stopTracks();
    onCancel();
  };

  const isCameraReady = cameraGranted && !cameraError && Boolean(stream && stream.getVideoTracks().length > 0 && stream.getVideoTracks()[0].readyState === 'live');

  const {
    faceState,
    guidanceMessage,
    isReady: isFaceReady,
  } = useFaceDetection({
    stream,
    videoRef,
    enabled: isCameraReady,
  });

  const isMicReady = micGranted && !isMicHardwareMuted && Boolean(stream && stream.getAudioTracks().length > 0 && stream.getAudioTracks()[0].readyState === 'live');
  const isAllReady = isCameraReady && isMicReady && testPassed === true && isFaceReady && hasConsentedToProctoring;

  const cameras = devices.filter((d) => d.kind === 'videoinput');
  const mics = devices.filter((d) => d.kind === 'audioinput');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={cn(
        'w-full max-w-2xl mx-auto p-5 sm:p-6 max-h-[92dvh] flex flex-col rounded-2xl bg-surface border border-border/80 text-left select-none shadow-xl font-sans',
        className
      )}
    >
      {/* Top Protocol Header (Fixed) */}
      <div className="flex items-center justify-between pb-3 border-b border-border/40 mb-4 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-foreground/5 text-foreground">
            <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-foreground">
              PRE-FLIGHT HARDWARE VERIFICATION
            </h2>
            <p className="text-[11px] font-sans text-foreground/60">
              ASCEND mandatory device & face proctoring check
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCancel}
          className="text-xs font-mono font-medium text-foreground/60 hover:text-foreground underline cursor-pointer"
        >
          Cancel
        </button>
      </div>

      {/* Internal Scrollable Content Body */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1.5 space-y-4">
        {/* SECTION 1: CAMERA VERIFICATION & PREVIEW */}
        <div className="flex flex-col gap-3 p-4 rounded-xl bg-background/50 border border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-foreground/70" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
                1. CAMERA & FACE PROCTORING PREVIEW
              </span>
            </div>

            {isCameraReady ? (
              isFaceReady ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-semibold uppercase">
                  <CheckCircle2 className="w-3 h-3" />
                  Face Verified (1 Person)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[10px] font-mono font-semibold uppercase">
                  <AlertCircle className="w-3 h-3" />
                  {faceState === 'INITIALIZING' ? 'Loading Face Model...' : 'Face Check Pending'}
                </span>
              )
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[10px] font-mono font-semibold uppercase">
                <AlertCircle className="w-3 h-3" />
                Pending Verification
              </span>
            )}
          </div>

          {/* Video Preview Canvas Surface */}
          <div className="relative w-full max-h-48 sm:max-h-56 aspect-video rounded-xl bg-surface-muted border border-border/60 overflow-hidden flex items-center justify-center">
            {isCameraReady ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center gap-2">
                <Video className="w-8 h-8 text-foreground/30" />
                <p className="text-xs text-foreground/60 max-w-xs">
                  {cameraError || 'Allow browser camera permissions to enable video preview.'}
                </p>
                {cameraError && (
                  <button
                    type="button"
                    onClick={handleRetryPermissions}
                    className="mt-1 px-3 py-1.5 rounded-lg bg-foreground text-background text-xs font-mono font-bold uppercase tracking-wider hover:opacity-90 cursor-pointer"
                  >
                    Retry Permission
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Face Guidance Banner */}
          {isCameraReady && (
            <div
              className={cn(
                'p-2.5 rounded-lg text-xs font-mono font-medium flex items-center gap-2 transition-all',
                isFaceReady
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                  : 'bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200'
              )}
            >
              {isFaceReady ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
              )}
              <span>{guidanceMessage}</span>
            </div>
          )}

          {/* Optional Camera Selector */}
          {cameras.length > 1 && (
            <div className="flex items-center gap-2 pt-1 text-xs">
              <span className="text-[11px] font-mono text-foreground/50 shrink-0">Camera:</span>
              <select
                value={selectedCameraId}
                onChange={(e) => handleDeviceChange('camera', e.target.value)}
                className="w-full p-1.5 rounded-lg bg-surface border border-border/60 text-xs font-sans text-foreground"
              >
                {cameras.map((cam) => (
                  <option key={cam.deviceId} value={cam.deviceId}>
                    {cam.label || `Camera ${cam.deviceId.slice(0, 5)}`}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* SECTION 2: MICROPHONE VERIFICATION & 10-SECOND TEST */}
        <div className="flex flex-col gap-3 p-4 rounded-xl bg-background/50 border border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-foreground/70" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
                2. MICROPHONE TEST (10-SEC DETECTOR)
              </span>
            </div>

            {testPassed === true ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-semibold uppercase">
                <CheckCircle2 className="w-3 h-3" />
                Microphone Passed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-muted text-foreground/70 border border-border/50 text-[10px] font-mono font-semibold uppercase">
                {isTesting ? `Testing (${countdown}s)` : 'Action Required'}
              </span>
            )}
          </div>

          <p className="text-xs text-foreground/70">
            Speak a few words naturally so ASCEND can calibrate your audio level. No test audio is recorded or stored.
          </p>

          {isMicHardwareMuted && (
            <div className="p-3 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div className="space-y-0.5">
                <span className="font-semibold block font-mono text-[11px] uppercase tracking-wide">
                  Microphone Muted by System / Hardware Switch
                </span>
                <p className="text-[11px] opacity-90 font-sans leading-relaxed">
                  Browser microphone permission is granted, but your microphone input is currently muted at the OS or hardware level. Press your laptop microphone mute key (e.g. F4) or check Windows Privacy Settings to enable signal.
                </p>
              </div>
            </div>
          )}

          {/* Real-time Audio Level Bar Meter */}
          <div className="w-full h-3 rounded-full bg-surface-muted border border-border/60 overflow-hidden relative">
            <div
              className={cn(
                'h-full transition-all duration-75',
                audioLevel > 50
                  ? 'bg-emerald-500'
                  : audioLevel > 15
                  ? 'bg-emerald-400'
                  : 'bg-foreground/30'
              )}
              style={{ width: `${audioLevel}%` }}
            />
          </div>

          {/* Test Action / Status Display */}
          <div className="flex items-center justify-between pt-1">
            {!isTesting && testPassed === null && (
              <button
                type="button"
                disabled={!micGranted || isLoading}
                onClick={startMicTest}
                className="px-4 py-2 rounded-lg bg-foreground text-background text-xs font-mono font-bold uppercase tracking-wider hover:opacity-90 disabled:opacity-50 cursor-pointer flex items-center gap-2"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>START 10-SEC MIC TEST</span>
              </button>
            )}

            {isTesting && (
              <div className="flex items-center gap-3 text-xs font-mono">
                <div className="w-8 h-8 rounded-full border-2 border-foreground border-t-transparent animate-spin flex items-center justify-center font-bold text-[11px]">
                  {countdown}
                </div>
                <span className="text-foreground animate-pulse font-semibold">
                  SPEAK NOW ({countdown}s)...
                </span>
              </div>
            )}

            {testPassed === false && !isTesting && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-destructive font-medium flex items-center gap-1.5">
                  <MicOff className="w-3.5 h-3.5" />
                  {audioTestError || 'No speech detected.'}
                </span>
                <button
                  type="button"
                  onClick={startMicTest}
                  className="px-3 py-1.5 rounded-lg border border-border hover:bg-surface text-xs font-mono font-semibold uppercase flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Retry Test</span>
                </button>
              </div>
            )}

            {testPassed === true && !isTesting && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Audio signal confirmed. Microphone ready for interview.
              </p>
            )}
          </div>

          {/* Optional Mic Selector */}
          {mics.length > 1 && (
            <div className="flex items-center gap-2 pt-1 text-xs">
              <span className="text-[11px] font-mono text-foreground/50 shrink-0">Microphone:</span>
              <select
                value={selectedMicId}
                onChange={(e) => handleDeviceChange('mic', e.target.value)}
                className="w-full p-1.5 rounded-lg bg-surface border border-border/60 text-xs font-sans text-foreground"
              >
                {mics.map((m) => (
                  <option key={m.deviceId} value={m.deviceId}>
                    {m.label || `Microphone ${m.deviceId.slice(0, 5)}`}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* SECTION 3: PROCTORED INTERVIEW RULES & CONSENT */}
        <div className="flex flex-col gap-3 p-4 rounded-xl bg-background/50 border border-border/50">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
              3. PROCTORED INTERVIEW RULES & CONSENT
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-surface/60 border border-border/40 text-xs">
              <Camera className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
              <span className="text-foreground/80 text-[11px] leading-snug">
                1. Camera must remain enabled during the interview.
              </span>
            </div>
            <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-surface/60 border border-border/40 text-xs">
              <Mic className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
              <span className="text-foreground/80 text-[11px] leading-snug">
                2. Microphone must remain enabled during the interview.
              </span>
            </div>
            <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-surface/60 border border-border/40 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
              <span className="text-foreground/80 text-[11px] leading-snug">
                3. Stay in fullscreen during the interview.
              </span>
            </div>
            <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-surface/60 border border-border/40 text-xs">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
              <span className="text-foreground/80 text-[11px] leading-snug">
                4. Tab switching and window blurring are logged as proctoring events.
              </span>
            </div>
            <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-surface/60 border border-border/40 text-xs">
              <Volume2 className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
              <span className="text-foreground/80 text-[11px] leading-snug">
                5. Local WASM face presence checks run continuously (no face biometric storage).
              </span>
            </div>
            <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-surface/60 border border-border/40 text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
              <span className="text-foreground/80 text-[11px] leading-snug">
                6. Repeated camera/mic disabling or face absence may terminate session.
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-border/40 mt-1">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-foreground/90 leading-relaxed font-sans">
              <input
                type="checkbox"
                checked={hasConsentedToProctoring}
                onChange={(e) => setHasConsentedToProctoring(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border/60 text-foreground focus:ring-foreground shrink-0 accent-foreground cursor-pointer"
              />
              <span>
                I acknowledge and consent to camera/microphone monitoring, local face-presence verification, tab event logging, and AI session evaluation for this interview in accordance with the{' '}
                <Link to="/privacy" target="_blank" className="font-semibold text-foreground underline hover:opacity-80">
                  Privacy Policy
                </Link>{' '}
                and{' '}
                <Link to="/terms" target="_blank" className="font-semibold text-foreground underline hover:opacity-80">
                  Terms &amp; Conditions
                </Link>
                .
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* FOOTER & CONTINUE BUTTON (Fixed) */}
      <div className="pt-4 mt-4 border-t border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-foreground/50">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Temporary Verification Stream Only</span>
          </div>
          {!isAllReady && (
            <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-semibold uppercase tracking-wide">
              {!isCameraReady
                ? '● Camera check pending'
                : !isMicReady
                ? '● Microphone check pending'
                : testPassed !== true
                ? '● Complete & pass 10-sec Mic Test to continue'
                : !isFaceReady
                ? `● Face Check: ${guidanceMessage}`
                : '● Proctoring consent required'}
            </span>
          )}
        </div>

        <button
          type="button"
          disabled={!isAllReady || isSubmitting}
          onClick={handleContinue}
          className={cn(
            'h-11 px-6 rounded-xl font-mono text-xs font-bold uppercase tracking-widest text-background bg-foreground shadow-md',
            'hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer',
            'disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none'
          )}
        >
          <span>{isSubmitting ? 'CREATING INTERVIEW SESSION...' : 'CONTINUE TO INTERVIEW'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};
