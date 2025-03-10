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
   - `STABILITY_API_KEY` - Required for image generation functionality
   - `NODE_ENV` - Set to "production" for the production environment

If you're using any other external APIs, make sure to add their keys as well.

### 4. Troubleshooting

If you see raw code in your deployment instead of your application:

1. Make sure the deployment is using the correct build command (`./build-for-vercel.sh`)
2. Check that the Vercel configuration file (`vercel.json`) is in the root of your project
3. Verify that the build script creates the correct output structure in the `dist` directory
4. **IMPORTANT**: If you still see raw JavaScript/TypeScript code after deploying, try the following:
   - Deploy directly from Git repository instead of using the Vercel CLI
   - Ensure your Vercel project is configured as "Framework preset: Other" and not as "Vite"
   - Clear the Vercel cache and redeploy
   - Verify that your vercel.json routes and rewrites are correctly configured

Voice transformation specific troubleshooting:

1. **File Upload Issues**: If voice samples aren't uploading correctly, check that you've configured Vercel to handle file uploads properly by increasing the body parser limit in your project settings.

2. **API Connection Problems**: If the application can't connect to external APIs (like OpenAI or Google Cloud), verify that your API keys are set correctly in the environment variables.

3. **Audio Processing Errors**: Make sure any required audio processing modules are properly included in the build. Some audio libraries may require special handling in serverless environments.

4. **Resource Limitations**: 
   - **Memory**: Voice processing can be memory-intensive. If you encounter out-of-memory errors, consider upgrading your Vercel plan for more resources or optimizing your audio processing code.
   - **Execution Time**: Vercel serverless functions have a maximum execution time (default is 10 seconds for the free tier, up to 60 seconds on paid plans). Complex voice processing operations may hit this limit. Consider breaking long operations into smaller chunks or using background processing with webhooks for completion notification.

5. **File System Limitations**: Vercel's serverless functions have a read-only filesystem, with the exception of the `/tmp` directory which can be used for temporary file storage. All audio processing that uses `fs` operations to write files must be modified to:
   - Use the `/tmp` directory for temporary files: `path.join('/tmp', 'filename.wav')`
   - Consider that files in `/tmp` are not guaranteed to persist between function invocations
   - For permanent storage, integrate with a cloud storage service like AWS S3, Google Cloud Storage, or similar

   Specific functions in `server/audio-converter.ts` need modification for Vercel:
   - `convertMp3ToWav`
   - `processVoiceSample`
   - `setupVoiceSamples`

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

## Cloud Storage Integration

For voice transformation applications deployed to Vercel, we recommend integrating with a cloud storage solution for storing voice samples and processed audio files. Here are some options:

### Amazon S3
```javascript
// Install the AWS SDK
// npm install aws-sdk

import AWS from 'aws-sdk';

// Configure AWS
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

// Upload a file
async function uploadToS3(fileBuffer, fileName, contentType) {
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: fileName,
    Body: fileBuffer,
    ContentType: contentType
  };
  
  return s3.upload(params).promise();
}

// Download a file
async function getFromS3(fileName) {
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: fileName
  };
  
  return s3.getObject(params).promise();
}
```

### Google Cloud Storage
```javascript
// Install the Google Cloud Storage client
// npm install @google-cloud/storage

import { Storage } from '@google-cloud/storage';

// Initialize storage
const storage = new Storage();
const bucket = storage.bucket(process.env.GCS_BUCKET_NAME);

// Upload a file
async function uploadToGCS(fileBuffer, fileName, contentType) {
  const file = bucket.file(fileName);
  const stream = file.createWriteStream({
    metadata: {
      contentType: contentType
    }
  });
  
  return new Promise((resolve, reject) => {
    stream.on('error', (err) => reject(err));
    stream.on('finish', () => resolve());
    stream.end(fileBuffer);
  });
}

// Download a file
async function getFromGCS(fileName) {
  const file = bucket.file(fileName);
  const [fileBuffer] = await file.download();
  return fileBuffer;
}
```

Remember to add the corresponding environment variables to your Vercel project settings.