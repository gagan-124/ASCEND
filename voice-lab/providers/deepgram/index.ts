/**
 * ASCEND VOICE LAB — Deepgram Aura Provider Adapter
 * 
 * Target Persona: Warm, confident, calm, conversational female interviewer.
 * Voice: 'aura-asteria-en' (or 'aura-luna-en')
 * Model: 'aura-2' / 'aura'
 */

import process from 'node:process';
import { BaseTTSProvider } from '../baseProvider.ts';
import type {
  ProviderOfficialInfo,
  TTSChunkCallback,
  TTSMetrics,
  TTSResult,
  TTSVoiceConfig
} from '../types.ts';

export class DeepgramProvider extends BaseTTSProvider {
  readonly id = 'deepgram';
  readonly name = 'Deepgram (Aura-2 / Aura)';

  readonly defaultVoiceConfig: TTSVoiceConfig = {
    voiceId: 'aura-asteria-en', // Premier warm, conversational female voice
    modelId: 'aura-asteria-en',
    sampleRate: 24000,
    format: 'wav'
  };

  private apiKey: string;

  constructor(apiKey: string = process.env.DEEPGRAM_API_KEY || '') {
    super();
    this.apiKey = apiKey.trim();
  }

  getProviderInfo(): ProviderOfficialInfo {
    return {
      providerId: 'deepgram',
      name: 'Deepgram',
      officialDocUrl: 'https://developers.deepgram.com/docs/getting-started-with-aura',
      pricingUrl: 'https://deepgram.com/pricing',
      models: ['aura-2-thalia-en', 'aura-asteria-en', 'aura-luna-en', 'aura-stella-en', 'aura-athena-en', 'aura-arcas-en', 'aura-helios-en'],
      selectedModel: 'aura-asteria-en',
      selectedVoiceId: 'aura-asteria-en',
      selectedVoiceName: 'Asteria (Warm, confident, conversational US English female)',
      voicePersonaDescription: 'Professional, calm, natural cadence, clear articulation suitable for technical interviews.',
      freeTier: {
        allocation: '$200 in free credits upon signup (valid for ~6.6M characters on Aura-2 at $0.030/1k chars)',
        requiresCreditCard: false,
        commercialUseAllowed: true,
        limitations: [
          'Subject to standard API concurrency limits (50 concurrent streams default)',
          'Requires active API key'
        ]
      },
      streamingCapabilities: {
        httpStreaming: true,
        webSockets: true,
        sse: false,
        claimedTtfbMs: '~90ms - 200ms',
        supportedFormats: ['linear16 (WAV)', 'mp3', 'opus', 'flac', 'mulaw', 'alaw'],
        supportedSampleRates: [8000, 16000, 24000, 32000, 48000]
      },
      concurrencyAndRateLimits: '50 concurrent streams; up to 100 requests/sec with standard account',
      strengths: [
        'Extremely low Time-To-First-Byte (sub-150ms achievable)',
        'True chunked streaming over both HTTP and WebSockets',
        'Generous $200 free credit without mandatory credit card',
        'Clean WAV and raw linear16 PCM outputs matching Web Audio API'
      ],
      weaknesses: [
        'Less emotional nuance modulation compared to ElevenLabs style tags',
        'Catalog is fixed voice models rather than unlimited fine-grained voice cloning'
      ]
    };
  }

  async synthesize(text: string, config?: Partial<TTSVoiceConfig>): Promise<TTSResult> {
    const finalConfig = { ...this.defaultVoiceConfig, ...config };
    const startTime = performance.now();

    if (!this.apiKey) {
      return {
        audioBuffer: new Uint8Array(0),
        metrics: {
          requestStartTimeMs: startTime,
          firstByteTimeMs: null,
          totalGenerationTimeMs: 0,
          audioDurationMs: 0,
          audioSizeBytes: 0,
          chunkCount: 0,
          streamingSupported: true,
          format: 'wav',
          sampleRate: finalConfig.sampleRate || 24000,
          channels: 1
        },
        error: 'DEEPGRAM_API_KEY is not configured in environment or voice-lab/.env'
      };
    }

    this.activeAbortController = new AbortController();
    const voiceModel = finalConfig.voiceId || 'aura-asteria-en';
    const sampleRate = finalConfig.sampleRate || 24000;
    const url = `https://api.deepgram.com/v1/speak?model=${encodeURIComponent(voiceModel)}&encoding=linear16&sample_rate=${sampleRate}&container=wav`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text }),
        signal: this.activeAbortController.signal
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          audioBuffer: new Uint8Array(0),
          metrics: {
            requestStartTimeMs: startTime,
            firstByteTimeMs: null,
            totalGenerationTimeMs: Math.round(performance.now() - startTime),
            audioDurationMs: 0,
            audioSizeBytes: 0,
            chunkCount: 0,
            streamingSupported: true,
            format: 'wav',
            sampleRate,
            channels: 1
          },
          error: `Deepgram API HTTP ${response.status} (${response.statusText}): ${errorText}`
        };
      }

      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = new Uint8Array(arrayBuffer);
      const totalTime = Math.round(performance.now() - startTime);

      const parsed = BaseTTSProvider.inspectAudio(audioBuffer, 'wav', sampleRate);

      return {
        audioBuffer,
        metrics: {
          requestStartTimeMs: startTime,
          firstByteTimeMs: totalTime, // In non-chunked single fetch, first full payload arrival
          totalGenerationTimeMs: totalTime,
          audioDurationMs: parsed.durationMs,
          audioSizeBytes: audioBuffer.length,
          chunkCount: 1,
          streamingSupported: true,
          format: parsed.format,
          sampleRate: parsed.sampleRate,
          channels: parsed.channels,
          bitDepth: parsed.bitDepth
        }
      };
    } catch (err: any) {
      return {
        audioBuffer: new Uint8Array(0),
        metrics: {
          requestStartTimeMs: startTime,
          firstByteTimeMs: null,
          totalGenerationTimeMs: Math.round(performance.now() - startTime),
          audioDurationMs: 0,
          audioSizeBytes: 0,
          chunkCount: 0,
          streamingSupported: true,
          format: 'wav',
          sampleRate,
          channels: 1
        },
        error: `Deepgram synthesis exception: ${err?.message || String(err)}`
      };
    } finally {
      this.activeAbortController = null;
    }
  }

  async stream(
    text: string,
    onChunk: TTSChunkCallback,
    config?: Partial<TTSVoiceConfig>
  ): Promise<TTSResult> {
    const finalConfig = { ...this.defaultVoiceConfig, ...config };
    const startTime = performance.now();

    if (!this.apiKey) {
      return {
        audioBuffer: new Uint8Array(0),
        metrics: {
          requestStartTimeMs: startTime,
          firstByteTimeMs: null,
          totalGenerationTimeMs: 0,
          audioDurationMs: 0,
          audioSizeBytes: 0,
          chunkCount: 0,
          streamingSupported: true,
          format: 'wav',
          sampleRate: finalConfig.sampleRate || 24000,
          channels: 1
        },
        error: 'DEEPGRAM_API_KEY is not configured in environment or voice-lab/.env'
      };
    }

    this.activeAbortController = new AbortController();
    const voiceModel = finalConfig.voiceId || 'aura-asteria-en';
    const sampleRate = finalConfig.sampleRate || 24000;
    const url = `https://api.deepgram.com/v1/speak?model=${encodeURIComponent(voiceModel)}&encoding=linear16&sample_rate=${sampleRate}&container=wav`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text }),
        signal: this.activeAbortController.signal
      });

      if (!response.ok || !response.body) {
        const errorText = await response.text();
        return {
          audioBuffer: new Uint8Array(0),
          metrics: {
            requestStartTimeMs: startTime,
            firstByteTimeMs: null,
            totalGenerationTimeMs: Math.round(performance.now() - startTime),
            audioDurationMs: 0,
            audioSizeBytes: 0,
            chunkCount: 0,
            streamingSupported: true,
            format: 'wav',
            sampleRate,
            channels: 1
          },
          error: `Deepgram streaming API HTTP ${response.status}: ${errorText}`
        };
      }

      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let totalBytes = 0;
      let firstByteTimeMs: number | null = null;
      let chunkIndex = 0;

      while (true) {
        const { done, value } = await reader.read();
        const now = performance.now();

        if (value && value.length > 0) {
          if (firstByteTimeMs === null) {
            firstByteTimeMs = Math.round(now - startTime);
          }
          chunks.push(value);
          totalBytes += value.length;

          onChunk(value, {
            chunkIndex,
            chunkSizeBytes: value.length,
            timestampMs: Math.round(now - startTime),
            isFirstChunk: chunkIndex === 0,
            isFinalChunk: done
          });
          chunkIndex++;
        }

        if (done) break;
      }

      const totalTime = Math.round(performance.now() - startTime);

      // Concatenate all chunks into a unified buffer
      const mergedBuffer = new Uint8Array(totalBytes);
      let offset = 0;
      for (const chunk of chunks) {
        mergedBuffer.set(chunk, offset);
        offset += chunk.length;
      }

      const parsed = BaseTTSProvider.inspectAudio(mergedBuffer, 'wav', sampleRate);

      return {
        audioBuffer: mergedBuffer,
        metrics: {
          requestStartTimeMs: startTime,
          firstByteTimeMs: firstByteTimeMs ?? totalTime,
          totalGenerationTimeMs: totalTime,
          audioDurationMs: parsed.durationMs,
          audioSizeBytes: totalBytes,
          chunkCount: chunkIndex,
          streamingSupported: true,
          format: parsed.format,
          sampleRate: parsed.sampleRate,
          channels: parsed.channels,
          bitDepth: parsed.bitDepth
        }
      };
    } catch (err: any) {
      return {
        audioBuffer: new Uint8Array(0),
        metrics: {
          requestStartTimeMs: startTime,
          firstByteTimeMs: null,
          totalGenerationTimeMs: Math.round(performance.now() - startTime),
          audioDurationMs: 0,
          audioSizeBytes: 0,
          chunkCount: 0,
          streamingSupported: true,
          format: 'wav',
          sampleRate,
          channels: 1
        },
        error: `Deepgram streaming exception: ${err?.message || String(err)}`
      };
    } finally {
      this.activeAbortController = null;
    }
  }
}
