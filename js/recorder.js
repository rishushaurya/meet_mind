// MeetMind - Live Recording Revolution (God Mode v12)
// Captures both Tab Audio (meeting participants) and Microphone (user)
// Mixes via AudioContext -> MediaRecorder
// Uses Web Speech API for live captions of user's voice

const recorder = {
  // Streams & Nodes
  tabStream: null,
  micStream: null,
  audioCtx: null,
  mediaRecorder: null,
  recognition: null,
  tabAnalyser: null,
  micAnalyser: null,
  animFrameId: null,
  
  // State
  audioChunks: [],
  isRecording: false,
  startTime: 0,
  timerInterval: null,
  wordCount: 0,
  liveTranscript: '',
  restarts: 0,
  
  init() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      this.showUnsupportedNotice();
      return false;
    }
    return true;
  },

  showUnsupportedNotice() {
    const recordZone = document.getElementById('recording-zone');
    if (recordZone) {
      recordZone.innerHTML = `
        <div style="color: var(--color-warning); margin-bottom: 16px;">
          <i data-lucide="alert-triangle" style="width: 32px; height: 32px;"></i>
        </div>
        <h4>Browser Unsupported</h4>
        <p style="color: var(--color-text-secondary); margin-top: 8px;">
          Recording requires Chrome or Edge. Please use the Paste or Upload tabs instead.
        </p>
      `;
      if (window.lucide) window.lucide.createIcons();
    }
  },

  async startRecording() {
    try {
      this.restarts = 0;
      this.audioChunks = [];
      
      // 1. Get Tab Stream (Meeting audio)
      try {
        this.tabStream = await navigator.mediaDevices.getDisplayMedia({
          video: { displaySurface: 'browser' },
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false
          }
        });
      } catch (err) {
        if (err.name !== 'NotAllowedError') console.error('Tab share error:', err);
        return; // User cancelled screen share
      }

      // Check if user actually shared audio
      if (this.tabStream.getAudioTracks().length === 0) {
        utils.showToast('You must share a tab WITH AUDIO enabled.', 'error');
        this.tabStream.getTracks().forEach(t => t.stop());
        return;
      }

      // 2. Get Mic Stream (User's voice)
      try {
        this.micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
      } catch (err) {
        console.warn('Mic access denied or unavailable. Continuing with tab audio only.', err);
        utils.showToast('Microphone not available. Capturing tab audio only.', 'warning');
      }

      // 3. AudioContext Mix
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const destination = this.audioCtx.createMediaStreamDestination();
      
      const tabSource = this.audioCtx.createMediaStreamSource(this.tabStream);
      this.tabAnalyser = this.audioCtx.createAnalyser();
      this.tabAnalyser.fftSize = 64;
      tabSource.connect(this.tabAnalyser);
      this.tabAnalyser.connect(destination);

      if (this.micStream && this.micStream.getAudioTracks().length > 0) {
        const micSource = this.audioCtx.createMediaStreamSource(this.micStream);
        this.micAnalyser = this.audioCtx.createAnalyser();
        this.micAnalyser.fftSize = 64;
        micSource.connect(this.micAnalyser);
        this.micAnalyser.connect(destination);
      }

      // 4. MediaRecorder Setup
      this.mediaRecorder = new MediaRecorder(destination.stream, { mimeType: 'audio/webm' });
      
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this.audioChunks.push(e.data);
          
          // Memory leak protection - flush if too many chunks
          if (this.audioChunks.length > 200) {
            const blob = new Blob(this.audioChunks, { type: 'audio/webm' });
            this.audioChunks = [blob]; // Compress array
          }
        }
      };

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.processRecordedAudio(audioBlob);
      };

      // Stop if user stops sharing via browser UI
      this.tabStream.getVideoTracks()[0].onended = () => {
        if (this.isRecording) this.stopRecording();
      };

      // 5. Start Recording
      this.mediaRecorder.start(1000); // chunk every 1s
      this.isRecording = true;
      
      // Resume context if suspended (Chrome policy)
      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      // 6. UI Update
      this.showRecordingState();
      this.startTimer();
      this.startWaveform();
      
      // 7. Live Captions (if mic is available)
      if (this.micStream) {
        this.startSpeechRecognition();
      } else {
        document.getElementById('live-captions-text').innerHTML = 
          '<span class="caption-placeholder">No microphone detected. Live captions disabled.</span>';
        document.getElementById('mic-status').classList.remove('active');
        document.getElementById('mic-status').style.color = 'var(--color-text-muted)';
      }

      utils.showToast('Recording started.', 'success');

    } catch (e) {
      console.error('Recording initialization failed:', e);
      utils.showToast('Failed to start recording.', 'error');
      this.cleanup();
    }
  },

  stopRecording() {
    if (!this.isRecording) return;
    this.isRecording = false;
    
    // Stop recording first
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    
    // Wait briefly for pending speech results before stopping recognition
    setTimeout(() => {
      this.stopSpeechRecognition();
    }, 500);

    this.stopTimer();
    this.stopWaveform();
    
    // UI Update
    document.querySelector('.record-live-badge').innerHTML = '<span class="record-dot" style="animation:none;background:var(--color-border);"></span> STOPPED';
    document.getElementById('btn-stop-record').disabled = true;
    document.getElementById('btn-stop-record').innerHTML = '<i class="chatbox-spinner"></i> Processing...';
  },

  processRecordedAudio(blob) {
    // Validate length (min 15KB roughly 3-4 seconds)
    if (blob.size < 15000) {
      utils.showToast('Recording too short to process.', 'warning');
      this.cleanup();
      this.showIdleState();
      return;
    }

    app.state.inputMethod = 'record';
    app.state.transcript = '[LIVE_RECORDING_AUDIO]\n' + this.liveTranscript; // Append live text as fallback reference
    app.state.audioFile = new File([blob], 'recording.webm', { type: 'audio/webm' });
    app.state.audioMimeType = 'audio/webm';

    const reader = new FileReader();
    reader.onload = (e) => {
      app.state.audioBase64 = e.target.result.split(',')[1];
      
      // Update paste input silently
      const pasteInput = document.getElementById('paste-input');
      if (pasteInput) pasteInput.value = '[System Audio + Mic Recorded Successfully]';
      
      // Trigger the app pipeline
      const procBtn = document.getElementById('process-btn');
      if (procBtn && !procBtn.disabled) {
        app.handleProcessMeetingClick();
      } else {
        utils.showToast('Recording saved. Click Process Meeting to continue.', 'success');
        this.showIdleState();
      }
    };
    reader.readAsDataURL(blob);
  },

  // ─── Speech Recognition (Live Captions) ──────────────────────────────────
  startSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      document.getElementById('live-captions-text').innerHTML = 
        '<span class="caption-placeholder">Live captions not supported in this browser.</span>';
      return;
    }

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-IN'; // Better for Hindi-English mix

      this.recognition.onresult = (event) => {
        if (!this.isRecording) return;
        
        let interimText = '';
        let finalText = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalText += event.results[i][0].transcript;
          } else {
            interimText += event.results[i][0].transcript;
          }
        }

        if (finalText) {
          this.liveTranscript += finalText + ' ';
          this.wordCount += finalText.trim().split(/\s+/).length;
          document.getElementById('live-word-count').textContent = `${this.wordCount} words`;
        }

        this.renderCaptions(finalText, interimText);
      };

      this.recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
      };

      this.recognition.onend = () => {
        // Auto-restart if we're still recording (prevents silent death)
        if (this.isRecording && this.restarts < 50) {
          this.restarts++;
          try {
            this.recognition.start();
          } catch(e) {}
        }
      };

      this.recognition.start();
    } catch (e) {
      console.error('Speech recognition init failed:', e);
    }
  },

  stopSpeechRecognition() {
    if (this.recognition) {
      this.recognition.onend = null; // Prevent restart
      try {
        this.recognition.stop();
      } catch(e) {}
    }
  },

  renderCaptions(finalAdded, interimText) {
    const container = document.getElementById('live-captions-text');
    
    // Build HTML safely
    let html = '';
    
    // Add existing final text (simplified for display to avoid huge DOM)
    const displayTokens = this.liveTranscript.split(' ').slice(-30).join(' '); // Keep last 30 words visible
    
    if (this.liveTranscript.trim().length > 0) {
      html += `<span class="transcript-speaker">You:</span> <span style="color: var(--color-text)">${utils.escapeHtml(displayTokens)}</span>`;
    }
    
    if (interimText) {
      html += ` <span class="transcript-interim">${utils.escapeHtml(interimText)}<span style="animation: pulse 1s infinite">_</span></span>`;
    }
    
    if (html === '') {
      html = '<span class="caption-placeholder">Start speaking...</span>';
    }

    // Assign using innerHTML since we escaped the dynamic parts
    container.innerHTML = html;
    
    // Auto-scroll
    container.scrollTop = container.scrollHeight;
  },

  // ─── Visualizer ─────────────────────────────────────────────────────────
  startWaveform() {
    const tabCanvas = document.getElementById('waveform-tab');
    const micCanvas = document.getElementById('waveform-mic');
    const tabCtx = tabCanvas ? tabCanvas.getContext('2d') : null;
    const micCtx = micCanvas ? micCanvas.getContext('2d') : null;
    
    if (!tabCtx && !micCtx) return;

    const tabDataArray = this.tabAnalyser ? new Uint8Array(this.tabAnalyser.frequencyBinCount) : null;
    const micDataArray = this.micAnalyser ? new Uint8Array(this.micAnalyser.frequencyBinCount) : null;

    const draw = () => {
      if (!this.isRecording) return;
      this.animFrameId = requestAnimationFrame(draw);

      // Render Tab (Meeting) Waveform
      if (tabCtx && tabDataArray) {
        this.tabAnalyser.getByteFrequencyData(tabDataArray);
        this.renderCanvasBar(tabCtx, tabCanvas.width, tabCanvas.height, tabDataArray, 'var(--color-accent)');
      }

      // Render Mic Waveform
      if (micCtx && micDataArray) {
        this.micAnalyser.getByteFrequencyData(micDataArray);
        this.renderCanvasBar(micCtx, micCanvas.width, micCanvas.height, micDataArray, 'var(--color-success)');
      }
    };

    draw();
  },

  renderCanvasBar(ctx, width, height, dataArray, colorStr) {
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Calculate average volume roughly
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const avg = sum / dataArray.length;
    
    // Draw base line
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(0, height/2 - 1, width, 2);
    
    // Draw level fill
    if (avg > 5) { // Threshold for silence
      // Convert CSS variable to literal color if needed, or use the variable if canvas supports it 
      // (Canvas API doesn't support CSS vars directly, so we use literal fallback based on our theme)
      ctx.fillStyle = colorStr === 'var(--color-accent)' ? '#00D2FF' : '#00E676';
      
      // Calculate width based on volume (max avg is ~255)
      const fillWidth = Math.min(width, (avg / 128) * width);
      ctx.fillRect(0, height/2 - Math.max(2, avg/8), fillWidth, Math.max(4, avg/4));
    }
  },

  stopWaveform() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    
    // Clear canvases
    ['waveform-tab', 'waveform-mic'].forEach(id => {
      const cvs = document.getElementById(id);
      if (cvs) {
        const ctx = cvs.getContext('2d');
        ctx.clearRect(0, 0, cvs.width, cvs.height);
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(0, cvs.height/2 - 1, cvs.width, 2);
      }
    });
  },

  // ─── UI Helpers ─────────────────────────────────────────────────────────
  startTimer() {
    this.startTime = Date.now();
    const timerEl = document.getElementById('record-timer');
    if (!timerEl) return;
    
    this.timerInterval = setInterval(() => {
      const elapsed = Date.now() - this.startTime;
      const seconds = Math.floor((elapsed / 1000) % 60);
      const minutes = Math.floor((elapsed / 1000) / 60);
      
      const formatTime = (val) => val < 10 ? `0${val}` : val;
      timerEl.textContent = `${formatTime(minutes)}:${formatTime(seconds)}`;
    }, 1000);
  },

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  },

  showRecordingState() {
    const idle = document.getElementById('record-idle');
    const active = document.getElementById('record-active');
    if (idle) idle.classList.add('hidden');
    if (active) active.classList.remove('hidden');
  },

  showIdleState() {
    const idle = document.getElementById('record-idle');
    const active = document.getElementById('record-active');
    if (idle) idle.classList.remove('hidden');
    if (active) active.classList.add('hidden');
    
    const btn = document.getElementById('btn-stop-record');
    if (btn) {
      btn.innerHTML = '<i data-lucide="square" style="width:14px;height:14px;fill:currentColor;"></i> Stop Recording';
    }
    if (window.lucide) window.lucide.createIcons();
    
    document.getElementById('record-timer').textContent = '00:00';
    document.getElementById('live-word-count').textContent = '0 words';
    document.getElementById('live-captions-text').innerHTML = '<span class="caption-placeholder">Start speaking — your words appear here in real-time...</span>';
    document.querySelector('.record-live-badge').innerHTML = '<span class="record-dot"></span> REC';
  },

  // ─── Cleanup ────────────────────────────────────────────────────────────
  cleanup() {
    this.stopRecording();
    this.showIdleState();
    
    if (this.tabStream) {
      this.tabStream.getTracks().forEach(t => t.stop());
      this.tabStream = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach(t => t.stop());
      this.micStream = null;
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      try { this.audioCtx.close(); } catch(e) {}
      this.audioCtx = null;
    }
    
    this.audioChunks = [];
    this.liveTranscript = '';
    this.wordCount = 0;
  }
};

window.recorder = recorder;

document.addEventListener('DOMContentLoaded', () => {
  recorder.init();
});
