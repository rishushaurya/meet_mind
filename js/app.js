// MeetMind - Main Application Logic
// Chunks 02, 03, 04

const app = {
  state: {
    transcript: '',
    attendees: [],
    inputMethod: 'upload', // default
  },

  // Initialization
  init() {
    this.initLucideIcons();
    this.initHeroAnimations();
    this.initFloatingImage();
    this.initDragAndDrop();
    this.initChart();
    this.initAttendeeChips();
    this.initPasteCounter();

    // Check localStorage for theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
      this.updateThemeIcon(savedTheme);
    }
    
    // Show landing view by default
    this.showView('landing-view');
  },

  // Initialize Lucide icons
  initLucideIcons() {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  },

  // View Navigation
  showView(viewId) {
    const views = ['landing-view', 'input-view', 'preview-view', 'loading-view', 'dashboard-view'];
    
    // Hide all views
    views.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.add('hidden');
    });

    // Handle container visibility
    const container = document.getElementById('app-container');
    if (viewId === 'landing-view') {
      container.classList.add('hidden');
      document.getElementById('landing-view').classList.remove('hidden');
    } else {
      container.classList.remove('hidden');
      document.getElementById(viewId).classList.remove('hidden');
      
      // If switching to dashboard, re-render chart to ensure correct size
      if (viewId === 'dashboard-view') {
        setTimeout(() => this.initChart(), 100);
      }
    }

    // Scroll to top
    window.scrollTo(0, 0);
  },

  // Theme Toggling
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

  // Landing Page Animations
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

  // Input Screen Tabs
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

  // File Upload Logic
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

    // Validate size (25MB max)
    if (file.size > 25 * 1024 * 1024) {
      utils.showToast('File too large. Maximum size is 25MB.', 'error');
      return;
    }

    const validTypes = ['.txt', '.srt', '.mp3', '.mp4', '.wav', '.webm'];
    const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validTypes.includes(extension)) {
      utils.showToast('Invalid file type. Please upload a supported format.', 'error');
      return;
    }

    // Process file content for text types
    if (extension === '.txt' || extension === '.srt') {
      const reader = new FileReader();
      reader.onload = (e) => {
        let content = e.target.result;
        if (extension === '.srt') {
          // Naive SRT timestamp strip: remove lines with '-->' and lines that are pure numbers
          content = content.replace(/\\d+\\s*\\r?\\n\\d{2}:\\d{2}:\\d{2}.*-->.*\\r?\\n/g, '');
        }
        this.state.transcript = content;
        
        // Also populate paste area
        document.getElementById('paste-input').value = content;
        document.getElementById('paste-input').dispatchEvent(new Event('input'));
        
        utils.showToast('Transcript parsed successfully.', 'success');
      };
      reader.readAsText(file);
    } else {
      utils.showToast('Audio/Video file attached. Will be sent for transcription.', 'info');
      this.state.transcript = '[AUDIO_UPLOADED: ' + file.name + ']';
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
  },

  // Paste Counter
  initPasteCounter() {
    const pasteArea = document.getElementById('paste-input');
    const wordCountEl = document.getElementById('paste-word-count');
    if (!pasteArea || !wordCountEl) return;

    pasteArea.addEventListener('input', utils.debounce((e) => {
      const text = e.target.value;
      this.state.transcript = text;
      
      const words = text.trim() ? text.trim().split(/\\s+/).length : 0;
      wordCountEl.textContent = `${words} words`;
    }, 300));
  },

  // Attendee Chips
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

  // Process Meeting Flow
  handleProcessMeetingClick() {
    // 1. Validate Attendees
    if (!utils.validateAttendees(this.state.attendees)) {
      utils.showToast('Please add at least one attendee before processing.', 'error');
      return;
    }

    // 2. Validate Transcript
    let currentText = '';
    if (this.state.inputMethod === 'paste') {
      currentText = document.getElementById('paste-input').value;
    } else {
      currentText = this.state.transcript;
    }
    
    this.state.transcript = currentText;

    if (!utils.validateTranscript(currentText) && !currentText.includes('[AUDIO_UPLOADED:')) {
      utils.showToast('Transcript is too short or empty. Paste or upload a valid meeting.', 'error');
      return;
    }

    // 3. Load Preview
    const editor = document.getElementById('preview-editor');
    if (editor) {
      if (currentText.includes('[AUDIO_UPLOADED:')) {
        editor.innerHTML = `<em>${utils.sanitize(currentText)}</em><br><br>The audio file will be transcribed automatically by the AI.`;
        editor.contentEditable = "false";
      } else {
        editor.contentEditable = "true";
        // Highlight basic speaker patterns (e.g. "Speaker 1:", "Name:")
        const highlightedHTML = utils.sanitize(currentText)
          .replace(/^(.*?):/gm, '<strong style="color: var(--color-primary)">$1:</strong>')
          .replace(/\\n/g, '<br>');
        editor.innerHTML = highlightedHTML;
      }
    }

    this.showView('preview-view');
  },

  async confirmAndProcess() {
    const editor = document.getElementById('preview-editor');
    if (editor && editor.contentEditable === "true") {
      // Save any edits
      this.state.transcript = editor.innerText;
    }

    this.showView('loading-view');
    
    // Call the API via the processor layer
    const result = await processor.processTranscript(this.state.transcript, this.state.attendees);

    if (result) {
      // Save result to global state so the dashboard can read it (Chunk 06)
      this.state.result = result;
      
      // Render results to DOM
      window.dashboard.renderResults(result);
      window.charts.renderCharts(result);

      this.showView('dashboard-view');
      utils.showToast('Meeting processed successfully!', 'success');
    }
  },

  // Demo Mode Flow
  loadDemo(demoId) {
    const demoDataObj = window.demo.getDemoTranscript(demoId);
    if (!demoDataObj) {
      utils.showToast("Demo not found.", "error");
      return;
    }

    processor.isDemoMode = true;
    processor.currentDemoId = demoId;

    this.state.transcript = demoDataObj.transcript;
    this.state.attendees = [...demoDataObj.attendees];
    this.state.inputMethod = 'demo';

    // Show preview view to let user review
    const editor = document.getElementById('preview-editor');
    if (editor) {
      editor.contentEditable = "false";
      // Highlight speaker names
      const highlightedHTML = utils.sanitize(this.state.transcript)
        .replace(/^(.*?):/gm, '<strong style="color: var(--color-primary)">$1:</strong>')
        .replace(/\\n/g, '<br>');
      editor.innerHTML = highlightedHTML;
    }

    this.renderChips();
    this.showView('preview-view');
    utils.showToast(`Loaded Demo: ${demoDataObj.title}. Click Confirm to process.`, "success");
  },

  // Showcase / Dashboard functionality (from Chunk 02)
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
    const canvas = document.getElementById('talkTimeChart');
    if (!canvas || !window.Chart) return;
    if (this.chartInstance) this.chartInstance.destroy();

    const ctx = canvas.getContext('2d');
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#A0A0C0' : '#6B6B80';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

    this.chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Rahul', 'Priya', 'Amit'],
        datasets: [{
          label: 'Talk Time (%)',
          data: [45, 35, 20],
          backgroundColor: '#E1E0CC',
          borderRadius: 4,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            grid: { color: gridColor, drawBorder: false },
            ticks: { color: textColor, font: { family: 'JetBrains Mono', size: 11 } }
          },
          x: {
            grid: { display: false, drawBorder: false },
            ticks: { color: textColor, font: { family: 'Inter', size: 12 } }
          }
        }
      }
    });
  }
};

window.app = app;

document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
