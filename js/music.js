"use strict";

// Procedural background music: a small step sequencer on the Web Audio music bus.
// Each mood has a key, tempo and chord progression; a melody is generated per stage from a
// seed, so every stage has its own tune. An intensity value (0..1) driven by the battle brings
// in drums, the lead line and extra percussion as the armies clash. Stings for victory and
// defeat come from the SFX jingles; the loop fades out under them.

const MUSIC_MOODS = {
  title: { root: 48, tempo: 92, minor: false, chords: [[0, "M"], [9, "m"], [5, "M"], [7, "M"]] },
  day: { root: 48, tempo: 116, minor: false, chords: [[0, "M"], [7, "M"], [9, "m"], [5, "M"]] },
  dusk: { root: 45, tempo: 104, minor: true, chords: [[0, "m"], [8, "M"], [3, "M"], [10, "M"]] },
  night: { root: 50, tempo: 90, minor: true, chords: [[0, "m"], [5, "m"], [7, "m"], [0, "m"]] },
  dawn: { root: 53, tempo: 108, minor: false, chords: [[0, "M"], [4, "m"], [5, "M"], [7, "M"]] },
};
const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11];
const MINOR_SCALE = [0, 2, 3, 5, 7, 8, 10];
const STEPS_PER_BAR = 16;
const MUSIC_LOOKAHEAD = 0.15;

const midiToHz = (m) => 440 * Math.pow(2, (m - 69) / 12);

const Music = {
  mood: null,
  seed: 0,
  step: 0,
  nextTime: 0,
  intensity: 0,
  targetIntensity: 0,
  timer: null,
  melody: [],
  fade: 1,

  start(moodName, seed) {
    if (!audio.ctx) return;
    if (this.mood === moodName && this.seed === seed && this.timer) {
      if (this.fade < 1) this.setFade(1);
      return;
    }
    this.mood = moodName;
    this.seed = seed;
    this.def = MUSIC_MOODS[moodName] || MUSIC_MOODS.day;
    this.melody = this.composeMelody(seed);
    this.step = 0;
    this.nextTime = audio.ctx.currentTime + 0.1;
    this.setFade(1);
    if (!this.timer) this.timer = setInterval(() => this.schedule(), 30);
  },

  stop() {
    this.setFade(0);
  },

  setFade(value) {
    this.fade = value;
    if (!audio.ctx) return;
    const level = (settings.musicVolume ?? 0.6) * value;
    audio.music.gain.setTargetAtTime(level, audio.ctx.currentTime, value ? 0.3 : 0.6);
  },

  // One bar per chord; the melody picks scale notes, favouring chord tones on strong beats.
  composeMelody(seed) {
    const random = seededRandom(seed * 2654435761);
    const def = this.def;
    const scale = def.minor ? MINOR_SCALE : MAJOR_SCALE;
    const notes = [];
    let degree = 2;
    for (let bar = 0; bar < def.chords.length; bar++) {
      for (let s = 0; s < STEPS_PER_BAR; s++) {
        const strong = s % 4 === 0;
        const play = strong ? random() < 0.85 : s % 2 === 0 ? random() < 0.45 : random() < 0.12;
        if (!play) {
          notes.push(null);
          continue;
        }
        degree = clamp(degree + Math.round((random() - 0.5) * 4), 0, 9);
        if (strong) degree -= degree % 2; // land on chord-ish tones
        const octave = Math.floor(degree / 7);
        notes.push(def.root + 24 + scale[degree % 7] + 12 * octave);
      }
    }
    return notes;
  },

  schedule() {
    if (!audio.ready() || !this.def) return;
    const ctxTime = audio.ctx.currentTime;
    if (this.nextTime < ctxTime - 0.5) this.nextTime = ctxTime + 0.05;
    const stepDur = 60 / this.def.tempo / 4;
    while (this.nextTime < ctxTime + MUSIC_LOOKAHEAD) {
      if (this.fade > 0) this.playStep(this.step, this.nextTime, stepDur);
      this.step = (this.step + 1) % (STEPS_PER_BAR * this.def.chords.length);
      this.nextTime += stepDur;
    }
  },

  playStep(step, when, stepDur) {
    const def = this.def;
    const bar = Math.floor(step / STEPS_PER_BAR);
    const s = step % STEPS_PER_BAR;
    const [chordRoot, quality] = def.chords[bar];
    const root = def.root + chordRoot;
    const third = quality === "m" ? 3 : 4;
    const delay = Math.max(0, when - audio.ctx.currentTime);
    const k = this.intensity;
    const bus = audio.music;

    // Bass on beats, walking up to the fifth on the off-beat when things heat up.
    if (s % 4 === 0) audio.tone(midiToHz(root - 12), stepDur * 3, { type: "triangle", volume: 0.16, delay, bus });
    if (k > 0.45 && s % 4 === 2) audio.tone(midiToHz(root - 5), stepDur * 1.5, { type: "triangle", volume: 0.09, delay, bus });

    // Soft chord pad at the start of each bar.
    if (s === 0) {
      [0, third, 7].forEach((iv) => audio.tone(midiToHz(root + 12 + iv), stepDur * 14, { type: "sine", volume: 0.035, attack: 0.08, delay, bus }));
    }

    // Lead melody fades in with intensity.
    const note = this.melody[step];
    if (note && k > 0.15) audio.tone(midiToHz(note), stepDur * 1.8, { type: "square", volume: 0.025 + 0.03 * k, delay, bus });

    // Drums: kick always, snare and hats with intensity.
    if (s % 8 === 0) audio.tone(140, 0.18, { type: "sine", volume: 0.22, slideTo: 45, delay, bus });
    if (k > 0.3 && s % 8 === 4) audio.noise(0.12, { volume: 0.06 + 0.06 * k, filter: "bandpass", freq: 1800, q: 0.8, delay, bus });
    if (k > 0.55 && s % 2 === 1) audio.noise(0.04, { volume: 0.03 + 0.03 * k, filter: "highpass", freq: 6000, delay, bus });
    if (k > 0.8 && s % 4 === 3) audio.noise(0.05, { volume: 0.05, filter: "bandpass", freq: 900, q: 2, delay, bus });
  },

  // Called every frame from the game: picks the mood and eases intensity toward the action.
  update(game, dt) {
    if (!audio.ready()) return;
    if (["title", "settings", "armory", "achievements"].includes(game.scene)) {
      this.start("title", 1);
      this.targetIntensity = 0.1;
    } else if (game.winner) {
      this.stop();
      this.targetIntensity = 0;
    } else {
      this.start(Sky.phase || "day", game.stage);
      const action = game.eggs.length / 30 + Effects.live / 350;
      this.targetIntensity = clamp(0.2 + action, 0, 1);
      if (game.scene === "paused") this.targetIntensity = 0.1;
    }
    const rate = this.targetIntensity > this.intensity ? 0.8 : 0.25;
    this.intensity += (this.targetIntensity - this.intensity) * Math.min(1, dt * rate);
  },
};
