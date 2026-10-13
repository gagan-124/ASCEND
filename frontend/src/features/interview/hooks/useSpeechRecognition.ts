import { useState, useRef, useCallback, useEffect } from 'react';

// Type definitions for Web Speech API SpeechRecognition
export interface ISpeechRecognitionResultItem {
  transcript: string;
}

export interface ISpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  [index: number]: ISpeechRecognitionResultItem;
}

export interface ISpeechRecognitionResultList {
  length: number;
  [index: number]: ISpeechRecognitionResult;
}

export interface ISpeechRecognitionEvent extends Event {
  results: ISpeechRecognitionResultList;
  resultIndex: number;
}

export interface ISpeechRecognitionErrorEvent extends Event {
  error: string;
}

export interface ISpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: ((this: ISpeechRecognitionInstance, ev: Event) => void) | null;
  onresult: ((this: ISpeechRecognitionInstance, ev: ISpeechRecognitionEvent) => void) | null;
  onerror: ((this: ISpeechRecognitionInstance, ev: ISpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: ISpeechRecognitionInstance, ev: Event) => void) | null;
}

export type SpeechRecognitionConstructor = new () => ISpeechRecognitionInstance;

export interface IWindowSpeechRecognition extends Window {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}

export interface ProcessedTranscriptResult {
  final: string;
  interim: string;
  combined: string;
  hasChanges: boolean;
  isFinal: boolean;
}

/**
 * Authoritative transcript accumulation and race-condition resolver engine.
 * Extracted as a pure unit to guarantee identical behavior across production runtime and unit testing.
 */
export class TranscriptProcessor {
  private accumulatedFinal = '';
  private interimText = '';
  private flushedInterimText = '';
  private lastProcessedFinalIndex = -1;
  private sessionToken = 0;

  getFinal(): string {
    return this.accumulatedFinal;
  }

  getInterim(): string {
    return this.interimText;
  }

  getCombined(): string {
    return this.interimText
      ? this.accumulatedFinal
        ? `${this.accumulatedFinal} ${this.interimText}`
        : this.interimText
      : this.accumulatedFinal;
  }

  getSessionToken(): number {
    return this.sessionToken;
  }

  startNewSession(): number {
    this.interimText = '';
    this.flushedInterimText = '';
    this.lastProcessedFinalIndex = -1;
    this.sessionToken += 1;
    return this.sessionToken;
  }

  reset(): void {
    this.accumulatedFinal = '';
    this.interimText = '';
    this.flushedInterimText = '';
    this.lastProcessedFinalIndex = -1;
    this.sessionToken += 1;
  }

  setManualTranscript(text: string): void {
    this.accumulatedFinal = text;
    this.interimText = '';
    this.flushedInterimText = '';
    this.lastProcessedFinalIndex = -1;
  }

  flushInterim(): { flushedText: string; finalTranscript: string } {
    if (this.interimText.trim()) {
      const pendingText = this.interimText.trim();
      const separator =
        this.accumulatedFinal && !this.accumulatedFinal.endsWith(' ') ? ' ' : '';
      this.accumulatedFinal += separator + pendingText;
      this.flushedInterimText = pendingText;
      this.interimText = '';
      return { flushedText: pendingText, finalTranscript: this.accumulatedFinal };
    }
    return { flushedText: '', finalTranscript: this.accumulatedFinal };
  }

  processResults(
    results: ISpeechRecognitionResultList,
    token: number
  ): ProcessedTranscriptResult {
    // Drop late events from obsolete session instances (Requirement E)
    if (token !== this.sessionToken) {
      return {
        final: this.accumulatedFinal,
        interim: this.interimText,
        combined: this.getCombined(),
        hasChanges: false,
        isFinal: false,
      };
    }

    let newlyFinalizedChunk = '';
    let maxFinalIndex = this.lastProcessedFinalIndex;

    for (let i = 0; i < results.length; i++) {
      const item = results[i];
      if (i > this.lastProcessedFinalIndex && item.isFinal) {
        const chunk = item[0]?.transcript?.trim() || '';
        if (chunk) {
          newlyFinalizedChunk = newlyFinalizedChunk
            ? `${newlyFinalizedChunk} ${chunk}`
            : chunk;
        }
        maxFinalIndex = i;
      }
    }

    let hasChanges = false;

    if (newlyFinalizedChunk) {
      this.lastProcessedFinalIndex = maxFinalIndex;
      hasChanges = true;

      if (this.flushedInterimText) {
        // Handle race where stopListening() already flushed this interim text (Requirement C & D)
        const flushed = this.flushedInterimText.trim();
        this.flushedInterimText = '';

        if (this.accumulatedFinal.endsWith(flushed)) {
          // Replace flushed interim portion with authoritative newly finalized chunk
          const base = this.accumulatedFinal
            .slice(0, this.accumulatedFinal.length - flushed.length)
            .trimEnd();
          const separator = base ? ' ' : '';
          this.accumulatedFinal = base + separator + newlyFinalizedChunk;
        } else if (newlyFinalizedChunk.toLowerCase().startsWith(flushed.toLowerCase())) {
          // If formatting differed, append only remaining newly added words
          const remainder = newlyFinalizedChunk.slice(flushed.length).trim();
          if (remainder) {
            const separator =
              this.accumulatedFinal && !this.accumulatedFinal.endsWith(' ') ? ' ' : '';
            this.accumulatedFinal += separator + remainder;
          }
        } else if (newlyFinalizedChunk !== flushed) {
          // Distinct finalized segment
          const separator =
            this.accumulatedFinal && !this.accumulatedFinal.endsWith(' ') ? ' ' : '';
          this.accumulatedFinal += separator + newlyFinalizedChunk;
        }
      } else {
        // Normal active accumulation
        const separator =
          this.accumulatedFinal && !this.accumulatedFinal.endsWith(' ') ? ' ' : '';
        this.accumulatedFinal += separator + newlyFinalizedChunk;
      }
    }

    // Extract current active interim text strictly following the last finalized item
    let currentInterim = '';
    for (let i = this.lastProcessedFinalIndex + 1; i < results.length; i++) {
      const item = results[i];
      if (!item.isFinal) {
        currentInterim += item[0]?.transcript || '';
      }
    }
    currentInterim = currentInterim.trim();

    if (currentInterim !== this.interimText) {
      this.interimText = currentInterim;
      hasChanges = true;
    }

    const combined = this.getCombined();

    return {
      final: this.accumulatedFinal,
      interim: this.interimText,
      combined,
      hasChanges,
      isFinal: !this.interimText,
    };
  }
}

export interface SpeechCoordinatorOptions {
  continuous?: boolean;
  interimResults?: boolean;
  lang?: string;
  getConstructor?: () => SpeechRecognitionConstructor | undefined;
  onTranscriptChange?: (res: ProcessedTranscriptResult) => void;
  onListeningChange?: (isListening: boolean) => void;
  onError?: (error: string) => void;
}

/**
 * Authoritative production coordinator for SpeechRecognition instances and restart lifecycles.
 * Decoupled from React to enable 100% deterministic testability of all lifecycle & restart scenarios.
 */
export class SpeechRecognitionCoordinator {
  private processor: TranscriptProcessor;
  private activeRecognition: ISpeechRecognitionInstance | null = null;
  private currentToken = 0;
  private isIntentionalStop = true;
  private isListening = false;
  private restartTimeout: ReturnType<typeof setTimeout> | null = null;
  private restartCount = 0;
  private maxRestarts = 5;
  private options: SpeechCoordinatorOptions;

  constructor(options: SpeechCoordinatorOptions = {}, processor?: TranscriptProcessor) {
    this.options = options;
    this.processor = processor || new TranscriptProcessor();
  }

  getProcessor(): TranscriptProcessor {
    return this.processor;
  }

  getIsListening(): boolean {
    return this.isListening;
  }

  getCurrentToken(): number {
    return this.currentToken;
  }

  getActiveRecognition(): ISpeechRecognitionInstance | null {
    return this.activeRecognition;
  }

  getIsIntentionalStop(): boolean {
    return this.isIntentionalStop;
  }

  updateOptions(options: Partial<SpeechCoordinatorOptions>): void {
    this.options = { ...this.options, ...options };
  }

  private clearRestartTimer(): void {
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }
  }

  private resolveConstructor(): SpeechRecognitionConstructor | undefined {
    if (this.options.getConstructor) {
      return this.options.getConstructor();
    }
    if (typeof window !== 'undefined') {
      const win = window as unknown as IWindowSpeechRecognition;
      return win.SpeechRecognition || win.webkitSpeechRecognition;
    }
    return undefined;
  }

  start(): void {
    this.clearRestartTimer();
    this.isIntentionalStop = false;
    this.restartCount = 0;
    this.spawnRecognitionInstance();
  }

  private spawnRecognitionInstance(): void {
    // 1. Cleanly detach and abort any existing recognition instance
    if (this.activeRecognition) {
      const old = this.activeRecognition;
      this.activeRecognition = null;
      old.onstart = null;
      old.onresult = null;
      old.onerror = null;
      old.onend = null;
      try {
        old.abort();
      } catch {
        // Safe ignore
      }
    }

    const SpeechClass = this.resolveConstructor();
    if (!SpeechClass) {
      this.isIntentionalStop = true;
      this.isListening = false;
      this.options.onListeningChange?.(false);
      this.options.onError?.('Speech recognition is not supported in this browser.');
      return;
    }

    // 2. Start a new session on the processor (resets lastProcessedFinalIndex to -1, increments sessionToken, preserves accumulatedFinal)
    const token = this.processor.startNewSession();
    this.currentToken = token;

    try {
      const recognition = new SpeechClass();
      recognition.continuous = this.options.continuous ?? true;
      recognition.interimResults = this.options.interimResults ?? true;
      recognition.lang = this.options.lang ?? 'en-US';

      recognition.onstart = () => {
        if (this.isIntentionalStop) {
          try {
            recognition.stop();
          } catch {
            // Safe ignore
          }
          return;
        }
        this.restartCount = 0;
        this.isListening = true;
        this.options.onListeningChange?.(true);
      };

      recognition.onresult = (event: ISpeechRecognitionEvent) => {
        const res = this.processor.processResults(event.results, token);
        if (res.hasChanges) {
          this.options.onTranscriptChange?.(res);
        }
      };

      recognition.onerror = (event: ISpeechRecognitionErrorEvent) => {
        const errType = event.error;
        if (errType === 'no-speech' || errType === 'aborted') {
          return;
        }
        if (errType === 'not-allowed' || errType === 'service-not-allowed') {
          this.isIntentionalStop = true;
          this.isListening = false;
          this.options.onListeningChange?.(false);
          this.options.onError?.('Microphone speech recognition permission denied.');
          return;
        }
        this.options.onError?.(`Speech recognition: ${errType}`);
      };

      recognition.onend = () => {
        // Intentional stop: do not restart!
        if (this.isIntentionalStop) {
          this.isListening = false;
          this.options.onListeningChange?.(false);
          if (this.activeRecognition === recognition) {
            this.activeRecognition = null;
          }
          return;
        }

        // Unexpected termination / silence pause
        if (this.activeRecognition === recognition) {
          this.activeRecognition = null;
        }

        if (this.restartCount >= this.maxRestarts) {
          this.isIntentionalStop = true;
          this.isListening = false;
          this.options.onListeningChange?.(false);
          this.options.onError?.('Speech recognition ended unexpectedly.');
          return;
        }

        this.restartCount += 1;
        this.clearRestartTimer();
        this.restartTimeout = setTimeout(() => {
          if (this.isIntentionalStop) return;
          try {
            this.spawnRecognitionInstance();
          } catch (err: unknown) {
            this.isIntentionalStop = true;
            this.isListening = false;
            this.options.onListeningChange?.(false);
            const msg = err instanceof Error ? err.message : 'Restart failed';
            this.options.onError?.(`Speech recognition restart failed: ${msg}`);
          }
        }, 50);
      };

      this.activeRecognition = recognition;
      recognition.start();
    } catch (e: unknown) {
      this.activeRecognition = null;
      this.isListening = false;
      this.options.onListeningChange?.(false);
      const msg = e instanceof Error ? e.message : 'Failed to start speech recognition';
      this.options.onError?.(msg);
    }
  }

  stop(): string {
    this.clearRestartTimer();
    this.isIntentionalStop = true;
    this.isListening = false;
    this.options.onListeningChange?.(false);

    // Synchronously flush any pending interim text
    const { flushedText, finalTranscript } = this.processor.flushInterim();
    if (flushedText) {
      this.options.onTranscriptChange?.({
        final: finalTranscript,
        interim: '',
        combined: finalTranscript,
        hasChanges: true,
        isFinal: true,
      });
    }

    if (this.activeRecognition) {
      try {
        this.activeRecognition.stop();
      } catch {
        // Safe ignore
      }
    }

    return finalTranscript;
  }

  reset(): void {
    this.clearRestartTimer();
    this.isIntentionalStop = true;
    if (this.activeRecognition) {
      const old = this.activeRecognition;
      this.activeRecognition = null;
      old.onstart = null;
      old.onresult = null;
      old.onerror = null;
      old.onend = null;
      try {
        old.abort();
      } catch {
        // Safe ignore
      }
    }
    this.processor.reset();
    this.isListening = false;
    this.options.onListeningChange?.(false);
    this.options.onTranscriptChange?.({
      final: '',
      interim: '',
      combined: '',
      hasChanges: true,
      isFinal: true,
    });
  }

  abort(): void {
    this.clearRestartTimer();
    this.isIntentionalStop = true;
    if (this.activeRecognition) {
      const old = this.activeRecognition;
      this.activeRecognition = null;
      old.onstart = null;
      old.onresult = null;
      old.onerror = null;
      old.onend = null;
      try {
        old.abort();
      } catch {
        // Safe ignore
      }
    }
    this.isListening = false;
    this.options.onListeningChange?.(false);
  }

  setManualTranscript(text: string): void {
    this.processor.setManualTranscript(text);
    this.options.onTranscriptChange?.({
      final: text,
      interim: '',
      combined: text,
      hasChanges: true,
      isFinal: true,
    });
  }
}

export interface SpeechRecognitionOptions {
  continuous?: boolean;
  interimResults?: boolean;
  lang?: string;
  onResult?: (transcript: string, isFinal: boolean, interimTranscript?: string) => void;
  onError?: (error: string) => void;
}

export function useSpeechRecognition(options: SpeechRecognitionOptions = {}) {
  const {
    continuous = true,
    interimResults = true,
    lang = 'en-US',
    onResult,
    onError,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const coordinatorRef = useRef<SpeechRecognitionCoordinator | null>(null);

  if (!coordinatorRef.current) {
    coordinatorRef.current = new SpeechRecognitionCoordinator({
      continuous,
      interimResults,
      lang,
      onListeningChange: (listening) => {
        setIsListening(listening);
      },
      onTranscriptChange: (res) => {
        setTranscript(res.final);
        setInterimTranscript(res.interim);
        onResultRef.current?.(res.combined, res.isFinal, res.interim);
      },
      onError: (err) => {
        setError(err);
        onErrorRef.current?.(err);
      },
    });
  }

  // Keep options updated on render
  useEffect(() => {
    coordinatorRef.current?.updateOptions({
      continuous,
      interimResults,
      lang,
      onError: (err) => {
        setError(err);
        onErrorRef.current?.(err);
      },
    });
  }, [continuous, interimResults, lang]);

  const isSupported =
    typeof window !== 'undefined' &&
    Boolean(
      (window as unknown as IWindowSpeechRecognition).SpeechRecognition ||
        (window as unknown as IWindowSpeechRecognition).webkitSpeechRecognition
    );

  const startListening = useCallback(() => {
    setError(null);
    coordinatorRef.current?.start();
  }, []);

  const stopListening = useCallback((): string => {
    return coordinatorRef.current?.stop() || '';
  }, []);

  const resetTranscript = useCallback(() => {
    coordinatorRef.current?.reset();
    setTranscript('');
    setInterimTranscript('');
  }, []);

  const setManualTranscript = useCallback((newTranscript: string) => {
    coordinatorRef.current?.setManualTranscript(newTranscript);
    setTranscript(newTranscript);
    setInterimTranscript('');
  }, []);

  useEffect(() => {
    return () => {
      coordinatorRef.current?.abort();
    };
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript,
    setTranscript: setManualTranscript,
  };
}
