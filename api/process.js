// MeetMind - Serverless API Engine (Chunk 05)
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

// Initialize SDKs lazily to avoid crashing if one key is missing during build
let genAI = null;
let groq = null;

const initAI = () => {
  if (!genAI && process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  if (!groq && process.env.GROQ_API_KEY) {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
};

const PROMPT_TEMPLATE = `You are a meeting analysis AI. Analyze this transcript.

ATTENDEES: {attendee_names}

TRANSCRIPT:
{transcript_text}

Extract in valid JSON:

{
  "meeting_summary": "3-sentence executive summary",
  "meeting_type": "standup|brainstorm|decision|check-in|general",
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
8. Handle mixed languages (Hindi+English, etc.) naturally.`;

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    initAI();

    const { transcript, attendees } = req.body;

    // Validation
    if (!transcript || typeof transcript !== 'string' || transcript.trim().length < 50) {
      if (!transcript.includes('[AUDIO_UPLOADED:')) {
        return res.status(400).json({ error: 'Transcript is too short or invalid. Minimum 50 characters required.' });
      }
    }

    if (!attendees || !Array.isArray(attendees) || attendees.length === 0) {
      return res.status(400).json({ error: 'At least one attendee is required.' });
    }

    // Strip HTML tags for safety
    const cleanTranscript = transcript.replace(/<[^>]*>?/gm, '');
    const cleanAttendees = attendees.map(a => String(a).replace(/<[^>]*>?/gm, ''));

    const prompt = PROMPT_TEMPLATE
      .replace('{attendee_names}', cleanAttendees.join(', '))
      .replace('{transcript_text}', cleanTranscript);

    let parsedResult = null;

    // Try Gemini First
    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
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
        console.error("Gemini failed:", geminiError);
        parsedResult = null; // Proceed to fallback
      }
    }

    // Fallback to Groq if Gemini fails or is not configured
    if (!parsedResult && groq) {
      try {
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
        console.error("Groq failed:", groqError);
      }
    }

    // If both failed or parsedResult is still null
    if (!parsedResult) {
      return res.status(500).json({ error: 'AI processing failed. Please try again later.' });
    }

    // Basic structural validation
    if (!parsedResult.meeting_summary || !parsedResult.attendees) {
       return res.status(500).json({ error: 'AI returned malformed JSON structure.' });
    }

    return res.status(200).json(parsedResult);

  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
