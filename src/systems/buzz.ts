import Phaser from "phaser";

// Tipsiness model (docs/GAME_DESIGN.md): Buzz is 0-100 and maps to staged
// handling degradation. This class is pure state + math; GameScene applies
// the effects to steering, speed response, and the camera.
//
//   20-40  slow sinusoidal steering drift, slight camera sway
//   40-60  input lag up to ~200ms, stronger drift
//   60-80  random wobble impulses, tunnel-vision onset, mushy braking
//   80-100 severe wobble, brief mirrored inputs, heavy vignette

export interface BuzzEffects {
  steerDrift: number; // lateral velocity offset, world units/s
  inputLagMs: number;
  mirrored: boolean;
  sway: number; // camera x offset, px
  vignette: number; // 0..1 tunnel-vision strength
  responseMush: number; // 0..1, scales down accel/brake response
}

const DECAY_PER_S = 1.1;

export class BuzzSystem {
  private levelValue = 0;
  private t = 0;
  private wobble = 0;
  private mirrorUntil = 0;
  private nextEventAt = 2;

  get level(): number {
    return this.levelValue;
  }

  drink(amount: number): void {
    this.levelValue = Math.min(100, this.levelValue + amount);
  }

  sober(amount: number): void {
    this.levelValue = Math.max(0, this.levelValue - amount);
  }

  update(dt: number): void {
    this.t += dt;
    this.levelValue = Math.max(0, this.levelValue - DECAY_PER_S * dt);
    this.wobble *= Math.exp(-2.5 * dt);

    if (this.t >= this.nextEventAt) {
      this.nextEventAt = this.t + Phaser.Math.FloatBetween(1.2, 3);
      const l = this.levelValue;
      if (l >= 60) {
        const severity = l >= 80 ? 130 : 90;
        this.wobble += Phaser.Math.FloatBetween(-1, 1) * severity * (l / 100);
      }
      if (l >= 80 && Math.random() < 0.3) {
        this.mirrorUntil = this.t + 0.5;
      }
    }
  }

  effects(): BuzzEffects {
    const l = this.levelValue;
    const f = l / 100;
    return {
      steerDrift: (l >= 20 ? Math.sin(this.t * 1.6) * 34 * f : 0) + this.wobble,
      inputLagMs: l >= 40 ? Math.min(200, ((l - 40) / 60) * 260) : 0,
      mirrored: this.t < this.mirrorUntil,
      sway: l >= 20 ? Math.sin(this.t * 0.8) * 7 * f : 0,
      vignette: l >= 60 ? (l - 60) / 40 : 0,
      responseMush: l >= 60 ? Math.min(0.6, ((l - 60) / 40) * 0.6) : 0,
    };
  }
}
