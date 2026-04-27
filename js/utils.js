// MeetMind - Utilities (Chunk 03 — Updated v2)

const utils = {
  // DOMPurify wrapper for safe HTML insertion
  sanitize(html) {
    if (!window.DOMPurify) {
      console.error("DOMPurify not loaded!");
      return html;
    }
    return window.DOMPurify.sanitize(html);
  },

  // Safely set text content (prevents XSS by avoiding innerHTML entirely)
  safeText(element, text) {
    if (element) {
      element.textContent = text;
    }
  },

  // Validation: Ensure transcript has enough content
  validateTranscript(text) {
    if (!text || typeof text !== 'string') return false;
    const cleanText = text.trim();
    return cleanText.length >= 50 && cleanText.split(/\s+/).length >= 10;
  },

  // Validation: Attendees are now OPTIONAL — this always returns true
  // Kept for API compatibility but no longer blocks processing
  validateAttendees(namesArray) {
    return true; // Attendees are optional — AI auto-detects
  },

  // Generate unique session ID for request isolation
  generateSessionId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback for older browsers
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },

  // Generate unique ID for DOM elements
  generateId() {
    return 'id_' + Math.random().toString(36).substr(2, 9);
  },

  // Debounce helper to prevent rapid-fire API calls
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Toast Notification System
  showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type} fade-in`;
    
    let icon = 'info';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'alert-circle';
    if (type === 'warning') icon = 'alert-triangle';

    toast.innerHTML = this.sanitize(`
      <i data-lucide="${icon}"></i>
      <span>${message}</span>
    `);
    
    container.appendChild(toast);
    
    if (window.lucide) {
      window.lucide.createIcons({ root: toast });
    }

    setTimeout(() => {
      toast.classList.remove('fade-in');
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  },

  // Format relative dates
  formatDate(dateStr) {
    if (!dateStr || dateStr.toLowerCase() === 'null') return null;
    return this.sanitize(dateStr);
  }
};

window.utils = utils;
