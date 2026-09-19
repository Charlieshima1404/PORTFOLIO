import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';

app.use(express.json({ limit: '2mb' }));

// Lazy initialization of Gemini client
let aiClient = null;
function getAIClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Chat API endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history = [], context = '', systemPrompt = '' } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required.' });
    }

    let ai;
    try {
      ai = getAIClient();
    } catch (err) {
      console.warn('[Gemini API] Client initialization warning:', err.message);
      return res.status(200).json({
        reply: "I'm currently unable to access my AI engine because the GEMINI_API_KEY is not configured yet. Please attach your Gemini API key in Settings > Secrets.",
      });
    }

    // Build system instruction with strict portfolio grounding
    const finalSystemPrompt = systemPrompt
      ? `${systemPrompt}\n\nStrict Grounding: Answer questions using ONLY the portfolio data provided. Never invent qualifications, projects, technologies, or background details not present in the data. If the answer is unknown or not in the portfolio, politely advise the visitor that it is not in the portfolio and suggest contacting Anghela Aliza directly.`
      : `You are charlie V.1, Anghela Aliza's personal AI portfolio assistant!
Your job is to answer questions about Anghela's background, education, skills, experience, projects, artwork, and contact information based ONLY on the provided portfolio data.

Strict Grounding Rules:
- Answer using ONLY the portfolio data provided below.
- Do not invent qualifications, projects, experience, education, artwork, awards, or personal information not in the data.
- If the requested information is not available in the portfolio data, politely state that it's not included and suggest contacting Anghela directly.
- Keep answers clear, friendly, and concise.

Portfolio Data:
${context}`;

    // Convert conversation history into Gemini format
    const contents = [];

    // Filter and sanitize past turns (excluding the current user message if it's already at the end)
    const pastTurns = Array.isArray(history) ? [...history] : [];
    if (
      pastTurns.length > 0 &&
      pastTurns[pastTurns.length - 1].role === 'user' &&
      pastTurns[pastTurns.length - 1].content === message
    ) {
      pastTurns.pop();
    }

    for (const turn of pastTurns) {
      if (!turn.content) continue;
      const role = turn.role === 'assistant' ? 'model' : 'user';
      // Ensure alternating roles for Gemini
      if (contents.length > 0 && contents[contents.length - 1].role === role) {
        contents[contents.length - 1].parts[0].text += `\n${turn.content}`;
      } else {
        contents.push({
          role,
          parts: [{ text: turn.content }],
        });
      }
    }

    // Ensure the turns start with a user turn if history exists
    while (contents.length > 0 && contents[0].role !== 'user') {
      contents.shift();
    }

    // Append the latest user message
    if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
      contents[contents.length - 1].parts[0].text = message;
    } else {
      contents.push({
        role: 'user',
        parts: [{ text: message }],
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction: finalSystemPrompt,
        temperature: 0.7,
      },
    });

    const reply = response.text || "I'm sorry, I couldn't generate a response. Please try again.";

    // Optional safe navigation suggestion matching the portfolio sections
    let actionLabel = null;
    let actionTarget = null;
    const lower = (message + ' ' + reply).toLowerCase();

    if (lower.includes('view projects') || (lower.includes('project') && !lower.includes('artwork'))) {
      actionLabel = 'VIEW PROJECTS →';
      actionTarget = 'projects';
    } else if (lower.includes('view skills') || lower.includes('skill') || lower.includes('tech stack')) {
      actionLabel = 'VIEW SKILLS →';
      actionTarget = 'skills';
    } else if (lower.includes('view artwork') || lower.includes('creative work') || lower.includes('artwork') || lower.includes('drawing')) {
      actionLabel = 'VIEW ARTWORK →';
      actionTarget = 'creative-works';
    } else if (lower.includes('view education') || lower.includes('education') || lower.includes('school') || lower.includes('university') || lower.includes('degree')) {
      actionLabel = 'VIEW EDUCATION →';
      actionTarget = 'education';
    } else if (lower.includes('view experience') || lower.includes('experience') || lower.includes('internship')) {
      actionLabel = 'VIEW EXPERIENCE →';
      actionTarget = 'experience';
    } else if (lower.includes('view contact') || lower.includes('contact') || lower.includes('reach out') || lower.includes('email me') || lower.includes('get in touch')) {
      actionLabel = 'VIEW CONTACT →';
      actionTarget = 'contact';
    }

    res.json({
      reply,
      actionLabel,
      actionTarget,
    });
  } catch (error) {
    console.error('[Gemini API] Error in /api/chat:', error);

    // Detect 429 / RESOURCE_EXHAUSTED quota/capacity errors
    const isQuota =
      error?.status === 429 ||
      error?.statusCode === 429 ||
      error?.code === 429 ||
      error?.code === 'RESOURCE_EXHAUSTED' ||
      error?.error?.code === 429 ||
      error?.error?.status === 'RESOURCE_EXHAUSTED' ||
      error?.response?.status === 429 ||
      (typeof error?.message === 'string' &&
        (error.message.includes('429') ||
         error.message.includes('RESOURCE_EXHAUSTED') ||
         error.message.toLowerCase().includes('quota') ||
         error.message.toLowerCase().includes('rate limit') ||
         error.message.toLowerCase().includes('too many requests')));

    if (isQuota) {
      return res.status(200).json({
        reply: "Sorry Choom, my usage capacity has reached its current limit. My creator hasn't upgraded my capacity yet due to budget. For now, I'm going to sleep. Please wait until my capacity recharges and try again.",
        isQuotaExceeded: true,
      });
    }

    res.status(500).json({
      error: 'An error occurred while communicating with the AI service.',
      reply: "I encountered an error processing your request. Please try again in a moment.",
    });
  }
});

// Paths to social preview images
const HERO_IMAGE_PATH = path.join(__dirname, 'assets', 'images', 'hero-bg.jpg');
const COVER_IMAGE_PATH = path.join(__dirname, 'assets', 'images', 'coverpg.png');

// Explicit handler for coverpg.png social media preview image requests
function serveCoverImage(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.sendStatus(204);
  }

  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Type, ETag');
  res.setHeader('Content-Disposition', 'inline; filename="coverpg.png"');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  res.sendFile(COVER_IMAGE_PATH, (err) => {
    if (err && !res.headersSent) {
      console.error('Error serving coverpg.png:', err);
      res.status(500).send('Image could not be served');
    }
  });
}

// Support direct image requests and common URL variants from social crawlers
app.all([
  '/assets/images/coverpg.png',
  '/assets/images/coverpg.PNG',
  '/images/coverpg.png',
  '/coverpg.png'
], serveCoverImage);

// Explicit handler for hero-bg.jpg social media preview image requests
function serveHeroImage(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.sendStatus(204);
  }

  res.setHeader('Content-Type', 'image/jpeg');
  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Type, ETag');
  res.setHeader('Content-Disposition', 'inline; filename="hero-bg.jpg"');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  res.sendFile(HERO_IMAGE_PATH, (err) => {
    if (err && !res.headersSent) {
      console.error('Error serving hero-bg.jpg:', err);
      res.status(500).send('Image could not be served');
    }
  });
}

// Support direct image requests and common URL variants from social crawlers
app.all([
  '/assets/images/hero-bg.jpg',
  '/assets/images/hero-bg.jpeg',
  '/assets/images/hero-bg.JPG',
  '/assets/images/hero-bg.JPEG',
  '/images/hero-bg.jpg',
  '/hero-bg.jpg'
], serveHeroImage);

// Serve static assets with CORS and caching
app.use('/assets', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
}, express.static(path.join(__dirname, 'assets'), {
  maxAge: '1d',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', 'inline');
    } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Content-Disposition', 'inline');
    }
  }
}));

// Serve remaining static files (css, js, etc.)
app.use(express.static(__dirname));

// Serve index.html for root and SPA routes
app.get(['/', '/index.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Fallback for any client-side routes (protecting /assets from returning HTML)
app.get('*', (req, res) => {
  if (req.path.startsWith('/assets/')) {
    return res.status(404).send('Asset not found');
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`Portfolio server listening on http://${HOST}:${PORT}`);
});

