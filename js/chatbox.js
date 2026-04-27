// MeetMind - Post-AI Correction Chatbox (New)
// Allows user to refine AI results via natural language instructions

const chatbox = {
  activeTab: 'ask',
  maxCorrections: 8,
  correctionCount: 0,
  isProcessing: false,

  switchTab(tab) {
    if (this.isProcessing) return;
    this.activeTab = tab;
    
    // Update tab buttons
    document.getElementById('chat-tab-ask')?.classList.toggle('active', tab === 'ask');
    document.getElementById('chat-tab-apply')?.classList.toggle('active', tab === 'apply');
    
    // Update history visibility
    const askHistory = document.getElementById('chatbox-ask-history');
    const applyHistory = document.getElementById('chatbox-apply-history');
    
    if (askHistory) askHistory.classList.toggle('hidden', tab !== 'ask');
    if (applyHistory) applyHistory.classList.toggle('hidden', tab !== 'apply');
    
    // Update input placeholder and counter
    const input = document.getElementById('chatbox-input');
    const counter = document.getElementById('chatbox-counter');
    if (input) {
      input.placeholder = tab === 'ask' ? 'Ask a question...' : 'e.g. "Change Host to Amit"';
      input.maxLength = tab === 'ask' ? 500 : 1000;
      input.value = '';
    }
    if (counter) {
      counter.textContent = `0/${tab === 'ask' ? 500 : 1000}`;
    }
  },

  openWithText(text) {
    const wrapper = document.getElementById('chatbox-wrapper');
    if (wrapper) wrapper.classList.add('open');
    this.switchTab('apply');
    const input = document.getElementById('chatbox-input');
    if (input) {
        input.value = text;
        input.focus();
        const counter = document.getElementById('chatbox-counter');
        if (counter) counter.textContent = `${text.length}/1000`;
    }
  },

  askSuggestion(text) {
    this.switchTab('ask');
    const input = document.getElementById('chatbox-input');
    if (input) {
      input.value = text;
    }
    const suggestions = document.getElementById('chatbox-suggestions');
    if (suggestions) suggestions.classList.add('hidden');
    this.send();
  },

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
        counter.textContent = `${input.value.length}/1000`;
      }
    });
  },

  send() {
    if (this.activeTab === 'ask') this.sendAsk();
    else this.sendApply();
  },

  async sendAsk() {
    if (this.isProcessing) return;

    const input = document.getElementById('chatbox-input');
    const question = input?.value?.trim();
    
    if (!question || question.length < 3) {
      utils.showToast('Please type a question.', 'warning');
      return;
    }

    if (!app.state.result || !app.state.transcript) {
      utils.showToast('No meeting data to ask about. Process a meeting first.', 'error');
      return;
    }

    this.isProcessing = true;
    this.setUIState('loading');

    this.addMessage(question, 'user', 'ask');
    input.value = '';
    const counter = document.getElementById('chatbox-counter');
    if (counter) counter.textContent = '0/500';

    try {
      const response = await processor.chatAboutMeeting(question, app.state.transcript, app.state.result);
      if (response && response.answer) {
        this.addMessage(response.answer, 'system', 'ask');
      } else {
        this.addMessage('Sorry, I could not answer that question.', 'error', 'ask');
      }
    } catch (error) {
      console.error('Chat Q&A error:', error);
      this.addMessage(`Error: ${error.message}`, 'error', 'ask');
    } finally {
      this.isProcessing = false;
      this.setUIState('idle');
    }
  },

  async sendApply() {
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

    // Check if this is a PDF/export command — handle locally, no API call
    if (this.isPDFCommand(instruction)) {
      this.handlePDFCommand(instruction);
      return;
    }

    this.isProcessing = true;
    this.setUIState('loading');

    // Add user message to chat history
    this.addMessage(instruction, 'user', 'apply');
    input.value = '';
    const counter = document.getElementById('chatbox-counter');
    if (counter) counter.textContent = '0/1000';

    try {
      const result = await processor.refineResults(app.state.result, instruction);
      
      if (result) {
        // Update app state
        app.state.result = result;
        
        try {
          // Re-render dashboard
          if (window.dashboard && typeof window.dashboard.renderResults === 'function') {
            window.dashboard.renderResults(result);
          }
          if (window.charts && typeof window.charts.renderCharts === 'function') {
            window.charts.renderCharts(result);
          }
        } catch (renderErr) {
          console.error('Dashboard re-rendering failed:', renderErr);
        }

        this.correctionCount++;
        this.addMessage(`✓ Done! (${this.correctionCount}/${this.maxCorrections} corrections used)`, 'system', 'apply');
        
        if (window.lucide) window.lucide.createIcons();
      } else {
        this.addMessage('Failed to apply change. Please try rephrasing.', 'error', 'apply');
      }

    } catch (error) {
      console.error('Chatbox refinement error:', error);
      this.addMessage(`Error: ${error.message || 'Failed to apply change.'}`, 'error', 'apply');
    } finally {
      this.isProcessing = false;
      this.setUIState('idle');
    }
  },

  addMessage(text, type = 'system', tab = this.activeTab) {
    const historyId = tab === 'ask' ? 'chatbox-ask-history' : 'chatbox-apply-history';
    const history = document.getElementById(historyId);
    if (!history) return;

    // Show history area if first message
    history.classList.remove('hidden');

    const msg = document.createElement('div');
    msg.className = `chatbox-message chatbox-${type}`;

    const icon = type === 'user' ? 'user' : type === 'error' ? 'alert-circle' : 'sparkles';
    
    const sanitizedText = utils.sanitize(text);
    const formattedText = sanitizedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    msg.innerHTML = `
      <i data-lucide="${icon}" style="width:14px;height:14px;flex-shrink:0;margin-top:2px;"></i>
      <span>${formattedText}</span>
    `;
    
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

  isPDFCommand(text) {
    const lower = text.toLowerCase().trim();
    return lower.startsWith('pdf') || 
           lower.startsWith('export pdf') || 
           lower.startsWith('download pdf') ||
           lower.startsWith('generate pdf') ||
           lower.startsWith('custom pdf');
  },

  handlePDFCommand(instruction) {
    const lower = instruction.toLowerCase().trim();
    
    this.addMessage(instruction, 'user', 'apply');
    
    const input = document.getElementById('chatbox-input');
    if (input) input.value = '';
    const counter = document.getElementById('chatbox-counter');
    if (counter) counter.textContent = '0/1000';

    let options = { type: 'full' };
    
    if (lower.includes('summary only') || lower === 'pdf summary') {
      options.type = 'summary';
    } else if (lower.includes('email') || lower.includes('emails')) {
      options.type = 'emails';
    } else if (lower.includes('deadline')) {
      options.type = 'deadlines';
    } else if (lower.includes('urgent')) {
      options.type = 'priority';
      options.priorityFilter = 'urgent';
    } else if (lower.includes('important')) {
      options.type = 'priority';
      options.priorityFilter = 'important';
    } else {
      const data = app.state.result;
      if (data && data.attendees) {
        const names = data.attendees.map(a => a.name.toLowerCase());
        const matchedNames = names.filter(n => lower.includes(n.split(' ')[0].toLowerCase()) || lower.includes(n.split('(')[0].trim().toLowerCase()));
        if (matchedNames.length > 0) {
          options.type = 'filtered';
          options.personFilter = matchedNames;
        }
      }
    }
    
    if (window.exports && typeof window.exports.exportCustomPDF === 'function') {
      window.exports.exportCustomPDF(options);
    } else if (window.exports && typeof window.exports.exportPDF === 'function') {
      window.exports.exportPDF();
    } else {
      this.addMessage('Export module not loaded. Please refresh the page.', 'error', 'apply');
      return;
    }
    this.addMessage('✓ Generating custom PDF...', 'system', 'apply');
  },

  // Reset state when starting a new meeting
  reset() {
    this.correctionCount = 0;
    this.isProcessing = false;
    
    const askHistory = document.getElementById('chatbox-ask-history');
    if (askHistory) {
      askHistory.innerHTML = `
        <div class="chatbox-message chatbox-system">
          <i data-lucide="sparkles" style="width:14px;height:14px;flex-shrink:0;margin-top:2px;"></i>
          <span>Ask me anything about the meeting! (e.g. "What did Ravi say about the deadline?")</span>
        </div>
      `;
    }

    const applyHistory = document.getElementById('chatbox-apply-history');
    if (applyHistory) {
      applyHistory.innerHTML = '';
      applyHistory.classList.add('hidden');
    }
    
    this.switchTab('ask');
    this.setUIState('idle');
  }
};

window.chatbox = chatbox;
