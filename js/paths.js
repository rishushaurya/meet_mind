// MeetMind - Floating Paths Background Animation
// Adapted from 21st.dev BackgroundPaths (React/Framer Motion → Vanilla JS)

const floatingPaths = {
  initialized: false,

  init() {
    if (this.initialized) return;
    const container = document.getElementById('floating-paths-bg');
    if (!container) return;

    this.createPathGroup(container, 1);
    this.createPathGroup(container, -1);
    this.initialized = true;
  },

  createPathGroup(container, position) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 696 316');
    svg.setAttribute('fill', 'none');
    svg.classList.add('paths-svg');

    for (let i = 0; i < 36; i++) {
      const p = position;
      const d = `M${-(380 - i * 5 * p)} ${-(189 + i * 6)}C${-(380 - i * 5 * p)} ${-(189 + i * 6)} ${-(312 - i * 5 * p)} ${216 - i * 6} ${152 - i * 5 * p} ${343 - i * 6}C${616 - i * 5 * p} ${470 - i * 6} ${684 - i * 5 * p} ${875 - i * 6} ${684 - i * 5 * p} ${875 - i * 6}`;

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', d);
      path.setAttribute('stroke', 'currentColor');
      path.setAttribute('stroke-width', String(0.5 + i * 0.03));
      path.setAttribute('pathLength', '1');

      path.style.strokeDasharray = '0.5 0.5';
      path.style.strokeDashoffset = '0';

      const duration = 20 + Math.random() * 10;
      const delay = -(Math.random() * 20);
      path.style.animation = `pathFlow ${duration}s linear ${delay}s infinite`;
      path.style.opacity = String(0.1 + i * 0.03);

      svg.appendChild(path);
    }
    container.appendChild(svg);
  }
};

window.floatingPaths = floatingPaths;
