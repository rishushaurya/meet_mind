// MeetMind - Post-AI Correction Chatbox (New)
// Allows user to refine AI results via natural language instructions

const chatbox = {
  maxCorrections: 8,
  correctionCount: 0,
  isProcessing: false,

  init() {
    const input = document.getElementById('chatbox-input');
    const sendBtn = document.getElementById('chatbox-send');
    if (!input || !sendBtn) return;

    // Enter to send
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.send();
      }
    });

    // Button click
    sendBtn.addEventListener('click', () => this.send());

    // Character counter
    input.addEventListener('input', () => {
      const counter = document.getElementById('chatbox-counter');
      if (counter) {
        counter.textContent = `${input.value.length}/500`;
      }
    });
  },

  async send() {
    if (this.isProcessing) return;

    const input = document.getElementById('chatbox-input');
    const instruction = input?.value?.trim();
    
    if (!instruction || instruction.length < 3) {
      utils.showToast('Please type a clear instruction (e.g., "Change Ravi\'s deadline to Friday")', 'warning');
      return;
    }

    if (this.correctionCount >= this.maxCorrections) {
      utils.showToast(`Maximum ${this.maxCorrections} corrections reached. Process a new meeting for more changes.`, 'warning');
      return;
    }

    if (!app.state.result) {
      utils.showToast('No meeting results to refine. Process a meeting first.', 'error');
      return;
    }

    this.isProcessing = true;
    this.setUIState('loading');

    // Add user message to chat history
    this.addMessage(instruction, 'user');
    input.value = '';
    const counter = document.getElementById('chatbox-counter');
    if (counter) counter.textContent = '0/500';

    try {
      const result = await processor.refineResults(app.state.result, instruction);
      
      if (result) {
        // Update app state
        app.state.result = result;
        
        // Re-render dashboard
        window.dashboard.renderResults(result);
        window.charts.renderCharts(result);

        this.correctionCount++;
        this.addMessage(`✓ Done! (${this.correctionCount}/${this.maxCorrections} corrections used)`, 'system');
        
        if (window.lucide) window.lucide.createIcons();
      } else {
        this.addMessage('Failed to apply change. Please try rephrasing.', 'error');
      }

    } catch (error) {
      console.error('Chatbox refinement error:', error);
      this.addMessage(`Error: ${error.message || 'Failed to apply change.'}`, 'error');
    } finally {
      this.isProcessing = false;
      this.setUIState('idle');
    }
  },

  addMessage(text, type = 'system') {
    const history = document.getElementById('chatbox-history');
    if (!history) return;

    // Show history area if first message
    history.classList.remove('hidden');

    const msg = document.createElement('div');
    msg.className = `chatbox-message chatbox-${type}`;

    const icon = type === 'user' ? 'user' : type === 'error' ? 'alert-circle' : 'sparkles';
    
    msg.innerHTML = utils.sanitize(`
      <i data-lucide="${icon}" style="width:14px;height:14px;flex-shrink:0;margin-top:2px;"></i>
      <span>${text}</span>
    `);
    
    history.appendChild(msg);
    history.scrollTop = history.scrollHeight;

    if (window.lucide) window.lucide.createIcons({ root: msg });
  },

  setUIState(state) {
    const sendBtn = document.getElementById('chatbox-send');
    const input = document.getElementById('chatbox-input');
    
    if (state === 'loading') {
      if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.innerHTML = '<div class="chatbox-spinner"></div>';
      }
      if (input) input.disabled = true;
    } else {
      if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.innerHTML = utils.sanitize('<i data-lucide="send" style="width:16px;height:16px;"></i>');
        if (window.lucide) window.lucide.createIcons({ root: sendBtn });
      }
      if (input) input.disabled = false;
    }
  },

  // Reset state when starting a new meeting
  reset() {
    this.correctionCount = 0;
    this.isProcessing = false;
    const history = document.getElementById('chatbox-history');
    if (history) {
      history.innerHTML = '';
      history.classList.add('hidden');
    }
    this.setUIState('idle');
  }
};

window.chatbox = chatbox;
