import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  ShieldAlert,
  ArrowLeft,
  ArrowRight,
  Volume2,
  Loader2,
  Mic,
} from 'lucide-react';

import { useInterviewStore } from '@/stores/interviewStore';
import { interviewsApi } from '@/services/api/interviews';
import {
  PreFlightDeviceCheck,
  AIInterviewer,
  CandidateCamera,
  TranscriptPanel,
  ChatNotesPanel,
  InterviewTopBar,
  InterviewBottomControls,
  ProctoringFooter,
  InterviewInitOverlay,
  type InterviewInitStep,
  type TranscriptEntry,
  type ChatMessage,
  useUserMedia,
  useVoiceSynthesizer,
  useProctoring,
  useFaceDetection,
  useSpeechRecognition,
  AnswerSubmissionCoordinator,
  createCandidateTranscriptEntry,
  appendTranscriptEntryDedup,
  stopAllInterviewMediaStreams,
} from '@/features/interview';
import { processRawEvaluationToResult, type TranscriptLine } from '@/features/results';
import type { InterviewState } from '@/config/interviewConfig';

export function InterviewRoomPage() {
  const navigate = useNavigate();

  const {
    setupConfig,
    sessionId,
    questions,
    currentQuestionIndex,
    setSession,
    nextQuestion,
    resetSession,
  } = useInterviewStore();

  const currentQuestion = questions[currentQuestionIndex] || null;
  const [candidateLiveAnswer, setCandidateLiveAnswer] = useState('');
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const submissionCoordinatorRef = useRef<AnswerSubmissionCoordinator | null>(null);
  if (!submissionCoordinatorRef.current) {
    submissionCoordinatorRef.current = new AnswerSubmissionCoordinator();
  }
  const isMountedRef = useRef(true);
  const lastSpokenQuestionIdRef = useRef<string | null>(null);

  // Room State
  const [deviceCheckComplete, setDeviceCheckComplete] = useState<boolean>(Boolean(sessionId));
  const [initStep, setInitStep] = useState<InterviewInitStep | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [roomState, setRoomState] = useState<InterviewState>('QUESTION');

  const [showEndModal, setShowEndModal] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const previousRoomStateRef = useRef<InterviewState>('QUESTION');

  // Audio & Media State
  const [isMicMuted, setIsMicMuted] = useState(false);
  const isMicMutedRef = useRef(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [candidateAudioLevel, setCandidateAudioLevel] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [questionElapsedSeconds, setQuestionElapsedSeconds] = useState(0);
  const hasRecoveredRef = useRef(false);
  const isTerminatedRef = useRef(false);
  const pendingInterviewIdRef = useRef<string | null>(null);

  useEffect(() => {
    isMicMutedRef.current = isMicMuted;
  }, [isMicMuted]);

  // Transcript & Chat Data
  const [transcriptEntries, setTranscriptEntries] = useState<TranscriptEntry[]>([
    {
      id: 'tx-1',
      speaker: 'ai',
      speakerName: 'Interviewer (IRA)',
      text: `Hi ${setupConfig.selectedRoleTitle ? 'there' : 'Candidate'} — I'm Ira, your AI interviewer for today. This is a mock interview for the position of ${setupConfig.selectedRoleTitle || 'Business Development (Sales)'}. I'll ask you a few questions to help you practice. Let's get started.`,
      timestamp: '00:02',
    },
  ]);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-sys',
      sender: 'system',
      text: 'Session connected. All proctoring checks and media streams are active.',
      timestamp: '00:01',
    },
  ]);

  const candidateVideoRef = useRef<HTMLVideoElement | null>(null);

  // 1. Candidate User Media Stream Hook (Centralized Single Stream Owner)
  const media = useUserMedia();
  const { stream: candidateStream, requestMedia: requestCandidateMedia, stopTracks } = media;

  // 2. Face Detection Hook for Live Interview Session
  const { faceState: liveFaceState } = useFaceDetection({
    stream: candidateStream,
    videoRef: candidateVideoRef,
    enabled: deviceCheckComplete && !isCameraOff && roomState !== 'COMPLETE' && roomState !== 'TERMINATED',
  });

  // 3. TTS Hook
  const {
    speak,
    stop: stopTTS,
    isSpeaking: isTtsSpeaking,
    isBusy: isTtsBusy,
    audioLevel: ttsAudioLevel,
    resumeAudioContext,
  } = useVoiceSynthesizer();

  // 4. Speech Recognition Hook for Candidate Oral Response
  const {
    isListening: isSpeechListening,
    transcript: speechTranscript,
    isSupported: isSpeechSupported,
    startListening: startSpeechRecognition,
    stopListening: stopSpeechRecognition,
    resetTranscript: resetSpeechTranscript,
  } = useSpeechRecognition({
    continuous: true,
    interimResults: true,
    onResult: (latestTranscript) => {
      resetCandidateInactivity();
      setCandidateLiveAnswer(latestTranscript);
    },
  });

  // Candidate Mic VAD indicator: candidate is speaking when candidate mic level > 8
  const isCandidateSpeaking = candidateAudioLevel > 8 && !isMicMuted;

  // Centralized Terminal Media Cleanup (MANDATORY INVARIANT)
  const stopCandidateMedia = useCallback(() => {
    console.log('[ASCEND Media Lifecycle] Executing complete media cleanup: stopping all tracks and audio.');
    stopTTS();
    stopSpeechRecognition();
    stopTracks();
    stopAllInterviewMediaStreams();
    if (candidateVideoRef.current) {
      candidateVideoRef.current.srcObject = null;
    }
    setCandidateAudioLevel(0);
  }, [stopTTS, stopSpeechRecognition, stopTracks]);

  const handleViewResults = useCallback(async () => {
    stopCandidateMedia();
    const targetId = sessionId || 'int-2026-0918-78a';

    const mappedTranscript: TranscriptLine[] = transcriptEntries.map((t) => ({
      id: t.id,
      speaker:
        t.speaker === 'ai' || t.speakerName?.toLowerCase().includes('ira') ? 'IRA' : 'CANDIDATE',
      speakerName: t.speakerName,
      text: t.text,
      timestamp: t.timestamp,
    }));

    await processRawEvaluationToResult({
      sessionId: targetId,
      roleTitle: setupConfig.selectedRoleTitle || 'SOFTWARE ENGINEER',
      experienceLevel: setupConfig.experienceLevel || 'Mid',
      rawAnswers: [],
      transcript: mappedTranscript,
    });

    resetSession();
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
    navigate(`/results/${targetId}`);
  }, [sessionId, transcriptEntries, setupConfig, stopCandidateMedia, resetSession, navigate]);

  // 5. Proctoring & Session Management Hook
  const {
    isTerminated,
    terminationReason,
    warningLevel,
    mediaWarningCount,
    isMediaPaused,
    mediaPauseMessage,
    resetCandidateInactivity,
    handleTerminate,
  } = useProctoring({
    sessionId,
    currentState: roomState,
    candidateSpeaking: isCandidateSpeaking,
    stream: candidateStream,
    faceState: liveFaceState,
    onTerminated: () => {
      stopCandidateMedia();
    },
  });

  // Handle Room State transition to/from MEDIA_PAUSED while preserving previous valid state
  useEffect(() => {
    if (isMediaPaused && roomState !== 'MEDIA_PAUSED') {
      previousRoomStateRef.current = roomState;
      setRoomState('MEDIA_PAUSED');
    } else if (!isMediaPaused && roomState === 'MEDIA_PAUSED') {
      setRoomState(previousRoomStateRef.current || 'QUESTION');
    }
  }, [isMediaPaused, roomState]);

  // Track termination and clean up tracks strictly on unmount
  useEffect(() => {
    isTerminatedRef.current = isTerminated;
    if (isTerminated) {
      stopCandidateMedia();
    }
  }, [isTerminated, stopCandidateMedia]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      stopCandidateMedia();
    };
  }, [stopCandidateMedia]);

  // Authoritative Backend Session Validation & Refresh Recovery on Mount
  useEffect(() => {
    if (!sessionId || hasRecoveredRef.current) return;
    hasRecoveredRef.current = true;

    interviewsApi
      .getSession(sessionId)
      .then((session) => {
        if (!session) return;
        if (session.currentState === 'TERMINATED') {
          stopCandidateMedia();
          handleTerminate(session.terminationReason || 'PAGE_RELOAD');
        } else if (session.currentState === 'COMPLETE') {
          stopCandidateMedia();
          handleViewResults();
        } else if (session.questions && session.questions.length > 0) {
          // Restore questions and resume at the first unanswered question
          setSession(session.id, session.questions, session.currentQuestionIndex);

          // Populate transcript history from already persisted answers
          const historicalEntries: TranscriptEntry[] = [];
          session.questions.forEach((q, idx) => {
            if (q.candidateResponse && q.candidateResponse.trim().length > 0) {
              historicalEntries.push({
                id: `hist-q-${q.id}`,
                speaker: 'ai',
                speakerName: 'Interviewer (IRA)',
                text: `Question ${idx + 1} (${q.category.toUpperCase()}): ${q.text}`,
                timestamp: 'Saved',
              });
              historicalEntries.push({
                id: `hist-ans-${q.id}`,
                speaker: 'candidate',
                speakerName: 'You',
                text: q.candidateResponse,
                timestamp: 'Saved',
              });
            }
          });

          if (historicalEntries.length > 0) {
            setTranscriptEntries((prev) => {
              const existingIds = new Set(prev.map((e) => e.id));
              const newEntries = historicalEntries.filter((e) => !existingIds.has(e.id));
              return [...prev, ...newEntries];
            });
          }
        }
      })
      .catch((err) => {
        console.error('[InterviewRoom] Session recovery error:', err);
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('not found') || msg.includes('P0002')) {
          resetSession();
          setDeviceCheckComplete(false);
          setInitError('Previous interview session not found. Please start a new interview.');
        }
      });
  }, [sessionId, setSession, stopCandidateMedia, handleTerminate, handleViewResults, resetSession]);

  // Question Vocalization & Speech Capture Lifecycle
  useEffect(() => {
    if (!deviceCheckComplete || !currentQuestion || isTerminated) return;
    if (lastSpokenQuestionIdRef.current === currentQuestion.id) return;

    const questionId = currentQuestion.id;
    lastSpokenQuestionIdRef.current = questionId;
    submissionCoordinatorRef.current?.reset();
    setSubmissionError(null);
    setCandidateLiveAnswer('');
    resetSpeechTranscript();
    setQuestionElapsedSeconds(0);

    // 1. Explicitly stop active speech recognition BEFORE question playback starts
    stopSpeechRecognition();

    // 2. Append to transcript panel
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setTranscriptEntries((prev) => {
      const qEntryId = `tx-q-${questionId}`;
      if (prev.some((e) => e.id === qEntryId)) return prev;
      return [
        ...prev,
        {
          id: qEntryId,
          speaker: 'ai',
          speakerName: 'Interviewer (IRA)',
          text: `Question ${currentQuestionIndex + 1} (${currentQuestion.category.toUpperCase()}): ${currentQuestion.text}`,
          timestamp,
        },
      ];
    });

    // 3. Play question audio and start speech recognition ONLY after playback completes
    speak(currentQuestion.text, () => {
      // Guard 1: Verify callback belongs to this active question
      if (lastSpokenQuestionIdRef.current !== questionId) return;
      // Guard 2: Verify session is not terminated
      if (isTerminatedRef.current) return;
      // Guard 3: Authoritative check on current mic mute state (prevents unmute if candidate muted while AI was speaking)
      if (isMicMutedRef.current) return;
      // Guard 4: Verify speech recognition availability
      if (isSpeechSupported) {
        startSpeechRecognition();
      }
    });
  }, [
    deviceCheckComplete,
    currentQuestion,
    currentQuestionIndex,
    isTerminated,
    isSpeechSupported,
    speak,
    stopSpeechRecognition,
    startSpeechRecognition,
    resetSpeechTranscript,
  ]);

  // Request media if not already established
  useEffect(() => {
    if (isTerminated || roomState === 'TERMINATED' || roomState === 'COMPLETE') {
      stopCandidateMedia();
      return;
    }
    if (deviceCheckComplete && !candidateStream && !isCameraOff) {
      requestCandidateMedia();
    }
  }, [deviceCheckComplete, candidateStream, isCameraOff, isTerminated, roomState, requestCandidateMedia, stopCandidateMedia]);

  // Session & Question Timing (paused when proctoring media is paused or terminated)
  useEffect(() => {
    if (!deviceCheckComplete || isTerminated || isMediaPaused || roomState === 'MEDIA_PAUSED') {
      return;
    }
    const timerInterval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
      setQuestionElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timerInterval);
  }, [deviceCheckComplete, isTerminated, isMediaPaused, roomState]);

  // Candidate Mic VAD Analyser
  useEffect(() => {
    if (!candidateStream || isMicMuted || isTerminated) {
      setCandidateAudioLevel(0);
      return;
    }

    let animFrame: number;
    let audioCtx: AudioContext;
    let source: MediaStreamAudioSourceNode | null = null;
    let analyser: AnalyserNode | null = null;

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      audioCtx = new AudioCtx();
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;

      source = audioCtx.createMediaStreamSource(candidateStream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let lastUpdate = 0;
      let lastLevel = 0;

      const updateLevel = (timestamp: number) => {
        if (!analyser) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const level = Math.min(100, Math.round((avg / 128) * 100));

        // Throttle React state updates to 40ms to avoid unnecessary re-renders while preserving smooth visual reaction
        if (timestamp - lastUpdate > 40 || Math.abs(level - lastLevel) > 8) {
          lastUpdate = timestamp;
          lastLevel = level;
          setCandidateAudioLevel(level);
        }

        if (level > 8) {
          resetCandidateInactivity();
        }

        animFrame = requestAnimationFrame(updateLevel);
      };

      animFrame = requestAnimationFrame(updateLevel);
    } catch {
      // Safe to ignore if candidate mic AudioContext cannot be initialized
    }

    return () => {
      if (animFrame) cancelAnimationFrame(animFrame);
      if (source) {
        try {
          source.disconnect();
        } catch {
          // Safe ignore
        }
      }
      if (analyser) {
        try {
          analyser.disconnect();
        } catch {
          // Safe ignore
        }
      }
      if (audioCtx && audioCtx.state !== 'closed') audioCtx.close().catch(() => {});
    };
  }, [candidateStream, isMicMuted, isTerminated, resetCandidateInactivity]);

  // Fullscreen Enforcement Listener (Proctoring Violation if user exits active fullscreen)
  useEffect(() => {
    if (!deviceCheckComplete || isTerminated) return;

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !isTerminated) {
        console.warn('[Proctoring] Fullscreen exit detected during active interview.');
        handleTerminate('FULLSCREEN_EXIT');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [deviceCheckComplete, isTerminated, handleTerminate]);

  // Pre-Flight Completion Handler: Enforce mandatory browser fullscreen capability & gesture
  const handleDeviceCheckComplete = async () => {
    setInitError(null);
    setInitStep('environment');

    // 1. Mandatory Environment Capability Check
    const isFullscreenSupported = typeof document !== 'undefined' && Boolean(document.fullscreenEnabled && document.documentElement.requestFullscreen);
    if (!isFullscreenSupported) {
      setInitError('ASCEND Proctoring Policy requires a desktop browser supporting full-screen mode. Your current browser or device environment does not support full-screen proctoring.');
      return;
    }

    try {
      // 2. Request and await browser fullscreen entry gesture
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch (fsErr) {
      console.error('[Proctoring] Fullscreen request rejected or denied:', fsErr);
      setInitError('Full-screen mode is required to begin your proctored interview. Please grant full-screen permissions and try again.');
      return;
    }

    try {
      await resumeAudioContext();

      setInitStep('media');
      if (!candidateStream && !isCameraOff) {
        await requestCandidateMedia().catch(() => {});
      }

      setInitStep('session');
      const mode = setupConfig.mode || 'role';
      const payload = {
        mode,
        roleTitle: setupConfig.selectedRoleTitle || 'Business Development (Sales)',
        experienceLevel: setupConfig.experienceLevel || 'Senior',
        selectedRoleId: setupConfig.selectedRoleId || undefined,
        selectedField: setupConfig.selectedField || undefined,
        difficulty: setupConfig.difficulty,
        focusArea: setupConfig.focusArea,
        jobDescription: setupConfig.jobDescription || undefined,
        resumeId: setupConfig.resumeId || undefined,
        interviewId: pendingInterviewIdRef.current || undefined,
      };

      const session = await interviewsApi.createSession(payload);
      pendingInterviewIdRef.current = session.id;
      setSession(session.id, session.questions);

      setInitStep('ready');
      setTimeout(() => {
        setDeviceCheckComplete(true);
        setInitStep(null);
        setRoomState('QUESTION');
      }, 400);
    } catch (err) {
      console.error('[InterviewRoom] Session creation failed:', err);
      const message = err instanceof Error ? err.message : 'Failed to generate interview questions';
      setInitError(message);
      setInitStep('session');
    }
  };

  const handleDeviceCheckCancel = () => {
    pendingInterviewIdRef.current = null;
    setInitError(null);
    setInitStep(null);
    stopCandidateMedia();
    if (window.history.length > 1) {
      navigate(-1);
    } else if (setupConfig.mode === 'resume') {
      navigate('/interview/setup?mode=resume');
    } else {
      navigate('/interview/setup?mode=role');
    }
  };

  // Hardware Toggles
  const handleToggleMic = () => {
    resetCandidateInactivity();
    const nextMuted = !isMicMutedRef.current;
    if (candidateStream && candidateStream.getAudioTracks().length > 0) {
      const track = candidateStream.getAudioTracks()[0];
      track.enabled = !nextMuted;
    }
    setIsMicMuted(nextMuted);
    isMicMutedRef.current = nextMuted;
    if (nextMuted) {
      stopSpeechRecognition();
    } else if (isSpeechSupported && deviceCheckComplete && !isTerminated && !isTtsBusy) {
      startSpeechRecognition();
    }
  };

  const handleReplayQuestion = () => {
    if (!currentQuestion || isTtsBusy) return;
    const questionId = currentQuestion.id;
    stopSpeechRecognition();
    speak(currentQuestion.text, () => {
      if (lastSpokenQuestionIdRef.current !== questionId) return;
      if (isTerminatedRef.current || isMicMutedRef.current) return;
      if (isSpeechSupported) {
        startSpeechRecognition();
      }
    });
  };

  const handleNextQuestion = async () => {
    const coordinator = submissionCoordinatorRef.current!;
    if (!coordinator.startSubmission()) {
      console.warn('[InterviewRoom] Concurrent answer submission prevented.');
      return;
    }
    setIsSubmittingAnswer(true);

    try {
      stopTTS();

      // Only flush speech if no answer is already retained from a failed submission
      let flushedTranscript = '';
      if (!coordinator.getRetainedAnswer()) {
        flushedTranscript = stopSpeechRecognition();
      }

      const { answer: finalAnswer, duration: durationToPersist } = coordinator.prepareAnswer({
        flushedSpeech: flushedTranscript,
        candidateLiveAnswer,
        speechTranscript,
        questionElapsedSeconds,
      });

      if (sessionId && currentQuestion) {
        await interviewsApi.submitAnswer(sessionId, {
          questionId: currentQuestion.id,
          transcriptText: finalAnswer,
          durationSeconds: durationToPersist,
        });
      }

      // Persistence confirmed: release coordinator lock & retained state
      coordinator.handleSuccess();
      if (isMountedRef.current) {
        setSubmissionError(null);
      }

      // Authoritative transcript bubble appended ONLY after persistence succeeds
      const entry = createCandidateTranscriptEntry(
        currentQuestion?.id || String(Date.now()),
        finalAnswer
      );
      setTranscriptEntries((prev) => appendTranscriptEntryDedup(prev, entry));

      // Reset speech & timing state only after successful persistence
      setCandidateLiveAnswer('');
      resetSpeechTranscript();
      setQuestionElapsedSeconds(0);

      if (currentQuestionIndex < questions.length - 1) {
        nextQuestion();
      } else {
        await handleViewResults();
      }
    } catch (err) {
      console.error('[InterviewRoom] Error submitting answer:', err);
      const errorMsg =
        err instanceof Error
          ? err.message
          : 'Failed to submit answer. Please check your connection and retry.';
      coordinator.handleFailure(errorMsg);
      if (isMountedRef.current) {
        setSubmissionError(errorMsg);
      }
    } finally {
      if (isMountedRef.current) {
        setIsSubmittingAnswer(false);
      }
    }
  };

  const handleToggleCamera = () => {
    resetCandidateInactivity();
    if (candidateStream && candidateStream.getVideoTracks().length > 0) {
      const track = candidateStream.getVideoTracks()[0];
      track.enabled = isCameraOff;
    }
    setIsCameraOff((prev) => !prev);
  };

  const handleSendMessage = (text: string) => {
    resetCandidateInactivity();
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      sender: 'candidate',
      text,
      timestamp,
    };
    setChatMessages((prev) => [...prev, newMsg]);

    // Also reflect candidate message in transcript
    const newTranscript: TranscriptEntry = {
      id: 'tx-' + Date.now(),
      speaker: 'candidate',
      speakerName: 'You',
      text,
      timestamp,
    };
    setTranscriptEntries((prev) => [...prev, newTranscript]);
  };

  const handleQuickAction = (actionText: string) => {
    resetCandidateInactivity();
    handleSendMessage(actionText);
  };

  const handleConfirmEndInterview = () => {
    stopCandidateMedia();
    handleTerminate('USER_ENDED');
    setShowEndModal(false);
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  };


  const handleReturnToDashboard = () => {
    stopCandidateMedia();
    resetSession();
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
    navigate('/dashboard');
  };

  // 1. Pre-Flight Device Check Screen or Interview Initialization
  if (!deviceCheckComplete && !sessionId) {
    if (initStep) {
      return (
        <div className="fixed inset-0 w-[100vw] h-[100dvh] min-h-[100dvh] bg-[#07090e] flex flex-col items-center justify-center p-4 sm:p-6 text-foreground overflow-hidden z-50">
          <InterviewInitOverlay
            step={initStep}
            roleTitle={setupConfig.selectedRoleTitle || 'Mock Interview'}
            error={initError}
            onRetry={handleDeviceCheckComplete}
            onCancel={handleDeviceCheckCancel}
          />
        </div>
      );
    }

    return (
      <div className="fixed inset-0 w-[100vw] h-[100dvh] min-h-[100dvh] bg-[#07090e] text-foreground overflow-hidden z-50">
        <PreFlightDeviceCheck
          media={media}
          onComplete={handleDeviceCheckComplete}
          onCancel={handleDeviceCheckCancel}
        />
      </div>
    );
  }

  // 2. Main Live Interview Room Surface
  return (
    <div className="fixed inset-0 w-[100vw] h-[100dvh] min-h-[100dvh] bg-[#07090e] text-white flex flex-col justify-between overflow-hidden select-none z-50 font-sans">
      {/* TOP STATUS & NAVIGATION BAR */}
      <InterviewTopBar
        roleTitle={setupConfig.selectedRoleTitle || 'Business Development (Sales)'}
        interviewType={setupConfig.mode === 'resume' ? 'Resume Screening' : 'Mock Interview'}
        elapsedSeconds={elapsedSeconds}
      />

      {/* CENTER INTERVIEW WORKSPACE (Split Video & Information Grid) */}
      <main className="flex-1 min-h-0 px-4 py-2 flex flex-col gap-3 max-w-[1700px] mx-auto w-full">
        {/* ACTIVE QUESTION BANNER */}
        {currentQuestion && (
          <div className="w-full bg-[#0d1219]/95 border border-cyan-500/30 backdrop-blur-md rounded-2xl p-3 sm:p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shrink-0 shadow-xl">
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-mono text-[11px] font-bold uppercase tracking-wider">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/70 font-mono text-[11px] uppercase">
                  {currentQuestion.category}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/70 font-mono text-[11px] uppercase">
                  {currentQuestion.difficulty}
                </span>
                {isSpeechListening && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] flex items-center gap-1 animate-pulse">
                    <Mic className="w-3 h-3" />
                    <span>Listening</span>
                  </span>
                )}
              </div>
              <p className="text-white text-xs sm:text-sm font-medium leading-relaxed">
                {currentQuestion.text}
              </p>
              {(candidateLiveAnswer || speechTranscript) && (
                <div className="pt-1 text-[11px] text-white/60 font-sans italic line-clamp-1">
                  <span className="font-semibold text-cyan-400 not-italic mr-1">Your answer:</span>
                  {candidateLiveAnswer || speechTranscript}
                </div>
              )}
              {submissionError && (
                <div className="pt-1.5 flex items-center gap-1.5 text-rose-400 text-xs font-mono">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span className="font-semibold">Submission failed:</span>
                  <span>{submissionError}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
              <button
                type="button"
                onClick={handleReplayQuestion}
                disabled={isTtsBusy}
                className="h-9 px-3 rounded-xl border border-white/10 hover:bg-white/5 text-white/80 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                title="Replay question audio"
              >
                <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Replay</span>
              </button>

              <button
                type="button"
                onClick={handleNextQuestion}
                disabled={isSubmittingAnswer}
                className={
                  submissionError
                    ? 'h-9 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50'
                    : 'h-9 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50'
                }
              >
                {isSubmittingAnswer ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : submissionError ? (
                  <>
                    <span>Retry Submission</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                ) : (
                  <>
                    <span>
                      {currentQuestionIndex < questions.length - 1
                        ? 'Next Question'
                        : 'Finish Interview'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* TOP ROW: Video Feeds (Interviewer on Left, Candidate on Right) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-[1.3] min-h-0">
          <AIInterviewer
            state={roomState}
            audioLevel={ttsAudioLevel}
            isSpeaking={isTtsSpeaking}
            interviewerName="Interviewer (IRA)"
          />

          <CandidateCamera
            videoRef={candidateVideoRef}
            stream={candidateStream}
            isCameraOff={isCameraOff}
            isMicMuted={isMicMuted}
            candidateName="You"
          />
        </div>

        {/* BOTTOM ROW: Transcript (Left) & Chat/Notes (Right) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 min-h-0">
          <TranscriptPanel entries={transcriptEntries} />

          <ChatNotesPanel
            messages={chatMessages}
            onSendMessage={handleSendMessage}
            onQuickAction={handleQuickAction}
          />
        </div>
      </main>

      {/* BOTTOM CONTROLS BAR WITH CENTER VOICE ORB */}
      <InterviewBottomControls
        isMicMuted={isMicMuted}
        isCameraOff={isCameraOff}
        isChatOpen={isChatOpen}
        roomState={roomState}
        audioLevel={isTtsSpeaking ? ttsAudioLevel : (!isMicMuted ? candidateAudioLevel : 0)}
        isSpeaking={isTtsSpeaking}
        isCandidateSpeaking={!isTtsSpeaking && !isMicMuted && candidateAudioLevel > 6}
        onToggleMic={handleToggleMic}
        onToggleCamera={handleToggleCamera}
        onToggleChat={() => setIsChatOpen((prev) => !prev)}
        onEndSession={() => setShowEndModal(true)}
      />

      {/* BOTTOM PROCTORING FOOTER */}
      <ProctoringFooter />

      {/* PROCTORING INACTIVITY WARNING OVERLAY */}
      <AnimatePresence>
        {warningLevel > 0 && !isTerminated && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 backdrop-blur-md text-amber-200 text-xs font-mono flex items-center gap-2 shadow-2xl"
          >
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Proctoring Warning {warningLevel}/2: Inactivity detected. Please interact or speak to confirm presence.
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MEDIA RECOVERY WARNING OVERLAY (Appears on 1st & 2nd media violation; non-blocking backdrop) */}
      <AnimatePresence>
        {isMediaPaused && !isTerminated && (
          <div className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 select-none pointer-events-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md p-6 rounded-2xl bg-[#0e131d] border border-amber-500/40 text-white shadow-2xl space-y-4 text-left pointer-events-auto"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-amber-400">
                  <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30">
                    <ShieldAlert className="w-5 h-5 text-amber-400" />
                  </div>
                  <h3 className="font-stardom text-base uppercase font-bold tracking-tight">
                    Interview Paused
                  </h3>
                </div>

                <span className="px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-[11px] font-bold uppercase tracking-wider">
                  Warning {mediaWarningCount} of 2
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 leading-relaxed">
                <p className="font-medium text-xs text-amber-100">
                  {mediaPauseMessage || 'Enable your required camera and microphone to resume the interview.'}
                </p>
                <p className="text-[11px] opacity-80 mt-1.5 font-sans">
                  The interview will automatically resume as soon as your device stream is restored. Re-enable device controls in the bottom bar or browser settings.
                </p>
              </div>

              <div className="pt-1 flex items-center gap-2 text-[11px] font-mono text-white/50">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>Monitoring live MediaStreamTrack state...</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* END SESSION CONFIRMATION MODAL */}
      <AnimatePresence>
        {showEndModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md p-6 rounded-2xl bg-[#0e131d] border border-white/10 text-white shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-rose-400">
                <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="font-stardom text-base uppercase font-bold tracking-tight">
                  End Interview Session?
                </h3>
              </div>

              <p className="text-xs text-white/70 leading-relaxed">
                Ending your session now will conclude your interview and release all active camera and microphone streams.
              </p>

              <div className="pt-2 flex items-center justify-end gap-3 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setShowEndModal(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-white/70 hover:text-white transition-colors cursor-pointer"
                >
                  Continue Interview
                </button>
                <button
                  type="button"
                  onClick={handleConfirmEndInterview}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold tracking-wider uppercase transition-colors cursor-pointer shadow-lg shadow-rose-600/30"
                >
                  End Session
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SESSION TERMINATION MODAL */}
      <AnimatePresence>
        {isTerminated && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-md p-6 rounded-2xl bg-[#0e131d] border border-rose-500/30 text-white shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-rose-400">
                <div className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/30">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <h3 className="font-stardom text-base uppercase font-bold tracking-tight">
                  Interview Concluded
                </h3>
              </div>

              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-200">
                <span className="font-semibold block font-mono text-[11px] uppercase mb-1">
                  Reason: {terminationReason || 'USER_ENDED'}
                </span>
                <p className="opacity-90 leading-relaxed text-[11px]">
                  All camera and microphone captures have been permanently terminated.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3 font-mono text-xs">
                <button
                  type="button"
                  onClick={handleReturnToDashboard}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-white/20 hover:bg-white/10 text-white font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Dashboard</span>
                </button>
                <button
                  type="button"
                  onClick={handleViewResults}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-accent text-accent-foreground font-mono text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <span>View Evaluation Results</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
