// MeetMind - Export and Sharing Logic (Chunk 06)

const exportsObj = {
  
  copyAll() {
    const data = app.state.result;
    if (!data) return;

    let text = "MEETMIND RESULTS\n";
    text += "Meeting: " + (data.meeting_summary || '') + "\n";
    text += "Health Score: " + (data.health_score?.score || 'N/A') + "/10\n\n";

    data.attendees.forEach(person => {
      text += person.name.toUpperCase() + "\n";
      if (!person.action_items || person.action_items.length === 0) {
        text += "- No action items\n";
      } else {
        person.action_items.forEach((item, index) => {
          text += this.formatActionText(item, person, index);
        });
      }
      text += "\n";
    });

    this.writeToClipboard(text);
  },

  copyPerson(personIndex) {
    const data = app.state.result;
    if (!data || !data.attendees[personIndex]) return;

    const person = data.attendees[personIndex];
    let text = person.name.toUpperCase() + " - ACTION ITEMS\n\n";

    if (!person.action_items || person.action_items.length === 0) {
      text += "- No action items\n";
    } else {
      person.action_items.forEach((item, index) => {
        text += this.formatActionText(item, person, index);
      });
    }

    this.writeToClipboard(text);
  },

  copyWhatsApp() {
    const data = app.state.result;
    if (!data) return;

    let text = "*Meeting Action Items*\n\n";

    data.attendees.forEach(person => {
      text += "*" + person.name + ":*\n";
      if (!person.action_items || person.action_items.length === 0) {
        text += "- No action items\n";
      } else {
        person.action_items.forEach((item, index) => {
          const stateKey = "meetmind-check-" + data.attendees.indexOf(person) + "-" + index;
          const isChecked = sessionStorage.getItem(stateKey) === 'true';
          const box = isChecked ? '[x]' : '[ ]';
          const priority = item.priority ? " (" + item.priority.toUpperCase() + ")" : '';
          const deadline = item.deadline ? " (by " + item.deadline + ")" : '';
          text += "- " + box + " " + item.task + priority + deadline + "\n";
        });
      }
      text += "\n";
    });

    this.writeToClipboard(text);
  },

  formatActionText(item, person, index) {
    let stateKey = '';
    if (app.state.result) {
      const pIndex = app.state.result.attendees.indexOf(person);
      stateKey = "meetmind-check-" + pIndex + "-" + index;
    }
    const isChecked = stateKey ? sessionStorage.getItem(stateKey) === 'true' : false;
    const box = isChecked ? '[x]' : '[ ]';
    const priority = item.priority ? " [" + item.priority.toUpperCase() + "]" : '';
    const deadline = item.deadline ? " (by " + item.deadline + ")" : '';
    
    return "- " + box + " " + item.task + priority + deadline + "\n";
  },

  writeToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        utils.showToast("Copied to clipboard!", "success");
      }).catch(err => {
        console.error('Could not copy text: ', err);
        utils.showToast("Failed to copy text.", "error");
      });
    } else {
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        utils.showToast("Copied to clipboard!", "success");
      } catch (err) {
        utils.showToast("Failed to copy text.", "error");
      }
      document.body.removeChild(textArea);
    }
  },

  exportPDF() {
    if (!window.html2pdf) {
      utils.showToast("PDF Library not loaded. Check your internet connection.", "error");
      return;
    }

    const element = document.getElementById('dashboard-view');
    if (!element) return;

    utils.showToast("Generating PDF... Please wait.", "info");

    // Temporarily hide action buttons so they don't appear in PDF
    const actionBtns = document.querySelector('.action-bar');
    if (actionBtns) actionBtns.style.display = 'none';
    
    // Also hide per-person action buttons
    const personBtns = document.querySelectorAll('.person-actions');
    personBtns.forEach(btn => btn.style.display = 'none');

    const opt = {
      margin:       10,
      filename:     'MeetMind-Results.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
      // Restore buttons
      if (actionBtns) actionBtns.style.display = 'flex';
      personBtns.forEach(btn => btn.style.display = 'flex');
      utils.showToast("PDF downloaded successfully!", "success");
    });
  },

  showEmailPreview(personIndex) {
    const data = app.state.result;
    if (!data || !data.attendees[personIndex]) return;

    const person = data.attendees[personIndex];
    
    let bodyText = "Hi " + person.name + ",\n\n";
    bodyText += "Here are your action items from the " + (data.meeting_type || 'recent') + " meeting:\n\n";
    
    if (!person.action_items || person.action_items.length === 0) {
      bodyText += "You have no specific action items from this meeting.\n\n";
    } else {
      person.action_items.forEach(item => {
        const priority = item.priority ? " [" + item.priority.toUpperCase() + "]" : '';
        const deadline = item.deadline ? " (Due: " + item.deadline + ")" : '';
        const dep = item.depends_on ? " (Needs: " + item.depends_on + ")" : '';
        bodyText += "\u2022 " + item.task + priority + deadline + dep + "\n";
      });
      bodyText += "\n";
    }

    bodyText += "Meeting Summary:\n" + data.meeting_summary + "\n\nBest,\nMeetMind AI";

    // Ensure modal exists in DOM
    let modal = document.getElementById('email-modal');
    if (!modal) {
      this.createEmailModal();
      modal = document.getElementById('email-modal');
    }

    document.getElementById('email-to').textContent = "To: " + person.name + " <" + person.name.toLowerCase() + "@team.com>";
    document.getElementById('email-subject').textContent = "Subject: Action Items from Meeting";
    document.getElementById('email-body').textContent = bodyText;

    modal.classList.remove('hidden');
  },

  closeEmailPreview() {
    const modal = document.getElementById('email-modal');
    if (modal) modal.classList.add('hidden');
  },

  copyEmailContent() {
    const text = document.getElementById('email-body').textContent;
    this.writeToClipboard(text);
    this.closeEmailPreview();
  },

  createEmailModal() {
    const modal = document.createElement('div');
    modal.id = 'email-modal';
    modal.className = 'modal-backdrop hidden';
    modal.innerHTML = '<div class="modal-content">' +
      '<div class="modal-header">' +
        '<h3>Email Preview</h3>' +
        '<button class="btn btn-icon" onclick="exports.closeEmailPreview()">' +
          '<i data-lucide="x"></i>' +
        '</button>' +
      '</div>' +
      '<div class="modal-body">' +
        '<div class="email-header-line" id="email-to">To: </div>' +
        '<div class="email-header-line" id="email-subject">Subject: </div>' +
        '<div class="email-body-content" id="email-body"></div>' +
      '</div>' +
      '<div class="modal-footer">' +
        '<button class="btn btn-secondary" onclick="exports.closeEmailPreview()">Close</button>' +
        '<button class="btn btn-primary" onclick="exports.copyEmailContent()">Copy Email Content</button>' +
      '</div>' +
    '</div>';

    document.body.appendChild(modal);

    // Add modal styles
    const style = document.createElement('style');
    style.textContent = '.modal-backdrop {' +
      'position: fixed; top: 0; left: 0; width: 100%; height: 100%;' +
      'background: rgba(0,0,0,0.5); z-index: 1000;' +
      'display: flex; align-items: center; justify-content: center;' +
      'backdrop-filter: blur(4px);' +
    '}' +
    '.modal-backdrop.hidden { display: none; }' +
    '.modal-content {' +
      'background: var(--color-surface-solid);' +
      'border: 1px solid var(--color-border);' +
      'border-radius: 12px; width: 90%; max-width: 500px;' +
      'box-shadow: 0 20px 40px rgba(0,0,0,0.2);' +
      'overflow: hidden;' +
    '}' +
    '.modal-header {' +
      'display: flex; justify-content: space-between; align-items: center;' +
      'padding: 16px 20px; border-bottom: 1px solid var(--color-border);' +
      'background: var(--color-surface-hover);' +
    '}' +
    '.modal-header h3 { margin: 0; font-size: 16px; font-weight: 500; }' +
    '.modal-body { padding: 20px; font-family: var(--font-mono); font-size: 13px; }' +
    '.email-header-line { margin-bottom: 8px; color: var(--color-text-secondary); }' +
    '.email-body-content {' +
      'margin-top: 16px; padding: 16px;' +
      'background: var(--color-bg); border-radius: 8px;' +
      'white-space: pre-wrap; line-height: 1.5; color: var(--color-text);' +
    '}' +
    '.modal-footer {' +
      'display: flex; justify-content: flex-end; gap: 12px;' +
      'padding: 16px 20px; border-top: 1px solid var(--color-border);' +
    '}';
    document.head.appendChild(style);

    if (window.lucide) window.lucide.createIcons();
  }
};

window.exports = exportsObj;
