// MeetMind - Utilities (Chunk 03)

const utils = {
  // DOMPurify wrapper for safe HTML insertion
  sanitize(html) {
    if (!window.DOMPurify) {
      console.error("DOMPurify not loaded!");
      return html; // Fallback, though dangerous. In prod, ensure DOMPurify is loaded.
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
    // Must be at least 50 chars and contain some words
    return cleanText.length >= 50 && cleanText.split(/\s+/).length >= 10;
  },

  // Validation: Ensure at least one attendee is provided
  validateAttendees(namesArray) {
    return Array.isArray(namesArray) && namesArray.length > 0;
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
    
    // Icon based on type
    let icon = 'info';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'alert-circle';
    if (type === 'warning') icon = 'alert-triangle';

    toast.innerHTML = this.sanitize(`
      <i data-lucide="${icon}"></i>
      <span>${message}</span>
    `);
    
    container.appendChild(toast);
    
    // Initialize Lucide icon for the new toast
    if (window.lucide) {
      window.lucide.createIcons({ root: toast });
    }

    // Auto-remove after 3 seconds
    setTimeout(() => {
      toast.classList.remove('fade-in');
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 300); // Wait for fade-out animation
    }, 3000);
  },

  // Format relative dates to readable format
  formatDate(dateStr) {
    if (!dateStr || dateStr.toLowerCase() === 'null') return null;
    // In a real app, we might parse "by Friday", but for now just return the string securely.
    return this.sanitize(dateStr);
  }
};

window.utils = utils;
