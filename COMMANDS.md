# MeetMind -- User Commands

> Copy-paste these prompts to any AI to get instant results.

---

## Session History

| Date | AI | Changes Made |
|------|----|--------------|
| **2024-04-25** | Claude/Gemini | Phase 1 (Core Pipeline): Vercel setup, Groq integration, CSS baseline |
| **2024-04-25** | Claude/Gemini | Phase 2 (Audio & Error Handling): Fallback models, rate limit retries (429 handling), Diagnostics 88/88 passed |
| **2024-04-26** | Gemini | Phase 3 (God Mode v2): 100MB chunked audio, PDF Generation, Host detection, Floating Chatbox |

---

## Quick Commands

| Category | Command (paste to AI) |
|----------|-----------------------|
| **Setup** | "Build everything from scratch following the build chunks in order" |
| **Setup** | "Execute Chunk [X] from the build directory" |
| **Setup** | "Run diagnostics and show me what's passing and failing" |
| **Setup** | "Install all dependencies" |
| **Dev** | "Start the dev server locally" |
| **Dev** | "Add this feature: [describe feature]" |
| **Dev** | "Fix [component name] -- it's not working" |
| **Dev** | "Show me what features are currently working" |
| **UI/UX** | "Here is my design reference: [link/image/description]. Apply it to the entire app." |
| **UI/UX** | "Change the color scheme to [description]" |
| **UI/UX** | "Redesign the [component] to look like [reference]" |
| **UI/UX** | "Add animation to [element]" |
| **UI/UX** | "Make it look like [website name]" |
| **Demo** | "Load all demo transcripts and test them" |
| **Demo** | "Start demo mode (no API keys needed)" |
| **Demo** | "Prepare for judge presentation -- verify everything works" |
| **Demo** | "Show me the full demo flow from start to finish" |
| **Fixes** | "API not responding -- diagnose and fix" |
| **Fixes** | "Live recording not working -- fix it" |
| **Fixes** | "Charts not rendering -- fix it" |
| **Fixes** | "Switch to Groq fallback -- Gemini is down" |
| **Fixes** | "[component] crashes when I click it -- fix" |
| **Deploy** | "Deploy to Vercel" |
| **Deploy** | "Set environment variables on Vercel for production" |
| **Deploy** | "Give me the live deployment URL" |
| **Emergency** | "Everything is broken -- rebuild from chunk 01" |
| **Emergency** | "I have [X] minutes before demo -- fix critical issues only" |
| **Status** | "What is the current build status?" |
| **Status** | "What features are working right now?" |
| **Status** | "Run full diagnostics and report" |

---

## Context Recovery Prompts

Use these when switching to a new AI, starting a new chat, or when an AI hallucinates.

### Full Context Recovery (new AI session)

```
You are resuming work on MeetMind, a hackathon project.

BEFORE YOU DO ANYTHING:
1. Read D:\ai_foundary_problem\meetmind\README.md -- this is the master context map.
2. Read D:\ai_foundary_problem\meetmind\CHANGELOG.md -- read EVERY entry, top to bottom. The last entry tells you what was done, what's working, what's broken, and what to do next.
3. Read D:\ai_foundary_problem\meetmind\IMPLEMENTATION_PLAN.md -- this is the complete technical spec.

AFTER READING ALL FILES:
- Report to me: (a) what chunks are complete, (b) what is currently broken, (c) what you will work on next.
- Do NOT change anything until I confirm.
- When you make changes, you MUST update CHANGELOG.md with exactly what you changed, what files were created/modified, and what the next AI session should do.
- Follow the build chunk order. Do not skip chunks.
- Use only the design tokens in style.css. Never hardcode colors or sizes.
- All API calls go through the serverless function. Never put API keys in frontend code.
- Test everything before telling me it works.

My current request is: [DESCRIBE WHAT YOU NEED]
```

### Quick Fix (fast correction)

```
You are working on MeetMind (D:\ai_foundary_problem\meetmind).
Read CHANGELOG.md -- the last entry has full context.
Fix this: [DESCRIBE THE ISSUE]
After fixing, update CHANGELOG.md with what you changed.
```

### Emergency Demo Prep (last-minute)

```
You are working on MeetMind (D:\ai_foundary_problem\meetmind).
I have a demo in [X] minutes. Read CHANGELOG.md for current status.
Prioritize: (1) demo transcripts load and process, (2) dashboard renders correctly, (3) no console errors.
Fix anything broken. Skip non-essential features. Update CHANGELOG.md when done.
```
