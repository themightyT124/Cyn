# Cyn - AI Voice Transformation Platform

A cutting-edge AI voice transformation platform featuring Cyn, a chaotic and cryptic AI personality with advanced voice synthesis capabilities.

## Quick Deploy (100% Free, No Credit Card)
[![Remix on Glitch](https://cdn.glitch.com/2703baf2-b643-4da7-ab91-7ee2a2d00b5b%2Fremix-button.svg)](https://glitch.com/edit/#!/import/github/yourusername/cyn)

Deploy instantly to Glitch's free tier! This deployment method is completely free and requires:
- No credit card
- No paid subscription
- Just a free Glitch account

You get:
- Free subdomain (your-cyn-app.glitch.me)
- Free SSL/HTTPS
- Automatic deployments
- Real-time collaboration
- 24/7 uptime with UptimeRobot (free)

## Deployment Instructions

### Step-by-Step Guide:

1. Go to [Glitch.com](https://glitch.com) and click "Sign Up" (it's free)
2. After signing in, click "New Project" button at the top
3. In the popup menu, select "Import from GitHub" 🔄
4. Paste your repository URL and click "OK"
5. Wait for the import to complete (1-2 minutes)
6. Your app will be live at: `https://your-cyn-app.glitch.me`

### Setting Up 24/7 Uptime (Important!)

To keep your app running 24/7 for free:

1. Go to [UptimeRobot.com](https://uptimerobot.com) and create a free account
2. Click "Add New Monitor"
3. Select "HTTP(s)" as the monitor type
4. Set your Glitch URL: `https://your-cyn-app.glitch.me/health`
5. Set checking interval to 5 minutes
6. Click "Create Monitor"

That's it! Your app will now stay online 24/7! 🎉

## Key Features

- Voice synthesis and transformation
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
git clone https://github.com/yourusername/cyn.git
cd cyn

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
1. Check our [Issues](https://github.com/yourusername/cyn/issues) page
2. Join our [Discord community](https://discord.gg/yourdiscord)
3. Email support at: support@yourdomain.com