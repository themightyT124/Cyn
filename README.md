# AI Voice Transformation Platform

A cutting-edge AI voice transformation platform specializing in character-specific voice cloning and personalization, with advanced audio processing capabilities.

## Quick Deploy (100% Free)
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

Deploy this project instantly on Render's free tier! This deployment method is completely free and includes:
- Free subdomain (your-app.onrender.com)
- Free SSL/HTTPS
- Automatic Git deployments
- Zero cost web service

## Deployment Instructions

### Option 1: One-Click Deploy (Easiest)
1. Click the "Deploy to Render" button above
2. Sign up/login to Render.com (free)
3. Click "Connect" if prompted to connect your GitHub account
4. Fill in the following details:
   - **Name**: Choose a name for your service (e.g., "ai-voice-transformation")
   - **Environment**: Leave as "Node"
   - **Branch**: main
5. Click "Create Web Service"
6. Wait for deployment to complete (usually 2-5 minutes)
7. Visit your new app at `https://your-app-name.onrender.com`

### Option 2: Manual Deploy
1. Fork this repository to your GitHub account
2. Sign up/login to [Render.com](https://render.com)
3. From the Render dashboard, click "New +" and select "Web Service"
4. Connect your GitHub account if you haven't already
5. Select the forked repository
6. Configure the web service:
   - **Name**: Choose a name for your service
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Plan**: Free
7. Add the following environment variables:
   ```
   NODE_ENV=production
   PORT=10000
   ```
8. Click "Create Web Service"

Your application will be deployed and available at `https://your-app-name.onrender.com`

## Key Features

- Voice synthesis and transformation
- Voice sample training and processing
- Character-specific voice cloning
- Web-based interface with React
- Real-time audio processing
- Support for various audio formats

## Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Express.js, Node.js
- **Audio Processing**: FFmpeg, Web Speech API
- **Build Tools**: Vite, ESBuild

## Local Development

Prerequisites:
- Node.js 18+ 
- npm or yarn

```bash
# Clone the repository
git clone https://github.com/yourusername/ai-voice-transformation.git
cd ai-voice-transformation

# Install dependencies
npm install

# Start development server
npm run dev

# Visit http://localhost:5000
```

## Environment Setup

Create a `.env` file with:

```env
STABILITY_API_KEY=your-stability-api-key
OPENAI_API_KEY=your-openai-api-key
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you need help or have questions:
1. Check our [Issues](https://github.com/yourusername/ai-voice-transformation/issues) page
2. Join our [Discord community](https://discord.gg/yourdiscord)
3. Email support at: support@yourdomain.com