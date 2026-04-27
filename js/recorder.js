// MeetMind - Live Recording Logic (Chunk 04)

const recorder = {
  mediaRecorder: null,
  audioChunks: [],
  isRecording: false,
  timerInterval: null,
  startTime: 0,
  stream: null,
  
  init() {
    // Check if getDisplayMedia is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      this.showUnsupportedNotice();
      return false;
    }
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
          System audio recording requires Chrome or Edge. Please use the Paste or Upload tabs instead.
        </p>
      `;
      if (window.lucide) window.lucide.createIcons();
    }
  },

  async startRecording() {
    try {
      // Request screen sharing with audio
      this.stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'browser' },
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      });

      // Check if user actually shared audio
      const audioTracks = this.stream.getAudioTracks();
      if (audioTracks.length === 0) {
        utils.showToast('You must share a tab WITH AUDIO enabled.', 'error');
        this.stream.getTracks().forEach(track => track.stop());
        return;
      }

      this.audioChunks = [];
      this.mediaRecorder = new MediaRecorder(this.stream, { mimeType: 'audio/webm' });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.processRecordedAudio(audioBlob);
      };

      // Stop recording if user clicks "Stop Sharing" in browser UI
      this.stream.getVideoTracks()[0].onended = () => {
        if (this.isRecording) {
          this.stopRecording();
        }
      };

      this.mediaRecorder.start();
      this.isRecording = true;

      // Update UI
      document.getElementById('record-status').textContent = 'Recording System Audio...';
      document.getElementById('record-pulse').classList.remove('paused');
      document.getElementById('btn-start-record').disabled = true;
      document.getElementById('btn-stop-record').disabled = false;
      document.getElementById('live-captions').classList.remove('hidden');
      document.getElementById('live-captions').innerHTML = '<span style="color: var(--color-text-secondary)">Capturing tab audio. Please keep the meeting tab active.</span>';
      
      this.startTimer();
      utils.showToast('Recording started. Audio is being captured.', 'success');

    } catch (e) {
      console.error(e);
      utils.showToast('Failed to start recording. Make sure to share a tab and enable audio.', 'error');
    }
  },

  stopRecording() {
    if (!this.isRecording || !this.mediaRecorder) return;
    
    this.mediaRecorder.stop();
    this.stream.getTracks().forEach(track => track.stop());
    this.isRecording = false;
    this.stopTimer();

    // Update UI
    document.getElementById('record-status').textContent = 'Recording Stopped';
    document.getElementById('record-pulse').classList.add('paused');
    document.getElementById('btn-start-record').disabled = false;
    document.getElementById('btn-stop-record').disabled = true;
  },

  processRecordedAudio(blob) {
    app.state.inputMethod = 'record';
    app.state.transcript = '[LIVE_RECORDING_AUDIO]';
    app.state.audioFile = new File([blob], 'recording.webm', { type: 'audio/webm' });
    app.state.audioMimeType = 'audio/webm';

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64String = e.target.result.split(',')[1];
      app.state.audioBase64 = base64String;
      utils.showToast('Recording saved. Add attendees and click Process Meeting.', 'success');
      
      // Update paste input to show it's recorded
      const pasteInput = document.getElementById('paste-input');
      if (pasteInput) {
        pasteInput.value = '[System Audio Recorded Successfully]';
      }
    };
    reader.readAsDataURL(blob);
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
