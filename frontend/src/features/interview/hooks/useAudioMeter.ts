import { useState, useRef, useCallback, useEffect } from 'react';

export interface AudioMeterState {
  audioLevel: number; // 0 to 100
  peakLevel: number; // 0 to 100
  rms: number;
  isTesting: boolean;
  countdown: number;
  speechDetected: boolean;
  testPassed: boolean | null;
  errorMessage: string | null;
}

export function useAudioMeter(stream: MediaStream | null) {
  const [meterState, setMeterState] = useState<AudioMeterState>({
    audioLevel: 0,
    peakLevel: 0,
    rms: 0,
    isTesting: false,
    countdown: 10,
    speechDetected: false,
    testPassed: null,
    errorMessage: null,
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const speechDetectedRef = useRef<boolean>(false);
  const isTestingRef = useRef<boolean>(false);

  const cleanupAudio = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    if (sourceRef.current) {
      try {
        sourceRef.current.disconnect();
      } catch {
        // Safe to ignore if source is already disconnected
      }
      sourceRef.current = null;
    }
    if (analyserRef.current) {
      try {
        analyserRef.current.disconnect();
      } catch {
        // Safe to ignore if analyser is already disconnected
      }
      analyserRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close().catch(() => {});
      } catch {
        // Safe to ignore if audio context is already closing/closed
      }
      audioContextRef.current = null;
    }
  }, []);

  // Setup continuous live audio analysis whenever a stream is available
  useEffect(() => {
    if (!stream || stream.getAudioTracks().length === 0) {
      cleanupAudio();
      setMeterState((prev) => ({
        ...prev,
        audioLevel: 0,
        peakLevel: 0,
        rms: 0,
      }));
      return;
    }

    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack || audioTrack.readyState !== 'live') {
      return;
    }

    let isMounted = true;

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      // Resume suspended AudioContext
      if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.4;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;

      const bufferLength = analyser.fftSize;
      const timeData = new Uint8Array(bufferLength);
      let lastUIUpdate = 0;

      const analyzeFrame = (timestamp: number) => {
        if (!isMounted || !analyserRef.current) return;

        analyserRef.current.getByteTimeDomainData(timeData);

        // Time-Domain RMS & Peak calculation
        let sumSquares = 0;
        let peak = 0;

        for (let i = 0; i < bufferLength; i++) {
          const normalized = (timeData[i] - 128) / 128; // -1.0 to 1.0
          sumSquares += normalized * normalized;
          const absVal = Math.abs(normalized);
          if (absVal > peak) peak = absVal;
        }

        const rms = Math.sqrt(sumSquares / bufferLength);
        // Map RMS (0.0 to 0.35 typical speech) to 0-100 visual level
        const visualLevel = Math.min(100, Math.round(rms * 280));
        const visualPeak = Math.min(100, Math.round(peak * 100));

        // Speech detection threshold (RMS > 0.012 or peak > 0.04)
        if (rms > 0.012 || peak > 0.04) {
          if (isTestingRef.current) {
            speechDetectedRef.current = true;
          }
        }

        if (timestamp - lastUIUpdate > 40) {
          lastUIUpdate = timestamp;
          setMeterState((prev) => ({
            ...prev,
            audioLevel: visualLevel,
            peakLevel: visualPeak,
            rms: Math.round(rms * 1000) / 1000,
            speechDetected: speechDetectedRef.current,
          }));
        }

        animFrameRef.current = requestAnimationFrame(analyzeFrame);
      };

      animFrameRef.current = requestAnimationFrame(analyzeFrame);
    } catch (err) {
      console.error('[MEDIA] Failed to initialize live audio meter:', err);
    }

    return () => {
      isMounted = false;
      cleanupAudio();
    };
  }, [stream, cleanupAudio]);

  const startMicTest = useCallback(async () => {
    speechDetectedRef.current = false;
    isTestingRef.current = true;

    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      try {
        await audioContextRef.current.resume();
      } catch {
        // Safe to ignore if resume fails or context state changed
      }
    }

    if (!stream || stream.getAudioTracks().length === 0) {
      isTestingRef.current = false;
      setMeterState((prev) => ({
        ...prev,
        isTesting: false,
        countdown: 10,
        speechDetected: false,
        testPassed: false,
        errorMessage: 'Microphone track unavailable.',
      }));
      return;
    }

    setMeterState((prev) => ({
      ...prev,
      isTesting: true,
      countdown: 10,
      speechDetected: false,
      testPassed: null,
      errorMessage: null,
    }));

    let currentSec = 10;
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }

    countdownTimerRef.current = setInterval(() => {
      currentSec -= 1;
      if (currentSec <= 0) {
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
        }

        isTestingRef.current = false;
        const passed = speechDetectedRef.current;

        setMeterState((prev) => ({
          ...prev,
          isTesting: false,
          countdown: 0,
          speechDetected: passed,
          testPassed: passed,
          errorMessage: passed
            ? null
            : 'No microphone input detected. Please speak clearly into your microphone and retry.',
        }));
      } else {
        setMeterState((prev) => ({
          ...prev,
          countdown: currentSec,
        }));
      }
    }, 1000);
  }, [stream]);

  const resetTest = useCallback(() => {
    isTestingRef.current = false;
    speechDetectedRef.current = false;
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setMeterState((prev) => ({
      ...prev,
      isTesting: false,
      countdown: 10,
      speechDetected: false,
      testPassed: null,
      errorMessage: null,
    }));
  }, []);

  return {
    ...meterState,
    startMicTest,
    resetTest,
    cleanupAudio,
  };
}
