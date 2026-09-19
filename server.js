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

// Helper to pause execution with a Promise
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper to determine if an error is a permanent/client error (must never be retried)
function isPermanentClientError(error) {
  const status = error?.status || error?.statusCode || error?.code || error?.error?.code || error?.response?.status;
  if (typeof status === 'number' && status >= 400 && status < 500 && status !== 408 && status !== 429) {
    return true;
  }
  const msg = typeof error?.message === 'string' ? error.message.toLowerCase() : '';
  if (
    msg.includes('api_key_invalid') ||
    msg.includes('invalid_argument') ||
    msg.includes('not_found') ||
    msg.includes('permission_denied') ||
    msg.includes('model not found') ||
    msg.includes('invalid model') ||
    msg.includes('unknown model')
  ) {
    return true;
  }
  return false;
}

// Helper to determine if an error is a daily quota or account capacity exhaustion
function isQuotaExhaustedError(error) {
  const status = error?.status || error?.statusCode || error?.code || error?.error?.code || error?.response?.status;
  const statusStr = String(error?.error?.status || error?.statusText || '');
  const msg = typeof error?.message === 'string' ? error.message.toLowerCase() : '';

  return (
    status === 429 ||
    statusStr === 'RESOURCE_EXHAUSTED' ||
    msg.includes('429') ||
    msg.includes('resource_exhausted') ||
    msg.includes('quota') ||
    msg.includes('rate limit') ||
    msg.includes('too many requests') ||
    msg.includes('capacity') ||
    msg.includes('billing') ||
    msg.includes('per day')
  );
}

// Helper to determine if a quota error is explicitly a daily limit / budget exhaustion that shouldn't be retried
function isDailyOrHardQuotaLimit(error) {
  const msg = typeof error?.message === 'string' ? error.message.toLowerCase() : '';
  return (
    msg.includes('daily') ||
    msg.includes('per day') ||
    msg.includes('perday') ||
    msg.includes('quota exceeded') ||
    msg.includes('exceeded your current quota') ||
    msg.includes('billing') ||
    msg.includes('free_tier') ||
    msg.includes('freetier') ||
    msg.includes('budget')
  );
}

// Helper to determine if an error is a transient/temporary error eligible for retry
function isTransientGeminiError(error) {
  if (isPermanentClientError(error)) {
    return false;
  }
  if (isDailyOrHardQuotaLimit(error)) {
    return false;
  }

  const status = error?.status || error?.statusCode || error?.code || error?.error?.code || error?.response?.status;
  const statusStr = String(error?.error?.status || error?.statusText || '');
  const msg = typeof error?.message === 'string' ? error.message.toLowerCase() : '';

  // 503 Service Unavailable / UNAVAILABLE / High demand spikes
  if (
    status === 503 ||
    statusStr === 'UNAVAILABLE' ||
    msg.includes('503') ||
    msg.includes('unavailable') ||
    msg.includes('high demand') ||
    msg.includes('spikes in demand') ||
    msg.includes('overloaded') ||
    msg.includes('service unavailable')
  ) {
    return true;
  }

  // 408 / DEADLINE_EXCEEDED / Timeout
  if (
    status === 408 ||
    statusStr === 'DEADLINE_EXCEEDED' ||
    msg.includes('408') ||
    msg.includes('deadline_exceeded') ||
    msg.includes('timeout')
  ) {
    return true;
  }

  // Other transient 5xx errors (500, 502, 504) or network failures
  if (
    (typeof status === 'number' && status >= 500 && status <= 599) ||
    statusStr === 'INTERNAL' ||
    msg.includes('500') ||
    msg.includes('502') ||
    msg.includes('504') ||
    msg.includes('bad gateway') ||
    msg.includes('gateway timeout') ||
    msg.includes('econnreset') ||
    msg.includes('etimedout') ||
    msg.includes('fetch failed')
  ) {
    return true;
  }

  // Temporary rate spike 429 that is NOT a hard daily quota
  if (status === 429 || msg.includes('429') || msg.includes('too many requests')) {
    return true;
  }

  return false;
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

    // Retry handling for transient Gemini API failures
    const maxRetries = 3;
    const baseDelays = [1000, 2000, 4000]; // ~1s before retry 1, ~2s before retry 2, ~4s before retry 3
    let response = null;
    let lastError = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents,
          config: {
            systemInstruction: finalSystemPrompt,
            temperature: 0.7,
          },
        });
        // Succeeded on this attempt; break immediately to avoid any delay
        break;
      } catch (error) {
        lastError = error;
        const errStatus = error?.status || error?.statusCode || error?.code || error?.error?.code || 'unknown';
        const errSummary = typeof error?.message === 'string' ? error.message.slice(0, 100).replace(/[\r\n]+/g, ' ') : String(error);

        // 1. Permanent client errors (400, 401, 403, 404, invalid model) should NEVER be retried
        if (isPermanentClientError(error)) {
          console.warn(`[Gemini API] Permanent client error detected (status: ${errStatus}). Not retrying.`);
          break;
        }

        // 2. Hard daily quota or budget exhaustion should not waste multiple retries
        if (isDailyOrHardQuotaLimit(error)) {
          console.warn(`[Gemini API] Hard daily quota limit detected (status: ${errStatus}). Not retrying.`);
          break;
        }

        // 3. Transient Gemini API errors (503 / UNAVAILABLE, 408, 5xx, temporary rate spike)
        if (isTransientGeminiError(error) && attempt < maxRetries) {
          const jitter = Math.floor(Math.random() * 250); // 0-250ms random jitter
          const delayMs = baseDelays[attempt] + jitter;

          console.warn(
            `[Gemini API] Temporary error detected (status: ${errStatus}, summary: ${errSummary}). Attempt ${attempt + 1} failed. Retrying in ${delayMs}ms (retry ${attempt + 1}/${maxRetries})...`
          );
          await sleep(delayMs);
          continue;
        }

        if (attempt >= maxRetries) {
          console.error(`[Gemini API] All ${maxRetries} retry attempts exhausted for temporary failure (last status: ${errStatus}).`);
        }
        break;
      }
    }

    if (!response) {
      // Case B: Daily quota / RESOURCE_EXHAUSTED / usage capacity limit
      if (isQuotaExhaustedError(lastError)) {
        return res.status(200).json({
          reply: "Sorry Choom, my usage capacity has reached its current limit. My creator hasn't upgraded my capacity yet due to budget. For now, I'm going to sleep. Please wait until 3pm for me to recharges and try again.",
          isQuotaExceeded: true,
        });
      }

      // Case A: Temporary Gemini service unavailable (503 / UNAVAILABLE / transient 5xx)
      if (isTransientGeminiError(lastError) || (typeof lastError?.status === 'number' && lastError.status >= 500 && lastError.status <= 599)) {
        return res.status(200).json({
          reply: "Sorry Choom, Gemini is temporarily having trouble responding right now. Please try again in a little while.",
          isTemporaryUnavailable: true,
        });
      }

      // Case C: Permanent client / configuration error
      console.error('[Gemini API] Permanent or unhandled error in /api/chat:', lastError);
      return res.status(500).json({
        error: 'An error occurred while communicating with the AI service.',
        reply: "I encountered an error processing your request. Please try again in a moment.",
      });
    }

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
    console.error('[Gemini API] Unexpected error in /api/chat:', error);

    if (isQuotaExhaustedError(error)) {
      return res.status(200).json({
        reply: "Sorry Choom, my usage capacity has reached its current limit. My creator hasn't upgraded my capacity yet due to budget. For now, I'm going to sleep. Please wait until my capacity recharges and try again.",
        isQuotaExceeded: true,
      });
    }

    if (isTransientGeminiError(error)) {
      return res.status(200).json({
        reply: "Sorry Choom, Gemini is temporarily having trouble responding right now. Please try again in a little while.",
        isTemporaryUnavailable: true,
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

