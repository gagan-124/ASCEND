import { useState, useEffect, useRef, useCallback } from 'react';
import { interviewsApi } from '@/services/api/interviews';
import type { InterviewState } from '@/config/interviewConfig';
import type { TerminationReason } from '@/types/interview';

export interface UseProctoringOptions {
  sessionId: string | null;
  currentState: InterviewState;
  candidateSpeaking?: boolean;
  stream?: MediaStream | null;
  onTerminated?: (reason: TerminationReason) => void;
  /**
   * Configurable inactivity check interval in milliseconds.
   * Default: 180,000 ms (3 minutes)
   * Dev testing override example: 10,000 ms (10 seconds)
   */
  inactivityIntervalMs?: number;
}

export function useProctoring({
  sessionId,
  currentState,
  candidateSpeaking = false,
  stream = null,
  onTerminated,
  inactivityIntervalMs = 180000, // 3 minutes production default
}: UseProctoringOptions) {
  const [warningLevel, setWarningLevel] = useState<0 | 1 | 2>(0);
  const [terminationReason, setTerminationReason] = useState<TerminationReason | null>(null);
  const [isTerminated, setIsTerminated] = useState(false);

  // Media Proctoring State
  const [mediaWarningCount, setMediaWarningCount] = useState<number>(0);
  const [isMediaPaused, setIsMediaPaused] = useState<boolean>(false);
  const [mediaPauseMessage, setMediaPauseMessage] = useState<string>('');

  const lastCandidateActivityRef = useRef<number>(Date.now());
  const terminationInProgressRef = useRef<boolean>(false);
  const wasMediaViolatedRef = useRef<boolean>(false);
  const mediaWarningCountRef = useRef<number>(0);

  const isActiveSession = Boolean(
    sessionId &&
      currentState !== 'SETUP' &&
      currentState !== 'COMPLETE' &&
      currentState !== 'TERMINATED'
  );

  // Idempotent Termination Handler
  const handleTerminate = useCallback(
    async (reason: TerminationReason, useKeepalive = false) => {
      if (!sessionId || terminationInProgressRef.current || isTerminated) return;
      terminationInProgressRef.current = true;

      setIsTerminated(true);
      setTerminationReason(reason);
      setWarningLevel(0);
      setIsMediaPaused(false);

      try {
        await interviewsApi.terminateSession(sessionId, reason, useKeepalive);
      } catch (err) {
        console.error('Failed to terminate session on backend:', err);
      }

      if (onTerminated) {
        onTerminated(reason);
      }
    },
    [sessionId, isTerminated, onTerminated]
  );

  // Reset Candidate Inactivity Timer (Only invoked by candidate VAD or candidate UI clicks)
  const resetCandidateInactivity = useCallback(() => {
    lastCandidateActivityRef.current = Date.now();
    setWarningLevel(0);
  }, []);

  // Monitor Candidate Mic VAD Activity (Candidate Speaking resets timer)
  useEffect(() => {
    if (candidateSpeaking && isActiveSession && currentState !== 'MEDIA_PAUSED' && !isMediaPaused) {
      resetCandidateInactivity();
    }
  }, [candidateSpeaking, isActiveSession, currentState, isMediaPaused, resetCandidateInactivity]);

  // 1. Session Persistence & Page Refresh Handling
  useEffect(() => {
    if (!isActiveSession || !sessionId) return;

    const handleBeforeUnload = () => {
      // Retain active session in sessionStorage so reloads re-hydrate cleanly
      sessionStorage.setItem('ascend_active_session_id', sessionId);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isActiveSession, sessionId]);

  // 2. Tab Switch / Page Visibility Listener
  useEffect(() => {
    if (!isActiveSession || !sessionId) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Candidate navigated away / switched tabs while interview is active
        handleTerminate('TAB_SWITCH');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isActiveSession, sessionId, handleTerminate]);

  // 3. Media Proctoring Monitor (Actual MediaStreamTrack state inspection)
  useEffect(() => {
    if (!isActiveSession || isTerminated) {
      return;
    }

    const checkMediaTracks = () => {
      if (!stream) return;

      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];

      // Camera violation condition: videoTrack exists AND videoTrack.enabled === false
      const isCamViolated = Boolean(videoTrack && videoTrack.enabled === false);
      // Microphone violation condition: audioTrack exists AND audioTrack.enabled === false
      const isMicViolated = Boolean(audioTrack && audioTrack.enabled === false);

      const isViolated = isCamViolated || isMicViolated;

      if (isViolated) {
        let msg = '';
        if (isCamViolated && isMicViolated) {
          msg = 'Enable your camera and microphone to resume the interview.';
        } else if (isCamViolated) {
          msg = 'Enable your camera to resume the interview.';
        } else {
          msg = 'Enable your microphone to resume the interview.';
        }
        setMediaPauseMessage(msg);

        // Count violations on edge transition: enabled -> disabled (count ONCE per violation event)
        if (!wasMediaViolatedRef.current) {
          wasMediaViolatedRef.current = true;
          const nextCount = mediaWarningCountRef.current + 1;
          mediaWarningCountRef.current = nextCount;
          setMediaWarningCount(nextCount);

          if (nextCount >= 3) {
            // Atomic 3rd violation: immediately terminate without entering MEDIA_PAUSED or showing popup
            setIsMediaPaused(false);
            handleTerminate('MEDIA_FAILURE');
          } else {
            // 1st or 2nd violation: show popup and signal pause
            setIsMediaPaused(true);
          }
        }
      } else {
        // Media restored
        if (wasMediaViolatedRef.current) {
          wasMediaViolatedRef.current = false;
          setIsMediaPaused(false);
          setMediaPauseMessage('');
        }
      }
    };

    checkMediaTracks();
    const interval = setInterval(checkMediaTracks, 250);

    return () => clearInterval(interval);
  }, [stream, isActiveSession, isTerminated, handleTerminate]);

  // 4. Candidate Inactivity Monitor (3-Stage Sequence; Suspended during MEDIA_PAUSED)
  useEffect(() => {
    if (!isActiveSession || currentState === 'MEDIA_PAUSED' || isMediaPaused) {
      setWarningLevel(0);
      return;
    }

    lastCandidateActivityRef.current = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - lastCandidateActivityRef.current;

      if (elapsed >= inactivityIntervalMs * 3) {
        // 3rd Violation: Terminate
        clearInterval(interval);
        handleTerminate('INACTIVITY');
      } else if (elapsed >= inactivityIntervalMs * 2) {
        // 2nd Violation: Warning 2
        setWarningLevel(2);
      } else if (elapsed >= inactivityIntervalMs) {
        // 1st Violation: Warning 1
        setWarningLevel(1);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [isActiveSession, currentState, isMediaPaused, inactivityIntervalMs, handleTerminate]);

  return {
    isTerminated,
    terminationReason,
    warningLevel,
    mediaWarningCount,
    isMediaPaused,
    mediaPauseMessage,
    resetCandidateInactivity,
    handleTerminate,
  };
}

