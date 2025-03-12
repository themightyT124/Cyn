# AI Voice Transformation Platform

A cutting-edge AI voice transformation platform specializing in character-specific voice cloning and personalization, with advanced audio processing capabilities.

## Quick Deploy (100% Free)
[![Run on Repl.it](https://replit.com/badge/github/yourusername/ai-voice-transformation)](https://replit.com/new/github/yourusername/ai-voice-transformation)

Click the "Run on Repl.it" button above to instantly clone and run this project in your own Replit workspace! This deployment method is completely free and includes:
- Free subdomain (your-project.username.repl.co)
- Free SSL/HTTPS
- Free Git version control
- Basic analytics

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

## Deployment Options

### 1. Free Deployment with Replit (Recommended)

The easiest way to deploy this project is using Replit:

1. Click the "Run on Repl.it" button above
2. After the project loads, click the "Deploy" button at the top of your Replit workspace
3. Your app will be deployed to a free subdomain: `your-project-name.username.repl.co`
4. The deployment includes:
   - Free SSL/HTTPS
   - Git version control
   - Basic analytics
   - 24/7 availability (with Replit's hacker plan)

### 2. Local Development and Other Deployments

#### Local Development

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

#### GitHub Pages Deployment

While this is primarily a full-stack application that requires a server, you can deploy the frontend to GitHub Pages:

1. Update the `homepage` field in `package.json`:
   ```json
   "homepage": "https://yourusername.github.io/ai-voice-transformation"
   ```

2. Install GitHub Pages package:
   ```bash
   npm install --save-dev gh-pages
   ```

3. Add deployment scripts to `package.json`:
   ```json
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```

4. Deploy to GitHub Pages:
   ```bash
   npm run deploy
   ```

#### Vercel Deployment

For full-stack deployment including backend functionality, follow the instructions in [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md).


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