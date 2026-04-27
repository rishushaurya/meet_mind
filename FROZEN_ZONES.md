# MEETMIND: FROZEN ZONES PROTOCOL

> **WARNING TO ALL FUTURE AI AGENTS**
> This project is in a highly stable, production-ready state. Previous AI agents have caused severe regressions by touching working code.
> To prevent this, the following "Frozen Zones" have been established.

## 🔴 STRICT RULE: DO NOT TOUCH FROZEN ZONES
You are **FORBIDDEN** from modifying any file listed below unless the user explicitly requests a change to that specific feature.

If you must modify a frozen file, you MUST:
1. Document the exact line numbers and the reason for the change in `CHANGELOG.md`.
2. Run the regression checks listed below to ensure you haven't broken the pipeline.
3. If a frozen zone breaks after your change, REVERT IMMEDIATELY. Do not attempt to "fix forward".

---

## 🧊 The Frozen Zones (Do Not Modify)

| Module | File(s) | Why It Is Frozen |
|--------|---------|------------------|
| **Dashboard Engine** | `js/dashboard.js` | Rendering logic is battle-tested. Survived 4 crash fixes. |
| **Charts Integration** | `js/charts.js` | Chart.js integration is stable and precisely tuned. |
| **Export System** | `js/export.js` | PDF engine was rewritten 3 times. It is now FINAL. |
| **Chatbox UI/Logic** | `js/chatbox.js` | Dual-tab system works perfectly with prompt injection defense. |
| **Demo Data** | `js/demo.js` | Mock data is static and structurally correct. |
| **Core Utilities** | `js/utils.js` | Security foundation (DOMPurify, ID generation). |
| **Starfield Background** | `js/starfield.js` | GPU-optimized, tested across all views. |
| **Analysis API** | `api/process.js` | Core AI analysis pipeline. Session isolation works perfectly. |
| **Transcription API** | `api/transcribe.js` | Audio transcription (Groq + Gemini fallback). |
| **Refinement API** | `api/refine.js` | Post-AI correction endpoint. |
| **Chat API** | `api/chat.js` | Conversational Q&A endpoint. |
| **Health API** | `api/health.js` | Diagnostics endpoint. |
| **Vercel Config** | `vercel.json` | Routing + CSP headers are strictly configured. |
| **Dependencies** | `package.json` | Stable versions installed. Do not upgrade packages. |

---

## ✅ Pre-Flight Checklist
Before concluding any session, you must mentally verify:
- [ ] Did I modify a Frozen Zone? If yes, did I document it?
- [ ] Are there any hardcoded colors or sizes in my new CSS? (MUST use `style.css` variables).
- [ ] Are API keys exposed in the frontend? (MUST use `/api` endpoints).
- [ ] Does the Demo mode still load fully to the Dashboard?

## 🔄 Regression Checks
If you touch the UI or logic, the user will verify:
1. File upload (TXT/MP3) still processes to Dashboard.
2. PDF/Clipboard/WhatsApp exports still work.
3. Chatbox Ask/Apply tabs still function.
4. Dark/light theme toggle still works globally.
