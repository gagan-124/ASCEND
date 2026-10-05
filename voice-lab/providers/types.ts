/**
 * ASCEND VOICE LAB — Common TTS Interface & Type Definitions
 * 
 * Isolated test harness types for evaluating AI voice / TTS providers.
 * Strictly decoupled from ASCEND production code.
 */

export type AudioContainerFormat = 'wav' | 'mp3' | 'pcm_s16le' | 'ogg_opus' | 'raw_pcm';

export interface TTSVoiceConfig {
  voiceId: string;
  modelId: string;
  sampleRate?: number;
  speed?: number;
  format?: AudioContainerFormat;
  additionalParams?: Record<string, any>;
}

export interface TTSChunkMetadata {
  chunkIndex: number;
  chunkSizeBytes: number;
  timestampMs: number;
  isFirstChunk: boolean;
  isFinalChunk: boolean;
}

export type TTSChunkCallback = (
  chunk: Uint8Array,
  metadata: TTSChunkMetadata
) => void;

export interface TTSMetrics {
  requestStartTimeMs: number;
  firstByteTimeMs: number | null;     // Time-to-First-Audio / First Byte (TTFA / TTFB)
  totalGenerationTimeMs: number;      // Total end-to-end request duration
  audioDurationMs: number;            // Length of synthesized audio speech in ms
  audioSizeBytes: number;             // Total bytes generated
  chunkCount: number;                 // Number of streaming chunks received
  streamingSupported: boolean;
  format: string;
  sampleRate: number;
  channels: number;
  bitDepth?: number;
}

export interface TTSResult {
  audioBuffer: Uint8Array;
  metrics: TTSMetrics;
  error?: string;
}

export interface ProviderOfficialInfo {
  providerId: 'deepgram' | 'cartesia' | 'elevenlabs' | 'google_cloud';
  name: string;
  officialDocUrl: string;
  pricingUrl: string;
  models: string[];
  selectedModel: string;
  selectedVoiceId: string;
  selectedVoiceName: string;
  voicePersonaDescription: string;
  freeTier: {
    allocation: string;
    requiresCreditCard: boolean;
    commercialUseAllowed: boolean;
    limitations: string[];
  };
  streamingCapabilities: {
    httpStreaming: boolean;
    webSockets: boolean;
    sse: boolean;
    claimedTtfbMs: string;
    supportedFormats: string[];
    supportedSampleRates: number[];
  };
  concurrencyAndRateLimits: string;
  strengths: string[];
  weaknesses: string[];
}

export interface TTSProvider {
  readonly id: string;
  readonly name: string;
  readonly defaultVoiceConfig: TTSVoiceConfig;
  
  /**
   * Complete generation: sends prompt text and resolves when full audio is ready.
   */
  synthesize(text: string, config?: Partial<TTSVoiceConfig>): Promise<TTSResult>;

  /**
   * Streaming generation: receives audio chunks incrementally as they arrive.
   */
  stream(
    text: string,
    onChunk: TTSChunkCallback,
    config?: Partial<TTSVoiceConfig>
  ): Promise<TTSResult>;

  /**
   * Aborts any in-flight requests.
   */
  stop(): void;

  /**
   * Returns verified official metadata and configuration for the provider.
   */
  getProviderInfo(): ProviderOfficialInfo;
}
