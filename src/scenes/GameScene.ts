import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../main";
import { BuzzSystem } from "../systems/buzz";
import { PEARL_ST_BREWERIES, type Brewery } from "../systems/breweries";

// Core riding model: the route is a 1D distance axis (d) with a lateral
// position (lat, 0..ROAD_WIDTH) across the road. Screen position is a
// fixed player anchor plus offsets along the two diagonal axes below —
// the Paperboy pseudo-isometric look without real isometric tiles.
const FORWARD = new Phaser.Math.Vector2(1, -2).normalize(); // up-right
const CROSS = new Phaser.Math.Vector2(2, 1).normalize(); // across the road
const ROAD_ANGLE = Math.atan2(FORWARD.y, FORWARD.x);

const ROAD_WIDTH = 130;
const SHOULDER = 28; // rideable grass strip before the crash boundary
const ANCHOR = new Phaser.Math.Vector2(150, 185); // bike's screen position
const ROUTE_LENGTH = 5000;
const MIN_SPEED = 50;
const MAX_SPEED = 190;
const OFFROAD_SPEED_CAP = 65;
const STEER_SPEED = 95;
const START_LIVES = 3;

type PropKind = "stripe" | "curb" | "cone";

interface Prop {
  kind: PropKind;
  d: number;
  lat: number;
  span: number; // distance after which the prop recycles ahead
  obj: Phaser.GameObjects.Shape;
}

// Fixed roadside set dressing (brewery buildings, stop zones): projected
// like props but never recycled.
interface Fixture {
  d: number;
  lat: number;
  obj: Phaser.GameObjects.Container | Phaser.GameObjects.Rectangle;
}

interface SteerSample {
  t: number;
  v: number;
}

export class GameScene extends Phaser.Scene {
  private buzz!: BuzzSystem;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private enterKey!: Phaser.Input.Keyboard.Key;
  private props: Prop[] = [];
  private fixtures: Fixture[] = [];
  private road!: Phaser.GameObjects.Rectangle;
  private bike!: Phaser.GameObjects.Container;
  private vignette!: Phaser.GameObjects.Image;

  private mode: "riding" | "chugging" = "riding";
  private d = 0;
  private lat = ROAD_WIDTH / 2;
  private speed = MIN_SPEED;
  private score = 0;
  private lives = START_LIVES;
  private crashTimer = 0;
  private invulnTimer = 0;
  private steerHistory: SteerSample[] = [];

  // Brewery stop state.
  private visited = new Set<string>();
  private streak = 0;
  private beerNum = 1;
  private markerPhase = 0;
  private markerSpeed = 2.4;
  private chugLocked = false;
  private resultTimer = 0;

  private scoreText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private buzzFill!: Phaser.GameObjects.Rectangle;
  private progressFill!: Phaser.GameObjects.Rectangle;

  private chugPanel!: Phaser.GameObjects.Container;
  private chugName!: Phaser.GameObjects.Text;
  private chugInfo!: Phaser.GameObjects.Text;
  private chugFeedback!: Phaser.GameObjects.Text;
  private chugPrompt!: Phaser.GameObjects.Text;
  private chugMarker!: Phaser.GameObjects.Rectangle;

  constructor() {
    super("Game");
  }

  create(): void {
    this.buzz = new BuzzSystem();
    this.props = [];
    this.fixtures = [];
    this.steerHistory = [];
    this.mode = "riding";
    this.d = 0;
    this.lat = ROAD_WIDTH / 2;
    this.speed = MIN_SPEED;
    this.score = 0;
    this.lives = START_LIVES;
    this.crashTimer = 0;
    this.invulnTimer = 0;
    this.visited = new Set();
    this.streak = 0;

    // Grass oversized so camera sway never reveals the void.
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 700, 500, 0x4a6741).setDepth(-30);
    this.road = this.add
      .rectangle(0, 0, 1500, ROAD_WIDTH, 0x3b3b45)
      .setRotation(ROAD_ANGLE)
      .setDepth(-20);

    // Lane stripes down the road center.
    for (let i = 0; i < 7; i++) {
      const obj = this.add.rectangle(0, 0, 20, 4, 0xf7f7e8).setRotation(ROAD_ANGLE);
      this.props.push({ kind: "stripe", d: i * 50, lat: ROAD_WIDTH / 2, span: 350, obj });
    }
    // Curb blocks on both edges.
    for (let i = 0; i < 10; i++) {
      for (const lat of [-4, ROAD_WIDTH + 4]) {
        const obj = this.add.rectangle(0, 0, 7, 7, 0xb8b8a0);
        this.props.push({ kind: "curb", d: i * 35, lat, span: 350, obj });
      }
    }
    // A few traffic cones as stand-in obstacles; the real obstacle set is
    // beercycle-ydf.
    for (let i = 0; i < 5; i++) {
      const obj = this.add.triangle(0, 0, 0, 10, 4, 0, 8, 10, 0xff7f2a);
      this.props.push({
        kind: "cone",
        d: 400 + i * 320,
        lat: Phaser.Math.FloatBetween(12, ROAD_WIDTH - 12),
        span: 1600,
        obj,
      });
    }

    // Brewery buildings, signs, and stop zones on the shoulder.
    for (const b of PEARL_ST_BREWERIES) {
      const buildingLat = b.side === "left" ? -40 : ROAD_WIDTH + 40;
      const zoneLat = b.side === "left" ? 8 : ROAD_WIDTH - 8;
      const building = this.add.container(0, 0, [
        this.add.rectangle(0, 0, 34, 26, 0x6b4226),
        this.add.rectangle(0, -16, 40, 8, 0x2b1a10),
        this.add
          .text(0, -16, b.name, { fontFamily: "monospace", fontSize: "7px", color: "#f7e8b0" })
          .setOrigin(0.5),
        this.add.rectangle(0, 6, 8, 12, 0x2b1a10), // door
      ]);
      const zone = this.add.rectangle(0, 0, 42, 24, 0xf7b32b, 0.28).setRotation(ROAD_ANGLE);
      this.fixtures.push({ d: b.d, lat: buildingLat, obj: building });
      this.fixtures.push({ d: b.d, lat: zoneLat, obj: zone });
    }

    const body = this.add.rectangle(0, 0, 10, 18, 0xf7b32b);
    const helmet = this.add.rectangle(0, -7, 6, 4, 0xf7f7e8);
    this.bike = this.add.container(ANCHOR.x, ANCHOR.y, [body, helmet]).setDepth(ANCHOR.y);

    if (!this.textures.exists("vignette")) {
      const canvas = this.textures.createCanvas("vignette", GAME_WIDTH, GAME_HEIGHT)!;
      const ctx = canvas.getContext();
      const grad = ctx.createRadialGradient(
        GAME_WIDTH / 2, GAME_HEIGHT / 2, 60,
        GAME_WIDTH / 2, GAME_HEIGHT / 2, 250,
      );
      grad.addColorStop(0, "rgba(0,0,0,0)");
      grad.addColorStop(1, "rgba(0,0,0,0.9)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      canvas.refresh();
    }
    this.vignette = this.add
      .image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "vignette")
      .setScrollFactor(0)
      .setDepth(1000)
      .setAlpha(0);

    this.createHud();
    this.createChugPanel();

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.enterKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.input.keyboard!.once("keydown-ESC", () => this.endRun(false));
    if (import.meta.env.DEV) {
      this.input.keyboard!.on("keydown-B", () => this.buzz.drink(15));
      this.input.keyboard!.on("keydown-N", () => this.buzz.sober(15));
    }
  }

  private createHud(): void {
    const hud = (t: Phaser.GameObjects.Text | Phaser.GameObjects.Rectangle) =>
      t.setScrollFactor(0).setDepth(1001);

    this.scoreText = hud(
      this.add.text(6, 4, "SCORE 0", { fontFamily: "monospace", fontSize: "10px", color: "#ffffff" }),
    ) as Phaser.GameObjects.Text;
    this.livesText = hud(
      this.add.text(6, 16, `LIVES ${this.lives}`, { fontFamily: "monospace", fontSize: "10px", color: "#8fd694" }),
    ) as Phaser.GameObjects.Text;

    hud(this.add.text(GAME_WIDTH - 92, 4, "BUZZ", { fontFamily: "monospace", fontSize: "10px", color: "#f7b32b" }));
    hud(this.add.rectangle(GAME_WIDTH - 58, 9, 52, 8, 0x222222).setOrigin(0, 0.5));
    this.buzzFill = hud(
      this.add.rectangle(GAME_WIDTH - 57, 9, 0, 6, 0xf7b32b).setOrigin(0, 0.5),
    ) as Phaser.GameObjects.Rectangle;

    hud(this.add.text(GAME_WIDTH / 2 - 70, 4, "PEARL ST", { fontFamily: "monospace", fontSize: "8px", color: "#cfcfcf" }));
    hud(this.add.rectangle(GAME_WIDTH / 2 - 20, 8, 80, 5, 0x222222).setOrigin(0, 0.5));
    this.progressFill = hud(
      this.add.rectangle(GAME_WIDTH / 2 - 19, 8, 0, 3, 0x8fd694).setOrigin(0, 0.5),
    ) as Phaser.GameObjects.Rectangle;
  }

  private createChugPanel(): void {
    const style = (size: string, color: string) => ({
      fontFamily: "monospace",
      fontSize: size,
      color,
    });
    const panel = this.add.rectangle(0, 0, 320, 130, 0x14101c, 0.95).setStrokeStyle(2, 0xf7b32b);
    this.chugName = this.add.text(0, -44, "", style("14px", "#f7b32b")).setOrigin(0.5);
    this.chugInfo = this.add.text(0, -26, "", style("10px", "#cfcfcf")).setOrigin(0.5);
    this.chugFeedback = this.add.text(0, -6, "", style("11px", "#8fd694")).setOrigin(0.5);
    const meterBg = this.add.rectangle(0, 20, 180, 10, 0x222222);
    const sweetSpot = this.add.rectangle(0, 20, 28, 10, 0x8fd694, 0.5);
    this.chugMarker = this.add.rectangle(0, 20, 4, 16, 0xf7f7e8);
    this.chugPrompt = this.add.text(0, 46, "", style("9px", "#9a9a9a")).setOrigin(0.5);

    this.chugPanel = this.add
      .container(GAME_WIDTH / 2, GAME_HEIGHT / 2, [
        panel, this.chugName, this.chugInfo, this.chugFeedback,
        meterBg, sweetSpot, this.chugMarker, this.chugPrompt,
      ])
      .setScrollFactor(0)
      .setDepth(1002)
      .setVisible(false);
  }

  update(_time: number, delta: number): void {
    const dt = Math.min(delta / 1000, 0.05);
    const now = this.time.now;

    if (this.mode === "chugging") {
      this.chugUpdate(dt);
      this.refreshHud();
      return;
    }

    if (this.crashTimer > 0) {
      this.crashTimer -= dt;
      this.bike.rotation += 12 * dt;
      if (this.crashTimer <= 0) {
        if (this.lives <= 0) {
          this.endRun(false);
          return;
        }
        this.bike.rotation = 0;
        this.lat = Phaser.Math.Clamp(this.lat, 12, ROAD_WIDTH - 12);
        this.speed = MIN_SPEED;
        this.invulnTimer = 2;
        this.steerHistory = [];
      }
      this.layoutWorld();
      return;
    }

    this.invulnTimer = Math.max(0, this.invulnTimer - dt);
    this.buzz.update(dt);
    const fx = this.buzz.effects();

    let raw = 0;
    if (this.cursors.left.isDown) raw = -1;
    else if (this.cursors.right.isDown) raw = 1;
    let steer = this.delayedSteer(raw, now, fx.inputLagMs);
    if (fx.mirrored) steer = -steer;

    const response = 1 - fx.responseMush;
    if (this.cursors.up.isDown) this.speed += 120 * response * dt;
    if (this.cursors.down.isDown) this.speed -= 160 * response * dt;
    this.speed = Phaser.Math.Clamp(this.speed, MIN_SPEED, MAX_SPEED);

    this.lat += (steer * STEER_SPEED + fx.steerDrift) * dt;
    const offRoad = this.lat < 0 || this.lat > ROAD_WIDTH;
    if (this.lat < -SHOULDER || this.lat > ROAD_WIDTH + SHOULDER) {
      this.crash();
      this.layoutWorld();
      return;
    }

    const forward = offRoad ? Math.min(this.speed, OFFROAD_SPEED_CAP) : this.speed;
    this.d += forward * dt;
    this.score += 12 * (forward / 100) * dt;

    if (this.d >= ROUTE_LENGTH) {
      // Finishing tipsy but upright pays out (design doc: risk reward).
      this.score += 500 + 5 * Math.floor(this.buzz.level);
      this.endRun(true);
      return;
    }

    // Brewery stop zones: ride onto the marked shoulder to stop in.
    for (const b of PEARL_ST_BREWERIES) {
      if (this.visited.has(b.name)) continue;
      const nearD = Math.abs(b.d - this.d) < 18;
      const onSide = b.side === "left" ? this.lat < 16 : this.lat > ROAD_WIDTH - 16;
      if (nearD && onSide) {
        this.enterStop(b);
        return;
      }
    }

    // Cone collisions.
    if (this.invulnTimer <= 0) {
      for (const p of this.props) {
        if (p.kind === "cone" && Math.abs(p.d - this.d) < 10 && Math.abs(p.lat - this.lat) < 9) {
          this.crash();
          this.layoutWorld();
          return;
        }
      }
    }

    this.bike.rotation = steer * 0.15;
    this.bike.setPosition(
      ANCHOR.x,
      ANCHOR.y + (offRoad ? Phaser.Math.FloatBetween(-1.5, 1.5) : 0),
    );
    this.bike.setAlpha(this.invulnTimer > 0 ? (Math.sin(now * 0.03) > 0 ? 0.3 : 1) : 1);

    this.cameras.main.setScroll(fx.sway, fx.sway * 0.4);
    this.vignette.setAlpha(fx.vignette * 0.85);

    this.layoutWorld();
    this.refreshHud();
  }

  // --- Brewery stop minigame -------------------------------------------

  private enterStop(b: Brewery): void {
    this.mode = "chugging";
    this.visited.add(b.name);
    this.streak++;
    this.beerNum = 1;
    this.markerSpeed = 2.4;
    this.markerPhase = Math.random() * Math.PI * 2;
    this.chugLocked = false;
    this.resultTimer = 0;
    this.bike.rotation = 0;
    this.chugPanel.setVisible(true);
    this.chugName.setText(b.name);
    this.chugFeedback.setText("");
    this.chugPrompt.setText("SPACE: slam it");
    this.updateChugInfo();
  }

  private updateChugInfo(): void {
    this.chugInfo.setText(`BEER #${this.beerNum}   STREAK x${this.streak}`);
  }

  private chugUpdate(dt: number): void {
    if (!this.chugLocked) {
      this.markerPhase += this.markerSpeed * dt;
      const pos = 0.5 + 0.5 * Math.sin(this.markerPhase);
      this.chugMarker.x = -90 + 180 * pos;
      if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
        const accuracy = 1 - Math.abs(pos - 0.5) * 2;
        const perfect = accuracy > 0.85;
        let points = Math.round((80 + 120 * accuracy) * this.streak);
        if (perfect) points = Math.round(points * 1.5);
        this.score += points;
        this.buzz.drink(14 + 6 * this.beerNum);
        this.chugLocked = true;
        this.resultTimer = 0.8;
        this.chugFeedback.setText(perfect ? `PERFECT POUR! +${points}` : `+${points}`);
        this.chugPrompt.setText("");
      }
      return;
    }
    if (this.resultTimer > 0) {
      this.resultTimer -= dt;
      if (this.resultTimer <= 0) {
        this.chugPrompt.setText("SPACE: one more    ENTER: ride on");
      }
      return;
    }
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.beerNum++;
      this.markerSpeed *= 1.25;
      this.chugLocked = false;
      this.chugFeedback.setText("");
      this.chugPrompt.setText("SPACE: slam it");
      this.updateChugInfo();
    } else if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      this.exitStop();
    }
  }

  private exitStop(): void {
    this.mode = "riding";
    this.chugPanel.setVisible(false);
    this.speed = MIN_SPEED;
    this.invulnTimer = 1;
    this.steerHistory = [];
  }

  // --- World & helpers -------------------------------------------------

  private refreshHud(): void {
    this.scoreText.setText(`SCORE ${Math.floor(this.score)}`);
    this.livesText.setText(`LIVES ${this.lives}`);
    this.buzzFill.width = 50 * (this.buzz.level / 100);
    this.progressFill.width = 78 * (this.d / ROUTE_LENGTH);
  }

  // Project every prop and fixture from route space to the screen.
  private layoutWorld(): void {
    const roadOff = ROAD_WIDTH / 2 - this.lat;
    this.road.setPosition(ANCHOR.x + CROSS.x * roadOff, ANCHOR.y + CROSS.y * roadOff);

    for (const p of this.props) {
      while (p.d < this.d - 100) {
        p.d += p.span;
        if (p.kind === "cone") p.lat = Phaser.Math.FloatBetween(12, ROAD_WIDTH - 12);
      }
      this.place(p.obj, p.d, p.lat);
    }
    for (const f of this.fixtures) {
      this.place(f.obj, f.d, f.lat);
    }
  }

  private place(
    obj: Phaser.GameObjects.Container | Phaser.GameObjects.Shape,
    d: number,
    lat: number,
  ): void {
    const rel = d - this.d;
    const latOff = lat - this.lat;
    const sx = ANCHOR.x + CROSS.x * latOff + FORWARD.x * rel;
    const sy = ANCHOR.y + CROSS.y * latOff + FORWARD.y * rel;
    obj.setPosition(sx, sy).setDepth(sy);
    obj.setVisible(rel > -100 && rel < 260);
  }

  // Buzz input lag: steer commands replay from a short history buffer.
  private delayedSteer(raw: number, now: number, lagMs: number): number {
    this.steerHistory.push({ t: now, v: raw });
    if (this.steerHistory.length > 240) this.steerHistory.shift();
    const cutoff = now - lagMs;
    while (this.steerHistory.length > 1 && this.steerHistory[1].t <= cutoff) {
      this.steerHistory.shift();
    }
    return this.steerHistory[0].t <= cutoff ? this.steerHistory[0].v : 0;
  }

  private crash(): void {
    if (this.crashTimer > 0 || this.invulnTimer > 0) return;
    this.lives--;
    this.crashTimer = 1.1;
    this.buzz.sober(8); // adrenaline
    this.cameras.main.shake(200, 0.01);
  }

  private endRun(finished: boolean): void {
    this.cameras.main.setScroll(0, 0);
    this.scene.start("Results", {
      score: Math.floor(this.score),
      finished,
      breweries: this.visited.size,
    });
  }
}
