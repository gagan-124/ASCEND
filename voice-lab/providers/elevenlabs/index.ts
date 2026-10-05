/**
 * ASCEND VOICE LAB — ElevenLabs Provider Adapter
 * 
 * Target Persona: Warm, professional, confident, clear female interviewer.
 * Model: 'eleven_flash_v2_5' (recommended for real-time conversational TTS)
 * Voice: '21m00Tcm4TlvDq8ikWAM' (Rachel - Calm, professional American female)
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

export class ElevenLabsProvider extends BaseTTSProvider {
  readonly id = 'elevenlabs';
  readonly name = 'ElevenLabs (Flash v2.5 / Turbo v2.5)';

  readonly defaultVoiceConfig: TTSVoiceConfig = {
    voiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel (Calm, professional female)
    modelId: 'eleven_flash_v2_5',     // Fast conversational model
    sampleRate: 44100,
    format: 'mp3',
    additionalParams: {
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0.0,
      use_speaker_boost: true
    }
  };

  private apiKey: string;

  constructor(apiKey: string = process.env.ELEVENLABS_API_KEY || '') {
    super();
    this.apiKey = apiKey.trim();
  }

  getProviderInfo(): ProviderOfficialInfo {
    return {
      providerId: 'elevenlabs',
      name: 'ElevenLabs',
      officialDocUrl: 'https://elevenlabs.io/docs/api-reference/text-to-speech',
      pricingUrl: 'https://elevenlabs.io/pricing',
      models: ['eleven_flash_v2_5', 'eleven_turbo_v2_5', 'eleven_multilingual_v2'],
      selectedModel: 'eleven_flash_v2_5',
      selectedVoiceId: '21m00Tcm4TlvDq8ikWAM',
      selectedVoiceName: 'Rachel (Calm, articulate, warm professional female)',
      voicePersonaDescription: 'High fidelity audio, exceptional prosody and expressiveness, natural pitch cadence.',
      freeTier: {
        allocation: '10,000 characters per month on the Free plan',
        requiresCreditCard: false,
        commercialUseAllowed: false,
        limitations: [
          'Strict non-commercial usage on Free tier (attribution required)',
          '2 concurrent requests max on Free plan',
          'Flash model discounts character consumption by ~50% (0.5 credits/char)'
        ]
      },
      streamingCapabilities: {
        httpStreaming: true,
        webSockets: true,
        sse: false,
        claimedTtfbMs: '~75ms model inference, ~180-300ms network TTFB',
        supportedFormats: ['mp3_44100_128', 'mp3_22050_32', 'pcm_16000', 'pcm_24000', 'pcm_44100', 'ulaw_8000'],
        supportedSampleRates: [16000, 22050, 24000, 44100]
      },
      concurrencyAndRateLimits: '2 concurrent requests on Free; 5 on Starter; 10+ on Creator/Pro',
      strengths: [
        'Unmatched expressive realism and vocal character stability',
        'Rich voice library with instant voice cloning capabilities',
        'Flash v2.5 delivers sub-250ms streaming latency'
      ],
      weaknesses: [
        'Free tier is capped at 10k chars/month (equivalent to ~10-15 interview answers)',
        'Free tier requires commercial attribution and cannot be used in production commercially',
        'Higher latency than Deepgram/Cartesia for WebSocket audio chunk streaming'
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
          format: 'mp3',
          sampleRate: finalConfig.sampleRate || 44100,
          channels: 1
        },
        error: 'ELEVENLABS_API_KEY is not configured in environment or voice-lab/.env'
      };
    }

    this.activeAbortController = new AbortController();
    const voiceId = finalConfig.voiceId || '21m00Tcm4TlvDq8ikWAM';
    const modelId = finalConfig.modelId || 'eleven_flash_v2_5';
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text,
          model_id: modelId,
          voice_settings: finalConfig.additionalParams || {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true
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
            format: 'mp3',
            sampleRate: 44100,
            channels: 1
          },
          error: `ElevenLabs API HTTP ${response.status} (${response.statusText}): ${errorText}`
        };
      }

      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = new Uint8Array(arrayBuffer);
      const totalTime = Math.round(performance.now() - startTime);

      const parsed = BaseTTSProvider.inspectAudio(audioBuffer, 'mp3', 44100);

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
          format: 'mp3',
          sampleRate: 44100,
          channels: 1,
          bitDepth: 16
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
          format: 'mp3',
          sampleRate: 44100,
          channels: 1
        },
        error: `ElevenLabs synthesis exception: ${err?.message || String(err)}`
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
          format: 'mp3',
          sampleRate: finalConfig.sampleRate || 44100,
          channels: 1
        },
        error: 'ELEVENLABS_API_KEY is not configured in environment or voice-lab/.env'
      };
    }

    this.activeAbortController = new AbortController();
    const voiceId = finalConfig.voiceId || '21m00Tcm4TlvDq8ikWAM';
    const modelId = finalConfig.modelId || 'eleven_flash_v2_5';
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}/stream?output_format=mp3_44100_128`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text,
          model_id: modelId,
          voice_settings: finalConfig.additionalParams || {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true
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
            format: 'mp3',
            sampleRate: 44100,
            channels: 1
          },
          error: `ElevenLabs streaming API HTTP ${response.status}: ${errorText}`
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

      const parsed = BaseTTSProvider.inspectAudio(mergedBuffer, 'mp3', 44100);

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
          format: 'mp3',
          sampleRate: 44100,
          channels: 1,
          bitDepth: 16
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
          format: 'mp3',
          sampleRate: 44100,
          channels: 1
        },
        error: `ElevenLabs streaming exception: ${err?.message || String(err)}`
      };
    } finally {
      this.activeAbortController = null;
    }
  }
}
