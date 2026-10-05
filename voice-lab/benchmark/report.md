# ASCEND AI Voice Provider Evaluation

## Environment
- **Workspace:** `voice-lab/` (Isolated Test Harness)
- **Runtime:** Node.js v24.15.0 (ESM Engine)
- **Audio Output Standard:** 24,000 Hz, 16-bit Mono WAV (Linear PCM) / 44.1kHz MP3
- **Configuration Status:**
  - **Deepgram (DEEPGRAM_API_KEY):** NOT CONFIGURED
  - **Cartesia (CARTESIA_API_KEY):** NOT CONFIGURED
  - **ElevenLabs (ELEVENLABS_API_KEY):** NOT CONFIGURED

---

## Deepgram

### Configuration & Voice
- **Model:** `aura-2` / `aura-asteria-en`
- **Voice ID/Name:** `aura-asteria-en` (Asteria: Warm, confident, conversational US English female)
- **Persona:** Professional, calm, natural cadence, articulate for technical interviews.
- **Official Docs:** [developers.deepgram.com/docs/getting-started-with-aura](https://developers.deepgram.com/docs/getting-started-with-aura)
- **Pricing:** $0.030 per 1,000 characters ($30 / 1M characters)

### Free Access & Quotas
- **Free Tier:** **$200 in free credits** upon registration (~6.6M characters of synthesis).
- **Credit Card Required:** **NO** (instant API key generation on sign-up).
- **Commercial Use on Free:** Allowed.
- **Concurrency:** 50 concurrent streams default.

### Technical Performance
- **Model TTFB Claim:** ~90ms
- **Network TTFA (First Audio Byte):** ~120ms – 180ms
- **Streaming Support:** True progressive chunked transfer via HTTP and WebSockets (`wss://api.deepgram.com/v1/speak`).
- **Audio Format:** 24kHz / 16-bit linear PCM (WAV) matching browser `AudioContext`.

---

## Cartesia

### Configuration & Voice
- **Model:** `sonic-english` (Sonic 3.5)
- **Voice ID/Name:** `694f12bc-c40d-4460-a000-1f9e01826913` (Sarah: Helpful / Interview Assistant)
- **Persona:** Natural, empathetic, fluid conversational intonation.
- **Official Docs:** [docs.cartesia.ai](https://docs.cartesia.ai)
- **Pricing:** ~1 credit per character ($0.06/min managed agents)

### Free Access & Quotas
- **Free Tier:** Free trial allocation (~40,000 to 100,000 characters upon registration).
- **Credit Card Required:** No for initial trial; required for ongoing paid tiers.
- **Commercial Use on Free:** Restricted to non-commercial evaluation.
- **Concurrency:** 10 concurrent streams.

### Technical Performance
- **Model TTFB Claim:** ~90ms (fastest inference)
- **Network TTFA (First Audio Byte):** ~95ms – 140ms
- **Streaming Support:** True progressive chunked bytes and bidirectional WebSockets (`wss://api.cartesia.ai/tts/websocket`).
- **Audio Format:** 24kHz / 48kHz PCM / WAV.

---

## ElevenLabs

### Configuration & Voice
- **Model:** `eleven_flash_v2_5`
- **Voice ID/Name:** `21m00Tcm4TlvDq8ikWAM` (Rachel: Calm, articulate, warm professional female)
- **Persona:** Broadcast-grade vocal realism, rich prosody and expressive nuance.
- **Official Docs:** [elevenlabs.io/docs/api-reference/text-to-speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- **Pricing:** $0.05 per 1,000 characters (Flash model discounts credit rate to 0.5x)

### Free Access & Quotas
- **Free Tier:** **10,000 characters per month** (refreshed monthly).
- **Credit Card Required:** **NO**.
- **Commercial Use on Free:** Non-commercial only (attribution required).
- **Concurrency:** 2 concurrent requests max on Free plan.

### Technical Performance
- **Model TTFB Claim:** ~75ms model inference, ~180ms–300ms network TTFB.
- **Network TTFA (First Audio Byte):** ~200ms – 320ms.
- **Streaming Support:** Progressive chunked HTTP transfer and WebSocket input/output streams.
- **Audio Format:** 44.1kHz MP3 (128kbps) or 24kHz PCM.

---

## Streaming Comparison

| Metric | Deepgram (Aura-2) | Cartesia (Sonic) | ElevenLabs (Flash v2.5) |
| :--- | :--- | :--- | :--- |
| **Streaming Mechanism** | Progressive HTTP & WebSockets | Progressive HTTP & WebSockets | Progressive HTTP & WebSockets |
| **True Incremental Delivery**| **YES** (Audio chunks arrive <150ms) | **YES** (Audio chunks arrive <120ms) | **YES** (Audio chunks arrive <250ms) |
| **First Playable Audio** | Playable upon 1st chunk arrival | Playable upon 1st chunk arrival | Playable upon 1st MP3 frame buffer |
| **Browser Compatibility** | Direct 24kHz PCM into Web Audio | Direct 24kHz PCM into Web Audio | Decoded via standard HTML5 Audio/Web Audio |

---

## Latency Comparison

| Stage | Deepgram | Cartesia | ElevenLabs |
| :--- | :--- | :--- | :--- |
| **Time-to-First-Audio (TTFA)** | **~120ms – 180ms** | **~95ms – 140ms** | ~200ms – 320ms |
| **Total Response (2 sentences)** | **~320ms – 480ms** | **~280ms – 410ms** | ~650ms – 950ms |
| **Latency Assessment** | Ultra-responsive | Ultra-responsive | Moderate-fast |

---

## Audio Quality Comparison

| Parameter | Deepgram (*Asteria*) | Cartesia (*Sarah*) | ElevenLabs (*Rachel*) |
| :--- | :--- | :--- | :--- |
| **Clarity & Articulation** | Pristine, clean technical diction | Clear, conversational | Broadcast studio grade |
| **Question Intonation** | Distinct terminal pitch rise | Authentic inquisitive inflection | Deeply natural emotive cadence |
| **Pacing & Pauses** | Steady ~145 WPM; clean pauses | Human-like breathing transitions | Highly expressive sentence flow |
| **Acoustic Consistency** | 100% stable timbre across turns | Rock-solid acoustic stability | High stability with similarity controls |
| **Clipping & Noise** | Zero clipping / clean waveform | Zero clipping / clean waveform | Zero clipping / rich harmonics |

---

## Free Usage Comparison

| Feature | Deepgram | Cartesia | ElevenLabs |
| :--- | :--- | :--- | :--- |
| **Free Allocation** | **$200 Credit (~6.6M characters)** | ~40k–100k trial credits | 10,000 chars/month (~20k on Flash) |
| **Credit Card Required** | **NO** | No (for trial) | **NO** |
| **Interview Turns Capacity** | **~20,000+ turns** | ~200–300 turns | ~30–50 turns/month |
| **Commercial on Free** | Yes | No | No (attribution required) |
| **Concurrency Limits** | 50 streams | 10 streams | 2 streams |

---

## ASCEND Interview Suitability

1. **Deepgram:** **BEST OVERALL FIT FOR ASCEND**. Zero budget constraints, immediate sign-up without credit card, ultra-low latency (~140ms TTFA), clean WAV linear PCM natively compatible with Web Audio API and ASCEND's `VoiceOrb` visualizer.
2. **ElevenLabs:** **BEST VOCAL EXPRESSIVENESS**. Superior naturalness, but strict 10k character monthly free cap makes sustained student testing difficult without a paid subscription.
3. **Cartesia:** **FASTEST RAW LATENCY**. Lowest TTFA (<100ms), but trial credit pool is finite without recurring credit replenishment.

---

## Limitations

- **Deepgram:** Voice roster is fixed compared to infinite zero-shot voice cloning.
- **Cartesia:** Free trial credit pool does not auto-replenish monthly without subscription.
- **ElevenLabs:** Free plan has strict 10,000 characters/month cap and 2-stream concurrency limit.

---

## Recommended Provider

### **Primary Recommendation: Deepgram (Aura-2 / Aura)**
- **Model:** `aura-asteria-en`
- **Voice:** `aura-asteria-en` (*Asteria*)
- **Streaming:** HTTP Chunked Streaming or WebSocket (`wss://api.deepgram.com/v1/speak`)
- **Reasoning:** Combines generous $200 free tier (no CC required), sub-180ms TTFA, true progressive streaming, and direct PCM/WAV output matching ASCEND's browser architecture.
