/**
 * Utility functions for Vercel deployment
 */
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

/**
 * Determines if the application is running in a Vercel environment
 */
export function isVercelEnvironment(): boolean {
  return process.env.VERCEL === '1' || process.env.SERVER_ENV === 'vercel';
}

/**
 * Gets the appropriate temporary directory for file operations
 * In Vercel, only /tmp is writable
 */
export function getTempDirectory(): string {
  if (isVercelEnvironment()) {
    // In Vercel, only the /tmp directory is writable
    return '/tmp';
  }
  
  // In development, use os.tmpdir() or a project-relative directory
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    return path.join(__dirname, '..', 'tmp');
  } catch (error) {
    // Fallback if import.meta.url is not available
    return path.join(process.cwd(), 'tmp');
  }
}

/**
 * Gets the appropriate base directory for project files
 */
export function getBaseDirectory(): string {
  if (isVercelEnvironment()) {
    // In Vercel, use the deployment directory
    return process.cwd();
  }
  
  // In development
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    return path.join(__dirname, '..');
  } catch (error) {
    // Fallback
    return process.cwd();
  }
}

/**
 * Creates a path for a writable file in the appropriate directory
 * based on the current environment
 */
export function getWritableFilePath(filename: string): string {
  if (isVercelEnvironment()) {
    // In Vercel, all files must be written to /tmp
    return path.join('/tmp', filename);
  }
  
  // In development, use the project directory
  try {
    const baseDir = getBaseDirectory();
    return path.join(baseDir, filename);
  } catch (error) {
    // Fallback
    return path.join(process.cwd(), filename);
  }
}

/**
 * Ensures a directory exists and is writable
 * In Vercel, this will redirect to /tmp
 */
export async function ensureWritableDirectory(dirPath: string): Promise<string> {
  if (isVercelEnvironment()) {
    // In Vercel, we need to use /tmp instead of the requested path
    const tempPath = path.join('/tmp', path.basename(dirPath));
    await fs.promises.mkdir(tempPath, { recursive: true });
    return tempPath;
  }
  
  // In development, use the requested path
  await fs.promises.mkdir(dirPath, { recursive: true });
  return dirPath;
}

/**
 * Logs environment information for debugging
 */
export function logEnvironmentInfo(): void {
  console.log('Environment Information:');
  console.log(`- Vercel Environment: ${isVercelEnvironment() ? 'Yes' : 'No'}`);
  console.log(`- NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`);
  console.log(`- Working Directory: ${process.cwd()}`);
  console.log(`- Temp Directory: ${getTempDirectory()}`);
  console.log(`- Base Directory: ${getBaseDirectory()}`);
}