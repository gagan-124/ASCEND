# ASCEND AI Voice Audition Lab (Iteration 1)

This directory contains the **isolated test harness and evaluation suite** for auditioning and benchmarking candidate AI Text-to-Speech (TTS) voice providers for **ASCEND AI**.

> [!IMPORTANT]
> **Strict Isolation Guarantee:**
> This directory is completely isolated from ASCEND's production code. It does NOT import into, modify, or depend upon the Interview Room UI, state machines, routing, proctoring, or camera/microphone logic.

---

## Directory Structure

```
voice-lab/
├── providers/
│   ├── types.ts              # Common TTS interface (TTSProvider, TTSMetrics, etc.)
│   ├── baseProvider.ts       # Audio header parsing, PCM metrics & inspection
│   ├── deepgram/             # Deepgram Aura-2 / Aura adapter
│   ├── cartesia/             # Cartesia Sonic adapter
│   └── elevenlabs/           # ElevenLabs Flash v2.5 / Turbo adapter
├── scripts/
│   ├── testPrompts.ts        # 5 standardized interview interaction prompts
│   └── benchmark.ts          # Automated benchmark runner & latency test
├── outputs/
│   ├── deepgram/             # Raw audio outputs from Deepgram
│   ├── cartesia/             # Raw audio outputs from Cartesia
│   └── elevenlabs/           # Raw audio outputs from ElevenLabs
├── benchmark/
│   ├── results.json          # Machine-readable benchmark metrics
│   └── report.md             # Comprehensive evaluation report
├── .env.example              # Environment variables template
├── .gitignore                # Protects API keys and secrets
├── package.json              # Standalone Node harness configuration
└── README.md                 # Test harness documentation & provider sources
```

---

## Evaluated Providers & Official Documentation

| Provider | Target Model | Selected Voice | Persona | Official Documentation | Pricing / Free Tier |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Deepgram** | `aura-2` / `aura-asteria-en` | `aura-asteria-en` | Warm, confident, calm, articulate female interviewer | [Deepgram Aura Docs](https://developers.deepgram.com/docs/getting-started-with-aura) | [Deepgram Pricing](https://deepgram.com/pricing) ($200 free credit, no CC req) |
| **Cartesia** | `sonic-english` | `694f12bc-c40d-4460-a000-1f9e01826913` | Empathetic, natural, conversational female | [Cartesia Docs](https://docs.cartesia.ai) | [Cartesia Pricing](https://www.cartesia.ai/pricing) (Free trial credits) |
| **ElevenLabs** | `eleven_flash_v2_5` | `Rachel` (`21m00Tcm4TlvDq8ikWAM`) | Warm, expressive, articulate female | [ElevenLabs Docs](https://elevenlabs.io/docs/api-reference/text-to-speech) | [ElevenLabs Pricing](https://elevenlabs.io/pricing) (10k chars/mo free, no CC) |

---

## Standardized Test Prompts

All providers are subjected to the identical 5 interview prompts:

1. **TEST 1 (Greeting):**
   > *"Hello, welcome to your interview. I'll be conducting your technical interview today."*
2. **TEST 2 (Open Question):**
   > *"Let's start with a simple question. Can you tell me about a project you're particularly proud of?"*
3. **TEST 3 (Follow-up Probe):**
   > *"That's interesting. What was the most challenging part of that project?"*
4. **TEST 4 (Technical Inquest):**
   > *"Can you explain the technical decision you made and why you chose that approach?"*
5. **TEST 5 (Transition):**
   > *"Thank you. Let's move on to the next question."*

---

## Running the Benchmark

### 1. Configure Environment Keys
Copy `.env.example` to `.env` in `voice-lab/`:
```bash
cp voice-lab/.env.example voice-lab/.env
```
Add your API keys:
```env
DEEPGRAM_API_KEY=your_key_here
CARTESIA_API_KEY=your_key_here
ELEVENLABS_API_KEY=your_key_here
```

### 2. Execute Benchmark Runner
Run the benchmark script using Node:
```bash
node --experimental-strip-types voice-lab/scripts/benchmark.ts
```

### 3. Review Generated Artifacts
- **Benchmark Data:** `voice-lab/benchmark/results.json`
- **Full Report:** `voice-lab/benchmark/report.md`
- **Generated Audio Files:** `voice-lab/outputs/{deepgram,cartesia,elevenlabs}/`
