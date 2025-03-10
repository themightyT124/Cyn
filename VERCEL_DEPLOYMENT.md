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

If your application uses environment variables (like API keys), make sure to set them in the Vercel dashboard:

1. Go to your project in the Vercel dashboard
2. Click on "Settings" > "Environment Variables"
3. Add all the required environment variables

### 4. Troubleshooting

If you see raw code in your deployment instead of your application:

1. Make sure the deployment is using the correct build command (`./build-for-vercel.sh`)
2. Check that the Vercel configuration file (`vercel.json`) is in the root of your project
3. Verify that the build script creates the correct output structure in the `dist` directory

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