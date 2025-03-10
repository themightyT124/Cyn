# Deploying Your App to Vercel

This guide explains how to properly deploy this full-stack application to Vercel.

## Prerequisites

1. Make sure you have a Vercel account (sign up at [vercel.com](https://vercel.com))
2. Have the Vercel CLI installed: `npm i -g vercel`

## Deployment Steps

### 1. Log in to Vercel

```bash
vercel login
```

### 2. Deploy the Application

From the root directory of your project, run:

```bash
vercel
```

During the deployment process:
- When asked "Do you want to override the settings?", select "Yes"
- For the "Build Command" question, enter: `./build-for-vercel.sh`
- For the "Output Directory" question, enter: `dist`
- For other questions, you can accept the defaults

### 3. Environment Variables

This voice transformation application requires several environment variables to function properly. Make sure to set them in the Vercel dashboard:

1. Go to your project in the Vercel dashboard
2. Click on "Settings" > "Environment Variables"
3. Add the following environment variables if you're using them:
   - `DATABASE_URL` - Connection string for your database
   - `OPENAI_API_KEY` - If you're using OpenAI for voice synthesis
   - `GOOGLE_CLOUD_API_KEY` - If you're using Google Cloud for text-to-speech
   - `NODE_ENV` - Set to "production" for the production environment

If you're using any other external APIs, make sure to add their keys as well.

### 4. Troubleshooting

If you see raw code in your deployment instead of your application:

1. Make sure the deployment is using the correct build command (`./build-for-vercel.sh`)
2. Check that the Vercel configuration file (`vercel.json`) is in the root of your project
3. Verify that the build script creates the correct output structure in the `dist` directory

Voice transformation specific troubleshooting:

1. **File Upload Issues**: If voice samples aren't uploading correctly, check that you've configured Vercel to handle file uploads properly by increasing the body parser limit in your project settings.

2. **API Connection Problems**: If the application can't connect to external APIs (like OpenAI or Google Cloud), verify that your API keys are set correctly in the environment variables.

3. **Audio Processing Errors**: Make sure any required audio processing modules are properly included in the build. Some audio libraries may require special handling in serverless environments.

4. **Memory Limits**: Voice processing can be memory-intensive. If you encounter out-of-memory errors, consider upgrading your Vercel plan for more resources or optimizing your audio processing code.

5. **Storage Issues**: If your application stores temporary audio files, be aware that Vercel's serverless functions have a read-only filesystem. Use cloud storage solutions instead of local file storage.

### 5. Production Deployment

Once everything is working with a preview deployment, you can deploy to production with:

```bash
vercel --prod
```

## Project Structure for Vercel

This project is configured with:

- `vercel.json` - Contains the Vercel deployment configuration
- `build-for-vercel.sh` - Custom build script for Vercel
- `api/index.js` - Serverless function adapter for the Express backend

These files work together to ensure your full-stack application deploys correctly on Vercel's serverless infrastructure.