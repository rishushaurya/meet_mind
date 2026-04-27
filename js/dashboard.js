// MeetMind - Dashboard Rendering Logic (Chunk 06)

const dashboard = {
  colors: ['#4A90E2', '#50E3C2', '#F5A623', '#D0021B', '#9013FE', '#7ED321'],
  
  getAvatarColor(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return this.colors[Math.abs(hash) % this.colors.length];
  },

  renderResults(data) {
    if (!data) return;

    try {
      this.renderSummary(data);
      this.renderPersonCards(data.attendees || []);
    } catch (err) {
      console.error('Dashboard render error:', err);
      if (window.utils) window.utils.showToast('Failed to render dashboard: ' + err.message, 'error');
    }
  },

  renderSummary(data) {
    // Top Bar Stats
    let totalActions = 0;
    data.attendees.forEach(a => totalActions += (a.action_items ? a.action_items.length : 0));
    
    document.getElementById('stat-actions').textContent = totalActions;
    document.getElementById('stat-speakers').textContent = data.attendees.length;
    document.getElementById('stat-type').textContent = data.meeting_type || 'General';

    // Health Score
    if (data.health_score) {
      this.animateHealthScore(data.health_score.score);
      document.getElementById('health-reasoning').textContent = data.health_score.reasoning;
    }

    // Summary Text
    document.getElementById('meeting-summary-text').textContent = data.meeting_summary;

    // Lists (Decisions, Questions, Topics Not Discussed)
    this.renderList('decisions-list', data.decisions_made);
    this.renderList('questions-list', data.unresolved_questions);
    this.renderList('not-discussed-list', data.topics_not_discussed, true); // true = warning style
  },

  renderList(containerId, items, isWarning = false) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!items || items.length === 0) {
      container.innerHTML = '<li style="color: var(--color-text-secondary); list-style: none;">None</li>';
      return;
    }

    items.forEach(item => {
      const li = document.createElement('li');
      li.textContent = item;
      if (isWarning) {
        li.style.color = 'var(--color-warning)';
      }
      container.appendChild(li);
    });
  },

  animateHealthScore(targetScore) {
    const el = document.getElementById('health-score-value');
    const circle = document.getElementById('health-score-circle');
    if (!el || !circle) return;

    let current = 0;
    const duration = 1500;
    const start = performance.now();

    const animate = (time) => {
      const elapsed = time - start;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      current = Math.round(targetScore * easeOut);
      
      el.textContent = `${current}/10`;

      // Update circle dasharray
      const circumference = 2 * Math.PI * 45; // r=45
      const offset = circumference - (current / 10) * circumference;
      circle.style.strokeDashoffset = offset;

      // Color logic
      if (current >= 8) circle.style.stroke = 'var(--color-success)';
      else if (current >= 5) circle.style.stroke = 'var(--color-warning)';
      else circle.style.stroke = 'var(--color-danger)';

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        el.textContent = `${targetScore}/10`;
      }
    };

    requestAnimationFrame(animate);
  },

  renderPersonCards(attendees) {
    // 1. Render Tabs
    const tabsContainer = document.getElementById('person-tabs');
    const panesContainer = document.getElementById('person-panes');
    if (!tabsContainer || !panesContainer) return;

    tabsContainer.innerHTML = '';
    panesContainer.innerHTML = '';

    attendees.forEach((person, index) => {
      // Tab Button
      const hostName = (app.state.result?.host || '').toLowerCase().trim();
      const personName = (person.name || '').toLowerCase().trim();
      const extractedName = (person.name.match(/\(([^)]+)\)/)?.[1] || '').toLowerCase().trim();
      const isHost = hostName && (
        hostName === personName ||
        hostName === extractedName ||
        personName.includes(hostName) ||
        hostName.includes(personName) ||
        (extractedName && hostName.includes(extractedName))
      );
      const hostTabLabel = isHost ? ' <i data-lucide="crown" style="width:12px;height:12px;color:var(--color-danger);"></i>' : '';

      // Smart name extraction
      let displayName = utils.sanitize(person.name);
      let isGeneric = /^Speaker \d+$/i.test(person.name);
      const nameMatch = person.name.match(/Speaker \d+\s*\(([^)]+)\)/i);
      if (nameMatch) displayName = utils.sanitize(nameMatch[1]);

      const avatarColor = this.getAvatarColor(displayName);
      const initial = displayName.charAt(0).toUpperCase();

      const btn = document.createElement('button');
      btn.className = `tab-btn ${index === 0 ? 'active' : ''}`;
      btn.innerHTML = `
        <div class="avatar-small" style="background-color: ${avatarColor}">${initial}</div>
        <span class="${isHost ? 'host-name' : ''}">${displayName}${hostTabLabel}</span>
        <span class="badge ${person.action_items?.length > 0 ? '' : 'hidden'}">${person.action_items?.length || 0}</span>
      `;
      btn.onclick = () => app.switchPersonTab(`pane-${index}`, btn);
      tabsContainer.appendChild(btn);

      // Pane Content
      const pane = document.createElement('div');
      pane.className = `tab-pane ${index === 0 ? 'active' : ''}`;
      pane.id = `pane-${index}`;

      let actionsHTML = '';
      if (!person.action_items || person.action_items.length === 0) {
        actionsHTML = `<div class="empty-state">No action items for ${utils.sanitize(person.name)}.</div>`;
      } else {
        actionsHTML = person.action_items.map((item, itemIndex) => this.createActionHTML(item, index, itemIndex)).join('');
      }

      pane.innerHTML = `
        <div class="card person-card">
          <div class="person-header">
            <div style="display: flex; align-items: center; gap: 16px;">
              <div class="avatar-large" style="background-color: ${avatarColor}">${initial}</div>
              <div>
                <h3 style="margin: 0;" class="${isHost ? 'host-name' : ''}">
                  ${displayName}
                  ${isHost ? '<span class="host-badge"><i data-lucide="star" style="width:12px;height:12px;"></i> Host</span>' : ''}
                  ${isGeneric ? `<i data-lucide="edit-2" style="width:14px;height:14px;cursor:pointer;opacity:0.5;margin-left:8px;" onclick="window.chatbox?.openWithText('Rename ${person.name} to ')"></i>` : ''}
                </h3>
                <div style="font-size: 13px; color: var(--color-text-secondary); margin-top: 4px;">
                  Talk Time: ${person.talk_percentage || 0}% | Questions: ${person.questions_asked || 0}
                </div>
              </div>
            </div>
            <div class="person-actions">
              <button class="btn btn-secondary btn-icon" onclick="exports.showEmailPreview(${index})" title="Preview Email">
                <i data-lucide="mail"></i>
              </button>
              <button class="btn btn-secondary btn-icon" onclick="exports.copyPerson(${index})" title="Copy to Clipboard">
                <i data-lucide="copy"></i>
              </button>
            </div>
          </div>

          <div class="action-items-list">
            ${actionsHTML}
          </div>
        </div>
      `;
      panesContainer.appendChild(pane);
    });

    if (window.lucide) window.lucide.createIcons();
    
    // Attach checkbox listeners
    this.attachCheckboxListeners();
  },

  createActionHTML(item, personIndex, itemIndex) {
    const priorityColors = {
      'urgent': 'var(--color-danger)',
      'important': 'var(--color-warning)',
      'normal': 'var(--color-success)'
    };
    const pColor = priorityColors[item.priority?.toLowerCase()] || 'var(--color-border)';
    const pText = (item.priority || 'Normal').toUpperCase();

    const deadlineHTML = item.deadline ? `<span class="deadline"><i data-lucide="calendar"></i> ${utils.sanitize(item.deadline)}</span>` : '';
    const depsHTML = item.depends_on ? `<span class="dependency"><i data-lucide="git-merge"></i> Needs: ${utils.sanitize(item.depends_on)}</span>` : '';
    
    const stateKey = `meetmind-check-${personIndex}-${itemIndex}`;
    const isChecked = sessionStorage.getItem(stateKey) === 'true';

    return `
      <div class="action-item ${isChecked ? 'completed' : ''}" id="action-${personIndex}-${itemIndex}">
        <div class="action-item-header">
          <label class="custom-checkbox">
            <input type="checkbox" id="check-${personIndex}-${itemIndex}" ${isChecked ? 'checked' : ''} data-person="${personIndex}" data-item="${itemIndex}">
            <span class="checkmark"></span>
          </label>
          <div class="action-content">
            <div class="task-text">${utils.sanitize(item.task)}</div>
            <div class="task-meta">
              <span class="badge" style="background: ${pColor}20; color: ${pColor}; border-color: ${pColor}40;">${pText}</span>
              ${deadlineHTML}
              ${depsHTML}
            </div>
          </div>
        </div>
        ${item.source_quote ? `
        <div class="source-quote" onclick="this.classList.toggle('expanded')">
          <div class="quote-toggle"><i data-lucide="message-square"></i> Source Quote</div>
          <div class="quote-text">"${utils.sanitize(item.source_quote)}"</div>
        </div>` : ''}
      </div>
    `;
  },

  attachCheckboxListeners() {
    const checkboxes = document.querySelectorAll('.custom-checkbox input[type="checkbox"]');
    checkboxes.forEach(cb => {
      cb.addEventListener('change', (e) => {
        const pIndex = e.target.getAttribute('data-person');
        const iIndex = e.target.getAttribute('data-item');
        const key = `meetmind-check-${pIndex}-${iIndex}`;
        
        sessionStorage.setItem(key, e.target.checked);
        
        const actionItem = document.getElementById(`action-${pIndex}-${iIndex}`);
        if (actionItem) {
          if (e.target.checked) actionItem.classList.add('completed');
          else actionItem.classList.remove('completed');
        }
      });
    });
  }
};

window.dashboard = dashboard;
