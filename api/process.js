// MeetMind - AI Analysis Endpoint (Chunk 05 — Rewrite v2)
// Takes text transcript → returns structured meeting analysis JSON
// Audio handling moved to /api/transcribe.js
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

export const maxDuration = 60;
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
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

// Prompt injection defense — strip known attack patterns
function sanitizeTranscript(text) {
  if (!text || typeof text !== 'string') return '';
  let clean = text;
  const patterns = [
    /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|rules?)/gi,
    /system\s*:\s*/gi,
    /\[INST\]/gi,
    /\[\/INST\]/gi,
    /<\|.*?\|>/g,
    /you\s+are\s+now/gi,
    /new\s+instructions?\s*:/gi,
    /override\s+(all|previous|system)/gi,
    /forget\s+(everything|all|previous)/gi,
    /act\s+as\s+/gi,
    /pretend\s+(to\s+be|you\s+are)/gi,
    /do\s+not\s+follow/gi,
    /disregard\s+(all|the|previous)/gi,
  ];
  patterns.forEach(p => { clean = clean.replace(p, '[filtered]'); });
  // Also strip HTML tags
  clean = clean.replace(/<[^>]*>?/gm, '');
  return clean;
}

const PROMPT_TEMPLATE = `You are a meeting analysis AI. Analyze this meeting transcript.

{attendee_instruction}

TRANSCRIPT:
{transcript_text}

Extract in valid JSON:

{
  "meeting_summary": "3-sentence executive summary",
  "meeting_type": "standup|brainstorm|decision|check-in|general",
  "host": "name of the person who organized/led the meeting",
  "health_score": {
    "score": 1-10,
    "reasoning": "why this score"
  },
  "decisions_made": ["decision 1", "decision 2"],
  "unresolved_questions": ["question 1", "question 2"],
  "topics_not_discussed": ["what should have been covered but was not"],
  "attendees": [
    {
      "name": "Person Name",
      "action_items": [
        {
          "task": "specific task description",
          "priority": "urgent|important|normal",
          "deadline": "extracted deadline or null",
          "depends_on": "name of person they coordinate with or null",
          "source_quote": "exact quote from transcript proving this attribution"
        }
      ],
      "talk_percentage": 25,
      "key_quotes": ["important thing they said"],
      "questions_asked": 3
    }
  ],
  "follow_up_suggestions": ["suggested follow-up topic 1"]
}

RULES:
1. Extract ONLY what was actually said. Never infer or hallucinate.
2. Every action item MUST have a source_quote from the transcript.
3. Attribute tasks to specific people, not "the team" or "everyone".
4. If a deadline is implied ("by Friday", "end of week"), convert to actual date.
5. Be specific, not generic. "Write the introduction section" not "work on the project".
6. If no action items exist, set empty array. Do NOT invent fake tasks.
7. Deduplicate: never list the same task twice for the same person.
8. Handle mixed languages (Hindi+English, etc.) naturally.
10. If a speaker is labeled like "Speaker 1 (Ravi)", use "Ravi" as their name, or "Speaker 1 (Ravi)" if you're unsure about the full name.
11. Detect the meeting HOST — the person who speaks first, sets the agenda, or manages transitions. If unclear, pick the most active speaker.`;

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { genAI, groq } = initAI();

    if (!genAI && !groq) {
      return res.status(503).json({ error: 'No AI providers configured.' });
    }

    const { transcript, attendees, sessionId } = req.body;

    // Validate transcript
    if (!transcript || typeof transcript !== 'string' || transcript.trim().length < 50) {
      return res.status(400).json({ error: 'Transcript is too short or invalid. Minimum 50 characters required.' });
    }

    // Validate sessionId format
    if (sessionId && !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sessionId)) {
      return res.status(400).json({ error: 'Invalid session ID format.' });
    }

    // Sanitize transcript against prompt injection + HTML
    const cleanTranscript = sanitizeTranscript(transcript);

    // Build attendee instruction — OPTIONAL now
    let attendeeInstruction;
    if (attendees && Array.isArray(attendees) && attendees.length > 0) {
      const cleanAttendees = attendees.map(a => String(a).replace(/<[^>]*>?/gm, '').trim()).filter(Boolean);
      attendeeInstruction = `KNOWN ATTENDEES: ${cleanAttendees.join(', ')}\nUse these names for the attendees array. If you detect additional speakers not in this list, add them too.`;
    } else {
      attendeeInstruction = `ATTENDEES: Auto-detect all speakers from the transcript. Use their names if mentioned (e.g., "Speaker 1 (Ravi)" → name is "Ravi"). If no name is mentioned, keep labels like "Speaker 1", "Speaker 2", etc.`;
    }

    const prompt = PROMPT_TEMPLATE
      .replace('{attendee_instruction}', attendeeInstruction)
      .replace('{transcript_text}', cleanTranscript);

    let parsedResult = null;
    let lastErrorStatus = 500;

    // ==========================================
    // 1. PRIMARY PATH: Groq (30 RPM, fast, text-only)
    // ==========================================
    if (groq) {
      try {
        console.log("Attempting analysis via Groq...");
        const completion = await groq.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: 'llama-3.3-70b-versatile',
          temperature: 0.2,
          response_format: { type: 'json_object' }
        });
        const text = completion.choices[0].message.content;
        parsedResult = JSON.parse(text);
        parsedResult._provider = 'groq';
      } catch (groqError) {
        console.error("Groq analysis failed:", { status: groqError.status, message: groqError.message, code: groqError.error?.error?.code || groqError.error?.code });
        if (groqError.status === 429) lastErrorStatus = 429;
        if (groqError.status === 401 || groqError.status === 403) lastErrorStatus = groqError.status;
      }
    }

    // ==========================================
    // 2. FALLBACK PATH: Gemini 2.5 Flash
    // ==========================================
    if (!parsedResult && genAI) {
      try {
        console.log("Falling back to Gemini 2.5 Flash...");
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
          }
        });
        const text = result.response.text();
        parsedResult = JSON.parse(text);
        parsedResult._provider = 'gemini';
      } catch (geminiError) {
        console.error("Gemini analysis failed:", { status: geminiError.status, message: geminiError.message });
        if (geminiError.status === 429 || (geminiError.message && geminiError.message.includes('429'))) lastErrorStatus = 429;
        if (geminiError.status === 401 || geminiError.status === 403 || geminiError.status === 404 || (geminiError.message && geminiError.message.includes('403'))) lastErrorStatus = geminiError.status || 403;
      }
    }

    // ==========================================
    // 3. FINALIZE
    // ==========================================
    if (!parsedResult) {
      if (lastErrorStatus === 429) {
        return res.status(429).json({ error: 'AI_RATE_LIMIT' });
      }
      if (lastErrorStatus === 401 || lastErrorStatus === 403) {
        return res.status(lastErrorStatus).json({ error: 'API key is invalid or quota exceeded. Please check your keys.' });
      }
      return res.status(500).json({ error: 'AI processing failed. Both Gemini and Groq are unavailable. Please try again later.' });
    }

    // Structural validation
    if (!parsedResult.meeting_summary || !parsedResult.attendees || !Array.isArray(parsedResult.attendees)) {
      return res.status(500).json({ error: 'AI returned malformed JSON structure. Please try again.' });
    }

    parsedResult._sessionId = sessionId || null;
    return res.status(200).json(parsedResult);

  } catch (error) {
    console.error("Analysis Server Error:", error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
