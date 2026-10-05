/**
 * ASCEND VOICE LAB — Base TTS Provider & Audio Utilities
 * 
 * Provides audio inspection, WAV header parsing, streaming utilities,
 * and timing calculations without external binary dependencies.
 */

import type {
  AudioContainerFormat,
  ProviderOfficialInfo,
  TTSChunkCallback,
  TTSMetrics,
  TTSProvider,
  TTSResult,
  TTSVoiceConfig
} from './types.ts';

export interface ParsedAudioInfo {
  format: string;
  sampleRate: number;
  channels: number;
  bitDepth: number;
  durationMs: number;
  isClippingOrDistorted: boolean;
}

export abstract class BaseTTSProvider implements TTSProvider {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly defaultVoiceConfig: TTSVoiceConfig;

  protected activeAbortController: AbortController | null = null;

  abstract synthesize(text: string, config?: Partial<TTSVoiceConfig>): Promise<TTSResult>;
  abstract stream(
    text: string,
    onChunk: TTSChunkCallback,
    config?: Partial<TTSVoiceConfig>
  ): Promise<TTSResult>;
  abstract getProviderInfo(): ProviderOfficialInfo;

  public stop(): void {
    if (this.activeAbortController) {
      this.activeAbortController.abort();
      this.activeAbortController = null;
    }
  }

  /**
   * Parses audio byte buffer to extract sample rate, channels, bit depth, and duration.
   * Supports standard RIFF WAV, raw PCM, and estimated MP3 frames.
   */
  public static inspectAudio(buffer: Uint8Array, fallbackFormat: AudioContainerFormat = 'wav', fallbackSampleRate: number = 24000): ParsedAudioInfo {
    if (!buffer || buffer.length === 0) {
      return {
        format: fallbackFormat,
        sampleRate: fallbackSampleRate,
        channels: 1,
        bitDepth: 16,
        durationMs: 0,
        isClippingOrDistorted: false
      };
    }

    // Check for RIFF WAV header (ASCII "RIFF" at offset 0, "WAVE" at offset 8)
    if (
      buffer.length >= 44 &&
      buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 && // RIFF
      buffer[8] === 0x57 && buffer[9] === 0x41 && buffer[10] === 0x56 && buffer[11] === 0x45    // WAVE
    ) {
      const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
      const channels = view.getUint16(22, true);
      const sampleRate = view.getUint32(24, true);
      const byteRate = view.getUint32(28, true);
      const bitDepth = view.getUint16(34, true);

      // Find "data" chunk
      let dataOffset = 36;
      let dataSize = buffer.length - 44;
      while (dataOffset < buffer.length - 8) {
        const chunkHeader = String.fromCharCode(
          buffer[dataOffset],
          buffer[dataOffset + 1],
          buffer[dataOffset + 2],
          buffer[dataOffset + 3]
        );
        const chunkSize = view.getUint32(dataOffset + 4, true);
        if (chunkHeader === 'data') {
          dataOffset += 8;
          dataSize = chunkSize;
          break;
        }
        dataOffset += 8 + chunkSize;
      }

      const bytesPerSample = (bitDepth / 8) * channels;
      const durationMs = bytesPerSample > 0 && sampleRate > 0
        ? Math.round((dataSize / (sampleRate * bytesPerSample)) * 1000)
        : Math.round((buffer.length / (byteRate || 48000)) * 1000);

      // Check for audio clipping (samples hitting exact max/min 16-bit values)
      let clippingDetected = false;
      if (bitDepth === 16 && dataOffset + 200 < buffer.length) {
        let maxSample = 0;
        for (let i = dataOffset; i < Math.min(buffer.length - 1, dataOffset + 10000); i += 2) {
          const sample = Math.abs(view.getInt16(i, true));
          if (sample > 32700) {
            clippingDetected = true;
            break;
          }
          if (sample > maxSample) maxSample = sample;
        }
      }

      return {
        format: 'wav',
        sampleRate: sampleRate || 24000,
        channels: channels || 1,
        bitDepth: bitDepth || 16,
        durationMs,
        isClippingOrDistorted: clippingDetected
      };
    }

    // Check for MP3 sync word (0xFF 0xFB, 0xFF 0xF3, 0xFF 0xF2, or ID3 header)
    const isID3 = buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33; // "ID3"
    const isMP3Sync = (buffer[0] === 0xFF && (buffer[1] & 0xE0) === 0xE0) || isID3;

    if (isMP3Sync || fallbackFormat === 'mp3') {
      // Estimated duration for standard 128kbps / 44.1kHz MP3
      const estimatedBitrateKbps = 128;
      const durationMs = Math.round((buffer.length * 8) / estimatedBitrateKbps);
      return {
        format: 'mp3',
        sampleRate: 44100,
        channels: 1,
        bitDepth: 16,
        durationMs,
        isClippingOrDistorted: false
      };
    }

    // Default raw PCM assumption (s16le at 24kHz mono)
    const bytesPerSec = fallbackSampleRate * 2 * 1;
    const durationMs = Math.round((buffer.length / bytesPerSec) * 1000);
    return {
      format: fallbackFormat,
      sampleRate: fallbackSampleRate,
      channels: 1,
      bitDepth: 16,
      durationMs,
      isClippingOrDistorted: false
    };
  }
}
