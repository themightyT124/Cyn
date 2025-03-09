# Voice Training System

This directory contains the voice training system files and models using Coqui TTS.

## Directory Structure

```
voice-training/
├── models/             # Trained voice models
│   └── cyn_voice/     # Default voice model
├── training-data/      # Training data for voice
│   └── voice-samples/ # Voice sample WAV files
└── config.json        # Voice configuration
```

## Voice Training Process

1. Place WAV files in the training-data/voice-samples directory
2. Configuration is managed through cyn-voice-training-data.json
3. Training process uses Coqui TTS for high-quality voice synthesis

## Requirements

- Audio files should be WAV format
- Recommended sampling rate: 22050 Hz
- Clear, high-quality recordings
- Consistent voice characteristics