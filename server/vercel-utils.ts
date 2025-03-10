/**
 * Utility functions for Vercel deployment
 */
import fs from 'fs';
import path from 'path';
import { promises as fsPromises } from 'fs';

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
    return '/tmp';
  }
  return path.join(process.cwd(), 'tmp');
}

/**
 * Gets the appropriate base directory for project files
 */
export function getBaseDirectory(): string {
  if (isVercelEnvironment()) {
    // In Vercel, the base directory depends on the build output
    return process.cwd();
  }
  return process.cwd();
}

/**
 * Creates a path for a writable file in the appropriate directory
 * based on the current environment
 */
export function getWritableFilePath(filename: string): string {
  const dir = getTempDirectory();
  return path.join(dir, filename);
}

/**
 * Ensures a directory exists and is writable
 * In Vercel, this will redirect to /tmp
 */
export async function ensureWritableDirectory(dirPath: string): Promise<string> {
  let targetDir = dirPath;
  
  if (isVercelEnvironment()) {
    // In Vercel, we need to use /tmp
    const relativePath = path.relative(process.cwd(), dirPath);
    targetDir = path.join(getTempDirectory(), relativePath);
  }
  
  try {
    await fsPromises.access(targetDir, fs.constants.F_OK);
  } catch (e) {
    // Directory doesn't exist, create it
    await fsPromises.mkdir(targetDir, { recursive: true });
    console.log(`Created directory: ${targetDir}`);
  }
  
  return targetDir;
}

/**
 * Logs environment information for debugging
 */
export function logEnvironmentInfo(): void {
  console.log('Environment Information:');
  console.log('------------------------');
  console.log(`Vercel Environment: ${isVercelEnvironment() ? 'Yes' : 'No'}`);
  console.log(`Current Working Directory: ${process.cwd()}`);
  console.log(`Base Directory: ${getBaseDirectory()}`);
  console.log(`Temp Directory: ${getTempDirectory()}`);
  console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
  console.log('------------------------');
}