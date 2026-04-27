// MeetMind - API Processor Layer (Chunk 05 — Rewrite v2)
// Handles: transcription, analysis, and refinement API calls

const processor = {
  isDemoMode: false,
  currentDemoId: null,

  // ─── 1. Transcribe Audio → Text (Chunked Support) ───────────────────────
  async transcribeAudioFile(file, mimeType) {
    // Vercel Hobby plan: 4.5MB body limit. Base64 adds ~33% overhead.
    // So raw audio must be under ~3MB to fit in the request.
    const MAX_MB = 3;
    if (file.size > MAX_MB * 1024 * 1024) {
        throw new Error(`Audio file is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum is ${MAX_MB}MB for cloud deployment. Please use a shorter recording or paste the transcript text directly.`);
    }

    // Single chunk processing
    const base64 = await this.fileToBase64(file);
    return await this._transcribeChunk(base64, mimeType, 0, 1);
  },

  fileToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  },

  async _transcribeChunk(audioBase64, mimeType, chunkIndex, totalChunks) {
    if (totalChunks === 1) {
      this.showLoadingStep(0, 'transcribe'); // "Uploading audio..."
    }

    let attempts = 0;
    while (attempts < 5) { // Cap at 5 retries
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 min per request

        if (attempts === 0 && totalChunks === 1) {
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
          if (response.status === 429) {
            attempts++;
            if (attempts >= 5) throw new Error('AI is too busy. Please try again later.');
            this.showRetryState();
            await new Promise(r => setTimeout(r, 8000));
            continue;
          }
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || 'Transcription failed');
        }

        if (attempts === 0 && totalChunks === 1) {
          this.showLoadingStep(2, 'transcribe'); // "Detecting speakers..."
        }
        
        const data = await response.json();
        
        if (attempts === 0 && totalChunks === 1) {
          this.showLoadingStep(3, 'transcribe'); // "Building transcript..."
        }
        return data; 

      } catch (error) {
        if (error.name === 'AbortError') {
          attempts++;
          if (attempts >= 5) throw new Error('Transcription timed out repeatedly. Please try a smaller file.');
          this.showRetryState();
          await new Promise(r => setTimeout(r, 5000));
          continue;
        }
        throw error;
      }
    }
    throw new Error('Maximum retry attempts reached.');
  },

  // ─── 2. Process Text Transcript → Analysis JSON ────────────────────────
  async processTranscript(transcript, attendees) {
    this.showLoadingStep(0, 'analyze');

    try {
      // Demo Mode
      if (this.isDemoMode && this.currentDemoId) {
        const result = await this.simulateDemoProcessing();
        // Reset after use so it doesn't persist
        this.isDemoMode = false;
        this.currentDemoId = null;
        return result;
      }

      // ALWAYS ensure demo mode is off for real transcripts
      this.isDemoMode = false;
      this.currentDemoId = null;

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
    while (attempts < 3) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 90000);

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
            if (attempts >= 3) throw new Error('System is busy. Please try again later.');
            utils.showToast("AI is warming up, retrying shortly...", "info");
            await new Promise(r => setTimeout(r, 4000));
            continue;
          }
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || 'Refinement failed');
        }

        return await response.json();

      } catch (error) {
        if (error.name === 'AbortError') {
          attempts++;
          if (attempts >= 3) throw new Error('Refinement timed out. Please try again later.');
          utils.showToast("AI is thinking, retrying...", "info");
          await new Promise(r => setTimeout(r, 5000));
          continue;
        }
        throw error;
      }
    }
    throw new Error('Maximum retry attempts reached.');
  },

  // ─── Internal: Call /api/process ────────────────────────────────────────
  async callAnalysisAPI(payload) {
    let attempts = 0;
    
    while (attempts < 3) {
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
            if (attempts >= 3) throw new Error('AI analysis is busy. Please try again later.');
            this.showRetryState();
            await new Promise(r => setTimeout(r, 8000));
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
          if (attempts >= 3) throw new Error('Analysis timed out. Please try a smaller transcript.');
          this.showRetryState();
          await new Promise(r => setTimeout(r, 5000));
          continue;
        }
        throw error;
      }
    }
    throw new Error('Maximum retry attempts reached.');
  },

  // ─── Internal: Call /api/chat ───────────────────────────────────────────
  async chatAboutMeeting(question, transcript, analysisResults) {
    let attempts = 0;
    while (attempts < 3) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question,
            transcript,
            analysisResults,
            sessionId: app.state.sessionId
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || 'Chat failed');
        }

        return await response.json();

      } catch (error) {
        if (error.name === 'AbortError') {
          attempts++;
          if (attempts >= 3) throw new Error('Chat timed out. Please try again later.');
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }
        throw error;
      }
    }
    throw new Error('Maximum retry attempts reached.');
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
      }, 400);
    });
  },

  // ─── Loading Steps Display ─────────────────────────────────────────────
  showLoadingStep(stepIndex, phase = 'analyze', customText = null) {
    const statusEl = document.getElementById('loading-status');
    if (!statusEl) return;
    
    if (customText) {
      utils.safeText(statusEl, customText);
      return;
    }
    
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
    
    statusEl.textContent = '';
    const dot = document.createElement('span');
    dot.style.cssText = 'color: #ef4444; margin-right: 8px;';
    dot.textContent = '●';
    const msg = document.createElement('span');
    msg.textContent = 'AI is busy, retrying shortly...';
    statusEl.appendChild(dot);
    statusEl.appendChild(msg);
  }
};

window.processor = processor;
