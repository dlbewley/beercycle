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

// Moving Boulder hazards: pedestrians wander laterally, dogs cut across.
type NpcKind = "ped" | "dog" | "goose" | "door";

interface Npc {
  kind: NpcKind;
  d: number;
  lat: number;
  latDir: number;
  latVel: number; // world units/s of lateral wander
  span: number;
  grazed: boolean; // came close enough for style points
  passed: boolean;
  obj: Phaser.GameObjects.Shape | Phaser.GameObjects.Container;
}

type PickupKind = "water" | "taco" | "tube" | "token" | "booch";

interface Pickup {
  kind: PickupKind;
  d: number;
  lat: number;
  span: number;
  obj: Phaser.GameObjects.Shape | Phaser.GameObjects.Container;
}

// Boulder PD watches stretches of the route: wobble past one at high
// Buzz for long enough and the run ends in a BUI citation.
interface Cop {
  d: number;
  lat: number;
  obj: Phaser.GameObjects.Container;
  alert: Phaser.GameObjects.Text;
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
  private paused = false;
  private pauseText!: Phaser.GameObjects.Text;
  private d = 0;
  private lat = ROAD_WIDTH / 2;
  private speed = MIN_SPEED;
  private score = 0;
  private lives = START_LIVES;
  private crashTimer = 0;
  private invulnTimer = 0;
  private steerHistory: SteerSample[] = [];

  private npcs: Npc[] = [];
  private pickups: Pickup[] = [];
  private cops: Cop[] = [];
  private suspicion = 0;
  private happyHour = false;

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
    this.npcs = [];
    this.pickups = [];
    this.cops = [];
    this.suspicion = 0;
    this.happyHour = false;

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

    // Moving hazards. Pedestrians wander the road, dogs bolt across,
    // geese hold their ground, car doors swing open near the curb.
    const npcSpecs: Array<{ kind: NpcKind; count: number; gap: number; latVel: number }> = [
      { kind: "ped", count: 4, gap: 340, latVel: 12 },
      { kind: "dog", count: 2, gap: 750, latVel: 42 },
      { kind: "goose", count: 2, gap: 830, latVel: 4 },
      { kind: "door", count: 2, gap: 910, latVel: 0 },
    ];
    let stagger = 500;
    for (const spec of npcSpecs) {
      for (let i = 0; i < spec.count; i++) {
        this.npcs.push({
          kind: spec.kind,
          d: stagger + i * spec.gap,
          lat: this.npcLat(spec.kind),
          latDir: Math.random() < 0.5 ? -1 : 1,
          latVel: spec.latVel,
          span: spec.count * spec.gap,
          grazed: false,
          passed: false,
          obj: this.makeNpcSprite(spec.kind),
        });
      }
      stagger += 130;
    }

    // Pickups. Water and tacos sober you up, a spare tube is a life,
    // the happy-hour token doubles the next brewery stop, kombucha is
    // a gamble.
    const pickupSpecs: Array<{ kind: PickupKind; count: number; gap: number }> = [
      { kind: "water", count: 3, gap: 950 },
      { kind: "taco", count: 2, gap: 1400 },
      { kind: "tube", count: 1, gap: 2900 },
      { kind: "token", count: 1, gap: 2300 },
      { kind: "booch", count: 2, gap: 1150 },
    ];
    stagger = 650;
    for (const spec of pickupSpecs) {
      for (let i = 0; i < spec.count; i++) {
        this.pickups.push({
          kind: spec.kind,
          d: stagger + i * spec.gap,
          lat: Phaser.Math.FloatBetween(14, ROAD_WIDTH - 14),
          span: spec.count * spec.gap,
          obj: this.makePickupSprite(spec.kind),
        });
      }
      stagger += 170;
    }

    // Boulder PD posts up on the shoulder along the route.
    for (const copD of [1850 + Phaser.Math.Between(-200, 200), 3500 + Phaser.Math.Between(-200, 200)]) {
      const side = Math.random() < 0.5 ? -18 : ROAD_WIDTH + 18;
      const alert = this.add
        .text(0, -18, "!", { fontFamily: "monospace", fontSize: "12px", color: "#ff5555" })
        .setOrigin(0.5)
        .setVisible(false);
      const obj = this.add.container(0, 0, [
        this.add.rectangle(0, 0, 9, 16, 0x27408b),
        this.add.rectangle(0, -9, 11, 3, 0x14205c), // hat brim
        alert,
      ]);
      this.cops.push({ d: copD, lat: side, obj, alert });
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
    this.paused = false;
    this.pauseText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, "PAUSED", {
        fontFamily: "monospace",
        fontSize: "20px",
        color: "#ffffff",
        backgroundColor: "#14101c",
        padding: { x: 10, y: 6 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1003)
      .setVisible(false);

    this.input.keyboard!.once("keydown-ESC", () => this.endRun(false));
    this.input.keyboard!.on("keydown-P", () => {
      this.paused = !this.paused;
      this.pauseText.setVisible(this.paused);
    });
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
    if (this.paused) return;
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

    if (this.updateNpcs(dt)) {
      this.layoutWorld();
      return;
    }
    this.updatePickups();
    const wobbling = Math.abs(fx.steerDrift) > 35 || fx.mirrored;
    if (this.updateCops(dt, wobbling)) return;

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

  // --- NPCs, pickups, and the law --------------------------------------

  private npcLat(kind: NpcKind): number {
    if (kind === "door") return Math.random() < 0.5 ? 8 : ROAD_WIDTH - 8;
    return Phaser.Math.FloatBetween(14, ROAD_WIDTH - 14);
  }

  private makeNpcSprite(kind: NpcKind): Npc["obj"] {
    switch (kind) {
      case "ped":
        return this.add.container(0, 0, [
          this.add.rectangle(0, 0, 8, 13, 0xd9a066),
          this.add.rectangle(0, -8, 6, 5, 0xc98a5a), // head
        ]);
      case "dog":
        return this.add.container(0, 0, [
          this.add.rectangle(0, 0, 12, 6, 0x8b5a2b),
          this.add.rectangle(7, -3, 4, 4, 0x8b5a2b), // head
        ]);
      case "goose":
        return this.add.container(0, 0, [
          this.add.rectangle(0, 0, 8, 7, 0xe8e4d8),
          this.add.rectangle(4, -6, 2, 6, 0x2b2b2b), // neck
        ]);
      case "door":
        return this.add.rectangle(0, 0, 5, 16, 0xc0c8d0);
    }
  }

  private makePickupSprite(kind: PickupKind): Pickup["obj"] {
    switch (kind) {
      case "water":
        return this.add.rectangle(0, 0, 6, 10, 0x5ab9d9);
      case "taco":
        return this.add.triangle(0, 0, 0, 0, 10, 0, 5, 7, 0xe8c56a);
      case "tube":
        return this.add.container(0, 0, [
          this.add.rectangle(0, 0, 10, 10, 0x2b2b2b),
          this.add.rectangle(0, 0, 4, 4, 0x4a6741),
        ]);
      case "token":
        return this.add.container(0, 0, [
          this.add.rectangle(0, 0, 9, 9, 0xf7b32b).setAngle(45),
          this.add.text(0, 0, "2", { fontFamily: "monospace", fontSize: "7px", color: "#14101c" }).setOrigin(0.5),
        ]);
      case "booch":
        return this.add.rectangle(0, 0, 6, 11, 0xc77dff);
    }
  }

  private popup(text: string, color: string): void {
    const t = this.add
      .text(ANCHOR.x, ANCHOR.y - 20, text, { fontFamily: "monospace", fontSize: "9px", color })
      .setOrigin(0.5)
      .setDepth(999);
    this.tweens.add({
      targets: t,
      y: ANCHOR.y - 48,
      alpha: 0,
      duration: 900,
      onComplete: () => t.destroy(),
    });
  }

  private updateNpcs(dt: number): boolean {
    for (const n of this.npcs) {
      if (n.latVel > 0) {
        n.lat += n.latVel * n.latDir * dt;
        if (n.lat < 6 || n.lat > ROAD_WIDTH - 6) n.latDir *= -1;
      }
      while (n.d < this.d - 100) {
        n.d += n.span;
        n.lat = this.npcLat(n.kind);
        n.grazed = false;
        n.passed = false;
      }
      const dd = Math.abs(n.d - this.d);
      const dl = Math.abs(n.lat - this.lat);
      if (dd < 10) {
        if (dl < 9 && this.invulnTimer <= 0) {
          this.crash();
          return true;
        }
        if (dl < 20) n.grazed = true;
      }
      if (!n.passed && n.d < this.d - 12) {
        n.passed = true;
        if (n.grazed) {
          this.score += 30;
          this.popup("+30 CLOSE ONE", "#8fd694");
        }
      }
    }
    return false;
  }

  private updatePickups(): void {
    for (const p of this.pickups) {
      while (p.d < this.d - 100) {
        p.d += p.span;
        p.lat = Phaser.Math.FloatBetween(14, ROAD_WIDTH - 14);
      }
      if (Math.abs(p.d - this.d) < 12 && Math.abs(p.lat - this.lat) < 10) {
        this.collect(p);
        p.d += p.span; // consume: recycle far ahead
      }
    }
  }

  private collect(p: Pickup): void {
    switch (p.kind) {
      case "water":
        this.buzz.sober(25);
        this.popup("WATER  BUZZ -25", "#5ab9d9");
        break;
      case "taco":
        this.buzz.sober(15);
        this.score += 25;
        this.popup("TACO  +25, BUZZ -15", "#e8c56a");
        break;
      case "tube":
        this.lives++;
        this.popup("SPARE TUBE  +1 LIFE", "#8fd694");
        break;
      case "token":
        this.happyHour = true;
        this.popup("HAPPY HOUR  NEXT STOP 2X", "#f7b32b");
        break;
      case "booch":
        if (Math.random() < 0.5) {
          this.buzz.sober(20);
          this.popup("KOMBUCHA  CLARITY, BUZZ -20", "#c77dff");
        } else {
          this.buzz.drink(12);
          this.popup("KOMBUCHA  IT'S FERMENTED +12", "#c77dff");
        }
        break;
    }
  }

  // Returns true if the run just ended in a citation.
  private updateCops(dt: number, wobbling: boolean): boolean {
    let inSight = false;
    for (const c of this.cops) {
      const watching = Math.abs(c.d - this.d) < 130;
      inSight ||= watching;
      c.alert.setVisible(watching && this.suspicion > 0.2);
    }
    if (inSight && this.buzz.level >= 55 && wobbling) {
      this.suspicion += dt;
      if (this.suspicion > 1.1) {
        this.endRun(false, true);
        return true;
      }
    } else {
      this.suspicion = Math.max(0, this.suspicion - dt * 0.8);
    }
    return false;
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
    this.chugInfo.setText(
      `BEER #${this.beerNum}   STREAK x${this.streak}${this.happyHour ? "   HAPPY HOUR 2X" : ""}`,
    );
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
        if (this.happyHour) points *= 2;
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
    this.happyHour = false;
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
    for (const n of this.npcs) {
      this.place(n.obj, n.d, n.lat);
    }
    for (const p of this.pickups) {
      this.place(p.obj, p.d, p.lat);
    }
    for (const c of this.cops) {
      this.place(c.obj, c.d, c.lat);
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

  private endRun(finished: boolean, busted = false): void {
    this.cameras.main.setScroll(0, 0);
    this.scene.start("Results", {
      score: Math.floor(this.score),
      finished,
      busted,
      breweries: this.visited.size,
    });
  }
}
