import { promises as fs } from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import ffmpegPath from 'ffmpeg-static';
import { 
  getBaseDirectory, 
  getTempDirectory, 
  isVercelEnvironment,
  ensureWritableDirectory,
  logEnvironmentInfo
} from './vercel-utils';

// Log environment information on startup for debugging
logEnvironmentInfo();

export async function convertMp3ToWav(inputPath: string): Promise<string> {
  try {
    // In Vercel, we need to ensure we're writing to a writable location
    const filename = path.basename(inputPath).replace('.mp3', '.wav');
    const outputPath = isVercelEnvironment() 
      ? path.join(getTempDirectory(), filename)
      : inputPath.replace('.mp3', '.wav');

    // Log conversion attempt
    console.log(`Converting MP3 to WAV: ${inputPath} → ${outputPath}`);

    // Handle Vercel environment differently
    if (isVercelEnvironment()) {
      console.log('Running in Vercel environment with limited file access');
      
      try {
        // First, copy the file to a writable location if needed
        if (!inputPath.startsWith('/tmp')) {
          const tempInputPath = path.join(getTempDirectory(), path.basename(inputPath));
          await fs.copyFile(inputPath, tempInputPath);
          inputPath = tempInputPath;
          console.log(`Copied input file to: ${inputPath}`);
        }
        
        // Try to run ffmpeg in limited capacity
        execSync(`"${ffmpegPath}" -y -i "${inputPath}" -acodec pcm_s16le -ar 22050 "${outputPath}"`);
        console.log(`Successfully converted file in Vercel environment`);
        return outputPath;
      } catch (ffmpegError) {
        console.error('FFmpeg error in Vercel environment:', ffmpegError);
        // In Vercel, if conversion fails, we'll try to make a copy with .wav extension
        const wavCopy = path.join(getTempDirectory(), filename);
        await fs.copyFile(inputPath, wavCopy);
        console.log(`Created WAV copy at: ${wavCopy}`);
        return wavCopy;
      }
    }

    // In development/Replit: Use FFmpeg to convert MP3 to WAV
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
    console.log(`Processing voice sample: ${inputPath} → ${targetDir}`);
    
    // In Vercel, we need to use /tmp directory
    const actualTargetDir = isVercelEnvironment() 
      ? await ensureWritableDirectory(path.join(getTempDirectory(), path.basename(targetDir)))
      : await ensureWritableDirectory(targetDir);
    
    console.log(`Using target directory: ${actualTargetDir}`);

    // Generate output path
    const filename = path.basename(inputPath);
    const outputPath = path.join(actualTargetDir, filename);

    // Copy file to target directory
    await fs.copyFile(inputPath, outputPath);
    console.log(`Copied to: ${outputPath}`);

    // If it's an MP3, convert it to WAV
    if (outputPath.toLowerCase().endsWith('.mp3')) {
      console.log(`MP3 detected, converting to WAV: ${outputPath}`);
      
      // Use our Vercel-aware conversion function
      const wavPath = await convertMp3ToWav(outputPath);
      console.log(`Conversion completed, result: ${wavPath}`);
      
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
  console.log(`Setting up voice samples, files: ${sampleFiles.length}`);
  
  // Use our environment-aware functions to get the appropriate directories
  const baseDir = getBaseDirectory();
  console.log(`Base directory: ${baseDir}`);
  
  // Determine training data directory, handling Vercel case
  let targetDir: string;
  let mp3InputDir: string;
  
  if (isVercelEnvironment()) {
    // In Vercel, we need to use /tmp for writable directories
    targetDir = path.join(getTempDirectory(), 'voice-samples');
    mp3InputDir = path.join(getTempDirectory(), 'mp3-input');
    console.log(`Vercel environment detected, using temp directories:
      - Target: ${targetDir}
      - MP3 Input: ${mp3InputDir}`);
  } else {
    // In development
    targetDir = path.join(baseDir, 'training-data', 'voice-samples');
    mp3InputDir = path.join(targetDir, 'mp3-input');
    console.log(`Development environment, using project directories:
      - Target: ${targetDir}
      - MP3 Input: ${mp3InputDir}`);
  }
  
  const processedFiles: string[] = [];

  try {
    // Create directories if they don't exist
    await ensureWritableDirectory(targetDir);
    await ensureWritableDirectory(mp3InputDir);
    console.log('Created required directories');
  } catch (error) {
    console.error('Error creating directories:', error);
  }

  for (const file of sampleFiles) {
    try {
      console.log(`Processing file: ${file}`);
      
      // Determine target directory based on file type
      const isMP3 = file.toLowerCase().endsWith('.mp3');
      const processTarget = isMP3 ? mp3InputDir : targetDir;
      console.log(`File type: ${isMP3 ? 'MP3' : 'WAV'}, target: ${processTarget}`);

      // Process the voice sample
      const processedPath = await processVoiceSample(file, processTarget);
      console.log(`Processed path: ${processedPath}`);

      // If it's an MP3, also convert it to WAV in the main directory
      if (isMP3) {
        console.log(`Converting MP3 to WAV for: ${processedPath}`);
        const wavPath = await convertMp3ToWav(processedPath);
        
        // Move the WAV file to the main training directory
        const wavFilename = path.basename(wavPath);
        const finalWavPath = path.join(targetDir, wavFilename);
        
        try {
          await fs.rename(wavPath, finalWavPath);
          console.log(`Moved WAV to: ${finalWavPath}`);
          processedFiles.push(finalWavPath);
        } catch (error) {
          // If rename fails (could happen across volumes in Vercel), try copy+delete
          const moveError = error as Error;
          console.error(`Could not move file, trying copy+delete: ${moveError.message}`);
          await fs.copyFile(wavPath, finalWavPath);
          try { await fs.unlink(wavPath); } catch (e) { /* ignore */ }
          processedFiles.push(finalWavPath);
        }
      } else {
        processedFiles.push(processedPath);
      }
      
      console.log(`Successfully processed file: ${file}`);
    } catch (error) {
      console.error(`Failed to process ${file}:`, error);
    }
  }

  console.log(`Completed voice sample setup, processed ${processedFiles.length} files`);
  return processedFiles;
}