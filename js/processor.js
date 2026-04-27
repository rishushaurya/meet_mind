// MeetMind - API Processor Layer (Chunk 05 — Rewrite v2)
// Handles: transcription, analysis, and refinement API calls

const processor = {
  isDemoMode: false,
  currentDemoId: null,

  // ─── 1. Transcribe Audio → Text (Chunked Support) ───────────────────────
  // Max 24MB upload, but large files are auto-chunked client-side to fit
  // Vercel's 4.5MB request body limit per serverless function call.
  async transcribeAudioFile(file, mimeType) {
    if (file.size > 24 * 1024 * 1024) {
      throw new Error(`Audio file is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum is 24MB. Please compress the file or use a shorter recording.`);
    }

    // Vercel body limit is 4.5MB. Base64 adds ~33% overhead.
    // So raw payload must be under ~3MB per request.
    const SINGLE_CHUNK_MAX = 3 * 1024 * 1024; // 3MB

    if (file.size <= SINGLE_CHUNK_MAX) {
      // Small file — send as single request
      const base64 = await this.fileToBase64(file);
      return await this._transcribeChunk(base64, mimeType, 0, 1);
    }

    // Large file — split into ~90s WAV chunks, transcribe each, merge
    this.showLoadingStep(0, 'transcribe');
    this.showLoadingStep(1, 'transcribe', 'Preparing audio chunks...');

    const chunks = await this._splitAudioIntoChunks(file);

    let fullTranscript = '';
    const allSpeakers = new Set();

    for (let i = 0; i < chunks.length; i++) {
      this.showLoadingStep(1, 'transcribe', `Transcribing part ${i + 1} of ${chunks.length}...`);
      const base64 = await this.fileToBase64(chunks[i]);
      const result = await this._transcribeChunk(base64, 'audio/wav', i, chunks.length);

      if (result.transcript) {
        fullTranscript += (fullTranscript ? '\n' : '') + result.transcript;
      }
      if (result.speakers) {
        result.speakers.forEach(s => allSpeakers.add(s));
      }
    }

    this.showLoadingStep(3, 'transcribe');
    return {
      transcript: fullTranscript,
      speakers: Array.from(allSpeakers),
      _provider: 'chunked'
    };
  },

  // Split audio into WAV chunks small enough for Vercel's body limit
  async _splitAudioIntoChunks(file) {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    await audioCtx.close();

    // 16kHz mono 16-bit WAV = 32KB/sec
    // Target each chunk under ~2.8MB raw (→ ~3.7MB base64, under 4.5MB body)
    const TARGET_SAMPLE_RATE = 16000;
    const BYTES_PER_SAMPLE = 2; // 16-bit
    const MAX_CHUNK_BYTES = 2.8 * 1024 * 1024;
    const chunkDurationSec = Math.floor(MAX_CHUNK_BYTES / (TARGET_SAMPLE_RATE * BYTES_PER_SAMPLE));
    // ~91 seconds per chunk

    const totalDuration = audioBuffer.duration;
    const numChunks = Math.ceil(totalDuration / chunkDurationSec);
    const chunks = [];

    for (let i = 0; i < numChunks; i++) {
      const start = i * chunkDurationSec;
      const end = Math.min(start + chunkDurationSec, totalDuration);
      const duration = end - start;

      // Downsample to 16kHz mono via OfflineAudioContext (faster than real-time)
      const numSamples = Math.ceil(duration * TARGET_SAMPLE_RATE);
      const offline = new OfflineAudioContext(1, numSamples, TARGET_SAMPLE_RATE);
      const source = offline.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(offline.destination);
      source.start(0, start, duration);

      const rendered = await offline.startRendering();
      chunks.push(this._audioBufferToWav(rendered));
    }

    return chunks;
  },

  // Encode an AudioBuffer as a 16-bit PCM WAV blob
  _audioBufferToWav(buffer) {
    const sampleRate = buffer.sampleRate;
    const samples = buffer.getChannelData(0);
    const dataLength = samples.length * 2;
    const totalLength = 44 + dataLength;

    const ab = new ArrayBuffer(totalLength);
    const v = new DataView(ab);

    const writeStr = (off, str) => { for (let i = 0; i < str.length; i++) v.setUint8(off + i, str.charCodeAt(i)); };

    writeStr(0, 'RIFF');
    v.setUint32(4, totalLength - 8, true);
    writeStr(8, 'WAVE');
    writeStr(12, 'fmt ');
    v.setUint32(16, 16, true);
    v.setUint16(20, 1, true); // PCM
    v.setUint16(22, 1, true); // mono
    v.setUint32(24, sampleRate, true);
    v.setUint32(28, sampleRate * 2, true);
    v.setUint16(32, 2, true);
    v.setUint16(34, 16, true);
    writeStr(36, 'data');
    v.setUint32(40, dataLength, true);

    let off = 44;
    for (let i = 0; i < samples.length; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      v.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      off += 2;
    }

    return new Blob([ab], { type: 'audio/wav' });
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
