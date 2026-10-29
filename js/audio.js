"use strict";

// Procedural sound effects (Web Audio API).
// Every effect is synthesised from oscillators and filtered noise with a little random pitch
// and length variation, so repeated sounds don't grate. A voice limiter caps how many play at
// once and how close together the same sound can retrigger.
//
// Routing: voice -> sfx bus -> master bus -> speakers. The music bus (used by js/music.js)
// also feeds the master bus. The original WAV jingles are kept as an optional layer for the
// start / win / loss stings (settings.useSampleJingles); if they fail to play, synth versions
// are used instead.

const SFX_MAX_VOICES = 28;
const SFX_MIN_GAP = {
  fire: 0.035,
  egg_splat: 0.045,
  tank_hit: 0.03,
  soldier_hit: 0.03,
  tank_destroyed: 0.06,
  soldier_destroyed: 0.05,
  coin: 0.03,
  click: 0.02,
};
const SAMPLE_JINGLES = ["start_reveille", "end_jingle", "sad_jingle"];

class AudioFx {
  constructor() {
    this.ctx = null;
    this.unlocked = false;
    this.voices = 0;
    this.lastPlayed = {};
    this.aliases = {
      splat: "egg_splat",
      hit: "tank_hit",
      win: "end_jingle",
      loss: "sad_jingle",
    };
    this.samples = {};
    SAMPLE_JINGLES.forEach((name) => {
      const sound = new window.Audio(`assets/sounds/${name}.wav`);
      sound.preload = "auto";
      this.samples[name] = sound;
    });
  }

  ensure() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.sfx = this.ctx.createGain();
      this.music = this.ctx.createGain();
      this.sfx.connect(this.master);
      this.music.connect(this.master);
      this.master.connect(this.ctx.destination);
      this.noiseBuffer = this.makeNoise();
      this.applyVolumes();
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
    this.unlocked = true;
  }

  makeNoise() {
    const length = this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  // Master follows the main volume/mute setting; the bus levels come from settings too.
  applyVolumes() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(Math.max(0, settings.soundVolume / 3), now, 0.02);
    this.sfx.gain.setTargetAtTime(settings.sfxVolume ?? 1, now, 0.02);
    const fade = typeof Music !== "undefined" ? Music.fade : 1;
    this.music.gain.setTargetAtTime((settings.musicVolume ?? 0.6) * fade, now, 0.02);
  }

  ready() {
    return this.ctx && this.unlocked && this.ctx.state !== "suspended" && settings.soundVolume > 0;
  }

  // ---- Synth primitives -----------------------------------------------------------------

  tone(freq, duration, { type = "square", volume = 0.1, slideTo = null, attack = 0.005, delay = 0, bus = this.sfx } = {}) {
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + duration);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(volume, t0 + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain).connect(bus);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  noise(duration, { volume = 0.2, filter = "lowpass", freq = 1000, freqTo = null, q = 1, delay = 0, bus = this.sfx } = {}) {
    const t0 = this.ctx.currentTime + delay;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const biquad = this.ctx.createBiquadFilter();
    biquad.type = filter;
    biquad.frequency.setValueAtTime(freq, t0);
    if (freqTo) biquad.frequency.exponentialRampToValueAtTime(Math.max(30, freqTo), t0 + duration);
    biquad.Q.value = q;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    src.connect(biquad).connect(gain).connect(bus);
    src.start(t0, Math.random() * 0.5);
    src.stop(t0 + duration + 0.02);
  }

  // ---- Recipes --------------------------------------------------------------------------

  // Returns the approximate length in seconds, used by the voice limiter.
  synth(name) {
    const v = rand(0.88, 1.12);
    const n = (d) => d * rand(0.85, 1.15);
    switch (name) {
      case "fire":
        this.noise(n(0.07), { volume: 0.22, filter: "bandpass", freq: 1300 * v, freqTo: 380, q: 1.2 });
        this.tone(230 * v, n(0.08), { type: "triangle", volume: 0.14, slideTo: 110 * v });
        return 0.09;
      case "egg_splat":
        this.noise(n(0.2), { volume: 0.32, filter: "lowpass", freq: 1100 * v, freqTo: 180 });
        this.tone(150 * v, n(0.12), { type: "sine", volume: 0.28, slideTo: 55 });
        return 0.2;
      case "tank_hit":
        this.tone(330 * v, n(0.1), { type: "square", volume: 0.09, slideTo: 250 * v });
        this.tone(880 * v, n(0.09), { type: "triangle", volume: 0.07, slideTo: 700 * v });
        this.noise(0.05, { volume: 0.14, filter: "highpass", freq: 2200 });
        return 0.1;
      case "soldier_hit":
        this.tone(560 * v, n(0.09), { type: "square", volume: 0.08, slideTo: 300 * v });
        return 0.09;
      case "tank_destroyed":
        this.noise(n(0.65), { volume: 0.45, filter: "lowpass", freq: 1900 * v, freqTo: 110 });
        this.tone(95 * v, n(0.5), { type: "sine", volume: 0.45, slideTo: 32 });
        this.noise(0.12, { volume: 0.2, filter: "highpass", freq: 3000, delay: 0.02 });
        return 0.6;
      case "soldier_destroyed":
        this.tone(720 * v, n(0.18), { type: "triangle", volume: 0.13, slideTo: 190 * v });
        this.noise(0.12, { volume: 0.16, filter: "bandpass", freq: 1500 * v, q: 2 });
        return 0.18;
      case "coin":
        this.tone(988 * v, 0.06, { type: "square", volume: 0.06 });
        this.tone(1319 * v, 0.14, { type: "square", volume: 0.06, delay: 0.06 });
        return 0.2;
      case "click":
        this.tone(620 * v, 0.035, { type: "square", volume: 0.05 });
        return 0.04;
      case "deny":
        this.tone(180, 0.09, { type: "square", volume: 0.06 });
        this.tone(140, 0.12, { type: "square", volume: 0.06, delay: 0.08 });
        return 0.2;
      case "levelup":
        [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.16, { type: "square", volume: 0.06, delay: i * 0.08 }));
        return 0.6;
      case "unlock":
        [784, 1175, 1568].forEach((f, i) => this.tone(f, 0.35, { type: "triangle", volume: 0.08, delay: i * 0.06 }));
        return 0.5;
      case "tick":
        this.tone(1400 * v, 0.025, { type: "triangle", volume: 0.035 });
        return 0.03;
      case "start_reveille":
        [392, 523, 659, 523, 659, 784].forEach((f, i) => this.tone(f, 0.13, { type: "square", volume: 0.06, delay: i * 0.12 }));
        return 0.8;
      case "end_jingle":
        [392, 523, 659, 784, 1047].forEach((f, i) => this.tone(f, i === 4 ? 0.4 : 0.16, { type: "square", volume: 0.06, delay: i * 0.11 }));
        return 0.9;
      case "sad_jingle":
        [392, 330, 262, 196].forEach((f, i) => this.tone(f, i === 3 ? 0.5 : 0.22, { type: "triangle", volume: 0.08, delay: i * 0.2 }));
        return 1.1;
      case "rumble":
        this.noise(n(1.1), { volume: 0.5, filter: "lowpass", freq: 260 * v, freqTo: 70 });
        this.tone(48 * v, n(1), { type: "sine", volume: 0.4, slideTo: 36 });
        return 1.1;
      case "wind_howl":
        this.noise(n(1.5), { volume: 0.28, filter: "bandpass", freq: 300 * v, freqTo: 1200 * v, q: 4 });
        this.noise(n(1.4), { volume: 0.18, filter: "bandpass", freq: 900 * v, freqTo: 350, q: 6, delay: 0.1 });
        return 1.5;
      case "wave_crash":
        this.noise(n(2.2), { volume: 0.45, filter: "lowpass", freq: 600 * v, freqTo: 2400 });
        this.noise(n(2.5), { volume: 0.3, filter: "highpass", freq: 2500, delay: 0.6 });
        return 2.5;
      case "squeak":
        this.tone(1300 * v, 0.07, { type: "sine", volume: 0.1, slideTo: 1800 * v });
        this.tone(1700 * v, 0.1, { type: "sine", volume: 0.08, slideTo: 1200 * v, delay: 0.08 });
        return 0.2;
      case "bawk":
        this.tone(700 * v, 0.06, { type: "square", volume: 0.05, slideTo: 1100 * v });
        this.tone(900 * v, 0.12, { type: "square", volume: 0.05, slideTo: 500 * v, delay: 0.07 });
        return 0.2;
      case "ufo":
        this.tone(600, 1.6, { type: "sine", volume: 0.08, slideTo: 900 });
        this.tone(910, 1.6, { type: "sine", volume: 0.05, slideTo: 600 });
        return 1.6;
      case "beam":
        this.tone(220, 1.2, { type: "sawtooth", volume: 0.04, slideTo: 880 });
        return 1.2;
      case "moo":
        this.tone(150, 0.7, { type: "sawtooth", volume: 0.07, slideTo: 110 });
        this.noise(0.6, { volume: 0.08, filter: "lowpass", freq: 500 });
        return 0.7;
      case "thunder":
        this.noise(0.08, { volume: 0.4, filter: "highpass", freq: 2500 });
        this.noise(n(1.8), { volume: 0.55, filter: "lowpass", freq: 900 * v, freqTo: 60, delay: 0.05 });
        this.tone(55 * v, n(1.2), { type: "sine", volume: 0.35, slideTo: 30, delay: 0.1 });
        return 1.8;
      case "crow":
        this.tone(520, 0.12, { type: "sawtooth", volume: 0.06, slideTo: 700 });
        this.tone(700, 0.14, { type: "sawtooth", volume: 0.06, slideTo: 760, delay: 0.13 });
        this.tone(760, 0.45, { type: "sawtooth", volume: 0.06, slideTo: 520, delay: 0.28 });
        return 0.75;
      case "freeze":
        [2400, 3100, 2700, 3600].forEach((f, i) => this.tone(f * v, 0.08, { type: "triangle", volume: 0.04, delay: i * 0.04 }));
        this.noise(0.3, { volume: 0.12, filter: "highpass", freq: 5000 });
        return 0.3;
      case "zap":
        this.noise(n(0.25), { volume: 0.3, filter: "highpass", freq: 3000 * v });
        this.tone(1800 * v, 0.2, { type: "sawtooth", volume: 0.05, slideTo: 300 });
        return 0.25;
      case "horn":
        this.tone(196, 0.25, { type: "sawtooth", volume: 0.06 });
        this.tone(262, 0.45, { type: "sawtooth", volume: 0.06, delay: 0.22 });
        return 0.7;
      case "bleat":
        this.tone(420 * v, 0.45, { type: "sawtooth", volume: 0.05, slideTo: 380 * v });
        for (let i = 0; i < 5; i++) this.tone(430 * v + (i % 2) * 30, 0.06, { type: "square", volume: 0.025, delay: i * 0.07 });
        return 0.45;
      case "buzz":
        this.tone(170 * v, 1.2, { type: "sawtooth", volume: 0.035, slideTo: 190 * v });
        this.tone(176 * v, 1.2, { type: "sawtooth", volume: 0.03, slideTo: 165 * v });
        return 1.2;
      case "croak":
        this.tone(120 * v, 0.12, { type: "square", volume: 0.07, slideTo: 90 });
        this.tone(140 * v, 0.14, { type: "square", volume: 0.06, slideTo: 80, delay: 0.14 });
        return 0.3;
      case "slime":
        this.tone(300 * v, 0.3, { type: "sine", volume: 0.12, slideTo: 80 });
        this.noise(0.25, { volume: 0.15, filter: "lowpass", freq: 600 });
        return 0.3;
      case "pop":
        this.noise(0.05, { volume: 0.3, filter: "bandpass", freq: 2200 * v, q: 3 });
        this.tone(900 * v, 0.04, { type: "square", volume: 0.04, slideTo: 500 });
        return 0.06;
      case "honk":
        this.tone(330 * v, 0.14, { type: "square", volume: 0.06 });
        this.tone(415 * v, 0.14, { type: "square", volume: 0.05 });
        this.tone(330 * v, 0.18, { type: "square", volume: 0.06, delay: 0.2 });
        this.tone(415 * v, 0.18, { type: "square", volume: 0.05, delay: 0.2 });
        return 0.4;
      case "laugh":
        for (let i = 0; i < 4; i++) this.tone((620 - i * 40) * v, 0.07, { type: "triangle", volume: 0.07, slideTo: (520 - i * 40) * v, delay: i * 0.12 });
        return 0.5;
      case "roar":
        this.tone(110 * v, 0.7, { type: "sawtooth", volume: 0.08, slideTo: 70 });
        this.noise(0.6, { volume: 0.18, filter: "lowpass", freq: 500 * v, freqTo: 150 });
        return 0.7;
      case "camera":
        this.noise(0.04, { volume: 0.2, filter: "highpass", freq: 4000 });
        this.tone(2200, 0.05, { type: "square", volume: 0.03, delay: 0.05 });
        return 0.1;
      case "boo":
        this.tone(300 * v, 1.1, { type: "sine", volume: 0.07, slideTo: 220 * v });
        this.tone(306 * v, 1.1, { type: "sine", volume: 0.05, slideTo: 230 * v });
        return 1.1;
      case "hiss":
        this.noise(n(1.2), { volume: 0.25, filter: "highpass", freq: 3500 * v });
        return 1.2;
      case "meow":
        this.tone(700 * v, 0.25, { type: "triangle", volume: 0.05, slideTo: 1000 * v });
        this.tone(1000 * v, 0.2, { type: "triangle", volume: 0.04, slideTo: 600 * v, delay: 0.2 });
        return 0.45;
      case "boing":
        this.tone(180 * v, 0.35, { type: "sine", volume: 0.12, slideTo: 520 * v });
        this.tone(520 * v, 0.2, { type: "sine", volume: 0.06, slideTo: 300 * v, delay: 0.3 });
        return 0.5;
      case "hic":
        this.tone(500 * v, 0.06, { type: "square", volume: 0.05, slideTo: 900 * v });
        return 0.08;
      case "event_warn":
        [660, 880, 660, 880].forEach((f, i) => this.tone(f, 0.12, { type: "triangle", volume: 0.07, delay: i * 0.15 }));
        return 0.6;
      default:
        return 0;
    }
  }

  // ---- Public API -----------------------------------------------------------------------

  play(name) {
    if (!this.ready()) return;
    name = this.aliases[name] || name;
    const now = this.ctx.currentTime;
    if (now - (this.lastPlayed[name] ?? -1) < (SFX_MIN_GAP[name] || 0)) return;
    if (this.voices >= SFX_MAX_VOICES) return;
    this.lastPlayed[name] = now;
    if (settings.useSampleJingles && this.samples[name]) {
      const player = this.samples[name].cloneNode();
      player.volume = clamp((settings.soundVolume / 3) * (settings.sfxVolume ?? 1), 0, 1);
      player.play().catch(() => this.voice(name));
      return;
    }
    this.voice(name);
  }

  voice(name) {
    const length = this.synth(name);
    if (!length) return;
    this.voices++;
    setTimeout(() => { this.voices = Math.max(0, this.voices - 1); }, length * 1000 + 50);
  }
}

const audio = new AudioFx();
