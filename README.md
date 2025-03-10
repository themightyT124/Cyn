# AI Voice Transformation Platform

A cutting-edge AI voice transformation platform specializing in character-specific voice cloning and personalization, with advanced audio processing capabilities.

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

## Project Structure

```
├── api/                  # API handlers for serverless deployment
├── client/               # React frontend application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utility functions and API clients
│   │   └── pages/        # Application pages
├── public/               # Static assets
├── server/               # Express backend server
│   ├── routes.ts         # API route definitions
│   ├── storage.ts        # Data storage interface
│   └── audio-converter.ts # Audio processing utilities
├── shared/               # Shared code between frontend and backend
│   └── schema.ts         # Data schemas and types
├── training-data/        # Directory for voice training data (gitignored)
├── uploads/              # Directory for user uploads (gitignored)
└── voice-training/       # Voice training utilities
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/ai-voice-transformation.git
   cd ai-voice-transformation
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5000`

## Audio Processing Features

### Voice Sample Processing

The platform can process various audio files:

- Converting MP3 to WAV format
- Splitting large audio files into smaller chunks
- Normalizing audio for better training results
- Preparing voice samples for AI training

### Voice Transformation

After training with voice samples, the system can:

- Generate speech in the trained voice
- Apply voice characteristics to new text
- Create personalized voice responses

## Environment Setup

Create a `.env` file in the root directory with the following variables (as needed):

```
GOOGLE_APPLICATION_CREDENTIALS=path/to/credentials.json
OPENAI_API_KEY=your-openai-api-key
```

## Deployment Options

### GitHub Pages Deployment

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

### Vercel Deployment

For full-stack deployment including backend functionality, follow the instructions in [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md).

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.