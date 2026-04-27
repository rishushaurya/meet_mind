# MeetMind

> **"The AI that remembers your meetings so you don't have to."**

AI Foundry Hackathon | Problem Statement 02: The Meeting That Never Happened

---

## Quick Start

```bash
# Install dependencies
npm install

# Run locally (requires Vercel CLI)
npx vercel dev

# Deploy to production
npx vercel --prod

# Run diagnostics
npm run diagnostics
```

---

## Project Identity

| Field | Value |
|-------|-------|
| **Name** | MeetMind |
| **Tagline** | The AI that remembers your meetings so you don't have to |
| **Challenge** | AI Foundry Hackathon -- Problem Statement 02 |
| **Target** | College students doing group project meetings |
| **Stack** | Vanilla JS + Vercel Serverless + Gemini 2.0 Flash |

---

## Build Status

| Chunk | Name | Status | Verified |
|-------|------|--------|----------|
| 00 | Manifest + Diagnostics | NOT STARTED | - |
| 01 | Scaffolding | COMPLETE | YES |
| 02 | UI/UX Design | COMPLETE | YES |
| 03 | Core App Logic | COMPLETE | YES |
| 04 | Input Processing | COMPLETE | YES |
| 05 | API Engine | COMPLETE | YES |
| 06 | Dashboard + Exports | COMPLETE | YES |

**UI/UX Status:** COMPLETE
**Logic Status:** COMPLETE
**Integration Status:** COMPLETE

---

## File Map

| File | Purpose |
|------|---------|
| `D:\ai_foundary_problem\meetmind\index.html` | Single-page app with all views |
| `D:\ai_foundary_problem\meetmind\style.css` | Complete design system (CSS custom properties) |
| `D:\ai_foundary_problem\meetmind\js\app.js` | View routing, state management, event wiring |
| `D:\ai_foundary_problem\meetmind\js\recorder.js` | Live recording + Web Speech API |
| `D:\ai_foundary_problem\meetmind\js\processor.js` | API communication + fallback logic |
| `D:\ai_foundary_problem\meetmind\js\dashboard.js` | Results rendering + per-person cards |
| `D:\ai_foundary_problem\meetmind\js\charts.js` | Chart.js visualizations |
| `D:\ai_foundary_problem\meetmind\js\export.js` | PDF, clipboard, WhatsApp format, email preview |
| `D:\ai_foundary_problem\meetmind\js\demo.js` | 3 demo transcripts + mock JSON responses |
| `D:\ai_foundary_problem\meetmind\js\utils.js` | DOMPurify wrappers, validation, helpers |
| `D:\ai_foundary_problem\meetmind\api\process.js` | Vercel serverless: Gemini + Groq calls |
| `D:\ai_foundary_problem\meetmind\vercel.json` | Routing, CSP headers, CORS |
| `D:\ai_foundary_problem\meetmind\package.json` | Dependencies: dotenv, generative-ai, groq-sdk |
| `D:\ai_foundary_problem\meetmind\.env.example` | API key template |
| `D:\ai_foundary_problem\meetmind\README.md` | This file -- master context map |
| `D:\ai_foundary_problem\meetmind\IMPLEMENTATION_PLAN.md` | Complete technical specification |
| `D:\ai_foundary_problem\meetmind\CHANGELOG.md` | Version history + AI session log |
| `D:\ai_foundary_problem\meetmind\COMMANDS.md` | User command shortcuts + AI switch prompts |
| `D:\ai_foundary_problem\meetmind\TEAMMATE_GUIDE.md` | Non-technical presentation guide |
| `D:\ai_foundary_problem\meetmind\build\00_MANIFEST.md` | Build order + diagnostics script |
| `D:\ai_foundary_problem\meetmind\build\01_SCAFFOLDING.md` | Project scaffolding instructions |
| `D:\ai_foundary_problem\meetmind\build\02_UI_DESIGN.md` | UI/UX design chunk |
| `D:\ai_foundary_problem\meetmind\build\03_CORE_APP.md` | Core app logic wiring |
| `D:\ai_foundary_problem\meetmind\build\04_INPUT_PROCESSING.md` | Input methods implementation |
| `D:\ai_foundary_problem\meetmind\build\05_API_ENGINE.md` | Gemini/Groq API engine |
| `D:\ai_foundary_problem\meetmind\build\06_DASHBOARD_EXPORTS.md` | Dashboard rendering + exports |

---

## AI Session Protocol (MANDATORY)

### Session Start
1. Read `CHANGELOG.md` FULLY -- every entry, top to bottom
2. Read `README.md` -- check build status table and UI/UX status
3. Report to user: (a) chunks complete, (b) what is broken, (c) what to do next
4. Do NOT make changes until user confirms

### Session End (AUTO -- do this WITHOUT being asked)
1. Update `CHANGELOG.md` with: date, AI model, description, files created, files modified, build status, known issues, next steps
2. Update build status table in this `README.md`
3. If anything is broken, note it explicitly

### On Every File Change
Track it. Include it in the changelog entry.

### RULE
A session without a CHANGELOG.md update is an INCOMPLETE session.

---

## Tech Stack

| Layer | Technology | Free Limits |
|-------|-----------|-------------|
| Frontend | Vanilla HTML/CSS/JS | N/A |
| Backend | Vercel Serverless (Node.js) | 100GB bandwidth/mo |
| Primary AI | Gemini 2.0 Flash | 15 RPM, 1M tokens/day |
| Fallback AI | Groq (Llama 3.3 70B) | 30 RPM, 6K tokens/min |
| Transcription | Web Speech API (browser) | Unlimited |
| Charts | Chart.js v4 (CDN) | Open source |
| PDF | html2pdf.js (CDN) | Open source |
| Sanitization | DOMPurify (CDN) | Open source |
| Icons | Lucide Icons (CDN) | Open source |
| Fonts | Google Fonts (Inter + JetBrains Mono) | Free |
| Hosting | Vercel | Free tier |

---

## API Keys

| Service | Env Variable | Get Key At | Free Limits |
|---------|-------------|------------|-------------|
| Gemini 2.0 Flash | `GEMINI_API_KEY` | https://aistudio.google.com/apikey | 15 RPM, 1M tokens/day |
| Groq | `GROQ_API_KEY` | https://console.groq.com/keys | 30 RPM, 6K tokens/min |

---

## Environment Variables

```env
GEMINI_API_KEY=your_gemini_api_key_here
GROQ_API_KEY=your_groq_api_key_here
```

---

## Rules for AI Workers

1. Follow chunk files in order. Never skip ahead.
2. ALL CSS uses custom properties. Never hardcode colors, fonts, sizes.
3. Demo mode must work WITHOUT API keys (mock JSON in demo.js).
4. ALL user input sanitized via DOMPurify before DOM insertion.
5. NEVER use innerHTML. Use textContent or DOMPurify.sanitize() only.
6. API keys ONLY in Vercel serverless env vars. Never in frontend. Never in git.
7. Every function has try/catch with user-friendly error messages.
8. AUTO-LOG: Update CHANGELOG.md after EVERY change. Log as you go.
9. Test in Chrome before reporting success.
10. Zero external state: no DB, no cookies, no server sessions.
11. Check for existing code before writing new. Never duplicate.
12. Read IMPLEMENTATION_PLAN.md before guessing anything.
13. If previous AI broke something, fix FIRST, then log under "Fixes from previous session."
14. After functional build is complete, ASK user for UI/UX design references before styling.
