// MeetMind - API Processor Layer (Chunk 05)

const processor = {
  isDemoMode: false,
  currentDemoId: null,

  async processTranscript(transcript, attendees) {
    this.showLoadingStep(0); // "Reading transcript..."

    try {
      // Demo Mode
      if (this.isDemoMode && this.currentDemoId) {
        return await this.simulateDemoProcessing();
      }

      // Real API Call
      const response = await this.callAPI(transcript, attendees);
      return response;

    } catch (error) {
      this.handleAPIError(error);
      return null;
    }
  },

  async callAPI(transcript, attendees) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    this.showLoadingStep(1); // "Identifying speakers..."

    try {
      const response = await fetch('/api/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          transcript: transcript,
          attendees: attendees,
          inputMethod: app.state.inputMethod
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      this.showLoadingStep(2); // "Extracting action items..."

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('RATE_LIMIT');
        }
        if (response.status === 400) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || 'BAD_REQUEST');
        }
        throw new Error('SERVER_ERROR');
      }

      this.showLoadingStep(3); // "Building your cards..."
      
      const data = await response.json();
      return data;

    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('TIMEOUT');
      }
      throw error;
    }
  },

  handleAPIError(error) {
    console.error("API Processing Error:", error);
    
    // Hide loading screen and go back to preview or input
    app.showView('preview-view');
    
    if (error.message === 'TIMEOUT') {
      utils.showToast("Request took too long. The AI might be overloaded. Try again or use Demo mode.", "error");
    } else if (error.message === 'RATE_LIMIT') {
      utils.showToast("Too many requests right now. Please wait a moment and try again.", "warning");
    } else if (error.message === 'BAD_REQUEST' || error.message.includes('Minimum')) {
      utils.showToast("Invalid transcript: " + error.message, "error");
    } else {
      utils.showToast("AI processing failed. Check your internet connection or try Demo mode.", "error");
    }
  },

  async simulateDemoProcessing() {
    return new Promise((resolve) => {
      let step = 0;
      const steps = setInterval(() => {
        step++;
        if (step < 4) {
          this.showLoadingStep(step);
        } else {
          clearInterval(steps);
          const data = window.demo.getDemoResponse(this.currentDemoId);
          resolve(data);
        }
      }, 1000); // 1 sec per step for dramatic effect
    });
  },

  showLoadingStep(stepIndex) {
    const statusEl = document.getElementById('loading-status');
    if (!statusEl) return;
    
    const steps = [
      "Reading transcript...",
      "Identifying speakers...",
      "Extracting action items...",
      "Building your cards..."
    ];
    
    if (steps[stepIndex]) {
      utils.safeText(statusEl, steps[stepIndex]);
    }
  }
};

window.processor = processor;
