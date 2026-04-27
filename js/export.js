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
    this.exportCustomPDF({ type: 'full' });
  },

  exportCustomPDF(options = {}) {
    const data = app.state.result;
    if (!data) {
      if (window.utils) window.utils.showToast("No meeting data available to export.", "error");
      return;
    }
    
    let config = { includeSummary: true, includePersonCards: true, includeCharts: true, includeEmails: false };
    
    switch (options.type) {
      case 'summary':
        config = { includeSummary: true, includePersonCards: false, includeCharts: false, includeEmails: false };
        break;
      case 'emails':
        config = { includeSummary: false, includePersonCards: false, includeCharts: false, includeEmails: true };
        break;
      case 'deadlines':
        config = { includeSummary: true, includePersonCards: true, includeCharts: false, includeEmails: false, filterDeadlines: true };
        break;
      case 'priority':
        config = { includeSummary: true, includePersonCards: true, includeCharts: false, includeEmails: false, filterPriority: options.priorityFilter };
        break;
      case 'filtered':
        config = { includeSummary: true, includePersonCards: true, includeCharts: true, includeEmails: true, personFilter: options.personFilter };
        break;
      default:
        // full config is default
        break;
    }
    
    this._generatePDF(data, config, options);
  },

  _generatePDF(data, config, options) {
    // If jsPDF isn't loaded yet, try loading it on-demand
    if (!window.jspdf) {
      if (window.utils) window.utils.showToast("Loading PDF library... Please wait.", "info");
      this._loadJsPdf().then(() => {
        if (window.jspdf) {
          this._buildAndDownloadPDF(data, config, options);
        } else {
          if (window.utils) window.utils.showToast("PDF library could not be loaded. Check your internet connection or try disabling ad-blockers.", "error");
        }
      });
      return;
    }

    this._buildAndDownloadPDF(data, config, options);
  },

  _loadJsPdf() {
    const cdnUrls = [
      'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.2/jspdf.umd.min.js',
      'https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js',
      'https://unpkg.com/jspdf@2.5.2/dist/jspdf.umd.min.js'
    ];

    return new Promise((resolve) => {
      let index = 0;
      const tryNext = () => {
        if (index >= cdnUrls.length || window.jspdf) {
          resolve();
          return;
        }
        const script = document.createElement('script');
        script.src = cdnUrls[index];
        script.onload = () => {
          console.log('[MeetMind] jsPDF loaded from:', cdnUrls[index]);
          resolve();
        };
        script.onerror = () => {
          console.warn('[MeetMind] Failed to load jsPDF from:', cdnUrls[index]);
          index++;
          tryNext();
        };
        document.head.appendChild(script);
      };
      tryNext();
    });
  },

  _buildAndDownloadPDF(data, config, options) {
    if (window.utils) window.utils.showToast("Generating custom PDF... Please wait.", "info");

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const usableWidth = pageWidth - margin * 2;
    let y = margin;

    // Helper: Check page overflow and add new page if needed
    const checkPage = (needed = 10) => {
      if (y + needed > pageHeight - margin) {
        doc.addPage();
        y = margin;
        return true;
      }
      return false;
    };

    // Helper: Print wrapped text and update y
    const printText = (text, size, isBold, color, xOffset = 0, lineSpacing = 1.5, addYAfter = 0) => {
      if (!text) return;
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      doc.setFontSize(size);
      doc.setTextColor(color[0], color[1], color[2]);
      
      const lines = doc.splitTextToSize(text, usableWidth - xOffset);
      const lineHeight = doc.getLineHeight() * lineSpacing / doc.internal.scaleFactor;
      
      checkPage(lines.length * lineHeight + addYAfter);
      
      doc.text(lines, margin + xOffset, y);
      y += lines.length * lineHeight + addYAfter;
    };

    // --- Header ---
    printText('MeetMind Executive Summary', 22, true, [111, 76, 255], 0, 1.2, 2);
    printText(`Generated on ${new Date().toLocaleDateString()} | Type: ${data.meeting_type || 'General'}`, 10, false, [100, 100, 100], 0, 1.2, 5);
    
    doc.setDrawColor(111, 76, 255);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    // --- Meeting Summary ---
    if (config.includeSummary) {
      printText('Meeting Overview', 14, true, [51, 51, 51], 0, 1.2, 3);
      printText(data.meeting_summary || 'No summary available.', 11, false, [68, 68, 68], 0, 1.5, 6);
      
      // Health Score Box
      checkPage(20);
      doc.setFillColor(248, 249, 250);
      doc.setDrawColor(111, 76, 255);
      doc.setLineWidth(1);
      doc.rect(margin, y, usableWidth, 20, 'F');
      doc.line(margin, y, margin, y + 20); // left border
      
      y += 6;
      printText(`Health Score: ${data.health_score?.score || 'N/A'}/10`, 11, true, [51, 51, 51], 5, 1.2, 1);
      printText(data.health_score?.reasoning || '', 9, false, [102, 102, 102], 5, 1.2, 10);
      y += 8; // extra space after box
      
      // Bulleted lists
      const printList = (title, items, titleColor) => {
        if (!items || items.length === 0) return;
        checkPage(15);
        printText(title, 12, true, titleColor, 0, 1.2, 3);
        items.forEach(item => {
           printText(`\u2022 ${item}`, 10, false, [68, 68, 68], 5, 1.5, 2);
        });
        y += 4;
      };

      printList('Decisions Made', data.decisions_made, [51, 51, 51]);
      printList('Unresolved Questions', data.unresolved_questions, [51, 51, 51]);
      printList('Topics Not Discussed', data.topics_not_discussed, [217, 119, 6]);
      printList('Follow-up Suggestions', data.follow_up_suggestions, [5, 150, 105]);
    }

    // --- Person Cards ---
    if (config.includePersonCards) {
      if (config.includeSummary) checkPage(pageHeight); // Try to start on a new page if we had a summary
      
      printText('Action Items by Attendee', 16, true, [51, 51, 51], 0, 1.2, 5);

      let filteredAttendees = data.attendees || [];
      if (config.personFilter) {
        filteredAttendees = filteredAttendees.filter(a => {
          const nameLower = a.name.toLowerCase();
          return config.personFilter.some(f => nameLower.includes(f));
        });
      }

      if (filteredAttendees.length === 0) {
         printText('No attendees matched the current filter.', 10, false, [100, 100, 100], 0, 1.2, 0);
      }

      filteredAttendees.forEach((person, personIndex) => {
        let actionItems = person.action_items || [];
        if (config.filterDeadlines) {
          actionItems = actionItems.filter(item => item.deadline && item.deadline.trim() !== '');
        }
        if (config.filterPriority) {
          actionItems = actionItems.filter(item => item.priority && item.priority.toLowerCase() === config.filterPriority);
        }

        if ((config.filterDeadlines || config.filterPriority) && actionItems.length === 0) return;

        checkPage(30);
        
        // Person Header
        doc.setFillColor(241, 245, 249);
        doc.rect(margin, y, usableWidth, 10, 'F');
        y += 7;
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(15, 23, 42);
        doc.text(person.name, margin + 5, y);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        const statsText = `Talk Time: ${person.talk_percentage || 0}% | Questions: ${person.questions_asked || 0}`;
        doc.text(statsText, margin + usableWidth - 5 - doc.getTextWidth(statsText), y);
        y += 8;

        if (person.key_quotes && person.key_quotes.length > 0) {
           printText(`"${person.key_quotes[0]}"`, 9, false, [71, 85, 105], 5, 1.2, 4);
        }

        if (actionItems.length === 0) {
          printText('No action items matching criteria.', 10, false, [148, 163, 184], 5, 1.2, 4);
        } else {
          actionItems.forEach((item, itemIndex) => {
            const origItemIndex = person.action_items ? person.action_items.findIndex(i => i.task === item.task) : itemIndex;
            const stateKey = `meetmind-check-${data.attendees.indexOf(person)}-${origItemIndex}`;
            const isChecked = sessionStorage.getItem(stateKey) === 'true';
            
            checkPage(15);
            
            // Checkmark
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            if (isChecked) {
                doc.setTextColor(34, 197, 94);
                doc.text('v', margin + 5, y); // simple checkmark representation
            } else {
                doc.setTextColor(203, 213, 225);
                doc.text('O', margin + 5, y);
            }
            
            // Construct task string
            let taskString = "";
            let pColor = [148, 163, 184];
            if (item.priority?.toLowerCase() === 'urgent') pColor = [239, 68, 68];
            if (item.priority?.toLowerCase() === 'important') pColor = [245, 158, 11];
            if (item.priority?.toLowerCase() === 'normal') pColor = [34, 197, 94];
            
            let currentX = margin + 12;
            
            if (item.priority) {
                doc.setTextColor(pColor[0], pColor[1], pColor[2]);
                const pText = `[${item.priority.toUpperCase()}] `;
                doc.text(pText, currentX, y);
                currentX += doc.getTextWidth(pText);
            }
            
            doc.setTextColor(51, 65, 85);
            doc.setFont('helvetica', 'normal');
            
            // Handle long task text wrapping manually alongside deadline
            const deadlineText = item.deadline ? ` (Due: ${item.deadline})` : '';
            const fullText = item.task + deadlineText;
            const lines = doc.splitTextToSize(fullText, usableWidth - (currentX - margin));
            
            doc.text(lines, currentX, y);
            y += lines.length * 5 + 1; // approx line height
            
            if (item.depends_on) {
                printText(`> Depends on: ${item.depends_on}`, 9, false, [139, 92, 246], 12, 1.2, 1);
            }
            if (item.source_quote) {
                printText(`"${item.source_quote}"`, 8, false, [100, 116, 139], 15, 1.2, 1);
            }
            y += 3;
          });
        }
        y += 5;
      });
    }

    // --- Emails ---
    if (config.includeEmails) {
      checkPage(pageHeight); // New page
      printText('Email Previews', 16, true, [51, 51, 51], 0, 1.2, 5);

      let filteredAttendees = data.attendees || [];
      if (config.personFilter) {
        filteredAttendees = filteredAttendees.filter(a => {
          const nameLower = a.name.toLowerCase();
          return config.personFilter.some(f => nameLower.includes(f));
        });
      }

      filteredAttendees.forEach(person => {
        checkPage(50);
        
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.3);
        
        let startY = y;
        y += 5;
        
        printText(`To: ${person.name}`, 10, true, [51, 65, 85], 5, 1.2, 2);
        printText(`Subject: Action Items from Meeting`, 10, true, [51, 65, 85], 5, 1.2, 5);
        
        doc.line(margin, y, pageWidth - margin, y);
        y += 5;
        
        printText(`Hi ${person.name},`, 10, false, [51, 65, 85], 5, 1.2, 3);
        printText(`Here are your action items from the ${data.meeting_type || 'recent'} meeting:`, 10, false, [51, 65, 85], 5, 1.2, 3);
        
        let actionItems = person.action_items || [];
        if (config.filterDeadlines) actionItems = actionItems.filter(item => item.deadline && item.deadline.trim() !== '');
        if (config.filterPriority) actionItems = actionItems.filter(item => item.priority && item.priority.toLowerCase() === config.filterPriority);

        if (actionItems.length === 0) {
          printText('You have no specific action items matching criteria from this meeting.', 10, false, [100, 116, 139], 5, 1.2, 3);
        } else {
          actionItems.forEach(item => {
            const priority = item.priority ? ` [${item.priority.toUpperCase()}]` : '';
            const deadline = item.deadline ? ` (Due: ${item.deadline})` : '';
            const dep = item.depends_on ? ` (Needs: ${item.depends_on})` : '';
            printText(`\u2022 ${item.task}${priority}${deadline}${dep}`, 10, false, [51, 65, 85], 10, 1.4, 2);
          });
        }
        
        y += 2;
        printText('Best,', 10, false, [51, 65, 85], 5, 1.2, 1);
        printText('MeetMind AI', 10, false, [51, 65, 85], 5, 1.2, 5);
        
        // Draw enclosing box
        doc.rect(margin, startY, usableWidth, y - startY);
        y += 8;
      });
    }

    // --- Charts ---
    if (config.includeCharts) {
      // Find exactly the talk time chart to avoid grabbing the starfield
      const chartCanvas = document.getElementById('talkTimeChart');
      if (chartCanvas) {
        checkPage(pageHeight); // Start on new page for chart
        printText('Meeting Analytics', 16, true, [51, 51, 51], 0, 1.2, 5);
        try {
          const imgData = chartCanvas.toDataURL('image/png');
          
          // Calculate proportional height based on usable width
          const imgProps = doc.getImageProperties(imgData);
          const pdfHeight = (imgProps.height * usableWidth) / imgProps.width;
          
          doc.addImage(imgData, 'PNG', margin, y, usableWidth, pdfHeight);
          y += pdfHeight + 10;
        } catch (e) {
          console.error("Could not capture chart for PDF", e);
        }
      }
    }

    // --- Footer on all pages ---
    const pageCount = doc.internal.getNumberOfPages();
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.text(
        'Generated by MeetMind -- The AI that remembers your meetings so you don\'t have to.',
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    let prefix = 'MeetMind-Report';
    if (options && options.type && options.type !== 'full') {
       prefix = 'MeetMind-' + options.type.charAt(0).toUpperCase() + options.type.slice(1) + '-Report';
    }

    try {
      doc.save(prefix + '.pdf');
      if (window.utils) window.utils.showToast("PDF downloaded successfully!", "success");
    } catch (err) {
      console.error("Failed to generate PDF", err);
      if (window.utils) window.utils.showToast("Failed to generate PDF.", "error");
    }
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
