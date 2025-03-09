# Voice Training Data

This directory contains the voice samples used for training the TTS system.

## Structure

Place your audio files in the following format:
```
training-data/voice-samples/
  ├── mp3-input/        # Place your MP3 files here for conversion
  ├── sample1.wav       # Converted/existing WAV files
  ├── sample2.wav
  └── sample3.wav
```

## Requirements

### MP3 Files (Input)
- Place MP3 files in the `mp3-input` directory
- Files will be automatically converted to WAV format
- Original MP3 files will be preserved
- **Maximum file size: 10MB**

### WAV Files (Training)
- Files must be WAV format
- Audio should be clear and high quality
- Each file should contain a single voice
- **Recommended length: 30-60 seconds per sample** (maximum 2 minutes)
- **Maximum file size: 10MB** (larger files may cause issues)
- Multiple samples are recommended for better results

## How to Add Voice Samples

1. For MP3 files:
   - Place MP3 files in the `mp3-input` directory
   - Files will be automatically converted to WAV format
   - Converted files will appear in the main directory

2. For WAV files:
   - Place WAV files directly in this directory
   - Files should be 44.1kHz, 16-bit
   - Name them descriptively (e.g., `voice_sample_1.wav`)

Note: Ensure your audio files are properly formatted. The system validates files before using them.