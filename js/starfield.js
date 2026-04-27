// MeetMind - 3D Starfield Background
// Replaces SVG paths with a lightweight, GPU-accelerated canvas starfield

const starfield = {
  initialized: false,
  stars: [],
  shootingStars: [],
  mouseX: 0,
  mouseY: 0,
  targetMouseX: 0,
  targetMouseY: 0,

  init() {
    if (this.initialized) return;
    const canvas = document.getElementById('starfield-canvas');
    if (!canvas) return;

    this.ctx = canvas.getContext('2d');
    this.resize(canvas);

    window.addEventListener('resize', () => this.resize(canvas));
    
    // Track mouse for parallax effect
    window.addEventListener('mousemove', (e) => {
      // Normalize mouse to -1 to 1 based on center of screen
      this.targetMouseX = (e.clientX / window.innerWidth) * 2 - 1;
      this.targetMouseY = (e.clientY / window.innerHeight) * 2 - 1;
    });

    this.createStars(canvas);
    this.animate(canvas);
    this.initialized = true;
  },

  resize(canvas) {
    // Set internal resolution to match display size for crispness
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  },

  createStars(canvas) {
    const numStars = window.innerWidth < 768 ? 100 : 200;
    this.stars = [];
    for (let i = 0; i < numStars; i++) {
      this.stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        z: Math.random() * 2 + 0.1, // Depth for parallax
        radius: Math.random() * 1.5 + 0.5,
        baseOpacity: Math.random() * 0.5 + 0.1,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        twinklePhase: Math.random() * Math.PI * 2,
        isSparkling: false,
        sparkleFrame: 0
      });
    }
  },

  createShootingStar(canvas) {
    this.shootingStars.push({
      x: Math.random() * canvas.width * 1.5,
      y: -50,
      length: Math.random() * 80 + 20,
      speed: Math.random() * 10 + 15,
      angle: Math.PI / 4 + (Math.random() * 0.2 - 0.1), // Down-right angle
      opacity: 1
    });
  },

  animate(canvas) {
    // Smooth mouse interpolation
    this.mouseX += (this.targetMouseX - this.mouseX) * 0.05;
    this.mouseY += (this.targetMouseY - this.mouseY) * 0.05;

    // Determine theme color
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const starColor = isLight ? 'rgba(0, 0, 0, ' : 'rgba(255, 255, 255, ';

    this.ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Occasional shooting star (approx 1% chance per frame)
    if (Math.random() < 0.01 && this.shootingStars.length < 2) {
      this.createShootingStar(canvas);
    }

    // Draw normal stars
    this.stars.forEach(star => {
      // Parallax shift based on depth (z)
      const shiftX = this.mouseX * 30 * star.z;
      const shiftY = this.mouseY * 30 * star.z;
      
      let drawX = star.x + shiftX;
      let drawY = star.y + shiftY;

      // Wrap around screen
      if (drawX < 0) drawX += canvas.width;
      if (drawX > canvas.width) drawX -= canvas.width;
      if (drawY < 0) drawY += canvas.height;
      if (drawY > canvas.height) drawY -= canvas.height;

      // Twinkle & Sparkle effect
      star.twinklePhase += star.twinkleSpeed;
      let currentOpacity = star.baseOpacity + Math.sin(star.twinklePhase) * 0.3;
      let currentRadius = star.radius;

      // Randomly trigger sparkle (very low probability)
      if (!star.isSparkling && Math.random() < 0.0005) {
        star.isSparkling = true;
        star.sparkleFrame = 0;
      }

      if (star.isSparkling) {
        star.sparkleFrame++;
        // Sparkle peaks at frame 15, ends at 30
        const sparkleIntensity = Math.sin((star.sparkleFrame / 30) * Math.PI);
        currentOpacity = Math.min(1, currentOpacity + sparkleIntensity * 0.8);
        currentRadius += sparkleIntensity * 1.5;
        
        if (star.sparkleFrame >= 30) {
          star.isSparkling = false;
        }
      }

      const clampedOpacity = Math.max(0.05, Math.min(1, currentOpacity));

      this.ctx.beginPath();
      this.ctx.arc(drawX, drawY, currentRadius, 0, Math.PI * 2);
      this.ctx.fillStyle = `${starColor}${clampedOpacity})`;
      this.ctx.fill();
    });

    // Draw shooting stars
    for (let i = this.shootingStars.length - 1; i >= 0; i--) {
      const star = this.shootingStars[i];
      
      star.x -= Math.cos(star.angle) * star.speed;
      star.y += Math.sin(star.angle) * star.speed;
      star.opacity -= 0.015;

      if (star.opacity <= 0 || star.x < 0 || star.y > canvas.height) {
        this.shootingStars.splice(i, 1);
        continue;
      }

      const gradient = this.ctx.createLinearGradient(
        star.x, star.y, 
        star.x + Math.cos(star.angle) * star.length, 
        star.y - Math.sin(star.angle) * star.length
      );
      gradient.addColorStop(0, `${starColor}${star.opacity})`);
      gradient.addColorStop(1, `${starColor}0)`);

      this.ctx.beginPath();
      this.ctx.moveTo(star.x, star.y);
      this.ctx.lineTo(
        star.x + Math.cos(star.angle) * star.length, 
        star.y - Math.sin(star.angle) * star.length
      );
      this.ctx.strokeStyle = gradient;
      this.ctx.lineWidth = 1.5;
      this.ctx.stroke();
    }

    requestAnimationFrame(() => this.animate(canvas));
  }
};

window.starfield = starfield;
