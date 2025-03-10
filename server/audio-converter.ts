import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import ffmpegPath from 'ffmpeg-static';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to determine paths for different environments
function getBaseDirectory() {
  if (process.env.VERCEL) {
    // Use tmp directory in Vercel environment
    return '/tmp';
  }
  // Use standard path in development
  return path.join(__dirname, '..');
}

export async function convertMp3ToWav(inputPath: string): Promise<string> {
  try {
    // Create output filename
    const outputPath = inputPath.replace('.mp3', '.wav');

    // Check if we're in Vercel environment
    if (process.env.VERCEL) {
      console.log('Running in Vercel environment, MP3 to WAV conversion is limited');
      // In Vercel, we might need a simpler approach or just rename the file
      // For now, we'll return a simplified response with the original path
      return inputPath;
    }

    // In development/Replit: Use FFmpeg to convert MP3 to WAV
    console.log(`Converting MP3 to WAV: ${inputPath} → ${outputPath}`);
    execSync(`"${ffmpegPath}" -y -i "${inputPath}" -acodec pcm_s16le -ar 22050 "${outputPath}"`);

    return outputPath;
  } catch (error) {
    console.error('Error converting MP3 to WAV:', error);
    // In case of error, return the original path so processing can continue
    return inputPath;
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
      // Use our Vercel-aware conversion function
      const wavPath = await convertMp3ToWav(outputPath);
      
      // Only remove original MP3 if conversion succeeded and paths are different
      if (wavPath !== outputPath) {
        try {
          await fs.unlink(outputPath);
          console.log(`Removed original file after conversion: ${outputPath}`);
        } catch (unlinkError) {
          console.error(`Could not remove original file: ${outputPath}`, unlinkError);
        }
      }
      
      return wavPath;
    }

    return outputPath;
  } catch (error) {
    console.error('Error processing voice sample:', error);
    // Return input path in case of error to prevent cascading failures
    return inputPath;
  }
}

export async function setupVoiceSamples(sampleFiles: string[]): Promise<string[]> {
  // Use our environment-aware function to get the base directory
  const baseDir = getBaseDirectory();
  const targetDir = path.join(baseDir, 'training-data', 'voice-samples');
  const mp3InputDir = path.join(targetDir, 'mp3-input');
  const processedFiles: string[] = [];

  try {
    // Create mp3-input directory if it doesn't exist
    await fs.mkdir(mp3InputDir, { recursive: true });
  } catch (error) {
    console.error('Error creating mp3-input directory:', error);
  }

  for (const file of sampleFiles) {
    try {
      // Determine target directory based on file type
      const isMP3 = file.toLowerCase().endsWith('.mp3');
      const processTarget = isMP3 ? mp3InputDir : targetDir;

      const processedPath = await processVoiceSample(file, processTarget);

      // If it's an MP3, also convert it to WAV in the main directory
      if (isMP3) {
        const wavPath = await convertMp3ToWav(processedPath);
        // Move the WAV file to the main training directory
        const wavFilename = path.basename(wavPath);
        const finalWavPath = path.join(targetDir, wavFilename);
        await fs.rename(wavPath, finalWavPath);
        processedFiles.push(finalWavPath);
      } else {
        processedFiles.push(processedPath);
      }
    } catch (error) {
      console.error(`Failed to process ${file}:`, error);
    }
  }

  return processedFiles;
}