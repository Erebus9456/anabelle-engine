# ANABELLE Affective Engine

Hybrid affective inference service for the **ANABELLE digital avatar**.

The system receives live audio over WebSocket, processes it through a **3-tier cognitive pipeline**, and returns real-time emotional states for synchronizing a 3D avatar.

> **Enterprise Stack:** FastAPI + Uvicorn gateway, GPU acceleration via PyTorch (CUDA / Apple MPS), integrated with Alibaba's SenseVoice and Emotion2Vec+.

---

## Table of Contents

* [Quick Start](#quick-start)
* [Architecture](#architecture)
* [The 3-Tier Pipeline](#the-3-tier-pipeline)
* [API Reference](#api-reference)
* [Testing & Benchmarks](#testing--benchmarks)
* [Frontend Integration](#frontend-integration)
* [Troubleshooting](#troubleshooting)
* [License](#license)

---

## Quick Start

### Backend — Python

```bash
# 1. Initialize environment
cd anabelle-backend

python3 -m venv venv
source venv/bin/activate  # macOS / Linux

# 2. Install dependencies and download models
pip install -r requirements.txt
./download_model.sh

# 3. Start the gateway
python3 main.py
```

### Frontend — React + Vite

```bash
cd anabelle-engine

npm install
npm run dev
```

---

## Architecture

### System Overview

ANABELLE uses a distributed **Edge-to-Cloud** architecture aligned with the **LUKYX Blueprint — Phase 1**.

```text
┌──────────────────┐       Binary Audio Stream       ┌─────────────────────────────────────┐
│                  │ ──────────────────────────────► │                                     │
│    React App     │                                 │    Python Backend — FastAPI         │
│    Vite UI       │ ◄────────────────────────────── │    WebSocket /ws/anabelle           │
│                  │       JSON Emotion Frames       │                                     │
└────────┬─────────┘                                 └──────────────────┬──────────────────┘
         │                                                            │
         │                                                            ▼
         │                                      ┌─────────────────────────────────────┐
         │                                      │                                     │
         ▼                                      │     Affective Inference Engine      │
┌──────────────────┐                            │     SenseVoiceSmall + Emotion2Vec+  │
│                  │                            │                                     │
│   3D Renderer    │                            └─────────────────────────────────────┘
│   Three.js       │
│                  │
└──────────────────┘
```

### Processing Flow

```text
Live Microphone
       │
       ▼
Audio Capture
       │
       ▼
16 kHz PCM Audio
       │
       ▼
┌─────────────────────────┐
│   Tier 1 — AI Model     │
│      SenseVoice         │
└────────────┬────────────┘
             │
       UNKNOWN?
             │
             ▼
┌─────────────────────────┐
│   Tier 2 — SER Model    │
│     Emotion2Vec+        │
└────────────┬────────────┘
             │
       STILL UNCERTAIN?
             │
             ▼
┌─────────────────────────┐
│  Tier 3 — Acoustic DNA  │
│ Pitch / Energy / ZCR    │
└────────────┬────────────┘
             │
             ▼
      Emotion Frame
             │
             ▼
        3D Avatar
```

---

## The 3-Tier Pipeline

ANABELLE uses a cascaded decision architecture designed to keep the avatar **continuously reactive**, even when the primary AI model is uncertain.

| Tier             | Source         | Logic                                                                        | Role                             |
| ---------------- | -------------- | ---------------------------------------------------------------------------- | -------------------------------- |
| **1. Primary**   | `AI_MODEL`     | SenseVoice high-confidence emotional tags                                    | High-accuracy semantic inference |
| **2. Secondary** | `SER_MODEL`    | Emotion2Vec+ feature-based emotion recognition when Tier 1 returns `UNKNOWN` | Secondary emotional inference    |
| **3. Fallback**  | `ACOUSTIC_DNA` | Pitch, energy, ZCR and other acoustic heuristics                             | Low-latency reactive fallback    |

### Tier 1 — AI Model

**SenseVoiceSmall** provides the primary emotional interpretation of incoming speech.

Example:

```text
<|en|><|HAPPY|><|Speech|> Hello world!
```

When a confident emotional tag is detected, the result is returned directly as the primary affective state.

### Tier 2 — Speech Emotion Recognition

If the primary model cannot determine an emotion, **Emotion2Vec+** is used as a secondary inference layer.

This provides an independent signal for speech emotion recognition and helps prevent the system from becoming emotionally neutral whenever the primary model is uncertain.

### Tier 3 — Acoustic DNA

When both AI-based layers are uncertain, ANABELLE falls back to direct acoustic analysis.

The **Acoustic DNA** layer evaluates properties such as:

* Pitch
* RMS / vocal energy
* Zero-crossing rate (ZCR)
* Voice intensity
* Other low-level acoustic characteristics

This layer is intentionally lightweight and prioritizes **responsiveness over semantic accuracy**.

### Global Benchmark

> **Current Global Accuracy on RAVDESS: 80.76%**

The three-tier architecture therefore combines **AI cognition with deterministic vocal reflexes**, ensuring that the avatar remains responsive even when model confidence is low.

---

## API Reference

### WebSocket — `/ws/anabelle`

The WebSocket endpoint provides a live binary audio stream for real-time affective synchronization.

#### Client → Server

**Audio Chunk**

| Property       | Value              |
| -------------- | ------------------ |
| Format         | Binary Float32 PCM |
| Sample Rate    | 16,000 Hz          |
| Chunk Duration | ~250–500 ms        |
| Transport      | WebSocket          |

Audio is downsampled to 16 kHz in the frontend before being transmitted.

#### Server → Client

**Emotion Frame**

```json
{
  "emotion": "EXCITED",
  "source": "AI_MODEL",
  "raw_text": "<|en|><|SURPRISED|><|Speech|> Hello world!",
  "status": "success"
}
```

### Response Fields

| Field      | Description                                   |
| ---------- | --------------------------------------------- |
| `emotion`  | Normalized emotional state used by the avatar |
| `source`   | Pipeline tier that produced the emotion       |
| `raw_text` | Raw output returned by the speech model       |
| `status`   | Processing status                             |

Possible sources include:

```text
AI_MODEL
SER_MODEL
ACOUSTIC_DNA
```

---

## Testing & Benchmarks

ANABELLE includes a static validation suite using the **RAVDESS Emotional Speech Dataset**.

### Run Benchmark

```bash
# Run benchmark against 1,440 files
python3 test/test_ravdess.py
```

### Reference Results

| Emotion Group   |   Accuracy |
| --------------- | ---------: |
| Angry / Disgust | **90.10%** |
| Happy / Excited | **84.90%** |
| Neutral / Calm  | **98.96%** |
| Sad / Fearful   | **68.23%** |
| **Overall**     | **80.76%** |

### Current Improvement Target

The primary area for future fine-tuning is:

**Sad / Fearful — 68.23%**

This category provides the largest opportunity for improving the overall affective inference accuracy.

---

## Frontend Integration

The React frontend handles **Visual Reflexes** while the backend performs **Affective Cognition**.

This separation keeps latency-sensitive visual behavior local while allowing the backend to perform more computationally expensive emotional inference.

### 1. Local Reflex

Lip-sync is calculated locally using the microphone's **RMS energy**.

```text
Microphone
    │
    ▼
Local RMS Analysis
    │
    ▼
Mouth / Lip Movement
```

This provides effectively immediate visual feedback without waiting for the backend.

### 2. Affective Blending

Emotion states received from the backend are smoothly blended into the current avatar state using **Linear Interpolation (Lerp)**.

```text
Current Emotion ────────────────┐
                               ▼
                          LERP / Blend
                               │
                               ▼
                       Target Emotion
```

This prevents:

* Emotional jitter
* Abrupt transitions
* Visual "popping"
* Unnatural state changes

The result is a smoother and more continuous avatar experience.

---

## Troubleshooting

### NumPy 2.0 Compatibility Issue

If you encounter:

```text
A module that was compiled using NumPy 1.x
cannot be run in NumPy 2.x
```

Downgrade NumPy:

```bash
pip install "numpy<2"
```

---

### 404 — Model Not Found

Ensure `download_model.sh` has successfully downloaded all required model files into:

```text
models/SenseVoiceSmall/
```

The engine depends on the local model configuration being present and correctly registered.

Verify that:

```text
models/
└── SenseVoiceSmall/
    ├── ...
    └── ...
```

contains the required model files before starting the backend.

---

## Project Philosophy

ANABELLE is designed around a simple principle:

> **The avatar should never stop reacting just because the AI is uncertain.**

The system therefore separates **reflexive behavior** from **cognitive inference**:

```text
             ANABELLE
                 │
       ┌─────────┴─────────┐
       │                   │
   REFLEXES             COGNITION
       │                   │
   Local RMS         AI + SER Models
       │                   │
   ~0ms Response     Emotional Inference
       │                   │
       └─────────┬─────────┘
                 ▼
           3D Avatar State
```

This hybrid architecture allows ANABELLE to combine **low-latency responsiveness, AI-driven emotional understanding, and graceful fallback behavior**.

---

## License

**Proprietary**

Developed for the **LUKYX INTELLIGENT Ecosystem**.
