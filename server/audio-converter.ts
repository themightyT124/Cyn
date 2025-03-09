import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import ffmpegPath from 'ffmpeg-static';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function convertMp3ToWav(inputPath: string): Promise<string> {
  try {
    // Create output filename
    const outputPath = inputPath.replace('.mp3', '.wav');
    
    // Use FFmpeg to convert MP3 to WAV
    execSync(`"${ffmpegPath}" -y -i "${inputPath}" -acodec pcm_s16le -ar 22050 "${outputPath}"`);
    
    return outputPath;
  } catch (error) {
    console.error('Error converting MP3 to WAV:', error);
    throw error;
  }
}

export async function processVoiceSample(inputPath: string, targetDir: string): Promise<string> {
  try {
    // Create target directory if it doesn't exist
    await fs.mkdir(targetDir, { recursive: true });
    
    // Generate output path
    const filename = path.basename(inputPath);
    const outputPath = path.join(targetDir, filename);
    
    // Copy file to target directory
    await fs.copyFile(inputPath, outputPath);
    
    // If it's an MP3, convert it to WAV
    if (outputPath.toLowerCase().endsWith('.mp3')) {
      const wavPath = await convertMp3ToWav(outputPath);
      // Remove the original MP3 after conversion
      await fs.unlink(outputPath);
      return wavPath;
    }
    
    return outputPath;
  } catch (error) {
    console.error('Error processing voice sample:', error);
    throw error;
  }
}

export async function setupVoiceSamples(sampleFiles: string[]): Promise<string[]> {
  const targetDir = path.join(__dirname, '..', 'training-data', 'voice-samples');
  const processedFiles: string[] = [];
  
  for (const file of sampleFiles) {
    try {
      const processedPath = await processVoiceSample(file, targetDir);
      processedFiles.push(processedPath);
    } catch (error) {
      console.error(`Failed to process ${file}:`, error);
    }
  }
  
  return processedFiles;
}
