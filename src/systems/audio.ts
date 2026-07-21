// Chiptune audio via raw WebAudio — no asset files. The context is
// created lazily on the first user gesture (browser autoplay policy),
// so every public method is safe to call at any time.
//
// The Buzz link: setDetune() warbles both music and SFX pitch as the
// meter climbs, per the design doc.

type SfxName =
  | "bell" | "crash" | "pour" | "pickup" | "chug" | "bust" | "lastcall"
  | "thunk" | "buzzer";

// One chiptune flavor per route (beercycle-e2x): Pearl St keeps the
// original sunny loop, The Hill runs brisker and minor-ish, East
// Boulder stretches out slow and wide.
interface MusicStyle {
  bass: number[];
  lead: number[];
  step: number; // seconds per sequencer step
}

const MUSIC_STYLES: MusicStyle[] = [
  {
    bass: [110, 110, 165, 110, 147, 110, 165, 196],
    lead: [440, 523, 659, 523, 587, 494, 523, 392, 440, 523, 659, 784, 659, 587, 523, 494],
    step: 0.22,
  },
  {
    bass: [98, 98, 147, 98, 131, 98, 156, 175],
    lead: [392, 466, 587, 466, 523, 440, 466, 349, 392, 466, 587, 698, 587, 523, 466, 440],
    step: 0.19,
  },
  {
    bass: [131, 131, 196, 131, 175, 131, 196, 220],
    lead: [523, 659, 784, 659, 698, 587, 659, 523, 523, 659, 784, 880, 784, 698, 659, 587],
    step: 0.25,
  },
];

class AudioSystem {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private musicTimer: number | null = null;
  private step = 0;
  private styleIndex = 0;
  private detuneCents = 0;
  private muted = false;

  private get style(): MusicStyle {
    return MUSIC_STYLES[this.styleIndex % MUSIC_STYLES.length];
  }

  // Pick the route's flavor; restarts the sequencer if music is playing.
  setMusicStyle(index: number): void {
    const next = index % MUSIC_STYLES.length;
    if (next === this.styleIndex) return;
    this.styleIndex = next;
    this.step = 0;
    if (this.musicTimer !== null) {
      this.stopMusic();
      this.startMusic();
    }
  }

  private ensure(): AudioContext | null {
    if (!this.ctx) {
      try {
        this.ctx = new AudioContext();
      } catch {
        return null; // no audio available; stay silent
      }
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.12;
      this.musicGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  // Mobile lifeline (beercycle-q25): iOS/Android suspend the context on
  // backgrounding or audio interruptions and only a user gesture can
  // reliably bring it back. Hook every gesture + tab-return so a
  // suspended context recovers on the next touch instead of staying
  // silent forever.
  attachAutoResume(): void {
    const kick = () => {
      if (this.ctx && this.ctx.state !== "running") void this.ctx.resume();
    };
    window.addEventListener("pointerdown", kick, { passive: true });
    window.addEventListener("touchend", kick, { passive: true });
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) kick();
    });
  }

  // Call from inside a touch/click handler to create+resume the context
  // while the gesture is live.
  unlock(): void {
    this.ensure();
  }

  isMuted(): boolean {
    return this.muted;
  }

  // Buzz 0-100 → up to ~70 cents of random warble on every note.
  setDetune(buzzLevel: number): void {
    this.detuneCents = buzzLevel * 0.7;
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.musicGain) this.musicGain.gain.value = this.muted ? 0 : 0.12;
    if (!this.muted) this.ensure(); // unmuting should also revive the ctx
    return this.muted;
  }

  startMusic(): void {
    const ctx = this.ensure();
    if (!ctx || this.musicTimer !== null) return;
    const tick = () => {
      if (this.muted || !this.ctx) return;
      const { bass, lead, step } = this.style;
      const t = this.ctx.currentTime + 0.05;
      this.note(bass[this.step % bass.length], t, step * 0.9, "triangle", 0.2, this.musicGain!);
      if (this.step % 2 === 0) {
        this.note(
          lead[Math.floor(this.step / 2) % lead.length], t, step * 1.6, "square", 0.06,
          this.musicGain!,
        );
      }
      this.step++;
    };
    this.musicTimer = window.setInterval(tick, this.style.step * 1000);
  }

  stopMusic(): void {
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  // Pitched blip for the flight-tasting memory game (one pitch per glass).
  blip(index: number): void {
    const ctx = this.ensure();
    if (!ctx || this.muted) return;
    this.note([392, 494, 587][index % 3], ctx.currentTime, 0.16, "square", 0.12);
  }

  sfx(name: SfxName): void {
    const ctx = this.ensure();
    if (!ctx || this.muted) return;
    const t = ctx.currentTime;
    switch (name) {
      case "bell":
        this.note(880, t, 0.08, "square", 0.12);
        this.note(1320, t + 0.09, 0.12, "square", 0.1);
        break;
      case "crash":
        this.noise(t, 0.3, 0.25);
        this.note(110, t, 0.25, "sawtooth", 0.15);
        break;
      case "pour":
        for (let i = 0; i < 6; i++) {
          this.note(620 - i * 70, t + i * 0.05, 0.06, "sawtooth", 0.07);
        }
        break;
      case "pickup":
        this.note(660, t, 0.05, "square", 0.1);
        this.note(990, t + 0.06, 0.08, "square", 0.1);
        break;
      case "chug":
        this.note(220, t, 0.1, "sine", 0.16);
        this.note(180, t + 0.1, 0.12, "sine", 0.16);
        this.note(240, t + 0.24, 0.1, "sine", 0.14);
        break;
      case "bust":
        for (let i = 0; i < 3; i++) {
          this.note(700, t + i * 0.3, 0.14, "square", 0.12);
          this.note(500, t + i * 0.3 + 0.15, 0.14, "square", 0.12);
        }
        break;
      case "thunk": // dart hitting the board
        this.note(140, t, 0.07, "square", 0.2);
        this.noise(t, 0.06, 0.12);
        break;
      case "buzzer": // wrong answer
        this.note(160, t, 0.25, "sawtooth", 0.14);
        this.note(151, t, 0.25, "sawtooth", 0.1);
        break;
      case "lastcall": {
        // Sad trombone: three descending notes, then a long wobbly one.
        const seq = [392, 370, 349];
        seq.forEach((f, i) => this.note(f, t + i * 0.35, 0.3, "sawtooth", 0.13));
        this.note(311, t + 1.05, 0.9, "sawtooth", 0.13);
        this.note(315, t + 1.05, 0.9, "sawtooth", 0.09); // detuned beat = the wah
        break;
      }
    }
  }

  private note(
    freq: number,
    t: number,
    dur: number,
    type: OscillatorType,
    gain: number,
    dest?: AudioNode,
  ): void {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.detune.value = (Math.random() * 2 - 1) * this.detuneCents;
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g);
    g.connect(dest ?? ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  private noise(t: number, dur: number, gain: number): void {
    const ctx = this.ctx!;
    const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const g = ctx.createGain();
    g.gain.value = gain;
    src.connect(g);
    g.connect(ctx.destination);
    src.start(t);
  }
}

export const audio = new AudioSystem();
