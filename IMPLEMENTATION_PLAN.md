# MeetMind -- Implementation Plan v3.0

> Version: 3.0 | Date: 2026-04-23 | Status: Documentation Complete

---

## Project Identity

| Field | Value |
|-------|-------|
| **Name** | MeetMind |
| **Tagline** | The AI that remembers your meetings so you don't have to |
| **Challenge** | AI Foundry Hackathon -- Problem Statement 02 (The Meeting That Never Happened) |
| **Target Audience** | College students doing group project meetings |
| **Architecture** | Stateless SPA + Vercel Serverless + Gemini/Groq AI |

---

## Problem Statement Verification

Every requirement from Problem Statement 02 mapped to our solution:

| # | Requirement (Exact Words) | Our Solution | Status |
|---|---------------------------|-------------|--------|
| 1 | "Takes any meeting recording or transcript" | 4 input methods: paste text, upload audio/video, upload transcript file, live browser recording | COVERED |
| 2 | "Stays focused on what was actually said" | Gemini prompt: extract ONLY from transcript, never infer. Output includes source quotes. | COVERED |
| 3 | "Sends every attendee a clear message" | Per-person action cards + email preview simulation showing what each person receives | COVERED |
| 4 | "Within minutes of it ending" | Single API call, structured JSON. Processing: 5-15 seconds. | COVERED |
| 5 | "Exactly what they personally need to do next" | Action items attributed to specific people with priorities, deadlines, dependencies | COVERED |
| 6 | "Use a pre-recorded audio file or typed transcript" | Audio via Gemini multimodal, text via paste/upload | COVERED |
| 7 | "Assign action items to specific people -- not generic summary" | 3-tier attribution: speaker labels, user names, AI inference. Source quotes prove it. | COVERED |
| 8 | "Build a webpage, dashboard, app, or agent" | Full-stack web dashboard with results rendering | COVERED |

---

## Judging Criteria Alignment

| Criteria | Judge Question | How We Answer |
|----------|---------------|---------------|
| **Function** | Does it correctly extract who needs to do what? Specific or generic? | Each person gets their OWN card with THEIR action items, deadlines, dependencies. Source quotes prove attribution. |
| **Design** | Is the output something a person would actually read and act on? | Per-person cards with priority badges, one-click copy, WhatsApp export, email preview, PDF export. |
| **Innovation** | How did you solve the attribution problem? | 3-tier system: (1) Parse speaker labels, (2) User provides attendee names, (3) AI infers from context. Each action item has source_quote. |
| **Perspective** | What type of meeting did you design for? | College project teams -- students have meetings constantly with zero follow-through. Pre-loaded demos reflect this. |

---

## Features (F01-F18)

| # | Feature | How | Key Detail | Why It Matters |
|---|---------|-----|------------|----------------|
| F01 | Paste transcript text | Textarea with format hints | Auto-detects "Speaker:" prefixes | Fastest input method |
| F02 | Upload audio/video | File input accepts .mp3/.wav/.webm/.mp4 | Sent to Gemini multimodal API | Handles recorded meetings |
| F03 | Upload transcript files | Drag-drop zone for .txt/.srt | Parses SRT timestamps | Works with existing transcripts |
| F04 | Live browser recording | MediaRecorder + Web Speech API | Real-time captions, speaker tag buttons | Record meetings directly |
| F05 | AI speaker detection | 3-tier attribution system | Auto-detect, user input, AI inference | Core differentiator |
| F06 | Per-person action cards | Individual cards per attendee | Priority badges, deadlines, dependencies, source quotes | Not a generic summary |
| F07 | Meeting health score | AI rates 1-10 with reasoning | Animated counter display | Shows meeting productivity |
| F08 | Talk-time chart | Chart.js doughnut | Per-speaker percentage | Visual engagement metric |
| F09 | Email preview | Modal with formatted email | Per-person simulated email | Shows real-world output |
| F10 | Copy + PDF export | Clipboard API + html2pdf.js | One-click per card or all | Instant sharing |
| F11 | Demo transcripts | 3 pre-loaded scenarios | Mock JSON responses included | Instant judge demo |
| F12 | Editable preview | contenteditable div | Speaker label assignment UI | User correction before AI |
| F13 | AI fallback chain | Gemini -> Groq automatic | Show "backup AI" message | 99.9% uptime |
| F14 | Dark/light mode | CSS custom property swap | Toggle button | User preference |
| F15 | WhatsApp/Slack export | Formatted plain text | Bold names, dash items | Copy to group chat |
| F16 | Action checkboxes | Toggle done/pending | sessionStorage persistence | Track completion |
| F17 | Meeting type detection | AI auto-classifies | standup/brainstorm/decision/check-in | Contextual output |
| F18 | Topics not discussed | AI suggests gaps | What should have been covered | Proactive intelligence |

---

## System Architecture

```
  +------------------+     +------------------+     +------------------+
  |   BROWSER (SPA)  |     |  VERCEL SERVER   |     |   AI ENGINES     |
  |                  |     |   (Serverless)   |     |                  |
  |  Landing Page    |     |                  |     |  Gemini 2.0      |
  |       |          |     |  POST /api/      |     |  Flash (Primary) |
  |  Input Screen    | --> |  process         | --> |                  |
  |  (Paste/Upload/  |     |                  |     |  Groq Llama 3.3  |
  |   Record)        |     |  - Validate      |     |  70B (Fallback)  |
  |       |          |     |  - Sanitize      |     |                  |
  |  Transcript      |     |  - Build prompt  |     +------------------+
  |  Preview (Edit)  |     |  - Call Gemini   |
  |       |          |     |  - Fallback Groq |            |
  |  Dashboard       | <-- |  - Validate JSON | <----------+
  |  (Cards/Charts/  |     |  - Return result |     Structured JSON
  |   Export)        |     |                  |
  |                  |     +------------------+
  |  sessionStorage  |
  |  (UI state only) |
  +------------------+

  Web Speech API          API Keys in env vars        1M token context
  (client-side)           (never in frontend)         JSON mode output
  DOMPurify sanitize      CSP + CORS headers          Dedup + validate
```

---

## Gemini Structured Prompt Template

```
You are a meeting analysis AI. Analyze this transcript.

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
8. Handle mixed languages (Hindi+English, etc.) naturally.
```

---

## JSON Response Schema

| Field | Type | Description |
|-------|------|-------------|
| `meeting_summary` | string | 3-sentence executive summary |
| `meeting_type` | string | standup, brainstorm, decision, check-in, general |
| `health_score.score` | number | 1-10 productivity rating |
| `health_score.reasoning` | string | Why this score |
| `decisions_made` | string[] | List of decisions made |
| `unresolved_questions` | string[] | Open questions not resolved |
| `topics_not_discussed` | string[] | What should have been covered |
| `attendees[].name` | string | Person name |
| `attendees[].action_items[].task` | string | Specific task |
| `attendees[].action_items[].priority` | string | urgent, important, normal |
| `attendees[].action_items[].deadline` | string/null | Deadline or null |
| `attendees[].action_items[].depends_on` | string/null | Dependency person or null |
| `attendees[].action_items[].source_quote` | string | Exact transcript quote |
| `attendees[].talk_percentage` | number | % of talking time |
| `attendees[].key_quotes` | string[] | Notable quotes |
| `attendees[].questions_asked` | number | Questions they asked |
| `follow_up_suggestions` | string[] | Suggested follow-ups |

---

## All 21 Loopholes -- Solved

### Infrastructure (1-6)

| # | Loophole | Risk | Solution |
|---|----------|------|----------|
| 1 | API rate limits | 15 RPM, 15+ users = fail | Queue + Groq fallback (30 RPM). 1 call per meeting. |
| 2 | Long transcripts | Token limit exceeded | 1M token window. 2hr meeting = 25K tokens. Chunking fallback. |
| 3 | Hosting cold starts | Free hosting sleeps | Vercel serverless = no cold start. Static frontend. |
| 4 | Network timeout | Gemini takes too long | 30s timeout + retry + cached transcript locally. |
| 5 | Invalid JSON from LLM | Schema breaks | Validate response. Retry once stricter. Fallback to Groq. |
| 6 | AI service down | Single point of failure | Gemini -> Groq automatic failover. "Backup AI" message. |

### User Input (7-11)

| # | Loophole | Risk | Solution |
|---|----------|------|----------|
| 7 | No speaker labels | Can't attribute tasks | 3-tier: auto-detect prefixes, user names, AI inference. |
| 8 | Empty/garbage input | Blank or gibberish | Min 50 chars + word validation. Inline error. |
| 9 | Audio too large | Upload limits | 25MB max. Client-side transcription fallback for larger. |
| 10 | Unicode/special chars | Names, emojis | UTF-8 throughout. DOMPurify sanitization. |
| 11 | Browser compatibility | Web Speech API | Detect on load. Fallback notice. Upload-only mode. |

### Security (12-15)

| # | Loophole | Risk | Solution |
|---|----------|------|----------|
| 12 | API key exposure | Keys in browser | Serverless proxy. Env vars only. Never in frontend. |
| 13 | XSS/injection | Malicious transcript | DOMPurify + textContent + CSP headers. |
| 14 | Data privacy | Sensitive transcripts | Zero storage. In-memory only. sessionStorage. Privacy badge. |
| 15 | CORS issues | Cross-origin blocked | Same-origin Vercel. Explicit CORS backup headers. |

### Multi-User (16-17)

| # | Loophole | Risk | Solution |
|---|----------|------|----------|
| 16 | User collision | Shared state | 100% stateless. Each request self-contained. Impossible to collide. |
| 17 | Concurrent overload | Many users at once | Vercel auto-scales. Rate limit queue. |

### Edge Cases (18-21)

| # | Loophole | Risk | Solution |
|---|----------|------|----------|
| 18 | Transcript too short | 2 lines of text | Min length check. AI reports "no actions found" honestly. |
| 19 | Code-mixed languages | Hindi+English | Gemini multilingual native. Noted in prompt. |
| 20 | Duplicate action items | Same task twice | Dedup instruction in prompt + frontend dedup check. |
| 21 | No action items | Discussion-only meeting | "Discussion-only" report with summary. No fake tasks. |

---

## Security Hardening (7 Layers)

| Layer | What | How |
|-------|------|-----|
| 1 | Input Sanitization | DOMPurify on all inputs. Strip HTML. Validate length/format. |
| 2 | API Key Isolation | Vercel env vars only. Serverless proxy. Never in frontend/git. |
| 3 | Content Security Policy | CSP headers in vercel.json. Restrict script/style sources. |
| 4 | Zero Persistent Storage | In-memory processing. sessionStorage for UI. Cleared on tab close. |
| 5 | Rate Limiting | 5s client debounce. Vercel automatic limits. |
| 6 | HTTPS Only | Vercel enforces HTTPS by default. |
| 7 | Error Sanitization | Catch all. Generic user message. No stack traces exposed. |

---

## Build Phases

| Phase | What | Demo-Ready? |
|-------|------|-------------|
| P0 | Docs + Scaffolding | NO |
| P1 | UI/UX Design (all pages styled, no functionality) | Visual only |
| P2 | Core functionality (routing, inputs, API) | YES (paste + demo) |
| P3 | Full features (recording, exports, charts) | YES (all features) |
| P4 | Polish (animations, edge cases, mobile) | YES (competition-ready) |

---

## Demo Transcripts

### Demo 1: College Hackathon Planning (4 students)
- **Attendees**: Rahul, Priya, Amit, Sneha
- **Scenario**: Planning a hackathon project
- **Action items**: Rahul = backend, Priya = frontend, Amit = ML model, Sneha = presentation
- **Deadlines**: "by Thursday", "before the weekend"
- **Unresolved**: Which API to use
- **Expected health score**: 8/10

### Demo 2: Startup Standup (3 founders)
- **Attendees**: Alex, Maya, Jordan
- **Scenario**: Product launch discussion
- **Dependencies**: Maya needs Alex's API before integration
- **Conflict**: Jordan wants marketing first, Alex wants stability
- **Expected health score**: 6/10

### Demo 3: Internship Check-in (2 people)
- **Attendees**: Sarah (manager), Dev (intern)
- **Scenario**: Weekly sync
- **Action items**: Simple tasks for Dev, feedback from Sarah
- **Expected health score**: 9/10

---

## Verification Plan

### Functional Tests
- Process all 3 demo transcripts -- correct attribution
- Upload .txt file -- correct parsing
- Upload .mp3 file -- Gemini transcription
- Live recording (Chrome) -- real-time captions
- No speaker labels -- AI inference works
- Very short transcript (2 lines) -- graceful handling
- Very long transcript (5000 words) -- no timeout

### Multi-User Tests
- Open 5 tabs, process different transcripts simultaneously
- Zero cross-contamination between tabs
- Independent results per session

### Security Tests
- Submit `<script>alert('xss')</script>` in transcript -- sanitized
- Check Network tab -- no API keys in requests
- HTTPS enforcement on deployed URL

### Browser Tests
- Chrome: full features including live recording
- Edge: full features
- Firefox: upload/paste only, recording disabled with notice
- Mobile Chrome: responsive, touch-friendly

---

## Judge Pitch Lines

1. "Your meetings deserve better than a shared Google Doc."
2. "MeetMind doesn't summarize your meeting -- it remembers it for each person individually."
3. "Every action item comes with a source quote. If the AI says you said it, we prove it."
4. "Zero data stored. Your meeting transcript never touches a database."
5. "Three AI providers, one fallback chain. Your results arrive even if Gemini sleeps."
6. "Built for the way students actually work: messy meetings, clear outcomes."
7. "Paste a transcript, get personalized cards in 10 seconds. Try it."
8. "One meeting, four people, four different action lists. That's MeetMind."
