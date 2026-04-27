// MeetMind - Main Application Logic (Rewrite v2)
// New: 2-step audio flow, session isolation, optional attendees

const app = {
  state: {
    transcript: '',
    attendees: [],
    inputMethod: 'upload',
    audioFile: null,
    audioMimeType: null,
    audioBase64: null,
    sessionId: null,
    result: null,
    isTranscribing: false
  },

  // ─── Initialization ────────────────────────────────────────────────────
  init() {
    this.initLucideIcons();
    this.initHeroAnimations();
    this.initFloatingImage();
    this.initDragAndDrop();
    this.initChart();
    this.initAttendeeChips();
    this.initPasteCounter();

    if (window.floatingPaths) window.floatingPaths.init();

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
      this.updateThemeIcon(savedTheme);
    }
    
    this.showView('landing-view');
  },

  initLucideIcons() {
    if (window.lucide) window.lucide.createIcons();
  },

  // ─── View Navigation ───────────────────────────────────────────────────
  showView(viewId) {
    const views = ['landing-view', 'input-view', 'preview-view', 'loading-view', 'dashboard-view'];
    
    views.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.add('hidden');
    });

    const container = document.getElementById('app-container');
    if (viewId === 'landing-view') {
      container.classList.add('hidden');
      document.getElementById('landing-view').classList.remove('hidden');
    } else {
      container.classList.remove('hidden');
      document.getElementById(viewId).classList.remove('hidden');
      
      if (viewId === 'dashboard-view') {
        setTimeout(() => {
          this.initChart();
          if (window.chatbox) window.chatbox.init();
        }, 100);
      }
    }

    window.scrollTo(0, 0);
  },

  // ─── Theme ──────────────────────────────────────────────────────────────
  toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    this.updateThemeIcon(newTheme);
  },

  updateThemeIcon(theme) {
    const iconEl = document.getElementById('theme-icon');
    if (iconEl && window.lucide) {
      const newIcon = document.createElement('i');
      newIcon.setAttribute('data-lucide', theme === 'dark' ? 'moon' : 'sun');
      newIcon.id = 'theme-icon';
      iconEl.parentNode.replaceChild(newIcon, iconEl);
      window.lucide.createIcons();
    }
  },

  // ─── Hero Animations ───────────────────────────────────────────────────
  initHeroAnimations() {
    const titleEl = document.getElementById('hero-title-text');
    if (!titleEl) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          const spans = entry.target.querySelectorAll(':scope > span');
          spans.forEach((span, index) => {
            setTimeout(() => {
              span.style.opacity = '1';
              span.style.transform = 'translateY(0)';
            }, index * 80);
          });
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    observer.observe(titleEl);
  },

  // ─── Input Tabs ─────────────────────────────────────────────────────────
  switchInputTab(type) {
    this.state.inputMethod = type;

    const buttons = document.querySelectorAll('#input-view .tabs-nav .tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    const activeBtn = Array.from(buttons).find(btn => btn.textContent.toLowerCase().includes(type.replace('-', ' ')));
    if (activeBtn) activeBtn.classList.add('active');

    document.getElementById('input-tab-upload').classList.add('hidden');
    document.getElementById('input-tab-paste').classList.add('hidden');
    document.getElementById('input-tab-record').classList.add('hidden');
    
    document.getElementById(`input-tab-${type}`).classList.remove('hidden');
  },

  // ─── File Upload ────────────────────────────────────────────────────────
  initDragAndDrop() {
    const dropZone = document.getElementById('drop-zone');
    if (!dropZone) return;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
      e.preventDefault();
      e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false);
    });

    dropZone.addEventListener('drop', (e) => {
      if (e.dataTransfer.files.length) this.handleFileSelect({ target: { files: e.dataTransfer.files } });
    }, false);
  },

  handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate size (200MB max)
    if (file.size > 200 * 1024 * 1024) {
      utils.showToast('File too large. Maximum size is 200MB.', 'error');
      return;
    }

    const validTypes = ['.txt', '.srt', '.mp3', '.mp4', '.wav', '.webm'];
    const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validTypes.includes(extension)) {
      utils.showToast('Invalid file type. Please upload a supported format.', 'error');
      return;
    }

    // Text files — read as text
    if (extension === '.txt' || extension === '.srt') {
      const reader = new FileReader();
      reader.onload = (e) => {
        let content = e.target.result;
        if (extension === '.srt') {
          content = content.replace(/\d+\s*\r?\n\d{2}:\d{2}:\d{2}.*-->\.*\r?\n/g, '');
        }
        this.state.transcript = content;
        this.state.audioFile = null;
        this.state.audioBase64 = null;
        this.state.audioMimeType = null;
        
        document.getElementById('paste-input').value = content;
        document.getElementById('paste-input').dispatchEvent(new Event('input'));
        
        utils.showToast('Transcript parsed successfully.', 'success');
      };
      reader.readAsText(file);
    } else {
      // Audio/Video files — read as base64
      // Check if too large for Gemini (>20MB raw audio)
      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > 20) {
        utils.showToast(`Audio file is ${sizeMB.toFixed(1)}MB. For best results, keep under 20MB (~20 min). Large files may time out.`, 'warning');
      }

      utils.showToast('Audio/Video file attached. Will be transcribed by AI.', 'info');
      this.state.transcript = '[AUDIO_UPLOADED: ' + file.name + ']';
      this.state.audioFile = file;
      this.state.audioMimeType = file.type || 'audio/' + extension.replace('.', '');
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64String = e.target.result.split(',')[1];
        this.state.audioBase64 = base64String;
      };
      reader.readAsDataURL(file);
    }

    // UI update
    document.getElementById('drop-zone').classList.add('hidden');
    const selectedFileEl = document.getElementById('selected-file');
    selectedFileEl.classList.remove('hidden');
    
    document.getElementById('file-name').textContent = file.name;
    document.getElementById('file-size').textContent = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
  },

  removeFile() {
    document.getElementById('selected-file').classList.add('hidden');
    document.getElementById('drop-zone').classList.remove('hidden');
    document.getElementById('file-upload').value = '';
    this.state.transcript = '';
    this.state.audioFile = null;
    this.state.audioBase64 = null;
    this.state.audioMimeType = null;
  },

  // ─── Paste Counter ──────────────────────────────────────────────────────
  initPasteCounter() {
    const pasteArea = document.getElementById('paste-input');
    const wordCountEl = document.getElementById('paste-word-count');
    if (!pasteArea || !wordCountEl) return;

    pasteArea.addEventListener('input', utils.debounce((e) => {
      const text = e.target.value;
      this.state.transcript = text;
      
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      wordCountEl.textContent = `${words} words`;
    }, 300));
  },

  // ─── Attendee Chips ─────────────────────────────────────────────────────
  initAttendeeChips() {
    const input = document.getElementById('attendee-input');
    const wrapper = document.getElementById('attendee-chips');
    if (!input || !wrapper) return;

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        const name = input.value.trim().replace(',', '');
        if (name && !this.state.attendees.includes(name)) {
          this.state.attendees.push(name);
          this.renderChips();
          input.value = '';
        }
      }
    });
  },

  renderChips() {
    const wrapper = document.getElementById('attendee-chips');
    wrapper.innerHTML = '';
    
    this.state.attendees.forEach((name, index) => {
      const chip = document.createElement('div');
      chip.className = 'chip';
      
      const text = document.createElement('span');
      utils.safeText(text, name);
      
      const btn = document.createElement('button');
      btn.innerHTML = utils.sanitize(`<i data-lucide="x" style="width:14px; height:14px;"></i>`);
      btn.onclick = () => {
        this.state.attendees.splice(index, 1);
        this.renderChips();
      };

      chip.appendChild(text);
      chip.appendChild(btn);
      wrapper.appendChild(chip);
    });

    if (window.lucide) window.lucide.createIcons();
  },

  // ─── Process Meeting Flow ───────────────────────────────────────────────
  handleProcessMeetingClick() {
    // Reset demo mode
    if (this.state.inputMethod !== 'demo' && window.processor) {
      window.processor.isDemoMode = false;
      window.processor.currentDemoId = null;
    }

    // Generate session ID for this processing flow
    this.state.sessionId = utils.generateSessionId();

    // Get current transcript
    let currentText = '';
    if (this.state.inputMethod === 'paste') {
      currentText = document.getElementById('paste-input').value;
    } else {
      currentText = this.state.transcript;
    }
    this.state.transcript = currentText;

    // If audio file — go to transcription step first
    if (this.state.audioBase64 && currentText.includes('[AUDIO_UPLOADED:')) {
      this.startAudioTranscription();
      return;
    }

    // Text transcript validation
    if (!utils.validateTranscript(currentText)) {
      utils.showToast('Transcript is too short or empty. Paste or upload a valid meeting.', 'error');
      return;
    }

    // Show preview
    this.showPreview(currentText, true);
  },

  // ─── NEW: Audio Transcription Step ──────────────────────────────────────
  async startAudioTranscription() {
    // Show loading view with transcription-specific steps
    this.showView('loading-view');
    this.state.isTranscribing = true;

    try {
      const result = await processor.transcribeAudio(
        this.state.audioBase64,
        this.state.audioMimeType
      );

      if (result && result.transcript) {
        // Save the real transcript
        this.state.transcript = result.transcript;
        
        // Auto-populate attendees from detected speakers
        if (result.speakers && result.speakers.length > 0) {
          this.state.attendees = result.speakers.map(s => {
            // Extract name from "Speaker 1 (Ravi)" → "Ravi"
            const nameMatch = s.match(/\(([^)]+)\)/);
            return nameMatch ? nameMatch[1] : s;
          });
          this.renderChips();
        }

        // Free the audio data — no longer needed
        this.state.audioBase64 = null;
        this.state.audioFile = null;
        this.state.audioMimeType = null;

        this.state.isTranscribing = false;

        // Show the REAL transcript in preview — user can now edit it!
        this.showPreview(result.transcript, true);
        utils.showToast(`Transcription complete! ${result.speakers?.length || 0} speakers detected. Review and edit before processing.`, 'success');
      } else {
        throw new Error('No transcript returned');
      }

    } catch (error) {
      console.error('Audio transcription failed:', error);
      this.state.isTranscribing = false;
      this.showView('input-view');
      utils.showToast(error.message || 'Audio transcription failed. Please try again or paste the transcript manually.', 'error');
    }
  },

  // ─── Show Preview ───────────────────────────────────────────────────────
  showPreview(transcriptText, editable) {
    const editor = document.getElementById('preview-editor');
    if (editor) {
      editor.contentEditable = editable ? "true" : "false";
      // Highlight speaker patterns (e.g. "Speaker 1:", "Ravi:")
      const highlightedHTML = utils.sanitize(transcriptText)
        .replace(/^(Speaker\s+\d+(?:\s*\([^)]*\))?)\s*:/gm, '<strong style="color: var(--color-primary)">$1:</strong>')
        .replace(/^([A-Z][a-zA-Z\s]+):/gm, '<strong style="color: var(--color-primary)">$1:</strong>')
        .replace(/\[(\d{1,2}:\d{2})\]/g, '<span style="color: var(--color-accent); font-size: 0.8em; font-family: var(--font-mono);">[$1]</span>')
        .replace(/\n/g, '<br>');
      editor.innerHTML = highlightedHTML;
    }

    this.showView('preview-view');
  },

  // ─── Confirm & Process ──────────────────────────────────────────────────
  async confirmAndProcess() {
    const editor = document.getElementById('preview-editor');
    if (editor && editor.contentEditable === "true") {
      this.state.transcript = editor.innerText;
    }

    // Reset chatbox for new analysis
    if (window.chatbox) window.chatbox.reset();

    this.showView('loading-view');
    
    // Now this is ALWAYS text — both text uploads and transcribed audio
    const result = await processor.processTranscript(
      this.state.transcript,
      this.state.attendees.length > 0 ? this.state.attendees : [] // Empty = auto-detect
    );

    if (result) {
      this.state.result = result;
      
      window.dashboard.renderResults(result);
      window.charts.renderCharts(result);

      this.showView('dashboard-view');
      utils.showToast('Meeting processed successfully!', 'success');
    }
  },

  // ─── Demo Mode ──────────────────────────────────────────────────────────
  loadDemo(demoId) {
    const demoDataObj = window.demo.getDemoTranscript(demoId);
    if (!demoDataObj) {
      utils.showToast("Demo not found.", "error");
      return;
    }

    this.state.sessionId = utils.generateSessionId();
    processor.isDemoMode = true;
    processor.currentDemoId = demoId;

    this.state.transcript = demoDataObj.transcript;
    this.state.attendees = [...demoDataObj.attendees];
    this.state.inputMethod = 'demo';

    // Show preview
    const editor = document.getElementById('preview-editor');
    if (editor) {
      editor.contentEditable = "false";
      const highlightedHTML = utils.sanitize(this.state.transcript)
        .replace(/^(.*?):/gm, '<strong style="color: var(--color-primary)">$1:</strong>')
        .replace(/\n/g, '<br>');
      editor.innerHTML = highlightedHTML;
    }

    this.renderChips();
    this.showView('preview-view');
    utils.showToast(`Loaded Demo: ${demoDataObj.title}. Click Confirm to process.`, "success");
  },

  // ─── Showcase / Floating Image ──────────────────────────────────────────
  initFloatingImage() {
    const floatingImage = document.getElementById('floating-image');
    if (!floatingImage) return;

    document.addEventListener('mousemove', (e) => {
      if (floatingImage.classList.contains('visible')) {
        floatingImage.style.left = `${e.clientX + 20}px`;
        floatingImage.style.top = `${e.clientY - 100}px`;
      }
    });
  },

  showHoverImage(id) {
    const floatingImage = document.getElementById('floating-image');
    const imgs = floatingImage.querySelectorAll('img');
    imgs.forEach(img => img.classList.remove('active'));
    
    const targetImg = document.getElementById(`hover-img-${id}`);
    if (targetImg) {
      targetImg.classList.add('active');
      floatingImage.classList.add('visible');
    }
  },

  hideHoverImage() {
    const floatingImage = document.getElementById('floating-image');
    if (floatingImage) floatingImage.classList.remove('visible');
  },

  switchPersonTab(personId, btnEl) {
    const buttons = document.querySelectorAll('#person-tabs .tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    btnEl.classList.add('active');

    const panes = document.querySelectorAll('.tab-pane');
    panes.forEach(pane => pane.classList.remove('active'));
    
    const activePane = document.getElementById(personId);
    if (activePane) activePane.classList.add('active');
  },

  initChart() {
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }
  }
};

window.app = app;

document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
