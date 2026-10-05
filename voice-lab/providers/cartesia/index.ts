/**
 * ASCEND VOICE LAB — Cartesia Sonic Provider Adapter
 * 
 * Target Persona: Calm, empathetic, professional female interviewer.
 * Model: 'sonic-english' / 'sonic-3.5'
 * Voice: '694f12bc-c40d-4460-a000-1f9e01826913' (Sarah / Helpful Assistant)
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

export class CartesiaProvider extends BaseTTSProvider {
  readonly id = 'cartesia';
  readonly name = 'Cartesia (Sonic)';

  readonly defaultVoiceConfig: TTSVoiceConfig = {
    voiceId: '694f12bc-c40d-4460-a000-1f9e01826913', // Sarah / Helpful Assistant
    modelId: 'sonic-english',
    sampleRate: 24000,
    format: 'wav'
  };

  private apiKey: string;

  constructor(apiKey: string = process.env.CARTESIA_API_KEY || '') {
    super();
    this.apiKey = apiKey.trim();
  }

  getProviderInfo(): ProviderOfficialInfo {
    return {
      providerId: 'cartesia',
      name: 'Cartesia',
      officialDocUrl: 'https://docs.cartesia.ai',
      pricingUrl: 'https://www.cartesia.ai/pricing',
      models: ['sonic-english', 'sonic-3.5', 'sonic-3.6', 'sonic-multilingual'],
      selectedModel: 'sonic-english',
      selectedVoiceId: '694f12bc-c40d-4460-a000-1f9e01826913',
      selectedVoiceName: 'Sarah / Helpful Assistant (Calm, conversational, articulate)',
      voicePersonaDescription: 'High naturalness, adaptive intonation, clear pronunciation with subtle conversational inflection.',
      freeTier: {
        allocation: 'Free trial credits upon registration (~40,000 to 100,000 characters)',
        requiresCreditCard: false,
        commercialUseAllowed: false,
        limitations: [
          'Trial credits do not renew automatically monthly without subscription',
          'Concurrency limits applied to free tier'
        ]
      },
      streamingCapabilities: {
        httpStreaming: true,
        webSockets: true,
        sse: false,
        claimedTtfbMs: '~90ms - 135ms',
        supportedFormats: ['wav', 'raw pcm_s16le', 'pcm_f32le', 'pcm_mulaw', 'pcm_alaw'],
        supportedSampleRates: [8000, 16000, 22050, 24000, 44100, 48000]
      },
      concurrencyAndRateLimits: '10 concurrent streams on standard free/starter plans',
      strengths: [
        'Industry-leading low model latency (sub-90ms inference)',
        'Superior handling of question intonations and natural micro-pauses',
        'Direct raw PCM / WAV chunk output perfectly formatted for AudioContext'
      ],
      weaknesses: [
        'Free credits pool is finite for ongoing student development without paid top-up',
        'Free tier non-commercial limitation'
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
        error: 'CARTESIA_API_KEY is not configured in environment or voice-lab/.env'
      };
    }

    this.activeAbortController = new AbortController();
    const sampleRate = finalConfig.sampleRate || 24000;

    try {
      const response = await fetch('https://api.cartesia.ai/tts/bytes', {
        method: 'POST',
        headers: {
          'X-API-Key': this.apiKey,
          'Cartesia-Version': '2024-06-10',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model_id: finalConfig.modelId || 'sonic-english',
          transcript: text,
          voice: {
            mode: 'id',
            id: finalConfig.voiceId || '694f12bc-c40d-4460-a000-1f9e01826913'
          },
          output_format: {
            container: 'wav',
            encoding: 'pcm_s16le',
            sample_rate: sampleRate
          }
        }),
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
          error: `Cartesia API HTTP ${response.status} (${response.statusText}): ${errorText}`
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
          firstByteTimeMs: totalTime,
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
        error: `Cartesia synthesis exception: ${err?.message || String(err)}`
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
        error: 'CARTESIA_API_KEY is not configured in environment or voice-lab/.env'
      };
    }

    this.activeAbortController = new AbortController();
    const sampleRate = finalConfig.sampleRate || 24000;

    try {
      const response = await fetch('https://api.cartesia.ai/tts/bytes', {
        method: 'POST',
        headers: {
          'X-API-Key': this.apiKey,
          'Cartesia-Version': '2024-06-10',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model_id: finalConfig.modelId || 'sonic-english',
          transcript: text,
          voice: {
            mode: 'id',
            id: finalConfig.voiceId || '694f12bc-c40d-4460-a000-1f9e01826913'
          },
          output_format: {
            container: 'wav',
            encoding: 'pcm_s16le',
            sample_rate: sampleRate
          }
        }),
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
          error: `Cartesia streaming API HTTP ${response.status}: ${errorText}`
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
        error: `Cartesia streaming exception: ${err?.message || String(err)}`
      };
    } finally {
      this.activeAbortController = null;
    }
  }
}
