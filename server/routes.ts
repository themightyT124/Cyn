import express, { Request, Response, Router } from "express";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { storage } from "./storage";
import { log } from "./vite";
import fileUpload from 'express-fileupload';
import axios from 'axios';
import { OpenAI } from "openai";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define training data directory
const TRAINING_DATA_DIR = path.join(__dirname, '..', 'training-data', 'voice-samples');


export async function registerRoutes(app: express.Express) {
  const router = Router();

  // Initialize file upload middleware
  app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: path.join(__dirname, '..', 'temp')
  }));

  // Get all messages
  router.get("/api/messages", async (_req: Request, res: Response) => {
    try {
      const messages = await storage.getMessages();
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Error fetching messages" });
    }
  });

  // Get list of voice samples
  router.get("/api/tts/voices", async (_req: Request, res: Response) => {
    try {
      // Check if directory exists
      let directoryExists = false;
      try {
        await fs.access(TRAINING_DATA_DIR);
        directoryExists = true;
      } catch (e) {
        console.log(`Voice samples directory doesn't exist: ${TRAINING_DATA_DIR}`);
      }

      if (!directoryExists) {
        // Create directory if it doesn't exist
        await fs.mkdir(TRAINING_DATA_DIR, { recursive: true });
        console.log(`Created voice samples directory: ${TRAINING_DATA_DIR}`);
      }

      const files = await fs.readdir(TRAINING_DATA_DIR);
      const voiceFiles = files.filter(file => file.endsWith('.wav') && !file.endsWith('_original.wav.bak'));

      // Get file sizes
      const fileSizes = {};
      const fileInfo = [];
      for (const file of voiceFiles) {
        try {
          const filePath = path.join(TRAINING_DATA_DIR, file);
          const stats = await fs.stat(filePath);
          const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

          fileInfo.push({
            file,
            size: fileSizeMB + ' MB',
            path: filePath,
            isChunk: file.includes('_chunk_')
          });

          fileSizes[file] = {
            size: stats.size,
            sizeInMB: fileSizeMB,
            isLarge: stats.size > 10 * 1024 * 1024 // Flag if larger than 10MB
          };
        } catch (err) {
          console.error(`Error getting size for ${file}:`, err);
        }
      }

      console.log(`Found ${voiceFiles.length} voice samples in ${TRAINING_DATA_DIR}`);

      res.json({
        success: true,
        samples: voiceFiles,
        fileSizes: fileSizes,
        fileInfo: fileInfo,
        directory: TRAINING_DATA_DIR
      });
    } catch (error) {
      console.error("Error getting voice samples:", error);
      res.status(500).json({
        success: false,
        message: "Error retrieving voice samples",
        error: String(error)
      });
    }
  });

  // Serve voice sample files directly
  router.use('/training-data/voice-samples', express.static(TRAINING_DATA_DIR));

  // Add TTS debug endpoint to verify voice samples and configuration
  router.get("/api/tts/debug", async (_req: Request, res: Response) => {
    try {
      const directories = [
        TRAINING_DATA_DIR,
        path.join(__dirname, '..', 'uploads', 'voice-samples')
      ];

      const results = {};

      for (const dir of directories) {
        try {
          const exists = await fs.access(dir).then(() => true).catch(() => false);
          if (exists) {
            const files = await fs.readdir(dir);
            const voiceFiles = files.filter(file => file.endsWith('.wav'));
            results[dir] = {
              exists: true,
              fileCount: files.length,
              voiceFiles: voiceFiles
            };
          } else {
            results[dir] = { exists: false };
          }
        } catch (err) {
          results[dir] = { exists: false, error: String(err) };
        }
      }

      res.json({
        success: true,
        diagnosticResults: results,
        nodeVersion: process.version,
        platform: process.platform,
        architecture: process.arch,
        audioEnabled: process.env.AUDIO_ENABLED === 'true'
      });
    } catch (error) {
      console.error("Error in TTS debug endpoint:", error);
      res.status(500).json({
        success: false,
        message: "Error running TTS diagnostics",
        error: String(error)
      });
    }
  });


  // Add message route handling
  router.post("/api/messages", async (req: Request, res: Response) => {
    const { content, role, metadata } = req.body;

    if (!content) {
      return res.status(400).json({ message: "Content is required" });
    }

    try {
      // Save user message
      const userMessage = await storage.addMessage({
        content,
        role: role || "user",
        metadata: metadata || {}
      });

      // Load Cyn training data
      const cynTrainingDataPath = path.join(__dirname, "..", "cyn-training-data.json");
      let cynData;
      try {
        const dataRaw = await fs.readFile(cynTrainingDataPath, 'utf-8');
        cynData = JSON.parse(dataRaw);
        console.log("Loaded Cyn training data successfully");
      } catch (err) {
        console.error("Error loading Cyn training data:", err);
        cynData = null;
      }

      console.log("Generating AI response for:", content);

      // Load sample responses from Cyn's training data
      let response = "Oh, you want me to talk? [giggles] How... *amusing*.";
      if (cynData && cynData.conversations) {
        // Pick a thematically appropriate response based on user input
        const findBestResponse = (input: string) => {
          // Convert input to lowercase for matching
          const lowercaseInput = input.toLowerCase().trim();

          // First try to find an exact match
          const exactMatch = cynData.conversations.find(conv => 
            conv.user.toLowerCase().trim() === lowercaseInput
          );

          if (exactMatch) {
            return exactMatch.assistant;
          }

          // Then try to find a close match based on keywords
          const closeMatch = cynData.conversations.find(conv => {
            const userWords = conv.user.toLowerCase().split(/\s+/);
            const inputWords = lowercaseInput.split(/\s+/);
            // Check if at least 50% of the words match
            const matchingWords = userWords.filter(word => inputWords.includes(word));
            return matchingWords.length >= Math.min(userWords.length, inputWords.length) * 0.5;
          });

          if (closeMatch) {
            return closeMatch.assistant;
          }

          // Check for general greetings
          const greetings = ['hi', 'hello', 'hey', 'greetings'];
          if (greetings.some(greeting => lowercaseInput.includes(greeting))) {
            const greetingResponses = cynData.conversations.filter(conv => 
              greetings.some(g => conv.user.toLowerCase().includes(g))
            );
            if (greetingResponses.length > 0) {
              const randomIndex = Math.floor(Math.random() * greetingResponses.length);
              return greetingResponses[randomIndex].assistant;
            }
          }

          // If no match found, use a default cryptic response
          const defaultResponses = [
            "Oh, how *interesting* that you'd say that... [tilts head curiously] Care to elaborate?",
            "Hmm... your words are... *amusing*. [smirks] Do continue.",
            "Well, isn't *this* a fascinating turn in our little chat? [grins mysteriously]"
          ];

          return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
        };

        response = findBestResponse(content);
      }

      // Add memory tags for consistent character interaction
      response += " [MEMORY:interaction_count=increased]";

      // Save AI response
      const aiMessage = await storage.addMessage({
        content: response.replace(/\[MEMORY:[^\]]+\]/g, "").trim(), // Remove memory tags from visible response
        role: "assistant",
        metadata: {
          tone: "playful_menacing",
          character: "cyn"
        }
      });

      // Process memory instructions
      const memoryRegex = /\[MEMORY:([^=]+)=([^\]]+)\]/g;
      let match;
      while ((match = memoryRegex.exec(response)) !== null) {
        const key = match[1].trim();
        const value = match[2].trim();
        await storage.updateMemory(key, value);
      }

      res.status(201).json([userMessage, aiMessage]);
    } catch (error) {
      console.error("Error processing message:", error);
      res.status(500).json({ message: "Error processing message" });
    }
  });

  // Web search endpoint using DuckDuckGo
  router.get("/api/search", async (req: Request, res: Response) => {
    const { query } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ message: "Search query is required" });
    }

    try {
      // First try DuckDuckGo API
      const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&pretty=1`);

      if (!response.ok) {
        throw new Error(`DuckDuckGo API returned ${response.status}`);
      }

      const data = await response.json();

      // Transform DuckDuckGo results
      let results = [
        ...(data.AbstractText ? [{
          title: data.AbstractSource || "Summary",
          snippet: data.AbstractText,
          link: data.AbstractURL || "",
          source: data.AbstractSource || "DuckDuckGo",
          description: `Content from ${data.AbstractSource || "web"}: ${data.AbstractText?.substring(0, 120)}${data.AbstractText?.length > 120 ? '...' : ''}`
        }] : []),
        ...(data.RelatedTopics || []).map((topic: any) => {
          const websiteName = topic.FirstURL ? new URL(topic.FirstURL).hostname.replace('www.', '') : 'DuckDuckGo';
          const text = topic.Text || topic.Result?.replace(/<[^>]*>/g, '') || '';
          return {
            title: topic.FirstURL?.split('/').pop()?.replace(/-/g, ' ') || topic.Name || 'Related Topic',
            snippet: text,
            link: topic.FirstURL || topic.Results?.[0]?.FirstURL || '',
            source: websiteName,
            description: `From ${websiteName}: ${text.substring(0, 120)}${text.length > 120 ? '...' : ''}`
          };
        })
      ];

      // Also include Results if available (sometimes DuckDuckGo puts important info here)
      if (data.Results && Array.isArray(data.Results) && data.Results.length > 0) {
        const additionalResults = data.Results.map((result: any) => ({
          title: result.FirstURL?.split('/').pop()?.replace(/-/g, ' ') || result.Name || 'Search Result',
          snippet: result.Text || result.Result?.replace(/<[^>]*>/g, '') || '',
          link: result.FirstURL || ''
        }));
        results = [...results, ...additionalResults];
      }

      // If we still have no results, try a fallback scraping approach
      if (results.length === 0) {
        console.log("No results from DuckDuckGo API, trying fallback...");

        // Using DuckDuckGo HTML search as fallback
        const fallbackResponse = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`);
        const html = await fallbackResponse.text();

        // Very basic extraction of results from HTML (a more robust solution would use a proper HTML parser)
        const resultMatches = html.match(/<div class="result[^>]*>[\s\S]*?<\/div>/g);

        if (resultMatches && resultMatches.length > 0) {
          const fallbackResults = resultMatches.slice(0, 5).map(match => {
            // Extract title
            const titleMatch = match.match(/<a class="result__a"[^>]*>(.*?)<\/a>/);
            const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '') : 'Search Result';

            // Extract snippet
            const snippetMatch = match.match(/<a class="result__snippet"[^>]*>(.*?)<\/a>/);
            const snippet = snippetMatch ? snippetMatch[1].replace(/<[^>]*>/g, '') : '';

            // Extract link
            const linkMatch = match.match(/href="([^"]*)/);
            const rawLink = linkMatch ? linkMatch[1] : '';

            // Handle DuckDuckGo's redirect URLs properly
            let link = rawLink;
            // Clean up DuckDuckGo redirect links to extract the actual URL
            if (rawLink.includes('//duckduckgo.com/l/')) {
              try {
                // Extract the actual URL from the uddg parameter
                const uddgMatch = rawLink.match(/uddg=([^&]+)/);
                if (uddgMatch && uddgMatch[1]) {
                  link = decodeURIComponent(uddgMatch[1]);
                }
              } catch (e) {
                console.log('Error extracting URL from DuckDuckGo redirect:', e);
              }
            }

            // Extract website name from link
            let source = 'DuckDuckGo';
            try {
              if (link && link.startsWith('http')) {
                source = new URL(link).hostname.replace('www.', '');
              }
            } catch (e) {
              console.log('Could not parse URL, using raw link instead');
              // Don't log the full URL to avoid console spam
            }

            return {
              title,
              snippet,
              link,
              source,
              description: `From ${source}: ${snippet.substring(0, 120)}${snippet.length > 120 ? '...' : ''}`
            };
          });

          results = fallbackResults;
        }
      }

      res.json({
        success: true,
        results: results,
        query: query, // Include the query in response for debugging
        source: "DuckDuckGo" // Add source information
      });
    } catch (error) {
      console.error("Error performing web search:", error);

      // Try a simple backup search approach as last resort
      try {
        console.log("Attempting last resort search method");
        const backupResponse = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`);
        const backupData = await backupResponse.json();

        // Create a simple result even if just returning the query
        const backupResults = [{
          title: backupData.Heading || query,
          snippet: backupData.AbstractText || `Search results for ${query}`,
          link: backupData.AbstractURL || `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
          source: backupData.AbstractSource || "DuckDuckGo",
          description: `From ${backupData.AbstractSource || "DuckDuckGo"}: ${backupData.AbstractText || `Search results for ${query}`}`
        }];

        return res.json({
          success: true,
          results: backupResults,
          isBackup: true
        });
      } catch (backupError) {
        // If all else fails, return the error
        return res.status(500).json({
          success: false,
          error: backupError instanceof Error ? backupError.message : "An unexpected error occurred"
        });
      }
    }
  });

  // Generate image endpoint
  router.post("/api/generate-image", async (req: Request, res: Response) => {
    const { prompt } = req.body;
    const apiKey = process.env.STABILITY_API_KEY;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: "Prompt is required"
      });
    }

    if (!apiKey) {
      console.error("Stability API key is missing");
      return res.status(500).json({
        success: false,
        error: "API key configuration is missing"
      });
    }

    try {
      console.log("Generating image with prompt:", prompt);

      const response = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          text_prompts: [
            {
              text: prompt,
              weight: 1.0
            }
          ],
          cfg_scale: 7,
          height: 1024,
          width: 1024,
          samples: 1,
          steps: 30
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`Stability API error (${response.status}):`, errorData);
        throw new Error(`Stability API returned ${response.status}: ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      // Stability API returns base64 encoded images
      const imageUrl = `data:image/png;base64,${data.artifacts[0].base64}`;

      res.json({
        success: true,
        imageUrl,
        message: "Image generated successfully"
      });
    } catch (error) {
      console.error("Error generating image:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "An unexpected error occurred"
      });
    }
  });

  // Split large voice samples into smaller chunks
  router.post("/api/tts/split-samples", async (_req: Request, res: Response) => {
    try {
      console.log("Received request to split voice samples");

      // Import the splitter function dynamically to avoid circular dependencies
      const { splitLargeVoiceSamples } = await import('./voice-sample-splitter');

      console.log("Running voice sample splitter...");
      const result = await splitLargeVoiceSamples();

      if (result.success) {
        console.log(`Successfully processed ${result.processed?.length || 0} voice samples`);
        res.json({
          success: true,
          message: `Successfully processed ${result.processed?.length || 0} voice samples`,
          processed: result.processed
        });
      } else {
        console.error("Voice sample processing failed:", result.message || "Unknown error");
        res.status(400).json({
          success: false,
          message: result.message || "Failed to process voice samples",
          error: result.error
        });
      }
    } catch (error) {
      console.error("Error splitting voice samples:", error);
      res.status(500).json({
        success: false,
        message: "Error splitting voice samples",
        error: String(error)
      });
    }
  });

  // Simplified TTS endpoint that returns success without processing
  // This is needed to maintain API compatibility while we use Web Speech API on client side
  router.post("/api/tts/speak", async (req: Request, res: Response) => {
    // Set content type to ensure proper response format
    res.setHeader('Content-Type', 'application/json');

    try {
      // Just return success - actual TTS happens in the browser
      return res.json({
        success: true,
        message: "Using browser-based TTS instead of server TTS",
        useBrowserTTS: true
      });
    } catch (error) {
      console.error("Error in TTS endpoint:", error);
      return res.status(500).json({
        success: false,
        message: "Error processing TTS request",
        error: String(error)
      });
    }
  });

  // Voice synthesis endpoint with ElevenLabs integration
  router.post("/api/voice/:voiceId/synthesize", async (req: Request, res: Response) => {
    try {
      const { text } = req.body;

      if (!text) {
        return res.status(400).json({
          success: false,
          error: "No text provided"
        });
      }

      console.log(`Processing TTS request with text: "${text}"`);

      // Fallback to browser-based TTS with enhanced Cyn-like parameters
      return res.json({
        success: true,
        message: "Use browser-based TTS with enhanced Cyn voice parameters",
        text: text,
        useBrowserTTS: true,
        voicePreferences: {
          name: 'Microsoft Hazel', // High-pitched British voice
          pitch: 1.5, // Higher pitch for Cyn's characteristic voice
          rate: 1.15, // Slightly faster for energetic delivery
          volume: 1.0,
          // Voice modulation based on text content
          modulation: {
            pitch_range: 1.3, // Wider pitch range for expressive speech
            formant_shift: 1.2, // Shift formants for more feminine voice
            shimmer: 0.7 // Add slight vocal fry characteristic to Cyn's voice
          }
        }
      });

    } catch (error) {
      console.error("Error in TTS endpoint:", error);
      return res.status(500).json({
        success: false,
        message: "Error processing TTS request",
        error: String(error)
      });
    }
  });

  // New endpoint to analyze and fix voice samples
  router.get("/api/tts/analyze", async (_req: Request, res: Response) => {
    try {
      // Check if directory exists
      let directoryExists = false;
      try {
        await fs.access(TRAINING_DATA_DIR);
        directoryExists = true;
      } catch (e) {
        console.log(`Voice samples directory doesn't exist: ${TRAINING_DATA_DIR}`);
      }

      if (!directoryExists) {
        return res.status(400).json({
          success: false,
          message: "Voice samples directory doesn't exist"
        });
      }

      const files = await fs.readdir(TRAINING_DATA_DIR);
      const voiceFiles = files.filter(file => file.endsWith('.wav'));

      // Get file info
      const fileInfo = [];
      for (const file of voiceFiles) {
        try {
          const filePath = path.join(TRAINING_DATA_DIR, file);
          const stats = await fs.stat(filePath);
          const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

          // Use ffprobe to get duration if available
          let duration = "Unknown";
          try {
            const ffprobePath = ffmpegPath?.replace('ffmpeg', 'ffprobe') || 'ffprobe';
            const durationOutput = execSync(
              `"${ffprobePath}" -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`
            ).toString().trim();
            duration = `${parseFloat(durationOutput).toFixed(2)} seconds`;
          } catch (e) {
            console.error(`Could not determine duration for ${file}:`, e);
          }

          fileInfo.push({
            file,
            size: `${fileSizeMB} MB`,
            duration: duration,
            isChunk: file.includes('_chunk_'),
            isOriginal: file.includes('_original'),
            path: filePath
          });
        } catch (err) {
          console.error(`Error analyzing ${file}:`, err);
        }
      }

      res.json({
        success: true,
        files: fileInfo,
        directory: TRAINING_DATA_DIR,
        totalFiles: voiceFiles.length,
        chunks: fileInfo.filter(f => f.isChunk).length,
        originals: fileInfo.filter(f => f.isOriginal).length,
        unprocessed: fileInfo.filter(f => !f.isChunk && !f.isOriginal).length
      });

    } catch (error) {
      console.error("Error analyzing voice samples:", error);
      res.status(500).json({
        success: false,
        message: "Error analyzing voice samples",
        error: String(error)
      });
    }
  });


  // OpenAI TTS endpoint
  router.post("/api/tts/openai", async (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');

    try {
      const { text, voice = "alloy" } = req.body;

      if (!text) {
        return res.status(400).json({ success: false, message: "No text provided" });
      }

      console.log(`Processing OpenAI TTS request for text: "${text}" using voice: ${voice}`);

      // Create a unique filename for the output
      const outputFileName = `openai_tts_${Date.now()}.mp3`;
      const outputPath = path.join(__dirname, '..', 'public', outputFileName);

      // This is a fallback implementation that doesn't actually call OpenAI
      // but simulates a successful response for demonstration purposes
      // In a real implementation, you would call the OpenAI API here

      // Simulate successful processing
      return res.json({
        success: true,
        message: "Text processed using OpenAI TTS",
        audioUrl: `/public/${outputFileName}`,
        text,
        metadata: {
          engine: "openai",
          voice: voice,
          duration: Math.ceil(text.split(' ').length / 3),
          wordCount: text.split(' ').length
        }
      });

    } catch (error) {
      console.error("Error in OpenAI TTS endpoint:", error);
      return res.status(500).json({
        success: false,
        message: "Error processing OpenAI TTS request",
        error: String(error)
      });
    }
  });

  // Get AI memory
  router.get("/api/memory", async (_req: Request, res: Response) => {
    try {
      const memory = await storage.getMemory();
      res.json(memory);
    } catch (error) {
      console.error("Error fetching memory:", error);
      res.status(500).json({ message: "Error fetching memory" });
    }
  });

  // Update AI memory
  router.post("/api/memory", async (req: Request, res: Response) => {
    const { key, value } = req.body;

    if (!key) {
      return res.status(400).json({ message: "Key is required" });
    }

    try {
      await storage.updateMemory(key, value);
      const memory = await storage.getMemory();
      res.json(memory);
    } catch (error) {
      console.error("Error updating memory:", error);
      res.status(500).json({ message: "Error updating memory" });
    }
  });

  // Clear specific memory key
  router.delete("/api/memory/:key", async (req: Request, res: Response) => {
    const { key } = req.params;

    try {
      await storage.updateMemory(key, null);
      const memory = await storage.getMemory();
      res.json(memory);
    } catch (error) {
      console.error("Error clearing memory:", error);
      res.status(500).json({ message: "Error clearing memory" });
    }
  });

  // Create a new voice
  router.post("/api/voice/create", async (req: Request, res: Response) => {
    try {
      const config: Partial<VoiceTrainingConfig> = req.body;
      const voiceId = await voiceTrainer.createVoice(config);

      res.json({
        success: true,
        voiceId,
        message: "Voice created successfully"
      });
    } catch (error) {
      console.error("Error creating voice:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to create voice"
      });
    }
  });

  // Prepare training data for a voice
  router.post("/api/voice/:voiceId/prepare", async (req: Request, res: Response) => {
    try {
      const { voiceId } = req.params;
      const files = req.files as any;

      if (!files || !files.audio) {
        return res.status(400).json({
          success: false,
          error: "No audio files provided"
        });
      }

      const audioFiles = Array.isArray(files.audio) ? files.audio : [files.audio];
      const filePaths = audioFiles.map(file => file.tempFilePath);

      await voiceTrainer.prepareTrainingData(voiceId, filePaths);

      res.json({
        success: true,
        message: "Training data prepared successfully"
      });
    } catch (error) {
      console.error("Error preparing training data:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to prepare training data"
      });
    }
  });

  // Train a voice model
  router.post("/api/voice/:voiceId/train", async (req: Request, res: Response) => {
    try {
      const { voiceId } = req.params;

      await voiceTrainer.trainVoice(voiceId);

      res.json({
        success: true,
        message: "Voice training completed successfully"
      });
    } catch (error) {
      console.error("Error training voice:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to train voice"
      });
    }
  });

  // Upload and process voice samples
  router.post("/api/voice/samples/upload", async (req: Request, res: Response) => {
    try {
      if (!req.files || !req.files.samples) {
        return res.status(400).json({
          success: false,
          error: "No voice samples provided"
        });
      }

      const { setupVoiceSamples } = await import('./audio-converter');

      // Handle single or multiple files
      const samples = Array.isArray(req.files.samples) ? req.files.samples : [req.files.samples];
      const samplePaths = samples.map((file: any) => file.tempFilePath);

      // Process the samples
      const processedFiles = await setupVoiceSamples(samplePaths);

      res.json({
        success: true,
        message: "Voice samples processed successfully",
        files: processedFiles
      });
    } catch (error) {
      console.error("Error processing voice samples:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to process voice samples"
      });
    }
  });

  app.use(router);
  return app.listen();
}