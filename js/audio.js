const midiFreq = (m) => 440 * Math.pow(2, (m - 69) / 12);

const WORLD_MUSIC = {
  prairie: { bpm: 128, root: 60, scale: [0, 2, 4, 7, 9, 12, 14, 16, 19], prog: [0, -5, -7, -3], wave: "triangle", bright: true },
  peaks: { bpm: 122, root: 58, scale: [0, 3, 5, 7, 10, 12, 15, 17], prog: [0, -3, -5, 2], wave: "sawtooth", bright: false },
  volcano: { bpm: 140, root: 55, scale: [0, 1, 5, 7, 8, 12, 13, 17], prog: [0, -2, 1, -4], wave: "sawtooth", bright: false },
  glacier: { bpm: 108, root: 65, scale: [0, 2, 3, 7, 9, 12, 14, 15], prog: [0, -4, -2, -7], wave: "sine", bright: true },
  desert: { bpm: 118, root: 62, scale: [0, 1, 4, 5, 7, 8, 11, 12], prog: [0, -1, -5, -3], wave: "triangle", bright: false },
  city: { bpm: 116, root: 52, scale: [0, 3, 7, 10, 12, 15, 19, 22], prog: [0, 3, 7, 10], wave: "sawtooth", bright: true },
};

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.noiseBuffer = null;
    this._musicTimer = null;
    this._step = 0;
    this._nextTime = 0;
    this._currentWorld = null;
    this._pattern = null;
    this._rngSeed = 7;
    this.musicVolume = 0.7;
    this.sfxVolume = 0.85;
  }

  init() {
    if (this.ctx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = 1;
    this.master.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = this.musicVolume;
    this.musicGain.connect(this.master);
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = this.sfxVolume;
    this.sfxGain.connect(this.master);
    const len = this.ctx.sampleRate * 0.5;
    this.noiseBuffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }

  resume() {
    this.init();
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
  }

  setVolumes(music, sfx) {
    this.musicVolume = music;
    this.sfxVolume = sfx;
    if (this.musicGain) this.musicGain.gain.value = music;
    if (this.sfxGain) this.sfxGain.gain.value = sfx;
  }

  _tone(time, freq, dur, type, gain, dest, slideTo) {
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, time);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), time + dur);
    g.gain.setValueAtTime(0, time);
    g.gain.linearRampToValueAtTime(gain, time + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0008, time + dur);
    o.connect(g);
    g.connect(dest || this.sfxGain);
    o.start(time);
    o.stop(time + dur + 0.05);
  }

  _noise(time, dur, gain, dest, filterFreq) {
    const s = this.ctx.createBufferSource();
    s.buffer = this.noiseBuffer;
    const f = this.ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = filterFreq || 2600;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, time);
    g.gain.exponentialRampToValueAtTime(0.0008, time + dur);
    s.connect(f); f.connect(g); g.connect(dest || this.sfxGain);
    s.start(time); s.stop(time + dur + 0.05);
  }

  startMusic(worldId) {
    this.init();
    this.stopMusic();
    if (!this.ctx) return;
    this._currentWorld = worldId;
    this._rngSeed = 11 + worldId.length * 7;
    this._step = 0;
    this._nextTime = this.ctx.currentTime + 0.08;
    this._musicTimer = setInterval(() => this._schedule(), 30);
  }

  stopMusic() {
    if (this._musicTimer) { clearInterval(this._musicTimer); this._musicTimer = null; }
    this._currentWorld = null;
  }

  _schedule() {
    if (!this.ctx || !this._currentWorld) return;
    const cfg = WORLD_MUSIC[this._currentWorld] || WORLD_MUSIC.prairie;
    const spb = 60 / cfg.bpm;
    const step = spb / 2;
    while (this._nextTime < this.ctx.currentTime + 0.14) {
      const s = this._step;
      const t = this._nextTime;
      const bar = Math.floor(s / 16) % cfg.prog.length;
      const rootNote = cfg.root + cfg.prog[bar];
      if (s % 4 === 0) this._tone(t, midiFreq(rootNote - 24), spb * 0.9, "sine", 0.30, this.musicGain);
      if (s % 8 === 4) this._tone(t, midiFreq(rootNote - 12), spb * 0.25, "square", 0.10, this.musicGain);
      const idx = (s * 5 + bar * 3) % cfg.scale.length;
      if (s % 2 === 0 || (s % 4 === 3)) {
        const note = rootNote + cfg.scale[idx] + 12;
        this._tone(t, midiFreq(note), step * 0.85, cfg.wave, 0.14, this.musicGain);
      }
      if (s % 4 === 2) this._noise(t, 0.05, 0.10, this.musicGain, 7000);
      if (s % 8 === 0) this._noise(t, 0.11, 0.14, this.musicGain, 1400);
      this._step++;
      this._nextTime += step;
    }
  }

  jump() { if (!this.ctx) return; const t = this.ctx.currentTime; this._tone(t, 320, 0.16, "square", 0.18, this.sfxGain, 720); }
  land() { if (!this.ctx) return; const t = this.ctx.currentTime; this._noise(t, 0.09, 0.16, this.sfxGain, 900); }
  coin() { if (!this.ctx) return; const t = this.ctx.currentTime; this._tone(t, 1180, 0.09, "square", 0.14); this._tone(t + 0.07, 1580, 0.14, "square", 0.13); }
  hit() { if (!this.ctx) return; const t = this.ctx.currentTime; this._noise(t, 0.3, 0.34, this.sfxGain, 420); this._tone(t, 200, 0.34, "sawtooth", 0.2, this.sfxGain, 60); }
  fall() { if (!this.ctx) return; const t = this.ctx.currentTime; this._tone(t, 640, 0.7, "sine", 0.2, this.sfxGain, 90); }
  checkpoint() { if (!this.ctx) return; const t = this.ctx.currentTime; [0, 4, 7, 12].forEach((n, i) => this._tone(t + i * 0.07, midiFreq(72 + n), 0.16, "triangle", 0.16)); }
  win() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    [0, 4, 7, 12, 16, 19].forEach((n, i) => this._tone(t + i * 0.1, midiFreq(64 + n), 0.32, "triangle", 0.2));
    this._tone(t + 0.62, midiFreq(88), 0.7, "sine", 0.22);
  }
  uiClick() { if (!this.ctx) return; this._tone(this.ctx.currentTime, 900, 0.06, "sine", 0.1); }
  record() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    [12, 16, 19, 24, 28].forEach((n, i) => this._tone(t + i * 0.09, midiFreq(60 + n), 0.3, "square", 0.14));
  }
}
