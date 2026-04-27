// MeetMind - Live Recording Logic (Chunk 04)

const recorder = {
  recognition: null,
  isRecording: false,
  transcriptParts: [],
  timerInterval: null,
  startTime: 0,
  
  // Check browser support
  init() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      this.showUnsupportedNotice();
      return false;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.wireEvents();
    return true;
  },

  showUnsupportedNotice() {
    const recordZone = document.querySelector('.recording-zone');
    if (recordZone) {
      recordZone.innerHTML = `
        <div style="color: var(--color-warning); margin-bottom: 16px;">
          <i data-lucide="alert-triangle" style="width: 32px; height: 32px;"></i>
        </div>
        <h4>Browser Unsupported</h4>
        <p style="color: var(--color-text-secondary); margin-top: 8px;">
          Live recording requires Chrome or Edge. Please use the Paste or Upload tabs instead.
        </p>
      `;
      if (window.lucide) window.lucide.createIcons();
    }
  },

  wireEvents() {
    if (!this.recognition) return;

    this.recognition.onstart = () => {
      this.isRecording = true;
      this.transcriptParts = [];
      
      // Update UI
      document.getElementById('record-status').textContent = 'Recording...';
      document.getElementById('record-pulse').classList.remove('paused');
      document.getElementById('btn-start-record').disabled = true;
      document.getElementById('btn-stop-record').disabled = false;
      document.getElementById('live-captions').classList.remove('hidden');
      document.getElementById('live-captions').innerHTML = '';
      
      this.startTimer();
      utils.showToast('Microphone activated. Start speaking.', 'success');
    };

    this.recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        // Add final chunk to our stored transcript array
        const text = finalTranscript.trim() + ' ';
        this.transcriptParts.push(text);
        
        // Append to UI
        const captionsEl = document.getElementById('live-captions');
        const finalSpan = document.createElement('span');
        finalSpan.style.color = 'var(--color-text)';
        utils.safeText(finalSpan, text);
        captionsEl.appendChild(finalSpan);
      }

      // We could display interim results if we want, but keeping it simple for now
    };

    this.recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      if (event.error === 'not-allowed') {
        utils.showToast('Microphone access denied. Please check your browser permissions.', 'error');
        this.stopRecording();
      }
    };

    this.recognition.onend = () => {
      if (this.isRecording) {
        // If it stopped automatically but we still think we are recording, restart it
        // (SpeechRecognition sometimes cuts out after silence)
        try {
          this.recognition.start();
        } catch(e) {
          this.stopRecording();
        }
      }
    };
  },

  startRecording() {
    if (!this.recognition) return;
    try {
      this.recognition.start();
    } catch(e) {
      console.error(e);
      utils.showToast('Could not start recording.', 'error');
    }
  },

  stopRecording() {
    this.isRecording = false;
    if (this.recognition) {
      this.recognition.stop();
    }
    
    this.stopTimer();

    // Update UI
    document.getElementById('record-status').textContent = 'Recording Stopped';
    document.getElementById('record-pulse').classList.add('paused');
    document.getElementById('btn-start-record').disabled = false;
    document.getElementById('btn-stop-record').disabled = true;

    // Send the captured text to app state if there is any
    const fullText = this.transcriptParts.join(' ').trim();
    if (fullText.length > 0) {
      app.state.transcript = fullText;
      app.state.inputMethod = 'record';
      utils.showToast('Recording saved. Add attendees and click Process Meeting.', 'success');
      
      // Also update the paste input box so users can easily edit there too
      const pasteInput = document.getElementById('paste-input');
      if (pasteInput) {
        pasteInput.value = fullText;
        pasteInput.dispatchEvent(new Event('input')); // trigger word count
      }
    }
  },

  startTimer() {
    this.startTime = Date.now();
    const timerEl = document.getElementById('record-timer');
    
    this.timerInterval = setInterval(() => {
      const elapsed = Date.now() - this.startTime;
      const seconds = Math.floor((elapsed / 1000) % 60);
      const minutes = Math.floor((elapsed / 1000) / 60);
      
      const formatTime = (val) => val < 10 ? `0${val}` : val;
      timerEl.textContent = `${formatTime(minutes)}:${formatTime(seconds)}`;
    }, 1000);
  },

  stopTimer() {
    clearInterval(this.timerInterval);
  }
};

window.recorder = recorder;

// Init when DOM loads
document.addEventListener('DOMContentLoaded', () => {
  recorder.init();
});
