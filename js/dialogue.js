// dialogue.js — Dialogue system with typewriter effect

class DialogueSystem {
  constructor() {
    this.lines = [];
    this.currentIndex = 0;
    this.active = false;
    this.charIndex = 0;
    this.charTimer = 0;
    this.charSpeed = 30; // ms per character
    this.finished = false; // current line fully displayed
    this.onComplete = null;
    // DOM refs
    this.box = document.getElementById('dialogue-box');
    this.nameEl = document.getElementById('dialogue-name');
    this.textEl = document.getElementById('dialogue-text');
    this.portraitCanvas = document.getElementById('portrait-canvas');
    this.portraitCtx = this.portraitCanvas.getContext('2d');
  }

  start(lines, onComplete) {
    if (!lines || lines.length === 0) {
      if (onComplete) onComplete();
      return;
    }
    this.lines = lines;
    this.currentIndex = 0;
    this.active = true;
    this.onComplete = onComplete || null;
    this.showLine();
  }

  showLine() {
    const line = this.lines[this.currentIndex];
    if (!line) { this.end(); return; }
    this.charIndex = 0;
    this.charTimer = 0;
    this.finished = false;

    // Hide fullscreen button during dialogue to prevent overlap
    const mobileBtn = document.getElementById('mobile-toggle');
    if (mobileBtn) mobileBtn.style.display = 'none';

    // Speaker name
    if (line.speaker && CHARACTERS[line.speaker]) {
      this.nameEl.textContent = CHARACTERS[line.speaker].name;
      this.nameEl.style.display = 'block';
      // Draw portrait (redraw when image loads)
      this.portraitCtx.clearRect(0, 0, 80, 80);
      Sprites.drawPortrait(this.portraitCtx, line.speaker, 80, 80);
      this.portraitCanvas.style.display = 'block';
      // Re-draw if portrait image loads after initial draw
      const _speaker = line.speaker;
      const _ctx = this.portraitCtx;
      Sprites.onPortraitReady(() => {
        _ctx.clearRect(0, 0, 80, 80);
        Sprites.drawPortrait(_ctx, _speaker, 80, 80);
      });
    } else {
      this.nameEl.textContent = line.speaker ? line.speaker : '';
      this.nameEl.style.display = line.speaker ? 'block' : 'none';
      this.portraitCtx.clearRect(0, 0, 80, 80);
      this.portraitCtx.fillStyle = '#223';
      this.portraitCtx.fillRect(0, 0, 80, 80);
      this.portraitCanvas.style.display = line.speaker ? 'block' : 'block';
    }

    this.textEl.textContent = '';
    this.box.classList.remove('hidden');
  }

  advance() {
    if (!this.active) return;
    if (!this.finished) {
      // Show full text immediately
      const line = this.lines[this.currentIndex];
      if (line) this.textEl.textContent = line.text;
      this.finished = true;
      return;
    }
    this.currentIndex++;
    if (this.currentIndex >= this.lines.length) {
      this.end();
    } else {
      this.showLine();
    }
  }

  end() {
    this.active = false;
    this.box.classList.add('hidden');
    
    // Restore fullscreen button visibility (only on small screens)
    const mobileBtn = document.getElementById('mobile-toggle');
    if (mobileBtn) {
      const isSmallScreen = window.innerWidth < 900 || window.innerHeight < 650;
      if (isSmallScreen) mobileBtn.style.display = 'block';
    }
    
    if (this.onComplete) this.onComplete();
  }

  isActive() { return this.active; }

  update(dt) {
    if (!this.active || this.finished) return;
    const line = this.lines[this.currentIndex];
    if (!line) return;
    this.charTimer += dt;
    while (this.charTimer >= this.charSpeed && this.charIndex < line.text.length) {
      this.charIndex++;
      this.charTimer -= this.charSpeed;
    }
    this.textEl.textContent = line.text.substring(0, this.charIndex);
    if (this.charIndex >= line.text.length) this.finished = true;
  }
}
