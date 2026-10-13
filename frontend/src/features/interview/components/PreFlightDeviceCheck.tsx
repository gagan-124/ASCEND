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

  // Guarantee complete unmount cleanup when candidate navigates back or exits
  useEffect(() => {
    return () => {
      cleanupAudio();
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      if (!media) {
        stopTracks();
      }
    };
  }, [cleanupAudio, stopTracks, media]);

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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={cn(
        'w-full h-full flex flex-col bg-[#07090e] text-foreground select-none font-sans',
        className
      )}
    >
      {/* Top Protocol Header (Fixed) */}
      <header className="w-full border-b border-border/40 bg-surface/50 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-foreground/5 text-foreground">
            <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-xs sm:text-sm font-mono font-bold uppercase tracking-widest text-foreground">
              PRE-FLIGHT HARDWARE VERIFICATION
            </h1>
            <p className="text-[11px] font-sans text-foreground/60">
              ASCEND mandatory device &amp; face proctoring verification
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-surface-muted/60 border border-border/50 text-[10px] font-mono text-foreground/70">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>Interactive Sensor Calibrator</span>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className="text-xs font-mono font-medium text-foreground/70 hover:text-foreground px-3 py-1.5 rounded-lg border border-border/50 hover:bg-surface/80 transition-colors cursor-pointer"
          >
            Cancel &amp; Exit
          </button>
        </div>
      </header>

      {/* Main Viewport Content - Responsive 2-Column Desktop Grid */}
      <div className="flex-1 min-h-0 w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 overflow-y-auto lg:overflow-hidden items-stretch">
        {/* LEFT COLUMN: Camera Preview & Microphone Test */}
        <div className="lg:col-span-7 flex flex-col gap-3.5 min-h-0 justify-between">
          {/* SECTION 1: CAMERA VERIFICATION & PREVIEW */}
          <section className="flex flex-col gap-2.5 p-3.5 sm:p-4 rounded-xl bg-surface/50 border border-border/60 flex-1 min-h-0">
            <div className="flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-foreground/70" />
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
                  1. CAMERA &amp; FACE PROCTORING PREVIEW
                </h2>
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
            <div className="relative w-full flex-1 min-h-[180px] max-h-[300px] aspect-video rounded-xl bg-[#060a12] border border-border/60 overflow-hidden flex items-center justify-center mx-auto shadow-inner">
              {isCameraReady ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-contain object-center transform -scale-x-100"
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
                  'p-2 rounded-lg text-xs font-mono font-medium flex items-center gap-2 transition-all shrink-0',
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
                <span className="truncate">{guidanceMessage}</span>
              </div>
            )}

            {/* Optional Camera Selector */}
            {cameras.length > 1 && (
              <div className="flex items-center gap-2 pt-0.5 text-xs shrink-0">
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
          </section>

          {/* SECTION 2: MICROPHONE VERIFICATION & 10-SECOND TEST */}
          <section className="flex flex-col gap-2.5 p-3.5 sm:p-4 rounded-xl bg-surface/50 border border-border/60 shrink-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-foreground/70" />
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
                  2. MICROPHONE TEST (10-SEC DETECTOR)
                </h2>
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
              <div className="p-2.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <div className="space-y-0.5">
                  <span className="font-semibold block font-mono text-[11px] uppercase tracking-wide">
                    Microphone Muted by System / Hardware Switch
                  </span>
                  <p className="text-[11px] opacity-90 font-sans leading-relaxed">
                    Browser microphone permission is granted, but your microphone input is currently muted at the OS or hardware level. Press your laptop microphone mute key or check Windows Privacy Settings to enable signal.
                  </p>
                </div>
              </div>
            )}

            {/* Real-time Audio Level Bar Meter */}
            <div className="w-full h-2.5 rounded-full bg-surface-muted border border-border/60 overflow-hidden relative">
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
            <div className="flex items-center justify-between pt-0.5">
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
                  <div className="w-7 h-7 rounded-full border-2 border-foreground border-t-transparent animate-spin flex items-center justify-center font-bold text-[11px]">
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
              <div className="flex items-center gap-2 pt-0.5 text-xs">
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
          </section>
        </div>

        {/* RIGHT COLUMN: Proctored Rules, Privacy & Consent */}
        <div className="lg:col-span-5 flex flex-col gap-3.5 min-h-0 justify-between">
          {/* SECTION 3: PROCTORED INTERVIEW RULES & CONSENT */}
          <section className="flex flex-col gap-3 p-3.5 sm:p-4 rounded-xl bg-surface/50 border border-border/60 flex-1 min-h-0 justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
                  3. PROCTORED INTERVIEW RULES &amp; CONSENT
                </h2>
              </div>
              <p className="text-xs text-foreground/60 leading-relaxed font-sans">
                Review mandatory session standards. Automated proctoring safeguards integrity throughout evaluation.
              </p>
            </div>

            {/* Proctoring Rules Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 pt-1">
              <div className="flex items-start gap-2.5 p-2 rounded-lg bg-surface/70 border border-border/40 text-xs">
                <Camera className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span className="text-foreground/80 text-[11px] leading-snug">
                  1. Camera must remain enabled during the entire interview.
                </span>
              </div>
              <div className="flex items-start gap-2.5 p-2 rounded-lg bg-surface/70 border border-border/40 text-xs">
                <Mic className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span className="text-foreground/80 text-[11px] leading-snug">
                  2. Microphone must remain active and responsive.
                </span>
              </div>
              <div className="flex items-start gap-2.5 p-2 rounded-lg bg-surface/70 border border-border/40 text-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span className="text-foreground/80 text-[11px] leading-snug">
                  3. Stay in fullscreen mode during the interview session.
                </span>
              </div>
              <div className="flex items-start gap-2.5 p-2 rounded-lg bg-surface/70 border border-border/40 text-xs">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span className="text-foreground/80 text-[11px] leading-snug">
                  4. Tab switching and window blurring are logged as proctoring events.
                </span>
              </div>
              <div className="flex items-start gap-2.5 p-2 rounded-lg bg-surface/70 border border-border/40 text-xs">
                <Volume2 className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span className="text-foreground/80 text-[11px] leading-snug">
                  5. Local WASM face presence checks run continuously in browser.
                </span>
              </div>
              <div className="flex items-start gap-2.5 p-2 rounded-lg bg-surface/70 border border-border/40 text-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span className="text-foreground/80 text-[11px] leading-snug">
                  6. Repeated camera/mic disabling or face absence may terminate session.
                </span>
              </div>
            </div>

            {/* Privacy Guarantee Note */}
            <div className="p-2.5 rounded-lg bg-surface/40 border border-border/40 text-[11px] text-foreground/70 flex items-start gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong className="text-foreground font-semibold">Privacy Guaranteed:</strong> Face verification runs client-side inside your browser via local WASM. No video feeds or biometric templates are stored.
              </p>
            </div>

            {/* Prominent Consent Checkbox Card */}
            <div className="p-3 rounded-xl bg-surface/90 border border-cyan-500/20 shadow-sm mt-1">
              <label htmlFor="preflight-proctoring-consent" className="flex items-start gap-2.5 cursor-pointer text-xs text-foreground/90 leading-relaxed font-sans">
                <input
                  id="preflight-proctoring-consent"
                  type="checkbox"
                  checked={hasConsentedToProctoring}
                  onChange={(e) => setHasConsentedToProctoring(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border/60 text-cyan-500 focus:ring-cyan-500 shrink-0 accent-cyan-500 cursor-pointer"
                />
                <span>
                  I acknowledge and consent to camera/microphone monitoring, local face-presence verification, tab event logging, and AI session evaluation for this interview in accordance with the{' '}
                  <Link to="/privacy" target="_blank" className="font-semibold text-cyan-400 underline hover:text-cyan-300">
                    Privacy Policy
                  </Link>{' '}
                  and{' '}
                  <Link to="/terms" target="_blank" className="font-semibold text-cyan-400 underline hover:text-cyan-300">
                    Terms &amp; Conditions
                  </Link>
                  .
                </span>
              </label>
            </div>
          </section>
        </div>
      </div>

      {/* FOOTER & CONTINUE BUTTON (Fixed Bottom Action Area) */}
      <footer className="w-full border-t border-border/40 bg-surface/80 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-foreground/50">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Temporary Verification Stream Only • No Session Recording Stored Prior to Start</span>
          </div>
          {!isAllReady ? (
            <span className="text-[11px] font-mono text-amber-500 font-semibold uppercase tracking-wide flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              {!isCameraReady
                ? 'Camera check pending — grant camera permission'
                : !isMicReady
                ? 'Microphone check pending — grant microphone permission'
                : testPassed !== true
                ? 'Complete & pass 10-sec Mic Test to continue'
                : !isFaceReady
                ? `Face check: ${guidanceMessage}`
                : 'Consent required — review and check acknowledgment box above'}
            </span>
          ) : (
            <span className="text-[11px] font-mono text-emerald-400 font-semibold uppercase tracking-wide flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              All pre-flight verification requirements satisfied
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <button
            type="button"
            onClick={handleCancel}
            className="h-10 px-4 rounded-xl border border-border/60 hover:bg-surface text-xs font-mono font-medium text-foreground/80 hover:text-foreground transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!isAllReady || isSubmitting}
            onClick={handleContinue}
            className={cn(
              'h-10 px-6 rounded-xl font-mono text-xs font-bold uppercase tracking-widest text-black bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.3)]',
              'hover:bg-cyan-300 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer',
              'disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:bg-foreground/20 disabled:text-foreground/40'
            )}
          >
            <span>{isSubmitting ? 'CREATING INTERVIEW SESSION...' : 'CONTINUE TO INTERVIEW'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </footer>
    </motion.div>
  );
};
