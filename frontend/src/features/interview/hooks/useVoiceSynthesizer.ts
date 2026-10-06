import { useState, useRef, useCallback, useEffect } from 'react';
import { env } from '@/config/environment';

export interface ITTSProvider {
  synthesizeSpeech(text: string, audioCtx: AudioContext): Promise<AudioBuffer>;
}

/**
 * AscendRealTTSProvider fetches actual synthesized MP3 audio bytes from /api/tts endpoint (in dev mode)
 * or falls back to Puter.js / Web Speech API client-side TTS in production.
 * Both sources return genuine audio binary data decoded via AudioContext.decodeAudioData().
 */
export const DIAGNOSTIC_SENTENCE = "Hello, welcome to your ASCEND interview. Let's begin.";

export class AscendRealTTSProvider implements ITTSProvider {
  async synthesizeSpeech(requestedText: string, audioCtx: AudioContext): Promise<AudioBuffer> {
    const targetText = requestedText?.trim() || DIAGNOSTIC_SENTENCE;

    // 1. Primary (Dev mode only): ASCEND TTS Middleware (/api/tts)
    if (env.IS_DEV) {
      try {
        const url = `/api/tts?text=${encodeURIComponent(targetText)}`;
        const res = await fetch(url);
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
          const puterRes = await fetch(audioEl.src);
          const puterBuffer = await puterRes.arrayBuffer();
          const decoded = await audioCtx.decodeAudioData(puterBuffer);
          return decoded;
        }
      } catch (puterErr) {
        console.warn('[ASCEND TTS] Puter.js synthesis failed:', puterErr);
      }
    }

    throw new Error('No production server TTS endpoint available.');
  }
}

const defaultTTSProvider = new AscendRealTTSProvider();

export function useVoiceSynthesizer(ttsProvider: ITTSProvider = defaultTTSProvider) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const speakTokenRef = useRef<number>(0);

  // Initialize or retrieve active AudioContext
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
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
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop();
        currentSourceRef.current.disconnect();
      } catch {
        // Source already stopped
      }
      currentSourceRef.current = null;
    }

    if (analyserRef.current) {
      try {
        analyserRef.current.disconnect();
      } catch {
        // Analyser disconnect
      }
      analyserRef.current = null;
    }

    setIsSpeaking(false);
    setAudioLevel(0);
  }, []);

  const speak = useCallback(
    async (text: string) => {
      stop();
      const token = ++speakTokenRef.current;

      try {
        const audioCtx = getAudioContext();
        if (audioCtx.state === 'suspended') {
          await audioCtx.resume();
        }
        console.log(`[ASCEND TTS] Starting speech playback. AudioContext state: ${audioCtx.state}`);

        // 1. Fetch & decode real audio bytes
        const audioBuffer = await ttsProvider.synthesizeSpeech(text, audioCtx);

        // Abort if another speak request superseded this one while awaiting TTS
        if (speakTokenRef.current !== token) {
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
        currentSourceRef.current = source;

        // 4. Wire Audio Pipeline: source -> analyser -> destination
        source.connect(analyser);
        analyser.connect(audioCtx.destination);

        setIsSpeaking(true);

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
          stop();
        };

        source.start(0);
        updateAudioMeter();
        console.log('[ASCEND TTS] AudioBufferSourceNode started successfully.');
      } catch (err) {
        console.warn('[ASCEND TTS] AudioBuffer synthesis unavailable, using Web Speech API fallback:', err);
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          try {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = () => {
              setIsSpeaking(false);
              setAudioLevel(0);
            };
            utterance.onerror = () => {
              setIsSpeaking(false);
              setAudioLevel(0);
            };
            window.speechSynthesis.speak(utterance);
            return;
          } catch {
            // Web Speech API fallback failed
          }
        }
        stop();
      }
    },
    [ttsProvider, getAudioContext, stop]
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
    isSpeaking,
    audioLevel,
    resumeAudioContext,
  };
}
