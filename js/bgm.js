// bgm.js — Chiptune Background Music Engine (Web Audio API oscillators only)

var BGM = {
  ctx: null,
  masterGain: null,
  volume: 0.15,
  muted: false,
  currentTrack: null,
  currentTrackName: null,
  channels: [],
  schedulerTimer: null,
  nextNoteTime: 0,
  currentStep: 0,
  tempo: 120,
  stepsPerBeat: 4,
  fadeInterval: null,
  resumeTrack: null, // track to resume after battle/dialogue

  init: function() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.ctx.destination);
      // Load preferences
      var saved = localStorage.getItem('bgm_volume');
      if (saved !== null) this.volume = parseFloat(saved);
      var savedMute = localStorage.getItem('bgm_muted');
      if (savedMute === 'true') this.muted = true;
      this.masterGain.gain.value = this.muted ? 0 : this.volume;
    } catch(e) {}
  },

  ensureCtx: function() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },

  // Note frequency lookup
  noteFreq: function(note) {
    if (!note || note === '-' || note === 0) return 0;
    var notes = { C:0,Cs:1,Db:1,D:2,Ds:3,Eb:3,E:4,F:5,Fs:6,Gb:6,G:7,Gs:8,Ab:8,A:9,As:10,Bb:10,B:11 };
    var match = String(note).match(/^([A-G][sb]?)(\d)$/);
    if (!match) return 0;
    var n = notes[match[1]];
    if (n === undefined) return 0;
    var oct = parseInt(match[2]);
    return 440 * Math.pow(2, (n - 9) / 12 + (oct - 4));
  },

  play: function(trackName, fadeIn) {
    if (!BGM.tracks[trackName]) return;
    this.ensureCtx();
    if (this.currentTrackName === trackName) return; // already playing
    this.stop(fadeIn ? true : false);
    var track = BGM.tracks[trackName];
    this.currentTrack = track;
    this.currentTrackName = trackName;
    this.tempo = track.tempo || 120;
    this.currentStep = 0;
    this.channels = [];

    for (var i = 0; i < track.channels.length; i++) {
      this.channels.push({ def: track.channels[i], activeOscs: [] });
    }

    if (fadeIn) {
      this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime + 0.8);
    } else {
      this.masterGain.gain.value = this.muted ? 0 : this.volume;
    }

    this.nextNoteTime = this.ctx.currentTime + 0.05;
    this.scheduleNotes();
  },

  stop: function(fadeOut) {
    if (fadeOut && this.ctx && this.masterGain) {
      var now = this.ctx.currentTime;
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(0, now + 0.5);
      var self = this;
      setTimeout(function() { self._hardStop(); }, 550);
    } else {
      this._hardStop();
    }
  },

  _hardStop: function() {
    if (this.schedulerTimer) { clearTimeout(this.schedulerTimer); this.schedulerTimer = null; }
    for (var i = 0; i < this.channels.length; i++) {
      var ch = this.channels[i];
      for (var j = 0; j < ch.activeOscs.length; j++) {
        try { ch.activeOscs[j].osc.stop(); } catch(e) {}
      }
    }
    this.channels = [];
    this.currentTrack = null;
    this.currentTrackName = null;
  },

  scheduleNotes: function() {
    if (!this.currentTrack) return;
    var secondsPerStep = 60.0 / this.tempo / this.stepsPerBeat;
    while (this.nextNoteTime < this.ctx.currentTime + 0.1) {
      this.playStep(this.currentStep, this.nextNoteTime, secondsPerStep);
      this.nextNoteTime += secondsPerStep;
      this.currentStep++;
      var totalSteps = this.currentTrack.patternLength * this.stepsPerBeat * 4; // patternLength in bars (4 beats/bar)
      if (this.currentStep >= totalSteps) {
        if (this.currentTrack.loop === false) { this._hardStop(); return; }
        this.currentStep = 0;
      }
    }
    var self = this;
    this.schedulerTimer = setTimeout(function() { self.scheduleNotes(); }, 25);
  },

  playStep: function(step, time, dur) {
    for (var i = 0; i < this.channels.length; i++) {
      var ch = this.channels[i];
      var def = ch.def;
      var pattern = def.pattern;
      var noteIdx = step % pattern.length;
      var note = pattern[noteIdx];
      if (!note || note === '-' || note === 0) continue;

      var freq = (typeof note === 'number') ? note : this.noteFreq(note);
      if (!freq) continue;

      var vol = (def.volume !== undefined ? def.volume : 0.5);
      var type = def.type || 'square';
      var noteDur = dur * (def.sustain || 0.8);

      if (type === 'noise') {
        this.playNoise(time, noteDur, vol);
      } else {
        var osc = this.ctx.createOscillator();
        var gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(vol, time);
        gain.gain.linearRampToValueAtTime(vol * 0.6, time + noteDur * 0.5);
        gain.gain.linearRampToValueAtTime(0, time + noteDur);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(time);
        osc.stop(time + noteDur);
      }
    }
  },

  playNoise: function(time, dur, vol) {
    // White noise via buffer
    var sr = this.ctx.sampleRate;
    var len = Math.floor(sr * dur);
    var buf = this.ctx.createBuffer(1, len, sr);
    var data = buf.getChannelData(0);
    for (var i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    var src = this.ctx.createBufferSource();
    src.buffer = buf;
    var gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol * 0.3, time);
    gain.gain.linearRampToValueAtTime(0, time + dur);
    src.connect(gain);
    gain.connect(this.masterGain);
    src.start(time);
    src.stop(time + dur);
  },

  setVolume: function(v) {
    this.volume = Math.max(0, Math.min(1, v));
    if (!this.muted && this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
    localStorage.setItem('bgm_volume', this.volume.toString());
    this.updateVolumeUI();
  },

  toggleMute: function() {
    this.muted = !this.muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime);
    }
    SFX.muted = this.muted;
    localStorage.setItem('bgm_muted', this.muted.toString());
    return this.muted;
  },

  updateVolumeUI: function() {
    var el = document.getElementById('bgm-vol-display');
    if (el) el.textContent = Math.round(this.volume * 100) + '%';
  },

  // Create volume control UI
  createVolumeControl: function() {
    var container = document.createElement('div');
    container.id = 'bgm-controls';
    container.style.cssText = 'position:fixed;top:4px;right:8px;z-index:1000;display:flex;align-items:center;gap:4px;font-size:11px;color:#aaa;';

    container.innerHTML =
      '<span style="font-size:10px">🎵</span>' +
      '<button id="bgm-vol-down" style="background:none;border:1px solid #555;color:#aaa;width:20px;height:18px;cursor:pointer;font-size:10px;padding:0">−</button>' +
      '<span id="bgm-vol-display" style="min-width:28px;text-align:center;font-size:10px">' + Math.round(this.volume * 100) + '%</span>' +
      '<button id="bgm-vol-up" style="background:none;border:1px solid #555;color:#aaa;width:20px;height:18px;cursor:pointer;font-size:10px;padding:0">+</button>';

    document.body.appendChild(container);
    var self = this;
    document.getElementById('bgm-vol-down').addEventListener('click', function(e) { e.stopPropagation(); self.setVolume(self.volume - 0.05); });
    document.getElementById('bgm-vol-up').addEventListener('click', function(e) { e.stopPropagation(); self.setVolume(self.volume + 0.05); });
  },

  // ==================== TRACKS ====================
  tracks: {}
};

// Helper: expand a pattern with repeats. r(notes, times)
function r(arr, n) { var out = []; for (var i = 0; i < n; i++) out = out.concat(arr); return out; }

// ===== TITLE SCREEN — D minor, 72 BPM, mysterious/epic =====
BGM.tracks.title = {
  tempo: 72, patternLength: 16, loop: true,
  channels: [
    { // Melody - sine for softer feel
      type: 'sine', volume: 0.4, sustain: 0.9,
      pattern: [
        'D4','-','-','-', 'F4','-','-','-', 'A4','-','-','G4', 'F4','-','E4','-',
        'D4','-','-','-', 'C4','-','-','-', 'D4','-','-','E4', 'F4','-','-','-',
        'A4','-','-','-', 'G4','-','F4','-', 'E4','-','-','-', 'D4','-','-','-',
        'C4','-','D4','-', 'E4','-','-','-', 'F4','-','E4','-', 'D4','-','-','-',
        // Second half - higher register
        'A4','-','-','-', 'Bb4','-','-','-', 'A4','-','G4','-', 'F4','-','-','-',
        'E4','-','-','-', 'F4','-','G4','-', 'A4','-','-','-', 'G4','-','F4','-',
        'D4','-','-','-', 'E4','-','F4','-', 'G4','-','-','-', 'F4','-','E4','-',
        'D4','-','-','-', '-','-','-','-', 'D4','-','-','-', '-','-','-','-',
      ]
    },
    { // Bass - triangle
      type: 'triangle', volume: 0.35, sustain: 0.7,
      pattern: [
        'D2','-','-','-', '-','-','D2','-', 'D2','-','-','-', '-','-','D2','-',
        'Bb1','-','-','-', '-','-','Bb1','-', 'C2','-','-','-', '-','-','C2','-',
        'F2','-','-','-', '-','-','F2','-', 'C2','-','-','-', '-','-','C2','-',
        'Bb1','-','-','-', '-','-','C2','-', 'D2','-','-','-', '-','-','-','-',
        'D2','-','-','-', '-','-','D2','-', 'D2','-','-','-', '-','-','D2','-',
        'C2','-','-','-', '-','-','C2','-', 'F2','-','-','-', '-','-','F2','-',
        'Bb1','-','-','-', '-','-','Bb1','-', 'C2','-','-','-', '-','-','C2','-',
        'D2','-','-','-', '-','-','-','-', 'D2','-','-','-', '-','-','-','-',
      ]
    },
    { // Harmony - square, quiet
      type: 'square', volume: 0.12, sustain: 0.6,
      pattern: [
        'A3','-','-','-', '-','-','-','-', 'F3','-','-','-', '-','-','-','-',
        'F3','-','-','-', '-','-','-','-', 'G3','-','-','-', '-','-','-','-',
        'C4','-','-','-', '-','-','-','-', 'G3','-','-','-', '-','-','-','-',
        'F3','-','-','-', '-','-','-','-', 'A3','-','-','-', '-','-','-','-',
        'F4','-','-','-', '-','-','-','-', 'F4','-','-','-', '-','-','-','-',
        'G3','-','-','-', '-','-','-','-', 'C4','-','-','-', '-','-','-','-',
        'F3','-','-','-', '-','-','-','-', 'G3','-','-','-', '-','-','-','-',
        'A3','-','-','-', '-','-','-','-', '-','-','-','-', '-','-','-','-',
      ]
    }
  ]
};

// ===== PLAYER PHASE — Bb Major/Mixolydian, 132 BPM, upbeat strategic =====
BGM.tracks.playerPhase = {
  tempo: 132, patternLength: 8, loop: true,
  channels: [
    { // Melody - square
      type: 'square', volume: 0.25, sustain: 0.7,
      pattern: [
        'Bb4','-','D5','C5', 'Bb4','-','A4','-', 'G4','-','A4','Bb4', 'C5','-','-','-',
        'D5','-','C5','Bb4', 'A4','-','G4','-', 'F4','-','G4','A4', 'Bb4','-','-','-',
        'Bb4','-','C5','D5', 'Eb5','-','D5','C5', 'D5','-','C5','Bb4', 'A4','-','G4','-',
        'F4','-','G4','A4', 'Bb4','-','C5','-', 'D5','-','-','-', 'Bb4','-','-','-',
        // B section
        'F5','-','Eb5','D5', 'C5','-','D5','-', 'Eb5','-','D5','C5', 'Bb4','-','-','-',
        'A4','-','Bb4','C5', 'D5','-','Eb5','-', 'D5','-','C5','Bb4', 'C5','-','-','-',
        'Bb4','-','D5','C5', 'Bb4','-','A4','-', 'G4','-','A4','Bb4', 'C5','-','D5','-',
        'Eb5','-','D5','-', 'C5','-','Bb4','-', 'Bb4','-','-','-', '-','-','-','-',
      ]
    },
    { // Bass - triangle
      type: 'triangle', volume: 0.35, sustain: 0.6,
      pattern: [
        'Bb2','-','Bb2','-', 'Bb2','-','Bb2','-', 'Eb2','-','Eb2','-', 'F2','-','F2','-',
        'Bb2','-','Bb2','-', 'F2','-','F2','-', 'Eb2','-','Eb2','-', 'Bb2','-','Bb2','-',
        'Bb2','-','Bb2','-', 'Eb2','-','Eb2','-', 'F2','-','F2','-', 'F2','-','F2','-',
        'Eb2','-','Eb2','-', 'Bb2','-','F2','-', 'Bb2','-','Bb2','-', 'Bb2','-','-','-',
        'Bb2','-','Bb2','-', 'F2','-','F2','-', 'Eb2','-','Eb2','-', 'Bb2','-','Bb2','-',
        'F2','-','F2','-', 'Bb2','-','Bb2','-', 'F2','-','F2','-', 'F2','-','F2','-',
        'Bb2','-','Bb2','-', 'Bb2','-','Bb2','-', 'Eb2','-','Eb2','-', 'F2','-','F2','-',
        'Eb2','-','F2','-', 'F2','-','Bb2','-', 'Bb2','-','-','-', '-','-','-','-',
      ]
    },
    { // Harmony - square quiet
      type: 'square', volume: 0.1, sustain: 0.5,
      pattern: [
        'D4','-','-','-', 'D4','-','-','-', 'Eb4','-','-','-', 'A3','-','-','-',
        'F4','-','-','-', 'C4','-','-','-', 'Bb3','-','-','-', 'D4','-','-','-',
        'D4','-','-','-', 'G4','-','-','-', 'A4','-','-','-', 'F4','-','-','-',
        'Bb3','-','-','-', 'D4','-','C4','-', 'F4','-','-','-', 'D4','-','-','-',
        'D5','-','-','-', 'A4','-','-','-', 'G4','-','-','-', 'F4','-','-','-',
        'C4','-','-','-', 'F4','-','-','-', 'F4','-','-','-', 'A4','-','-','-',
        'D4','-','-','-', 'D4','-','-','-', 'Eb4','-','-','-', 'A4','-','-','-',
        'G4','-','-','-', 'F4','-','-','-', 'D4','-','-','-', '-','-','-','-',
      ]
    },
    { // Percussion
      type: 'noise', volume: 0.3, sustain: 0.3,
      pattern: [
        1,'-','-',1, '-','-',1,'-', 1,'-','-',1, '-','-',1,'-',
        1,'-','-',1, '-','-',1,'-', 1,'-','-',1, '-','-',1,'-',
        1,'-','-',1, '-','-',1,'-', 1,'-','-',1, '-','-',1,'-',
        1,'-','-',1, '-','-',1,'-', 1,'-','-',1, '-','-','-','-',
        1,'-','-',1, '-','-',1,'-', 1,'-','-',1, '-','-',1,'-',
        1,'-','-',1, '-','-',1,'-', 1,'-','-',1, '-','-',1,'-',
        1,'-','-',1, '-','-',1,'-', 1,'-','-',1, '-','-',1,'-',
        1,'-','-',1, '-','-',1,'-', 1,'-','-','-', '-','-','-','-',
      ]
    }
  ]
};

// ===== ENEMY PHASE — A minor, 144 BPM, tense/threatening =====
BGM.tracks.enemyPhase = {
  tempo: 144, patternLength: 8, loop: true,
  channels: [
    { // Melody - sawtooth for edge
      type: 'sawtooth', volume: 0.15, sustain: 0.6,
      pattern: [
        'A4','-','A4','B4', 'C5','-','B4','A4', 'G4','-','A4','-', 'E4','-','-','-',
        'A4','-','B4','C5', 'D5','-','C5','B4', 'A4','-','G4','-', 'A4','-','-','-',
        'E5','-','D5','C5', 'B4','-','A4','-', 'G4','-','A4','B4', 'C5','-','B4','-',
        'A4','-','G4','A4', 'B4','-','C5','-', 'D5','-','C5','B4', 'A4','-','-','-',
        // Repeat with variation
        'A4','-','C5','B4', 'A4','-','G4','A4', 'E4','-','G4','-', 'A4','-','-','-',
        'C5','-','D5','E5', 'D5','-','C5','B4', 'A4','-','B4','-', 'C5','-','-','-',
        'E5','-','D5','C5', 'B4','-','C5','D5', 'C5','-','B4','A4', 'G4','-','A4','-',
        'A4','-','B4','C5', 'B4','-','A4','-', 'A4','-','-','-', '-','-','-','-',
      ]
    },
    { // Bass - triangle, driving
      type: 'triangle', volume: 0.4, sustain: 0.5,
      pattern: [
        'A2','-','A2','-', 'A2','-','A2','-', 'C2','-','C2','-', 'E2','-','E2','-',
        'A2','-','A2','-', 'D2','-','D2','-', 'E2','-','E2','-', 'A2','-','A2','-',
        'A2','-','A2','-', 'E2','-','E2','-', 'C2','-','C2','-', 'A2','-','A2','-',
        'F2','-','F2','-', 'G2','-','G2','-', 'A2','-','A2','-', 'E2','-','E2','-',
        'A2','-','A2','-', 'A2','-','A2','-', 'C2','-','C2','-', 'A2','-','A2','-',
        'F2','-','F2','-', 'D2','-','D2','-', 'E2','-','E2','-', 'A2','-','A2','-',
        'A2','-','A2','-', 'E2','-','E2','-', 'F2','-','F2','-', 'E2','-','E2','-',
        'A2','-','A2','-', 'E2','-','A2','-', 'A2','-','-','-', '-','-','-','-',
      ]
    },
    { // Percussion - faster
      type: 'noise', volume: 0.25, sustain: 0.2,
      pattern: [
        1,'-',1,'-', 1,'-',1,'-', 1,'-',1,'-', 1,'-',1,'-',
        1,'-',1,'-', 1,'-',1,'-', 1,'-',1,'-', 1,'-',1,'-',
        1,'-',1,'-', 1,'-',1,'-', 1,'-',1,'-', 1,'-',1,'-',
        1,'-',1,'-', 1,'-',1,'-', 1,'-',1,'-', 1,'-','-','-',
        1,'-',1,'-', 1,'-',1,'-', 1,'-',1,'-', 1,'-',1,'-',
        1,'-',1,'-', 1,'-',1,'-', 1,'-',1,'-', 1,'-',1,'-',
        1,'-',1,'-', 1,'-',1,'-', 1,'-',1,'-', 1,'-',1,'-',
        1,'-',1,'-', 1,'-',1,'-', 1,'-','-','-', '-','-','-','-',
      ]
    }
  ]
};

// ===== BATTLE THEME — E minor, 160 BPM, intense =====
BGM.tracks.battle = {
  tempo: 160, patternLength: 8, loop: true,
  channels: [
    { // Melody
      type: 'square', volume: 0.22, sustain: 0.65,
      pattern: [
        'E5','-','D5','E5', 'G5','-','Fs5','E5', 'D5','-','E5','D5', 'B4','-','-','-',
        'C5','-','D5','E5', 'Fs5','-','G5','-', 'A5','-','G5','Fs5', 'E5','-','-','-',
        'B4','-','D5','E5', 'Fs5','-','E5','D5', 'C5','-','D5','-', 'E5','-','-','-',
        'G5','-','Fs5','E5', 'D5','-','C5','B4', 'C5','-','D5','-', 'E5','-','-','-',
        // B section
        'E5','-','G5','Fs5', 'E5','-','D5','C5', 'B4','-','C5','D5', 'E5','-','-','-',
        'Fs5','-','G5','A5', 'G5','-','Fs5','E5', 'D5','-','E5','Fs5', 'G5','-','-','-',
        'B4','-','C5','D5', 'E5','-','Fs5','G5', 'A5','-','G5','Fs5', 'E5','-','D5','-',
        'E5','-','Fs5','-', 'G5','-','Fs5','E5', 'E5','-','-','-', '-','-','-','-',
      ]
    },
    { // Bass
      type: 'triangle', volume: 0.4, sustain: 0.5,
      pattern: [
        'E2','E2','E2','E2', 'E2','E2','E2','E2', 'G2','G2','G2','G2', 'B2','B2','B2','B2',
        'C2','C2','C2','C2', 'D2','D2','D2','D2', 'A2','A2','A2','A2', 'E2','E2','E2','E2',
        'B1','B1','B1','B1', 'D2','D2','D2','D2', 'C2','C2','C2','C2', 'E2','E2','E2','E2',
        'G2','G2','G2','G2', 'A2','A2','A2','A2', 'C2','C2','C2','C2', 'E2','E2','E2','E2',
        'E2','E2','E2','E2', 'E2','E2','E2','E2', 'B1','B1','B1','B1', 'E2','E2','E2','E2',
        'D2','D2','D2','D2', 'G2','G2','G2','G2', 'D2','D2','D2','D2', 'G2','G2','G2','G2',
        'B1','B1','B1','B1', 'E2','E2','E2','E2', 'A2','A2','A2','A2', 'E2','E2','E2','E2',
        'E2','E2','E2','E2', 'G2','G2','B2','E2', 'E2','-','-','-', '-','-','-','-',
      ]
    },
    { // Harmony
      type: 'square', volume: 0.1, sustain: 0.