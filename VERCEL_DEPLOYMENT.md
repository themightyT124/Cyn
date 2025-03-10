# Vercel Deployment Guide

This document outlines how to deploy this application to Vercel, focusing on the specific considerations for our audio processing features.

## Deployment Prerequisites

Before deploying to Vercel, ensure you have:

1. A Vercel account
2. The Vercel CLI installed (optional but recommended)
3. Your project pushed to a Git repository (GitHub, GitLab, or Bitbucket)

## Deployment Steps

### Option 1: Deploy from the Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your Git repository
4. In the "Configure Project" settings:
   - Set the Framework Preset to **"Other"** (not "Vite")
   - Expand the "Build and Output Settings" section
   - Set Build Command to: `chmod +x build-for-vercel.sh && ./build-for-vercel.sh`
   - Set Output Directory to: `dist`
   - In the Environment Variables section, add any required API keys
5. Click "Deploy"

### Option 2: Deploy with Vercel CLI

1. Install the Vercel CLI: `npm i -g vercel`
2. Log in to Vercel: `vercel login`
3. From the project directory, run: `vercel`
4. Follow the CLI prompts, making sure to:
   - Override the build settings as in Option 1
   - Set the same environment variables

## Important Deployment Considerations

### Serverless Function Limitations

Vercel serverless functions have the following limitations that affect our app:

1. **Read-only filesystem**: Only `/tmp` is writable
   - All file write operations have been adapted to use this directory
   - Temporary files are managed accordingly

2. **Execution time limits**: Functions timeout after 60 seconds (on Pro plan)
   - Audio processing operations are optimized to complete quickly
   - Large file operations may be limited

3. **Cold starts**: Initial function execution may be slower
   - The app includes optimizations to minimize the impact

### Audio Processing in Serverless

The audio processing features work in the serverless environment with some adaptations:

1. **Voice sample processing**: Large file operations are handled differently
   - File splitting uses simpler methods in Vercel environment
   - Very large uploads may require preprocessing before upload

2. **FFmpeg usage**: All FFmpeg operations are optimized for serverless execution
   - Paths are adjusted automatically for the Vercel environment

## Troubleshooting

If you encounter issues with the deployment:

1. Check Vercel function logs for any errors
2. Verify environment variables are set correctly
3. Ensure that the `/api` routes are being correctly routed to the serverless function
4. For audio processing issues, verify that file paths are being correctly handled

## Local Testing for Vercel Compatibility

To test Vercel compatibility locally:

1. Create a `.env.vercel` file with `VERCEL=1`
2. Run the application with: `VERCEL=1 npm run dev`
3. Test the audio processing features with this environment variable set