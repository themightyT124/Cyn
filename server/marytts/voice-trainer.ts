import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { VoiceTrainingConfig, validateConfig } from './config/voice-config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class VoiceTrainer {
  private readonly voicesDir: string;
  private readonly trainingDir: string;
  private readonly modelsDir: string;

  constructor() {
    const baseDir = path.join(__dirname, '..', '..', 'voice-training');
    this.voicesDir = path.join(baseDir, 'voices');
    this.trainingDir = path.join(baseDir, 'training-data');
    this.modelsDir = path.join(baseDir, 'models');

    // Ensure directories exist
    this.initializeDirectories();
  }

  private async initializeDirectories() {
    const dirs = [this.voicesDir, this.trainingDir, this.modelsDir];
    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  async createVoice(config: Partial<VoiceTrainingConfig>): Promise<string> {
    const validConfig = validateConfig(config);
    const voiceDir = path.join(this.voicesDir, validConfig.voiceId);

    // Create voice directory
    await fs.mkdir(voiceDir, { recursive: true });

    // Save configuration
    await fs.writeFile(
      path.join(voiceDir, 'config.json'),
      JSON.stringify(validConfig, null, 2)
    );

    console.log(`Created voice ${validConfig.voiceId} with config:`, validConfig);
    return validConfig.voiceId;
  }

  async prepareTrainingData(voiceId: string, audioFiles: string[]): Promise<void> {
    console.log(`Preparing training data for voice ${voiceId}`);
    const voiceDir = path.join(this.voicesDir, voiceId);
    const trainingDir = path.join(this.trainingDir, voiceId);

    // Ensure voice exists
    try {
      await fs.access(voiceDir);
    } catch {
      throw new Error(`Voice ${voiceId} not found`);
    }

    // Create training directory
    await fs.mkdir(trainingDir, { recursive: true });

    // Process and copy audio files
    for (const file of audioFiles) {
      try {
        const filename = path.basename(file);
        const destPath = path.join(trainingDir, filename);
        await fs.copyFile(file, destPath);
        console.log(`Copied audio file ${filename} to training directory`);
      } catch (error) {
        console.error(`Error processing audio file ${file}:`, error);
        throw error;
      }
    }

    console.log(`Successfully prepared ${audioFiles.length} training files`);
  }

  async trainVoice(voiceId: string): Promise<void> {
    console.log(`Starting voice training for ${voiceId}`);
    const voiceDir = path.join(this.voicesDir, voiceId);
    const trainingDir = path.join(this.trainingDir, voiceId);
    const modelDir = path.join(this.modelsDir, voiceId);

    // Load configuration
    const configPath = path.join(voiceDir, 'config.json');
    let config: VoiceTrainingConfig;
    try {
      const configData = await fs.readFile(configPath, 'utf-8');
      config = JSON.parse(configData) as VoiceTrainingConfig;
      console.log(`Loaded voice configuration:`, config);
    } catch (error) {
      console.error(`Error loading voice configuration:`, error);
      throw new Error(`Failed to load voice configuration for ${voiceId}`);
    }

    // Verify training data exists
    try {
      const files = await fs.readdir(trainingDir);
      const audioFiles = files.filter(f => f.endsWith('.wav'));
      if (audioFiles.length === 0) {
        throw new Error('No training audio files found');
      }
      console.log(`Found ${audioFiles.length} audio files for training`);
    } catch (error) {
      console.error(`Error accessing training data:`, error);
      throw new Error('Training data not found or inaccessible');
    }

    // Create model directory
    await fs.mkdir(modelDir, { recursive: true });

    // TODO: Implement actual training logic using TensorFlow.js or similar
    // For now, create a basic model file that at least enables synthesis
    const modelData = {
      id: voiceId,
      config: config,
      features: {
        mfcc: true,
        pitch: true,
        energy: true
      },
      status: 'trained',
      timestamp: new Date().toISOString()
    };

    await fs.writeFile(
      path.join(modelDir, 'model.json'),
      JSON.stringify(modelData, null, 2)
    );

    console.log(`Completed voice training for ${voiceId}`);
  }

  async synthesizeSpeech(voiceId: string, text: string): Promise<Buffer> {
    console.log(`Synthesizing speech for text: "${text}" using voice ${voiceId}`);
    const modelDir = path.join(this.modelsDir, voiceId);

    // Check if model exists
    try {
      await fs.access(modelDir);
    } catch {
      console.error(`Model for voice ${voiceId} not found`);
      throw new Error(`Model for voice ${voiceId} not found`);
    }

    try {
      // Load model configuration
      const modelConfigPath = path.join(modelDir, 'model.json');
      const modelConfig = JSON.parse(await fs.readFile(modelConfigPath, 'utf-8'));
      console.log(`Loaded model configuration:`, modelConfig);

      // For now, we'll create a simple WAV file as a placeholder
      // In a real implementation, this would use the trained model
      const { WaveFile } = await import('wavefile');
      const wav = new WaveFile();

      // Create a simple sine wave as placeholder audio
      const sampleRate = 22050;
      const seconds = 2;
      const samples = new Float32Array(sampleRate * seconds);
      for (let i = 0; i < samples.length; i++) {
        samples[i] = Math.sin(440 * Math.PI * 2 * i / sampleRate);
      }

      wav.fromScratch(1, sampleRate, '32f', samples);
      console.log(`Generated placeholder audio for text: "${text}"`);

      return Buffer.from(wav.toBuffer());
    } catch (error) {
      console.error(`Error synthesizing speech:`, error);
      throw new Error('Failed to synthesize speech');
    }
  }
}

export const voiceTrainer = new VoiceTrainer();