"use strict";

class AudioFx {
  constructor() {
    this.ctx = null;
    this.unlocked = false;
    this.aliases = {
      splat: "egg_splat",
      hit: "tank_hit",
      win: "end_jingle",
      loss: "sad_jingle",
    };
    this.sounds = {};
    [
      "fire",
      "tank_hit",
      "tank_destroyed",
      "soldier_hit",
      "soldier_destroyed",
      "egg_splat",
      "start_reveille",
      "end_jingle",
      "sad_jingle",
    ].forEach((name) => {
      const sound = new window.Audio(`assets/sounds/${name}.wav`);
      sound.preload = "auto";
      sound.volume = Math.min(1, settings.soundVolume / 3);
      this.sounds[name] = sound;
    });
  }

  ensure() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx.state === "suspended") this.ctx.resume();
    this.unlocked = true;
    Object.values(this.sounds).forEach((sound) => sound.load());
  }

  tone(freq, duration, type = "square", volume = 0.05) {
    if (!this.ctx || !this.unlocked || this.ctx.state === "suspended") return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = Math.min(0.35, volume * settings.soundVolume);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  play(name) {
    if (!this.ctx || !this.unlocked) return;
    const soundName = this.aliases[name] || name;
    const sound = this.sounds[soundName];
    if (sound) {
      const player = sound.cloneNode();
      player.volume = sound.volume;
      player.play().catch(() => this.playFallback(soundName));
      return;
    }
    this.playFallback(soundName);
  }

  playFallback(name) {
    if (name === "fire") this.tone(720, 0.08, "square", 0.05);
    if (name === "egg_splat") this.tone(140, 0.12, "sawtooth", 0.06);
    if (name === "tank_hit" || name === "soldier_hit") this.tone(260, 0.1, "square", 0.065);
    if (name === "end_jingle") [392, 523, 659, 784].forEach((f, i) => setTimeout(() => this.tone(f, 0.16, "square", 0.055), i * 110));
    if (name === "sad_jingle") [392, 330, 262].forEach((f, i) => setTimeout(() => this.tone(f, i === 2 ? 0.34 : 0.2, "triangle", 0.07), i * 180));
  }
}

const audio = new AudioFx();
