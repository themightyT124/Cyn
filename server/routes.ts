import express, { Request, Response, Router } from "express";
import { nanoid } from "nanoid";
import { existsSync, promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { storage } from "./storage";
import { log } from "./vite";
import { GoogleGenerativeAI } from "@google/generative-ai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function registerRoutes(app: express.Express) {
  const router = Router();

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

  // Add a new message and get AI response
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

      // Get AI response using the correct Gemini model
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
      // Use gemini-1.5-pro-latest model
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });

      console.log("Generating AI response for:", content);
      
      // Build system prompt with Cyn's personality
      let systemPrompt = "You are a standard AI assistant.";
      let exampleConversations = [];
      
      if (cynData) {
        // Extract character info and example conversations
        const { character, conversations, response_guidelines } = cynData;
        
        // Build a rich system prompt based on Cyn's character
        systemPrompt = `You are ${character.name}, ${character.personality}. ${character.background}. 
Your tone is ${character.tone}.
Your traits include: ${character.traits.join(', ')}.
Follow these guidelines: ${response_guidelines.general_approach}
Style preferences: ${response_guidelines.style_preferences.join(', ')}`;
        
        // Use the example conversations for few-shot learning
        exampleConversations = conversations.map(conv => ({
          role: "user",
          parts: [{ text: conv.user }]
        })).flatMap((userMsg, i) => [
          userMsg,
          {
            role: "model",
            parts: [{ text: conversations[i].assistant }]
          }
        ]);
      }
      
      // Generate response
      const chat = model.startChat({
        history: exampleConversations,
        generationConfig: {
          temperature: 0.7,
          topP: 0.8,
          topK: 40,
        }
      });
      
      // Get the AI's memory
      const memory = await storage.getMemory();
      
      // Include memory in the prompt if it exists
      let memoryPrompt = "";
      if (Object.keys(memory).length > 0) {
        memoryPrompt = "\n\nHere's information you remember about the user:\n";
        for (const [key, value] of Object.entries(memory)) {
          memoryPrompt += `- ${key}: ${value}\n`;
        }
      }
      
      // In Gemini API, we can't use a direct "role: system" parameter
      // Instead, we need to prepend the system prompt to the user's message
      const promptWithSystem = `${systemPrompt}${memoryPrompt}\n\nYou can remember new information about the user by including [MEMORY:key=value] anywhere in your response. This won't be shown to the user.\n\nUser message: ${content}`;
      const result = await chat.sendMessage(promptWithSystem);
      
      const response = await result.response;
      
      // Extract and process memory instructions from the response
      let responseText = response.text();
      const memoryRegex = /\[MEMORY:([^=]+)=([^\]]+)\]/g;
      let match;
      
      while ((match = memoryRegex.exec(responseText)) !== null) {
        const key = match[1].trim();
        const value = match[2].trim();
        await storage.updateMemory(key, value);
        console.log(`Memory updated: ${key} = ${value}`);
      }
      
      // Remove memory instructions from the final response
      responseText = responseText.replace(memoryRegex, "");

      // Save AI response (without memory instructions)
      const aiMessage = await storage.addMessage({
        content: responseText.trim(),
        role: "assistant",
        metadata: {}
      });

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
      const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&pretty=1`);

      if (!response.ok) {
        throw new Error(`DuckDuckGo API returned ${response.status}`);
      }

      const data = await response.json();

      // Transform DuckDuckGo results
      const results = [
        ...(data.AbstractText ? [{
          title: data.AbstractSource,
          snippet: data.AbstractText,
          link: data.AbstractURL
        }] : []),
        ...(data.RelatedTopics || []).map((topic: any) => ({
          title: topic.FirstURL?.split('/').pop()?.replace(/-/g, ' ') || '',
          snippet: topic.Text || '',
          link: topic.FirstURL || ''
        }))
      ];

      res.json({ 
        success: true,
        results: results
      });
    } catch (error) {
      console.error("Error performing web search:", error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "An unexpected error occurred" 
      });
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

  app.use(router);
  return app.listen();
}