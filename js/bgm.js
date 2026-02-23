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
  resumeTrack: null,

  init: function() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
      var sv = localStorage.getItem('bgm_volume');
      if (sv !== null) this.volume = parseFloat(sv);
      if (localStorage.getItem('bgm_muted') === 'true') this.muted = true;
      this.masterGain.gain.value = this.muted ? 0 : this.volume;
    } catch(e) {}
  },

  ensureCtx: function() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },

  noteFreq: function(note) {
    if (!note || note === '-' || note === 0) return 0;
    var N = {C:0,Cs:1,Db:1,D:2,Ds:3,Eb:3,E:4,F:5,Fs:6,Gb:6,G:7,Gs:8,Ab:8,A:9,As:10,Bb:10,B:11};
    var m = String(note).match(/^([A-G][sb]?)(\d)$/);
    if (!m) return 0;
    var n = N[m[1]]; if (n === undefined) return 0;
    return 440 * Math.pow(2, (n - 9) / 12 + (parseInt(m[2]) - 4));
  },

  play: function(trackName, fadeIn) {
    if (!BGM.tracks[trackName]) return;
    this.ensureCtx();
    if (this.currentTrackName === trackName) return;
    this._hardStop();
    var track = BGM.tracks[trackName];
    this.currentTrack = track;
    this.currentTrackName = trackName;
    this.tempo = track.tempo || 120;
    this.currentStep = 0;
    this.channels = [];
    for (var i = 0; i < track.channels.length; i++)
      this.channels.push({ def: track.channels[i] });
    if (fadeIn && this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime + 0.8);
    } else if (this.masterGain) {
      this.masterGain.gain.value = this.muted ? 0 : this.volume;
    }
    this.nextNoteTime = this.ctx.currentTime + 0.05;
    this._schedule();
  },

  stop: function(fadeOut) {
    if (fadeOut && this.ctx && this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, this.ctx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);
      var s = this; setTimeout(function() { s._hardStop(); }, 550);
    } else { this._hardStop(); }
  },

  _hardStop: function() {
    if (this.schedulerTimer) { clearTimeout(this.schedulerTimer); this.schedulerTimer = null; }
    this.channels = []; this.currentTrack = null; this.currentTrackName = null;
  },

  _schedule: function() {
    if (!this.currentTrack) return;
    var sps = 60.0 / this.tempo / this.stepsPerBeat;
    while (this.nextNoteTime < this.ctx.currentTime + 0.1) {
      this._playStep(this.currentStep, this.nextNoteTime, sps);
      this.nextNoteTime += sps;
      this.currentStep++;
      var total = this.currentTrack.patternLength * this.stepsPerBeat * 4;
      if (this.currentStep >= total) {
        if (this.currentTrack.loop === false) { this._hardStop(); return; }
        this.currentStep = 0;
      }
    }
    var s = this; this.schedulerTimer = setTimeout(function() { s._schedule(); }, 25);
  },

  _playStep: function(step, time, dur) {
    for (var i = 0; i < this.channels.length; i++) {
      var d = this.channels[i].def, p = d.pattern;
      var note = p[step % p.length];
      if (!note || note === '-' || note === 0) continue;
      var freq = (typeof note === 'number' && note > 20) ? note : this.noteFreq(note);
      if (!freq || freq < 20) { if (typeof note === 'number') { this._noise(time, dur*(d.sustain||0.8), d.volume||0.5); } continue; }
      var vol = d.volume || 0.5, type = d.type || 'square', nd = dur * (d.sustain || 0.8);
      if (type === 'noise') { this._noise(time, nd, vol); continue; }
      var o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, time);
      g.gain.setValueAtTime(vol, time);
      g.gain.linearRampToValueAtTime(vol * 0.4, time + nd * 0.7);
      g.gain.linearRampToValueAtTime(0, time + nd);
      o.connect(g); g.connect(this.masterGain);
      o.start(time); o.stop(time + nd + 0.01);
    }
  },

  _noise: function(time, dur, vol) {
    var sr = this.ctx.sampleRate, len = Math.max(1, Math.floor(sr * dur));
    var buf = this.ctx.createBuffer(1, len, sr), data = buf.getChannelData(0);
    for (var i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    var src = this.ctx.createBufferSource(); src.buffer = buf;
    var g = this.ctx.createGain();
    g.gain.setValueAtTime(vol * 0.3, time); g.gain.linearRampToValueAtTime(0, time + dur);
    src.connect(g); g.connect(this.masterGain);
    src.start(time); src.stop(time + dur + 0.01);
  },

  setVolume: function(v) {
    this.volume = Math.max(0, Math.min(1, v));
    if (!this.muted && this.masterGain && this.ctx)
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    localStorage.setItem('bgm_volume', this.volume.toString());
    var el = document.getElementById('bgm-vol-display');
    if (el) el.textContent = Math.round(this.volume * 100) + '%';
  },

  toggleMute: function() {
    this.muted = !this.muted;
    if (this.masterGain && this.ctx)
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime);
    SFX.muted = this.muted;
    localStorage.setItem('bgm_muted', this.muted.toString());
    var el = document.getElementById('btn-mute-inner');
    if (el) el.textContent = this.muted ? '🔇' : '🔊';
    return this.muted;
  },

  createVolumeControl: function() {
    var c = document.createElement('div'); c.id = 'bgm-controls';
    c.style.cssText = 'margin-left:auto;display:flex;align-items:center;gap:6px;font-size:11px;color:#aaa;';
    c.innerHTML = 
        '<button id="btn-mute-inner" style="background:none;border:1px solid #555;color:#aaa;padding:1px 6px;font-size:11px;cursor:pointer;">' + (this.muted ? '🔇' : '🔊') + '</button>'
      + '<span style="font-size:10px;margin-left:4px">音量</span>'
      + '<button id="bgm-vol-down" style="background:none;border:1px solid #555;color:#aaa;width:20px;height:18px;cursor:pointer;font-size:10px;padding:0">−</button>'
      + '<button id="btn-mute" style="background:none;border:1px solid #555;color:#aaa;padding:1px 6px;font-size:11px;cursor:pointer;margin-left:8px">🔊</button><span id="bgm-vol-display" style="min-width:28px;text-align:center;font-size:10px">' + Math.round(this.volume * 100) + '%</span>'
      + '<button id="bgm-vol-up" style="background:none;border:1px solid #555;color:#aaa;width:20px;height:18px;cursor:pointer;font-size:10px;padding:0">+</button>';
    var topBar = document.getElementById('top-bar'); if (topBar) { topBar.appendChild(c); } else { document.body.appendChild(c); }
    var s = this;
    document.getElementById('btn-mute-inner').onclick = function(e) { e.stopPropagation(); s.toggleMute(); };
    document.getElementById('bgm-vol-down').onclick = function(e) { e.stopPropagation(); s.setVolume(s.volume - 0.05); };
    document.getElementById('bgm-vol-up').onclick = function(e) { e.stopPropagation(); s.setVolume(s.volume + 0.05); };
  },

  tracks: {}
};
