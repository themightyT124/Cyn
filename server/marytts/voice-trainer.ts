import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { VoiceTrainingConfig, validateConfig } from './config/voice-config';
import { spawn } from 'child_process';

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

  private async runPythonScript(scriptPath: string, args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const process = spawn('python3', [scriptPath, ...args]);

      process.stdout.on('data', (data) => {
        console.log(`Python stdout: ${data}`);
      });

      process.stderr.on('data', (data) => {
        console.error(`Python stderr: ${data}`);
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Python process exited with code ${code}`));
        }
      });
    });
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

    // Create a Python script to prepare data for Coqui TTS
    const prepareScript = path.join(__dirname, 'scripts', 'prepare_data.py');
    await this.runPythonScript(prepareScript, [trainingDir]);

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

    // Create model directory
    await fs.mkdir(modelDir, { recursive: true });

    // Run Coqui TTS training script
    const trainScript = path.join(__dirname, 'scripts', 'train_model.py');
    await this.runPythonScript(trainScript, [
      trainingDir,
      modelDir,
      JSON.stringify(config)
    ]);

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

    // Run Coqui TTS synthesis script
    const synthesizeScript = path.join(__dirname, 'scripts', 'synthesize.py');
    const outputFile = path.join(modelDir, `output_${Date.now()}.wav`);

    await this.runPythonScript(synthesizeScript, [
      modelDir,
      text,
      outputFile
    ]);

    // Read the generated audio file
    const audioBuffer = await fs.readFile(outputFile);

    // Clean up the temporary file
    await fs.unlink(outputFile);

    return audioBuffer;
  }
}

export const voiceTrainer = new VoiceTrainer();