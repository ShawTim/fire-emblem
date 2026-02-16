// sfx.js — Simple Web Audio API sound effects (oscillator-based)

const SFX = {
  ctx: null,
  muted: false,

  init: function() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch(e) { /* no audio */ }
  },

  ensureCtx: function() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },

  _play: function(freq, type, duration, vol, ramp) {
    if (this.muted || !this.ctx) return;
    var o = this.ctx.createOscillator();
    var g = this.ctx.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, this.ctx.currentTime);
    if (ramp) o.frequency.linearRampToValueAtTime(ramp, this.ctx.currentTime + duration);
    g.gain.setValueAtTime(vol || 0.08, this.ctx.currentTime);
    g.gain.linearRampToValueAtTime(0, this.ctx.currentTime + duration);
    o.connect(g); g.connect(this.ctx.destination);
    o.start(); o.stop(this.ctx.currentTime + duration);
  },

  cursor: function() {
    this.ensureCtx();
    this._play(880, 'square', 0.04, 0.05);
  },

  select: function() {
    this.ensureCtx();
    this._play(660, 'square', 0.06, 0.06);
    setTimeout(() => this._play(880, 'square', 0.06, 0.06), 60);
  },

  cancel: function() {
    this.ensureCtx();
    this._play(440, 'square', 0.08, 0.05, 220);
  },

  hit: function() {
    this.ensureCtx();
    this._play(200, 'sawtooth', 0.12, 0.10, 80);
    this._play(120, 'square', 0.08, 0.06);
  },

  crit: function() {
    this.ensureCtx();
    this._play(440, 'sawtooth', 0.05, 0.10);
    setTimeout(() => this._play(220, 'sawtooth', 0.15, 0.12, 60), 50);
    setTimeout(() => this._play(110, 'square', 0.10, 0.08), 120);
  },

  miss: function() {
    this.ensureCtx();
    this._play(300, 'sine', 0.15, 0.04, 200);
  },

  heal: function() {
    this.ensureCtx();
    this._play(523, 'sine', 0.1, 0.06);
    setTimeout(() => this._play(659, 'sine', 0.1, 0.06), 100);
    setTimeout(() => this._play(784, 'sine', 0.15, 0.06), 200);
  },

  levelUp: function() {
    this.ensureCtx();
    var notes = [523, 587, 659, 784, 880, 1047];
    for (var i = 0; i < notes.length; i++) {
      (function(n, d) {
        setTimeout(() => SFX._play(n, 'square', 0.12, 0.07), d);
      })(notes[i], i * 80);
    }
  },

  phaseChange: function() {
    this.ensureCtx();
    this._play(330, 'square', 0.1, 0.06);
    setTimeout(() => this._play(440, 'square', 0.15, 0.06), 100);
  },

  defeat: function() {
    this.ensureCtx();
    this._play(440, 'sawtooth', 0.15, 0.08, 220);
    setTimeout(() => this._play(330, 'sawtooth', 0.15, 0.08, 165), 150);
    setTimeout(() => this._play(220, 'sawtooth', 0.2, 0.06, 110), 300);
  },

  victory: function() {
    this.ensureCtx();
    var notes = [523, 659, 784, 1047, 784, 1047];
    for (var i = 0; i < notes.length; i++) {
      (function(n, d) {
        setTimeout(() => SFX._play(n, 'square', 0.15, 0.07), d);
      })(notes[i], i * 120);
    }
  },

  toggleMute: function() {
    this.muted = !this.muted;
    return this.muted;
  }
};
