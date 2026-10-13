import { useState, useRef, useCallback, useEffect } from 'react';

export type TTSStatus = 'idle' | 'preparing' | 'playing';

/**
 * Pure lifecycle coordinator for TTS speech synthesis and playback.
 * Decoupled from Web Audio / Web Speech DOM objects to enable 100% testability.
 */
export class TTSLifecycleManager {
  private status: TTSStatus = 'idle';
  private speakToken = 0;
  private onEndedCallback: (() => void) | null = null;
  private onStatusChange?: (status: TTSStatus) => void;

  constructor(onStatusChange?: (status: TTSStatus) => void) {
    this.onStatusChange = onStatusChange;
  }

  getStatus(): TTSStatus {
    return this.status;
  }

  isPreparing(): boolean {
    return this.status === 'preparing';
  }

  isPlaying(): boolean {
    return this.status === 'playing';
  }

  isBusy(): boolean {
    return this.status !== 'idle';
  }

  getSpeakToken(): number {
    return this.speakToken;
  }

  startPrepare(onEnded?: () => void): number {
    this.stop();
    this.speakToken += 1;
    this.onEndedCallback = onEnded || null;
    this.status = 'preparing';
    this.onStatusChange?.('preparing');
    return this.speakToken;
  }

  startPlayback(token: number): boolean {
    if (this.speakToken !== token) return false;
    this.status = 'playing';
    this.onStatusChange?.('playing');
    return true;
  }

  finishPlayback(token: number): void {
    if (this.speakToken === token) {
      const cb = this.onEndedCallback;
      this.onEndedCallback = null;
      this.stop();
      cb?.();
    }
  }

  stop(): void {
    this.speakToken += 1;
    this.onEndedCallback = null;
    if (this.status !== 'idle') {
      this.status = 'idle';
      this.onStatusChange?.('idle');
    }
  }
}

export interface ITTSProvider {
  synthesizeSpeech(text: string, audioCtx: AudioContext, signal?: AbortSignal): Promise<AudioBuffer>;
}

export const DIAGNOSTIC_SENTENCE = "Hello, welcome to your ASCEND interview. Let's begin.";

/**
 * Standard bounded timeout for TTS synthesis.
 * 8000ms accommodates network latency and edge model cold starts for full sentences
 * while guaranteeing candidate is never trapped in an unrecoverable 'preparing' state.
 */
export const DEFAULT_TTS_TIMEOUT_MS = 8000;

/**
 * Natural conversational speech rate for AI interviewer (Ira).
 * Calibrated to 1.05 for natural, responsive pacing and clear comprehension without awkward delays.
 */
export const DEFAULT_SPEECH_RATE = 1.05;

export class AscendRealTTSProvider implements ITTSProvider {
  async synthesizeSpeech(
    requestedText: string,
    audioCtx: AudioContext,
    signal?: AbortSignal
  ): Promise<AudioBuffer> {
    const targetText = requestedText?.trim() || DIAGNOSTIC_SENTENCE;

    // Check dev environment safely without crashing in pure Node environments
    const isDev = Boolean(
      (typeof import.meta !== 'undefined' && (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV) ||
      (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production')
    );

    // 1. Primary (Dev mode only): ASCEND TTS Middleware (/api/tts)
    if (isDev) {
      try {
        const url = `/api/tts?text=${encodeURIComponent(targetText)}`;
        const res = await fetch(url, { signal });
        if (res.ok) {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('audio') || contentType.includes('mpeg')) {
            const arrayBuffer = await res.arrayBuffer();
            if (arrayBuffer && arrayBuffer.byteLength > 0) {
              const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
              return audioBuffer;
            }
          }
        }
      } catch (err) {
        if (signal?.aborted) throw err;
        console.warn('[ASCEND TTS] Dev middleware /api/tts fetch failed, trying fallbacks...', err);
      }
    }

    // 2. Secondary: Puter.js client-side AI TTS (if present on window)
    const puterWin = window as unknown as {
      puter?: { ai?: { txt2speech?: (text: string) => Promise<HTMLAudioElement> } };
    };
    if (typeof window !== 'undefined' && puterWin.puter?.ai?.txt2speech) {
      try {
        console.log('[ASCEND TTS] Requesting speech via Puter.js...');
        const audioEl: HTMLAudioElement = await puterWin.puter.ai.txt2speech(targetText);
        if (audioEl && audioEl.src) {
          const puterRes = await fetch(audioEl.src, { signal });
          const puterBuffer = await puterRes.arrayBuffer();
          const decoded = await audioCtx.decodeAudioData(puterBuffer);
          return decoded;
        }
      } catch (puterErr) {
        if (signal?.aborted) throw puterErr;
        console.warn('[ASCEND TTS] Puter.js synthesis failed:', puterErr);
      }
    }

    throw new Error('No production server TTS endpoint available.');
  }
}

/**
 * Executes TTS synthesis bounded by an explicit timeout.
 * Aborts in-flight network requests where supported and rejects cleanly.
 */
export async function executeBoundedSynthesis(
  provider: ITTSProvider,
  text: string,
  audioCtx: AudioContext,
  timeoutMs: number = DEFAULT_TTS_TIMEOUT_MS,
  signal?: AbortSignal
): Promise<AudioBuffer> {
  const controller = new AbortController();

  if (signal) {
    if (signal.aborted) {
      controller.abort(signal.reason);
    } else {
      signal.addEventListener('abort', () => controller.abort(signal.reason), { once: true });
    }
  }

  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      controller.abort(new Error(`TTS synthesis timed out after ${timeoutMs}ms`));
      reject(new Error(`TTS synthesis timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    const buffer = await Promise.race([
      provider.synthesizeSpeech(text, audioCtx, controller.signal),
      timeoutPromise,
    ]);
    return buffer;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * Manages retention, release, and invalidation of SpeechSynthesisUtterance objects.
 * Prevents premature garbage collection in Chromium/WebKit browsers and
 * guards against stale callbacks clearing newer active utterances.
 */
export class UtteranceLifecycleManager {
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private currentId = 0;

  getActiveUtterance(): SpeechSynthesisUtterance | null {
    return this.activeUtterance;
  }

  getCurrentId(): number {
    return this.currentId;
  }

  retain(utterance: SpeechSynthesisUtterance): number {
    this.currentId += 1;
    this.activeUtterance = utterance;
    return this.currentId;
  }

  release(id: number, utterance?: SpeechSynthesisUtterance): boolean {
    if (this.currentId !== id) {
      // Stale callback attempting to release a newer utterance: reject!
      return false;
    }
    if (utterance && this.activeUtterance !== utterance) {
      return false;
    }
    this.activeUtterance = null;
    return true;
  }

  clear(): void {
    this.currentId += 1;
    if (this.activeUtterance) {
      this.activeUtterance.onstart = null;
      this.activeUtterance.onend = null;
      this.activeUtterance.onerror = null;
      this.activeUtterance = null;
    }
  }
}

const defaultTTSProvider = new AscendRealTTSProvider();

export interface VoiceSynthesizerOptions {
  synthesisTimeoutMs?: number;
}

export function useVoiceSynthesizer(
  ttsProvider: ITTSProvider = defaultTTSProvider,
  options: VoiceSynthesizerOptions = {}
) {
  const { synthesisTimeoutMs = DEFAULT_TTS_TIMEOUT_MS } = options;

  const [status, setStatus] = useState<TTSStatus>('idle');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const synthIntervalRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const utteranceManagerRef = useRef<UtteranceLifecycleManager | null>(null);
  if (!utteranceManagerRef.current) {
    utteranceManagerRef.current = new UtteranceLifecycleManager();
  }

  const lifecycleRef = useRef<TTSLifecycleManager | null>(null);
  if (!lifecycleRef.current) {
    lifecycleRef.current = new TTSLifecycleManager((newStatus) => {
      setStatus(newStatus);
      setIsPreparing(newStatus === 'preparing');
      setIsSpeaking(newStatus === 'playing');
      setIsBusy(newStatus !== 'idle');
    });
  }

  // Initialize or retrieve active AudioContext
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      audioContextRef.current = new AudioCtx();
    }
    return audioContextRef.current;
  }, []);

  // Proactively unlock and resume AudioContext on user interactions
  const resumeAudioContext = useCallback(async () => {
    try {
      const audioCtx = getAudioContext();
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
        console.log(`[ASCEND AudioContext] Resumed successfully. Current state: ${audioCtx.state}`);
      }
      return audioCtx;
    } catch (err) {
      console.error('[ASCEND AudioContext] Resume error:', err);
      return null;
    }
  }, [getAudioContext]);

  useEffect(() => {
    const handleGesture = () => {
      resumeAudioContext();
    };

    window.addEventListener('click', handleGesture, { capture: true });
    window.addEventListener('keydown', handleGesture, { capture: true });
    window.addEventListener('touchstart', handleGesture, { capture: true });

    return () => {
      window.removeEventListener('click', handleGesture, { capture: true });
      window.removeEventListener('keydown', handleGesture, { capture: true });
      window.removeEventListener('touchstart', handleGesture, { capture: true });
    };
  }, [resumeAudioContext]);

  const stop = useCallback(() => {
    // 1. Invalidate any in-flight async speech requests in the lifecycle controller
    lifecycleRef.current?.stop();

    // 2. Abort any active synthesis network request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // 3. Clear and detach active utterance
    utteranceManagerRef.current?.clear();

    // 4. Cancel native Web Speech API synthesis playback
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Safe ignore
      }
    }

    // 5. Clear simulated level interval if active
    if (synthIntervalRef.current) {
      clearInterval(synthIntervalRef.current);
      synthIntervalRef.current = null;
    }

    // 6. Cancel audio animation frame
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    // 7. Stop and disconnect AudioBufferSourceNode
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop();
        currentSourceRef.current.disconnect();
      } catch {
        // Source already stopped
      }
      currentSourceRef.current = null;
    }

    // 8. Disconnect AnalyserNode
    if (analyserRef.current) {
      try {
        analyserRef.current.disconnect();
      } catch {
        // Analyser disconnect
      }
      analyserRef.current = null;
    }

    setAudioLevel(0);
  }, []);

  const speak = useCallback(
    async (text: string, onEnded?: () => void) => {
      stop();
      const manager = lifecycleRef.current!;
      const token = manager.startPrepare(onEnded);

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        const audioCtx = getAudioContext();
        if (audioCtx.state === 'suspended') {
          await audioCtx.resume();
        }
        console.log(`[ASCEND TTS] Starting speech playback. AudioContext state: ${audioCtx.state}`);

        // 1. Fetch & decode real audio bytes bounded by timeout
        const audioBuffer = await executeBoundedSynthesis(
          ttsProvider,
          text,
          audioCtx,
          synthesisTimeoutMs,
          abortController.signal
        );

        // Abort if another speak request superseded this one while awaiting TTS
        if (manager.getSpeakToken() !== token) {
          console.log('[ASCEND TTS] Superseded by newer speech request, aborting playback.');
          return;
        }

        // 2. Setup AnalyserNode
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;
        analyserRef.current = analyser;

        // 3. Setup AudioBufferSourceNode
        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.playbackRate.value = DEFAULT_SPEECH_RATE;
        currentSourceRef.current = source;

        // 4. Wire Audio Pipeline: source -> analyser -> destination
        source.connect(analyser);
        analyser.connect(audioCtx.destination);

        // Transition lifecycle to playing
        manager.startPlayback(token);

        // 5. Measure real-time frequency data from AnalyserNode
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const updateAudioMeter = () => {
          if (!analyserRef.current) return;

          analyserRef.current.getByteFrequencyData(dataArray);

          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }

          const avg = sum / bufferLength;
          const level = Math.min(100, Math.round((avg / 128) * 100));

          setAudioLevel(level);

          animFrameRef.current = requestAnimationFrame(updateAudioMeter);
        };

        source.onended = () => {
          console.log('[ASCEND TTS] Interviewer audio playback finished.');
          manager.finishPlayback(token);
        };

        source.start(0);
        updateAudioMeter();
        console.log('[ASCEND TTS] AudioBufferSourceNode started successfully.');
      } catch (err) {
        console.warn('[ASCEND TTS] AudioBuffer synthesis unavailable or timed out, using Web Speech API fallback:', err);
        if (manager.getSpeakToken() !== token) return;

        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          try {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = DEFAULT_SPEECH_RATE;
            utterance.pitch = 1.0;

            // Prioritize clear, natural English voices when available in the browser
            try {
              const availableVoices = window.speechSynthesis.getVoices();
              const naturalVoice =
                availableVoices.find(
                  (v) =>
                    v.lang.startsWith('en') &&
                    (v.name.includes('Natural') ||
                      v.name.includes('Google') ||
                      v.name.includes('Neural') ||
                      v.name.includes('Samantha') ||
                      v.name.includes('Ava') ||
                      v.name.includes('Jenny') ||
                      v.name.includes('Guy'))
                ) ||
                availableVoices.find((v) => v.lang === 'en-US' || v.lang === 'en-GB') ||
                null;

              if (naturalVoice) {
                utterance.voice = naturalVoice;
              }
            } catch {
              // Graceful fallback to default system voice
            }

            // Retain active utterance in manager to prevent premature garbage collection
            const utteranceId = utteranceManagerRef.current?.retain(utterance) ?? 0;

            let hasCompleted = false;
            const handleCompletion = () => {
              if (hasCompleted) return;
              hasCompleted = true;

              // Only release if this callback belongs to the current active utterance
              utteranceManagerRef.current?.release(utteranceId, utterance);

              if (synthIntervalRef.current) {
                clearInterval(synthIntervalRef.current);
                synthIntervalRef.current = null;
              }

              // finishPlayback validates token and fires completion callback at most once
              manager.finishPlayback(token);
            };

            const startSimulatedLevels = () => {
              if (manager.getSpeakToken() !== token) return;
              manager.startPlayback(token);
              if (synthIntervalRef.current) clearInterval(synthIntervalRef.current);
              synthIntervalRef.current = window.setInterval(() => {
                const simulatedLevel = Math.floor(Math.random() * 45) + 40;
                setAudioLevel(simulatedLevel);
              }, 100);
            };

            utterance.onstart = startSimulatedLevels;
            utterance.onend = handleCompletion;
            utterance.onerror = handleCompletion;

            window.speechSynthesis.speak(utterance);
            return;
          } catch {
            // Web Speech API fallback failed
            utteranceManagerRef.current?.clear();
          }
        }
        manager.finishPlayback(token);
      }
    },
    [ttsProvider, getAudioContext, stop, synthesisTimeoutMs]
  );

  useEffect(() => {
    return () => {
      stop();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [stop]);

  return {
    speak,
    stop,
    status,
    isSpeaking,
    isPreparing,
    isBusy,
    audioLevel,
    resumeAudioContext,
  };
}
