// MeetMind - API Processor Layer (Chunk 05 — Rewrite v2)
// Handles: transcription, analysis, and refinement API calls

const processor = {
  isDemoMode: false,
  currentDemoId: null,

  // ─── 1. Transcribe Audio → Text ────────────────────────────────────────
  async transcribeAudio(audioBase64, mimeType) {
    this.showLoadingStep(0, 'transcribe'); // "Uploading audio..."

    let attempts = 0;
    while (true) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 min per request

        if (attempts === 0) {
          this.showLoadingStep(1, 'transcribe'); // "Transcribing with AI..."
        }

        const response = await fetch('/api/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioBase64,
            mimeType,
            sessionId: app.state.sessionId
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          // If Rate Limit, stay in the generating screen and retry persistently
          if (response.status === 429) {
            attempts++;
            this.showRetryState();
            await new Promise(r => setTimeout(r, 15000)); // Wait 15s before next attempt
            continue;
          }
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || 'Transcription failed');
        }

        if (attempts === 0) {
          this.showLoadingStep(2, 'transcribe'); // "Detecting speakers..."
        }
        
        const data = await response.json();
        
        if (attempts === 0) {
          this.showLoadingStep(3, 'transcribe'); // "Building transcript..."
        }
        return data; // { transcript, speakers, sessionId }

      } catch (error) {
        if (error.name === 'AbortError') {
          // Timeouts often happen due to queuing/rate limits, so retry these too
          attempts++;
          this.showRetryState();
          await new Promise(r => setTimeout(r, 5000));
          continue;
        }
        throw error;
      }
    }
  },

  // ─── 2. Process Text Transcript → Analysis JSON ────────────────────────
  async processTranscript(transcript, attendees) {
    this.showLoadingStep(0, 'analyze');

    try {
      // Demo Mode
      if (this.isDemoMode && this.currentDemoId) {
        return await this.simulateDemoProcessing();
      }

      const response = await this.callAnalysisAPI({ transcript, attendees });
      return response;

    } catch (error) {
      this.handleAPIError(error);
      return null;
    }
  },

  // ─── 3. Refine Results via User Instruction ────────────────────────────
  async refineResults(currentResults, userInstruction) {
    let attempts = 0;
    while (true) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        const response = await fetch('/api/refine', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentResults,
            userInstruction,
            sessionId: app.state.sessionId
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          if (response.status === 429) {
            attempts++;
            utils.showToast("High traffic, retrying...", "warning");
            await new Promise(r => setTimeout(r, 10000));
            continue;
          }
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || 'Refinement failed');
        }

        return await response.json();

      } catch (error) {
        if (error.name === 'AbortError') {
          attempts++;
          utils.showToast("Taking longer than expected, retrying...", "warning");
          await new Promise(r => setTimeout(r, 5000));
          continue;
        }
        throw error;
      }
    }
  },

  // ─── Internal: Call /api/process ────────────────────────────────────────
  async callAnalysisAPI(payload) {
    let attempts = 0;
    
    while (true) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 min per request

        if (attempts === 0) {
          this.showLoadingStep(1, 'analyze'); // "Identifying speakers..."
        }

        const response = await fetch('/api/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...payload,
            sessionId: app.state.sessionId
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        
        if (!response.ok) {
          if (response.status === 429) {
            attempts++;
            this.showRetryState();
            await new Promise(r => setTimeout(r, 15000));
            continue;
          }
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || 'SERVER_ERROR');
        }

        if (attempts === 0) {
          this.showLoadingStep(2, 'analyze'); // "Extracting action items..."
        }
        
        const data = await response.json();
        
        if (attempts === 0) {
          this.showLoadingStep(3, 'analyze'); // "Building your cards..."
        }
        return data;

      } catch (error) {
        if (error.name === 'AbortError') {
          attempts++;
          this.showRetryState();
          await new Promise(r => setTimeout(r, 5000));
          continue;
        }
        throw error;
      }
    }
  },

  // ─── Error Handler ─────────────────────────────────────────────────────
  handleAPIError(error) {
    console.error("API Processing Error:", error);
    
    app.showView('preview-view');
    
    const msg = error.message || '';
    if (msg.includes('too short') || msg.includes('Minimum')) {
      utils.showToast("Invalid transcript: " + msg, "error");
    } else {
      utils.showToast(msg || "AI processing failed. Check your internet connection or try Demo mode.", "error");
    }
  },

  // ─── Demo Simulation ───────────────────────────────────────────────────
  async simulateDemoProcessing() {
    return new Promise((resolve) => {
      let step = 0;
      const steps = setInterval(() => {
        step++;
        if (step < 4) {
          this.showLoadingStep(step, 'analyze');
        } else {
          clearInterval(steps);
          const data = window.demo.getDemoResponse(this.currentDemoId);
          resolve(data);
        }
      }, 1000);
    });
  },

  // ─── Loading Steps Display ─────────────────────────────────────────────
  showLoadingStep(stepIndex, phase = 'analyze') {
    const statusEl = document.getElementById('loading-status');
    if (!statusEl) return;
    
    const steps = {
      transcribe: [
        "Uploading audio...",
        "Transcribing with Groq...",
        "Detecting speakers...",
        "Building transcript..."
      ],
      analyze: [
        "Reading transcript...",
        "Analyzing with AI...",
        "Extracting action items...",
        "Building your cards..."
      ]
    };
    
    const phaseSteps = steps[phase] || steps.analyze;
    if (phaseSteps[stepIndex]) {
      utils.safeText(statusEl, phaseSteps[stepIndex]);
    }
  },

  showRetryState() {
    const statusEl = document.getElementById('loading-status');
    if (!statusEl) return;
    
    // As per user request: "when limit reached you show some red dot and says it make longer then expected"
    statusEl.innerHTML = `<span style="color: #ef4444; margin-right: 8px;">●</span> Taking longer than expected... AI is busy, waiting to retry.`;
  }
};

window.processor = processor;
