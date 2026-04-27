// MeetMind - Audio Transcription Endpoint
// Primary: Groq Whisper (ultra-fast, high quota) + Groq LLM (speaker labeling)
// Fallback: Gemini 2.5 Flash multimodal
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import fs from 'fs';
import path from 'path';
import os from 'os';

export const maxDuration = 120;
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb', // Base64 overhead for 24.5MB audio is ~33MB
    },
  },
};

function initAI() {
  const genAI = process.env.GEMINI_API_KEY 
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
  const groq = process.env.GROQ_API_KEY 
    ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;
  return { genAI, groq };
}

const GEMINI_TRANSCRIBE_PROMPT = `You are a professional audio transcription AI. Transcribe this audio recording into text with perfect accuracy.

CRITICAL RULES:
1. Identify each distinct speaker by their voice. Label them Speaker 1, Speaker 2, etc.
2. If a speaker's name is mentioned, include it: Speaker 1 (John)
3. Format each line as: "Speaker N: [exact words they said]"
4. Include EVERY word spoken. Do NOT summarize.
5. Insert approximate timestamp markers every 3-5 minutes as [MM:SS] on their own line.
6. The audio may contain multiple languages including Hindi, Bhojpuri, Kannada, Telugu, and English. Transcribe ALL words exactly as spoken in their original language. Do NOT translate.
7. Do NOT add any commentary, headers, or metadata. ONLY output the transcript.

Now transcribe the provided audio:`;

const GROQ_SPEAKER_PROMPT = `You are a professional transcript editor. I will provide a raw audio transcript that currently has NO speaker labels.
Your job is to read the conversation flow and add speaker labels (Speaker 1, Speaker 2, etc.) to the text.

CRITICAL RULES:
1. Identify when the speaker changes based on the natural flow of conversation, questions and answers, and context.
2. Format each spoken segment as "Speaker N: [their words]".
3. If someone is explicitly called by name (e.g., "Thanks John"), use their name: "Speaker 1 (John):". Do NOT guess or invent names.
4. Do NOT change, summarize, or omit ANY of the original words. Keep the exact text.
5. The transcript may contain multiple languages (Hindi, Bhojpuri, Kannada, Telugu, English). Preserve all languages exactly as written. Do NOT translate.
6. Do NOT add any introductory text, commentary, or markdown formatting. Just output the labeled transcript.

RAW TRANSCRIPT:
{transcript}`;

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { genAI, groq } = initAI();

    if (!genAI && !groq) {
      return res.status(503).json({ error: 'No AI providers configured. Please set GEMINI_API_KEY and GROQ_API_KEY.' });
    }

    const { audioBase64, mimeType, sessionId, language } = req.body;

    if (!audioBase64 || typeof audioBase64 !== 'string') {
      return res.status(400).json({ error: 'Audio data is missing or invalid.' });
    }

    // Validate sessionId format
    if (sessionId && !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sessionId)) {
      return res.status(400).json({ error: 'Invalid session ID format.' });
    }

    // Check audio size (~25MB max for Groq)
    const estimatedSizeMB = (audioBase64.length * 0.75) / (1024 * 1024);
    if (estimatedSizeMB > 24.5) {
      return res.status(413).json({ 
        error: `Audio file is too large (${estimatedSizeMB.toFixed(1)}MB). Maximum is ~24.5MB. Please compress the audio.`,
        sizeMB: estimatedSizeMB.toFixed(1)
      });
    }

    let finalTranscript = null;
    let speakers = [];
    let lastErrorStatus = 500;
    let tmpFilePath = null;

    // ==========================================
    // 1. PRIMARY PATH: Groq Whisper
    // ==========================================
    if (groq) {
      try {
        console.log("Attempting transcription via Groq Whisper...");
        
        // Write base64 to temp file for Groq SDK
        const buffer = Buffer.from(audioBase64, 'base64');
        const ext = mimeType ? mimeType.split('/')[1].split(';')[0] : 'mp3';
        tmpFilePath = path.join(os.tmpdir(), `meetmind-audio-${Date.now()}.${ext}`);
        await fs.promises.writeFile(tmpFilePath, buffer);

        const transcription = await groq.audio.transcriptions.create({
          file: fs.createReadStream(tmpFilePath),
          model: 'whisper-large-v3-turbo',
          response_format: 'text',
          temperature: 0.0,
          language: language || undefined
        });

        // Clean up temp file
        await fs.promises.unlink(tmpFilePath).catch(() => {});
        tmpFilePath = null;

        if (transcription && transcription.trim().length > 20) {
          // Post-process to add speaker labels using Groq LLM
          console.log("Groq Whisper successful. Adding speaker labels via Groq LLM...");
          const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: GROQ_SPEAKER_PROMPT.replace('{transcript}', transcription) }],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.1
          });
          
          finalTranscript = completion.choices[0]?.message?.content || transcription;
        }

      } catch (err) {
        console.error("Groq Whisper failed:", { status: err.status, message: err.message, code: err.error?.error?.code || err.error?.code });
        if (tmpFilePath) {
          await fs.promises.unlink(tmpFilePath).catch(() => {});
        }
        if (err.status === 429) lastErrorStatus = 429;
        if (err.status === 401 || err.status === 403) lastErrorStatus = err.status;
      }
    }

    // ==========================================
    // 2. FALLBACK PATH: Gemini Multimodal
    // ==========================================
    if (!finalTranscript && genAI) {
      console.log("Falling back to Gemini Multimodal...");
      
      try {
        // Use the updated gemini-2.5-flash model
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const result = await model.generateContent({
          contents: [{
            role: 'user',
            parts: [
              { inlineData: { mimeType: mimeType || 'audio/mp3', data: audioBase64 } },
              { text: GEMINI_TRANSCRIBE_PROMPT }
            ]
          }],
          generationConfig: { temperature: 0.1 }
        });

        const transcript = result.response.text();
        if (transcript && transcript.trim().length > 20) {
          finalTranscript = transcript;
          console.log("Gemini Multimodal successful.");
        }

      } catch (err) {
        console.error("Gemini fallback failed:", { status: err.status, message: err.message });
        if (err.status === 429 || (err.message && err.message.includes('429'))) lastErrorStatus = 429;
        if (err.status === 401 || err.status === 403 || err.status === 404 || (err.message && err.message.includes('403'))) lastErrorStatus = err.status || 403;
      }
    }

    // ==========================================
    // 3. FINALIZE & EXTRACT
    // ==========================================
    if (!finalTranscript || finalTranscript.trim().length < 20) {
      // If we hit a rate limit on the last attempt, return 429 explicitly
      if (lastErrorStatus === 429) {
        return res.status(429).json({ error: 'AI_RATE_LIMIT' });
      }
      if (lastErrorStatus === 401 || lastErrorStatus === 403) {
        return res.status(lastErrorStatus).json({ error: 'API key is invalid or quota exceeded. Please check your keys.' });
      }
      return res.status(500).json({ error: 'Audio transcription failed on all available AI models. Please try again.' });
    }

    // Extract speakers
    const speakerPattern = /^(Speaker \d+(?:\s*\([^)]+\))?)\s*:/gm;
    const speakerSet = new Set();
    let match;
    while ((match = speakerPattern.exec(finalTranscript)) !== null) {
      speakerSet.add(match[1].trim());
    }
    speakers = Array.from(speakerSet);

    return res.status(200).json({
      transcript: finalTranscript.trim(),
      speakers,
      sessionId: sessionId || null,
      _provider: groq && finalTranscript ? 'groq' : 'gemini'
    });

  } catch (error) {
    console.error("Transcription Server Error:", error);
    return res.status(500).json({ error: 'Internal server error during transcription.' });
  }
}
