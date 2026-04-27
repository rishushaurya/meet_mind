// MeetMind - Data Visualizations (Chunk 06)

const charts = {
  instances: {},

  renderCharts(data) {
    if (!window.Chart || !data || !data.attendees) return;

    this.destroyCharts();

    this.renderTalkTimeChart(data.attendees);
    this.renderPriorityChart(data.attendees);
  },

  destroyCharts() {
    Object.keys(this.instances).forEach(key => {
      if (this.instances[key]) {
        this.instances[key].destroy();
        this.instances[key] = null;
      }
    });
  },

  getThemeColors() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
      text: isDark ? '#A0A0C0' : '#6B6B80',
      grid: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
      tooltipBg: isDark ? 'rgba(17, 17, 17, 0.9)' : 'rgba(255, 255, 255, 0.9)',
      tooltipText: isDark ? '#fff' : '#000',
    };
  },

  renderTalkTimeChart(attendees) {
    const canvas = document.getElementById('talkTimeChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const colors = this.getThemeColors();

    const labels = attendees.map(a => a.name);
    const data = attendees.map(a => a.talk_percentage || 0);
    const bgColors = attendees.map(a => window.dashboard.getAvatarColor(a.name));

    this.instances.talkTime = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: bgColors,
          borderWidth: 2,
          borderColor: document.documentElement.getAttribute('data-theme') === 'dark' ? '#111' : '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: colors.text,
              font: { family: 'Inter', size: 12 },
              usePointStyle: true,
              padding: 20
            }
          },
          tooltip: {
            backgroundColor: colors.tooltipBg,
            titleColor: colors.tooltipText,
            bodyColor: colors.tooltipText,
            callbacks: {
              label: (context) => ` ${context.label}: ${context.parsed}%`
            }
          }
        }
      }
    });
  },

  renderPriorityChart(attendees) {
    // Note: The UI currently has one chart canvas ('talkTimeChart') in index.html.
    // If we want a priority chart, we'd need another canvas. 
    // The implementation plan mentions a Priority Distribution bar chart.
    // I will dynamically create the canvas in the dashboard if it doesn't exist.
    
    let canvas = document.getElementById('priorityChart');
    if (!canvas) {
      // Find a place to put it - maybe next to the talk time chart
      const parent = document.getElementById('talkTimeChart')?.parentNode;
      if (parent) {
        // Change parent to flex to hold both
        parent.style.display = 'flex';
        parent.style.gap = '24px';
        parent.style.flexWrap = 'wrap';
        
        // Wrap original chart
        const origWrapper = document.createElement('div');
        origWrapper.style.flex = '1 1 300px';
        origWrapper.style.minHeight = '250px';
        parent.insertBefore(origWrapper, document.getElementById('talkTimeChart'));
        origWrapper.appendChild(document.getElementById('talkTimeChart'));
        
        // Create new wrapper
        const newWrapper = document.createElement('div');
        newWrapper.style.flex = '1 1 300px';
        newWrapper.style.minHeight = '250px';
        
        canvas = document.createElement('canvas');
        canvas.id = 'priorityChart';
        newWrapper.appendChild(canvas);
        parent.appendChild(newWrapper);
      } else {
        return; // Nowhere to put it
      }
    }

    const ctx = canvas.getContext('2d');
    const colors = this.getThemeColors();

    let urgent = 0, important = 0, normal = 0;
    attendees.forEach(a => {
      if (a.action_items) {
        a.action_items.forEach(item => {
          const p = item.priority?.toLowerCase();
          if (p === 'urgent') urgent++;
          else if (p === 'important') important++;
          else normal++;
        });
      }
    });

    this.instances.priority = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Urgent', 'Important', 'Normal'],
        datasets: [{
          data: [urgent, important, normal],
          backgroundColor: [
            '#FF5252',
            '#FFD600',
            '#00E676'
          ],
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: colors.tooltipBg,
            titleColor: colors.tooltipText,
            bodyColor: colors.tooltipText
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, color: colors.text },
            grid: { color: colors.grid, drawBorder: false }
          },
          x: {
            ticks: { color: colors.text },
            grid: { display: false }
          }
        }
      }
    });
  }
};

window.charts = charts;
