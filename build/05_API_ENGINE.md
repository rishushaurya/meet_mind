# Chunk 05: API Engine (The AI Brain)

> **Goal**: Build serverless API + frontend processor + demo mode with mock data.
> **Time**: 40-50 minutes
> **Dependencies**: Chunk 03 (app.js + utils.js)
> **Unlocks**: Chunk 06

---

## Files to Create

### api/process.js -- Vercel Serverless Function

```javascript
// This is the ONLY file that touches API keys.
// It runs on Vercel's servers, never in the browser.

Responsibilities:
1. Accept POST request with: { transcript, attendees, inputMethod }
2. Validate input:
   - transcript must be string, min 50 chars
   - attendees must be array of strings
   - Strip HTML tags from transcript
3. Build the Gemini prompt (exact template from IMPLEMENTATION_PLAN.md)
4. Call Gemini 2.0 Flash:
   - Use @google/generative-ai SDK
   - Set generationConfig: { responseMimeType: "application/json" }
   - Set temperature: 0.2 (deterministic)
   - Send prompt
5. Validate response:
   - Parse JSON
   - Check required fields exist (meeting_summary, attendees, health_score)
   - Check attendees array has action_items
6. If Gemini fails (error, timeout, invalid JSON):
   - Log error (server-side only)
   - Auto-fallback to Groq:
     - Use groq-sdk
     - Same prompt, model: "llama-3.3-70b-versatile"
     - response_format: { type: "json_object" }
   - If Groq also fails: return error response
7. Return JSON response to frontend

Error responses:
- 400: Invalid input (missing transcript, too short)
- 500: Both AI providers failed
- 429: Rate limited (retry after header)

Headers:
- Access-Control-Allow-Origin: same origin
- Content-Type: application/json
```

### js/processor.js -- Frontend API Layer

```
Responsibilities:
1. processTranscript(transcript, attendees) -- main function
2. Check if demo mode (isDemoMode flag):
   - If demo: return mock response from demo.js immediately
   - If not: POST to /api/process
3. API call:
   - POST /api/process with JSON body
   - 30 second timeout (AbortController)
   - On timeout: retry once
   - On success: validate JSON, return parsed data
   - On error: show user-friendly toast
4. Loading state management:
   - Show loading view with step updates
   - Steps: "Reading transcript...", "Identifying speakers...", "Extracting action items...", "Building your cards..."
   - Each step shows for ~3-5 seconds (or actual processing time)
5. Error handling:
   - Network error: "Connection failed. Check your internet."
   - Timeout: "Taking longer than expected. Retrying..."
   - 429: "Too many requests. Please wait a moment."
   - 500: "AI processing failed. Try again or use demo mode."
   - Parse error: "Received unexpected response. Retrying..."

Functions:
  processTranscript(transcript, attendees) -> Promise<result>
  callAPI(transcript, attendees) -> Promise<response>
  handleAPIError(error) -> void
  showLoadingStep(stepIndex) -> void
```

### js/demo.js -- Demo Transcripts + Mock Responses

```
Must contain 3 complete demo datasets, each with:
1. Full transcript text (realistic, 20-30 lines of dialogue)
2. Attendee names array
3. Complete mock JSON response matching the exact schema

Demo 1: College Hackathon Planning
Transcript example:
  "Rahul: Alright, so we need to finalize our hackathon project. I think I should handle the backend API since I've been working with Node.js.
  Priya: That works. I'll take the frontend -- I can use React or maybe just vanilla JS to keep it simple.
  Amit: I'll build the ML model. I need the dataset by Wednesday though. Rahul, can you set up the data pipeline?
  Sneha: I'll handle the presentation and the README. But we need to decide which API to use for the AI part.
  Rahul: Let's go with Gemini -- it has the best free tier. I'll set it up by Thursday.
  Priya: Sounds good. I need the API endpoints documented before the weekend so I can connect the frontend.
  Amit: What about the dataset? Are we using the Kaggle one or generating our own?
  Sneha: I think Kaggle is faster. Let's not waste time on that.
  Rahul: Agreed. Amit, grab the Kaggle dataset and preprocess it by Wednesday.
  Priya: One more thing -- should we deploy on Vercel or Render?
  Sneha: Vercel is easier. Rahul, can you handle deployment too?
  Rahul: Sure, I'll set up Vercel after the backend is ready."

Mock response: Full JSON with per-person action items, health score 8/10, etc.

Demo 2: Startup Standup
(Similar structure, 3 people, dependencies, conflict, health score 6/10)

Demo 3: Internship Check-in
(Similar structure, 2 people, simple tasks, health score 9/10)

Each mock response MUST match the exact JSON schema from IMPLEMENTATION_PLAN.md.
Include realistic source_quotes that match lines from the transcript.

Functions:
  getDemoTranscripts() -> array of { id, title, transcript, attendees }
  getDemoResponse(demoId) -> mock JSON response
  isDemoId(id) -> boolean
```

---

## Verification

1. **Demo mode**: Click demo button on landing -> transcript loads -> process -> mock results display. No API call made.
2. **Real API** (with Gemini key): Paste real transcript -> get real AI response.
3. **Fallback test**: Set invalid GEMINI_API_KEY in .env -> process transcript -> Groq handles it successfully.
4. **Error test**: Disconnect internet -> process transcript -> friendly error message shown.
5. **Timeout test**: Results arrive within 30 seconds for a 500-word transcript.
6. **Loading states**: Progress steps appear and update during processing.
7. **Network tab**: No API keys visible in browser requests. Only POST to /api/process.
