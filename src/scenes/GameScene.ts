import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../main";
import { BuzzSystem } from "../systems/buzz";
import { type Brewery } from "../systems/breweries";
import { ROUTES, type RouteDef } from "../systems/routes";
import { audio } from "../systems/audio";
import { type AvatarId, type AvatarState, AVATARS } from "../art/pixelart";
import {
  type BeerDef, mechanicFor, effectFor, buzzFor, pointsFor, markerSpeedFor, styleLabel,
} from "../systems/beers";
import { vocabLine } from "../systems/vocab";

// Core riding model: the route is a 1D distance axis (d) with a lateral
// position (lat, relative to the route baseline) across the road. Screen
// position is a
// fixed player anchor plus offsets along the two diagonal axes below —
// the Paperboy pseudo-isometric look without real isometric tiles.
const FORWARD = new Phaser.Math.Vector2(1, -2).normalize(); // up-right
const CROSS = new Phaser.Math.Vector2(2, 1).normalize(); // across the road
const ROAD_ANGLE = Math.atan2(FORWARD.y, FORWARD.x);

const SHOULDER = 28; // rideable grass strip before the crash boundary
const ANCHOR = new Phaser.Math.Vector2(150, 185); // bike's screen position
const MIN_SPEED = 50;
const MAX_SPEED = 190;
const OFFROAD_SPEED_CAP = 65;
const STEER_SPEED = 95;
const START_LIVES = 3;
const TAB_LIMIT = 3; // beers per brewery stop before the bartender cuts you off

type WorldObj =
  | Phaser.GameObjects.Shape
  | Phaser.GameObjects.Image
  | Phaser.GameObjects.Container;

type PropKind = "roadseg" | "stripe" | "curb" | "cone" | "deco";

interface Prop {
  kind: PropKind;
  d: number;
  lat: number;
  span: number; // distance after which the prop recycles ahead
  obj: WorldObj;
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
  obj: Phaser.GameObjects.Image;
}

type PickupKind = "water" | "taco" | "tube" | "token" | "booch";

interface Pickup {
  kind: PickupKind;
  d: number;
  lat: number;
  span: number;
  obj: Phaser.GameObjects.Image;
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

// State carried between routes on a multi-route run.
export interface RunCarry {
  routeIndex?: number;
  score?: number;
  lives?: number;
  buzz?: number;
  streak?: number;
}

export class GameScene extends Phaser.Scene {
  private buzz!: BuzzSystem;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private enterKey!: Phaser.Input.Keyboard.Key;
  private props: Prop[] = [];
  private fixtures: Fixture[] = [];
  private bike!: Phaser.GameObjects.Image;
  private vignette!: Phaser.GameObjects.Image;
  private flatirons!: Phaser.GameObjects.Image;
  private clouds: Phaser.GameObjects.Image[] = [];
  private pedalTimer = 0;

  private mode: "riding" | "chugging" = "riding";
  private paused = false;
  private pauseText!: Phaser.GameObjects.Text;
  private routeIndex = 0;
  private routeDef!: RouteDef;
  // Road geometry (beercycle-zgh): lat 0 is the route baseline; the road
  // center wanders along C(d) and everything on it stores lat relative
  // to that centerline.
  private roadW = 130;
  private avatarId: AvatarId = "dwnwrd";
  private portrait!: Phaser.GameObjects.Image;
  private portraitState: AvatarState = "sober";
  private smugTimer = 0;
  private lastSway = 0;
  private d = 0;
  private lat = 0;
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
  private resultTimer = 0;
  private chugPhase: "pick" | "active" | "result" | "darts" | "flight" = "pick";
  private currentBrewery: Brewery | null = null;
  private tapIndex = 0;
  private fillLevel = 0;
  private jitterCd = 0;
  // Stop flow (beercycle-49i): the tab caps beers per stop; one foam
  // mulligan per stop on an overfilled pour; results auto-advance.
  private tabRemaining = TAB_LIMIT;
  private mulliganUsed = false;
  private houseGamePlayed = false;
  private idleTimer = 0;
  private queuedSpace = false;
  private queuedEnter = false;
  // Darts state.
  private dartNum = 1;
  private dartTotal = 0;
  private dartPhaseX = 0;
  private dartPhaseY = 0;
  // Flight-tasting state.
  private flightSeq: number[] = [];
  private flightShow = 0;
  private flightGuess = -1;
  private flightTimer = 0;
  private flightTotal = 0;
  private flightTapGuess = -1;
  // Post-drink effects on riding.
  private heavyTimer = 0;
  private boostTimer = 0;
  private chiliTimer = 0;

  private scoreText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private buzzFill!: Phaser.GameObjects.Rectangle;
  private progressFill!: Phaser.GameObjects.Rectangle;

  private chugPanel!: Phaser.GameObjects.Container;
  private chugPanelBg!: Phaser.GameObjects.Rectangle;
  private chugGlyph!: Phaser.GameObjects.Image;
  private chugName!: Phaser.GameObjects.Text;
  private chugTagline!: Phaser.GameObjects.Text;
  private chugEnterLine!: Phaser.GameObjects.Text;
  private chugInfo!: Phaser.GameObjects.Text;
  private chugFeedback!: Phaser.GameObjects.Text;
  private chugPrompt!: Phaser.GameObjects.Text;
  private chugMarker!: Phaser.GameObjects.Rectangle;
  private chugSweetSpot!: Phaser.GameObjects.Rectangle;
  private chugFillBar!: Phaser.GameObjects.Rectangle;
  private tapSlots: Array<{
    box: Phaser.GameObjects.Rectangle;
    glass: Phaser.GameObjects.Image;
    label: Phaser.GameObjects.Text;
  }> = [];
  private chiliOverlay!: Phaser.GameObjects.Rectangle;
  private stopBackdrop!: Phaser.GameObjects.Image;

  // Touch input (beercycle-bkg): one-shot tap flags feed the same state
  // machine the keyboard uses; pointer position steers while riding.
  private touchTap = false;
  private touchEnter = false;
  private prevPourHeld = false;
  private speedUpHeld = false;
  private speedDownHeld = false;
  private chugAnotherBtn!: Phaser.GameObjects.Text;
  private chugRideOnBtn!: Phaser.GameObjects.Text;
  private chugMeterBg!: Phaser.GameObjects.Rectangle;
  private houseBtn!: Phaser.GameObjects.Text;
  private dartboard!: Phaser.GameObjects.Image;
  private crosshair!: Phaser.GameObjects.Container;
  private dartMarks: Phaser.GameObjects.Rectangle[] = [];
  private oneKey!: Phaser.Input.Keyboard.Key;
  private twoKey!: Phaser.Input.Keyboard.Key;
  private threeKey!: Phaser.Input.Keyboard.Key;
  private gKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super("Game");
  }

  create(data: RunCarry): void {
    this.routeIndex = data.routeIndex ?? 0;
    this.routeDef = ROUTES[this.routeIndex];
    this.avatarId = (this.registry.get("avatar") as AvatarId) ?? "dwnwrd";
    this.roadW = this.routeDef.roadWidth;
    this.smugTimer = 0;
    this.lastSway = 0;
    this.buzz = new BuzzSystem();
    this.buzz.drink(data.buzz ?? 0);
    this.props = [];
    this.fixtures = [];
    this.steerHistory = [];
    this.mode = "riding";
    this.d = 0;
    this.lat = 0; // road centerline
    this.speed = MIN_SPEED;
    this.score = data.score ?? 0;
    this.lives = data.lives ?? START_LIVES;
    this.crashTimer = 0;
    this.invulnTimer = 1; // grace period at the route start
    this.visited = new Set();
    this.streak = data.streak ?? 0;
    this.currentBrewery = null;
    this.heavyTimer = 0;
    this.boostTimer = 0;
    this.chiliTimer = 0;
    this.npcs = [];
    this.pickups = [];
    this.cops = [];
    this.suspicion = 0;
    this.happyHour = false;

    // Grass oversized so camera sway never reveals the void.
    this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 700, 500, this.routeDef.grassColor)
      .setDepth(-30);

    // Horizon strip: sky, drifting clouds, and the Flatirons (west, as
    // they should be). The road overlaps it as it exits the top — the
    // street "runs into" the horizon, Paperboy-style.
    this.add.image(0, 0, "sky").setOrigin(0).setScrollFactor(0).setDepth(-29);
    this.flatirons = this.add
      .image(10, 64, "flatirons")
      .setOrigin(0, 1)
      .setScrollFactor(0)
      .setDepth(-28);
    this.clouds = [
      this.add.image(90, 14, "cloud").setScrollFactor(0).setDepth(-27),
      this.add.image(260, 26, "cloud").setScrollFactor(0).setDepth(-27).setScale(0.7),
    ];

    // The road itself: overlapping segments recycled along the curving
    // centerline (a single band can't bend).
    for (let i = 0; i < 18; i++) {
      const obj = this.add
        .rectangle(0, 0, 34, this.roadW, this.routeDef.roadColor)
        .setRotation(ROAD_ANGLE);
      this.props.push({ kind: "roadseg", d: i * 24 - 100, lat: 0, span: 18 * 24, obj });
    }
    // Lane stripes down the road center.
    for (let i = 0; i < 7; i++) {
      const obj = this.add.rectangle(0, 0, 20, 4, 0xf7f7e8).setRotation(ROAD_ANGLE);
      this.props.push({ kind: "stripe", d: i * 50, lat: 0, span: 350, obj });
    }
    // Curb blocks on both edges (lat holds the edge sign).
    for (let i = 0; i < 10; i++) {
      for (const edge of [-1, 1]) {
        const obj = this.add.rectangle(0, 0, 7, 7, 0xb8b8a0);
        this.props.push({ kind: "curb", d: i * 35, lat: edge, span: 350, obj });
      }
    }
    // Traffic cones on the road (lat relative to centerline).
    for (let i = 0; i < this.routeDef.cones; i++) {
      this.props.push({
        kind: "cone",
        d: 400 + i * 320,
        lat: Phaser.Math.FloatBetween(-this.roadW / 2 + 12, this.roadW / 2 - 12),
        span: this.routeDef.cones * 320,
        obj: this.add.image(0, 0, "cone"),
      });
    }

    // Roadside greenery on both grass banks.
    const decoKeys = ["tree", "tree", "bush", "flowers"];
    for (let i = 0; i < 14; i++) {
      const side = Math.random() < 0.5 ? -1 : 1;
      this.props.push({
        kind: "deco",
        d: i * 95,
        lat: side * (this.roadW / 2 + 46 + Phaser.Math.FloatBetween(0, 55)),
        span: 14 * 95,
        obj: this.add.image(0, 0, decoKeys[i % decoKeys.length]).setOrigin(0.5, 1),
      });
    }

    // Brewery buildings, signs, and stop zones on the shoulder.
    for (const b of this.routeDef.breweries) {
      const sideSign = b.side === "left" ? -1 : 1;
      const buildingLat = sideSign * (this.roadW / 2 + 40);
      const zoneLat = sideSign * (this.roadW / 2 - 8);
      const building = this.add.container(0, 0, [
        this.add.image(0, 0, "brewery"),
        this.add
          .text(0, -13, b.name, { fontFamily: "monospace", fontSize: "7px", color: "#f7e8b0" })
          .setOrigin(0.5),
      ]);
      const zone = this.add.rectangle(0, 0, 42, 24, 0xf7b32b, 0.28).setRotation(ROAD_ANGLE);
      this.fixtures.push({ d: b.d, lat: buildingLat, obj: building });
      this.fixtures.push({ d: b.d, lat: zoneLat, obj: zone });
    }

    // Moving hazards. Pedestrians wander the road, dogs bolt across,
    // geese hold their ground, car doors swing open near the curb.
    const npcSpecs: Array<{ kind: NpcKind; count: number; gap: number; latVel: number }> = [
      { kind: "ped", count: this.routeDef.peds, gap: 340, latVel: 12 },
      { kind: "dog", count: this.routeDef.dogs, gap: 750, latVel: 42 },
      { kind: "goose", count: this.routeDef.geese, gap: 830, latVel: 4 },
      { kind: "door", count: this.routeDef.doors, gap: 910, latVel: 0 },
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
          lat: Phaser.Math.FloatBetween(-this.roadW / 2 + 14, this.roadW / 2 - 14),
          span: spec.count * spec.gap,
          obj: this.makePickupSprite(spec.kind),
        });
      }
      stagger += 170;
    }

    // Boulder PD posts up on the shoulder along the route.
    const copSpots: number[] = [];
    for (let i = 0; i < this.routeDef.cops; i++) {
      const base = (this.routeDef.length / (this.routeDef.cops + 1)) * (i + 1);
      copSpots.push(base + Phaser.Math.Between(-200, 200));
    }
    for (const copD of copSpots) {
      const side = (Math.random() < 0.5 ? -1 : 1) * (this.roadW / 2 + 18);
      const alert = this.add
        .text(0, -18, "!", { fontFamily: "monospace", fontSize: "12px", color: "#ff5555" })
        .setOrigin(0.5)
        .setVisible(false);
      const obj = this.add.container(0, 0, [this.add.image(0, 0, "cop"), alert]);
      this.cops.push({ d: copD, lat: side, obj, alert });
    }

    this.bike = this.add.image(ANCHOR.x, ANCHOR.y, `bike_${this.avatarId}_a`).setDepth(ANCHOR.y);
    this.pedalTimer = 0;

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

    this.chiliOverlay = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xc23b2a)
      .setScrollFactor(0)
      .setDepth(999)
      .setAlpha(0);

    // Brewery interior shown behind the chug panel during stops.
    this.stopBackdrop = this.add
      .image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "__DEFAULT")
      .setScrollFactor(0)
      .setDepth(998)
      .setVisible(false);

    this.createHud();
    this.createChugPanel();

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.enterKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.oneKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
    this.twoKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
    this.threeKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);
    this.gKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.G);
    this.touchTap = false;
    this.touchEnter = false;
    this.speedUpHeld = false;
    this.speedDownHeld = false;
    this.makeSpeedButtons();
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
    this.input.keyboard!.on("keydown-M", () => audio.toggleMute());
    this.input.keyboard!.on("keydown-P", () => {
      this.paused = !this.paused;
      this.pauseText.setVisible(this.paused);
    });
    if (import.meta.env.DEV) {
      this.input.keyboard!.on("keydown-B", () => this.buzz.drink(15));
      this.input.keyboard!.on("keydown-N", () => this.buzz.sober(15));
    }
  }

  // On-screen speed controls, bottom-right. Useful for mouse too, so
  // they're always visible (subtly).
  private makeSpeedButtons(): void {
    const mk = (y: number, label: string, setHeld: (v: boolean) => void) => {
      const t = this.add
        .text(GAME_WIDTH - 26, y, label, {
          fontFamily: "monospace",
          fontSize: "14px",
          color: "#ffffff",
          backgroundColor: "#14101c",
        })
        .setOrigin(0.5)
        .setPadding(10, 6, 10, 6)
        .setScrollFactor(0)
        .setDepth(1001)
        .setAlpha(0.65)
        .setInteractive();
      t.on("pointerdown", () => setHeld(true));
      t.on("pointerup", () => setHeld(false));
      t.on("pointerout", () => setHeld(false));
    };
    mk(GAME_HEIGHT - 82, "+", (v) => (this.speedUpHeld = v));
    mk(GAME_HEIGHT - 44, "-", (v) => (this.speedDownHeld = v));
  }

  // Any held pointer outside the speed-button corner steers toward it.
  private touchSteerRaw(): number {
    for (const p of this.input.manager.pointers) {
      if (!p.isDown) continue;
      if (p.x > GAME_WIDTH - 56 && p.y > GAME_HEIGHT - 104) continue;
      if (p.x < ANCHOR.x - 10) return -1;
      if (p.x > ANCHOR.x + 10) return 1;
      return 0;
    }
    return 0;
  }

  private anyPointerDown(): boolean {
    return this.input.manager.pointers.some((p) => p.isDown);
  }

  private consumeTap(): boolean {
    const t = this.touchTap;
    this.touchTap = false;
    return t;
  }

  private consumeEnterTap(): boolean {
    const t = this.touchEnter;
    this.touchEnter = false;
    return t;
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

    // Doom-style status face, bottom-left (emptiest corner during play).
    this.portrait = this.add
      .image(24, GAME_HEIGHT - 22, `av_${this.avatarId}_sober`)
      .setScale(1.5)
      .setScrollFactor(0)
      .setDepth(1001);
    this.portraitState = "sober";

    hud(this.add.text(GAME_WIDTH - 92, 4, "BUZZ", { fontFamily: "monospace", fontSize: "10px", color: "#f7b32b" }));
    hud(this.add.rectangle(GAME_WIDTH - 58, 9, 52, 8, 0x222222).setOrigin(0, 0.5));
    this.buzzFill = hud(
      this.add.rectangle(GAME_WIDTH - 57, 9, 0, 6, 0xf7b32b).setOrigin(0, 0.5),
    ) as Phaser.GameObjects.Rectangle;

    hud(this.add.text(GAME_WIDTH / 2 - 70, 4, this.routeDef.name, { fontFamily: "monospace", fontSize: "8px", color: "#cfcfcf" }));
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
    this.chugPanelBg = this.add
      .rectangle(0, 0, 344, 152, 0x14101c, 0.95)
      .setStrokeStyle(2, 0xf7b32b)
      .setInteractive()
      .on("pointerdown", () => {
        this.touchTap = true;
      });
    this.chugGlyph = this.add.image(-100, -60, "glyph_moon");
    this.chugName = this.add.text(0, -60, "", style("13px", "#f7b32b")).setOrigin(0.5);
    this.chugTagline = this.add.text(0, -46, "", style("7px", "#8f8fa0")).setOrigin(0.5);
    this.chugEnterLine = this.add.text(0, -35, "", style("8px", "#8fd694")).setOrigin(0.5);

    this.tapSlots = [];
    for (let i = 0; i < 3; i++) {
      const x = (i - 1) * 108;
      const box = this.add
        .rectangle(x, -6, 100, 40, 0xffffff, 0.05)
        .setStrokeStyle(1, 0x555566)
        .setInteractive()
        .on("pointerdown", () => this.onTapSlot(i));
      const glass = this.add.image(x - 36, -6, "glass_kinda");
      const label = this.add
        .text(x + 8, -6, "", {
          fontFamily: "monospace",
          fontSize: "7px",
          color: "#e8e8e8",
          align: "center",
          wordWrap: { width: 66 },
        })
        .setOrigin(0.5);
      this.tapSlots.push({ box, glass, label });
    }

    this.houseBtn = this.add
      .text(108, -60, "", style("8px", "#e8c56a"))
      .setOrigin(0.5)
      .setInteractive()
      .on("pointerdown", () => this.startHouseGame());

    this.dartboard = this.add.image(0, 6, "dartboard").setVisible(false);
    this.crosshair = this.add
      .container(0, 6, [
        this.add.rectangle(0, 0, 12, 1, 0xffffff),
        this.add.rectangle(0, 0, 1, 12, 0xffffff),
      ])
      .setVisible(false);
    this.dartMarks = [];
    for (let i = 0; i < 3; i++) {
      this.dartMarks.push(
        this.add.rectangle(0, 0, 3, 3, 0x1a1a1a).setVisible(false),
      );
    }

    this.chugInfo = this.add.text(0, 22, "", style("8px", "#cfcfcf")).setOrigin(0.5);
    this.chugFeedback = this.add.text(0, 35, "", style("10px", "#8fd694")).setOrigin(0.5);
    const meterBg = this.add.rectangle(0, 52, 180, 10, 0x222222);
    this.chugMeterBg = meterBg;
    this.chugFillBar = this.add
      .rectangle(-90, 52, 0, 8, 0xd9a516)
      .setOrigin(0, 0.5)
      .setVisible(false);
    this.chugSweetSpot = this.add.rectangle(0, 52, 28, 10, 0x8fd694, 0.5);
    this.chugMarker = this.add.rectangle(0, 52, 4, 16, 0xf7f7e8);
    this.chugPrompt = this.add.text(0, 66, "", style("8px", "#9a9a9a")).setOrigin(0.5);
    this.chugAnotherBtn = this.add
      .text(-122, 66, "[ ONE MORE ]", style("8px", "#8fd694"))
      .setOrigin(0.5)
      .setInteractive()
      .on("pointerdown", () => {
        this.touchTap = true;
      });
    this.chugRideOnBtn = this.add
      .text(122, 66, "[ RIDE ON ]", style("8px", "#f7b32b"))
      .setOrigin(0.5)
      .setInteractive()
      .on("pointerdown", () => {
        this.touchEnter = true;
      });

    this.chugPanel = this.add
      .container(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 4, [
        this.chugPanelBg, this.chugGlyph, this.chugName, this.chugTagline, this.chugEnterLine,
        ...this.tapSlots.flatMap((s) => [s.box, s.glass as Phaser.GameObjects.GameObject, s.label]),
        this.houseBtn, this.dartboard, this.crosshair, ...this.dartMarks,
        this.chugInfo, this.chugFeedback,
        meterBg, this.chugFillBar, this.chugSweetSpot, this.chugMarker, this.chugPrompt,
        this.chugAnotherBtn, this.chugRideOnBtn,
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
        const center = this.centerLat(this.d);
        this.lat = center + Phaser.Math.Clamp(
          this.lat - center, -this.roadW / 2 + 12, this.roadW / 2 - 12,
        );
        this.speed = MIN_SPEED;
        this.invulnTimer = 2;
        this.steerHistory = [];
      }
      this.layoutWorld();
      return;
    }

    this.invulnTimer = Math.max(0, this.invulnTimer - dt);
    this.buzz.update(dt);
    audio.setDetune(this.buzz.level);
    const fx = this.buzz.effects();

    let raw = 0;
    if (this.cursors.left.isDown) raw = -1;
    else if (this.cursors.right.isDown) raw = 1;
    if (raw === 0) raw = this.touchSteerRaw();
    let steer = this.delayedSteer(raw, now, fx.inputLagMs);
    if (fx.mirrored) steer = -steer;

    const response = 1 - fx.responseMush;
    if (this.cursors.up.isDown || this.speedUpHeld) this.speed += 120 * response * dt;
    if (this.cursors.down.isDown || this.speedDownHeld) this.speed -= 160 * response * dt;
    this.speed = Phaser.Math.Clamp(this.speed, MIN_SPEED, MAX_SPEED);

    // Post-drink effects: heavy legs after a stout, refreshed after a
    // lager, and the chili beer takes the wheel entirely.
    this.heavyTimer = Math.max(0, this.heavyTimer - dt);
    this.boostTimer = Math.max(0, this.boostTimer - dt);
    this.chiliTimer = Math.max(0, this.chiliTimer - dt);
    if (this.heavyTimer > 0) this.speed = Math.min(this.speed, 105);
    if (this.chiliTimer > 0) this.speed = Math.max(this.speed, 175);
    else if (this.boostTimer > 0) this.speed = Math.max(this.speed, 85);
    this.chiliOverlay.setAlpha(this.chiliTimer > 0 ? 0.12 + 0.08 * Math.sin(now * 0.02) : 0);

    this.lat += (steer * STEER_SPEED + fx.steerDrift) * dt;
    const dev = this.lat - this.centerLat(this.d);
    const offRoad = Math.abs(dev) > this.roadW / 2;
    if (Math.abs(dev) > this.roadW / 2 + SHOULDER) {
      this.crash();
      this.layoutWorld();
      return;
    }

    const forward = offRoad ? Math.min(this.speed, OFFROAD_SPEED_CAP) : this.speed;
    this.d += forward * dt;
    this.score += 12 * (forward / 100) * dt;

    if (this.d >= this.routeDef.length) {
      // Finishing tipsy but upright pays out (design doc: risk reward).
      this.score += 500 + 5 * Math.floor(this.buzz.level);
      this.endRun(true);
      return;
    }

    // Brewery stop zones: ride onto the marked shoulder to stop in.
    for (const b of this.routeDef.breweries) {
      if (this.visited.has(b.name)) continue;
      const nearD = Math.abs(b.d - this.d) < 18;
      const rel = this.lat - this.centerLat(this.d);
      const onSide =
        b.side === "left" ? rel < -this.roadW / 2 + 16 : rel > this.roadW / 2 - 16;
      if (nearD && onSide) {
        this.enterStop(b);
        return;
      }
    }

    // Cone collisions.
    if (this.invulnTimer <= 0) {
      for (const p of this.props) {
        if (
          p.kind === "cone" &&
          Math.abs(p.d - this.d) < 10 &&
          Math.abs(this.centerLat(p.d) + p.lat - this.lat) < 9
        ) {
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

    // Pedal animation, cadence tied to speed.
    this.pedalTimer += dt * (forward / 60);
    if (this.pedalTimer > 0.18) {
      this.pedalTimer = 0;
      this.bike.setTexture(
        this.bike.texture.key.endsWith("_a") ? `bike_${this.avatarId}_b` : `bike_${this.avatarId}_a`,
      );
    }

    // Backdrop life: subtle Flatirons parallax, drifting clouds.
    this.flatirons.x = 10 - this.lat * 0.18;
    for (const c of this.clouds) {
      c.x -= (c.scale < 1 ? 2 : 3.2) * dt;
      if (c.x < -20) c.x = GAME_WIDTH + 20;
    }

    this.cameras.main.setScroll(fx.sway, fx.sway * 0.4);
    this.lastSway = fx.sway;
    this.vignette.setAlpha(fx.vignette * 0.85);

    this.layoutWorld();
    this.refreshHud();
  }

  // --- NPCs, pickups, and the law --------------------------------------

  // Road centerline offset at distance d.
  private centerLat(d: number): number {
    return this.routeDef.curveAmp * Math.sin(d * this.routeDef.curveFreq);
  }

  private npcLat(kind: NpcKind): number {
    if (kind === "door") return (Math.random() < 0.5 ? -1 : 1) * (this.roadW / 2 - 8);
    return Phaser.Math.FloatBetween(-this.roadW / 2 + 14, this.roadW / 2 - 14);
  }

  private makeNpcSprite(kind: NpcKind): Npc["obj"] {
    switch (kind) {
      case "ped":
        return this.add.image(0, 0, Math.random() < 0.5 ? "ped_a" : "ped_b");
      case "dog":
        return this.add.image(0, 0, "dog");
      case "goose":
        return this.add.image(0, 0, "goose");
      case "door":
        return this.add.image(0, 0, "car_door");
    }
  }

  private makePickupSprite(kind: PickupKind): Pickup["obj"] {
    return this.add.image(0, 0, kind); // texture keys match pickup kinds
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
        if (Math.abs(n.lat) > this.roadW / 2 - 6) n.latDir *= -1;
        n.obj.setFlipX(n.latDir < 0);
      }
      while (n.d < this.d - 100) {
        n.d += n.span;
        n.lat = this.npcLat(n.kind);
        n.grazed = false;
        n.passed = false;
      }
      const dd = Math.abs(n.d - this.d);
      const dl = Math.abs(this.centerLat(n.d) + n.lat - this.lat);
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
          this.popup(this.avatarId === "hoskins" ? "HEH. +30" : "+30 CLOSE ONE", "#8fd694");
        }
      }
    }
    return false;
  }

  private updatePickups(): void {
    for (const p of this.pickups) {
      while (p.d < this.d - 100) {
        p.d += p.span;
        p.lat = Phaser.Math.FloatBetween(-this.roadW / 2 + 14, this.roadW / 2 - 14);
      }
      if (
        Math.abs(p.d - this.d) < 12 &&
        Math.abs(this.centerLat(p.d) + p.lat - this.lat) < 10
      ) {
        this.collect(p);
        p.d += p.span; // consume: recycle far ahead
      }
    }
  }

  private collect(p: Pickup): void {
    audio.sfx("pickup");
    switch (p.kind) {
      case "water":
        this.buzz.sober(25);
        this.popup("WATER  BUZZ -25", "#5ab9d9");
        break;
      case "taco":
        this.buzz.sober(15);
        this.score += 25;
        this.popup(
          this.avatarId === "dwnwrd" ? "TOFU TACO  +25, BUZZ -15" : "TACO  +25, BUZZ -15",
          "#e8c56a",
        );
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
        audio.sfx("bust");
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
    this.currentBrewery = b;
    this.visited.add(b.name);
    this.streak++;
    this.beerNum = 1;
    this.resultTimer = 0;
    this.tabRemaining = TAB_LIMIT;
    this.mulliganUsed = false;
    this.houseGamePlayed = false;
    this.queuedSpace = false;
    this.queuedEnter = false;
    this.bike.rotation = 0;
    audio.sfx("bell");
    if (this.textures.exists(`bg_${b.id}`)) {
      this.stopBackdrop.setTexture(`bg_${b.id}`).setVisible(true);
    }
    this.chugPanel.setVisible(true);
    this.chugPanelBg.setStrokeStyle(2, b.accent);
    this.chugGlyph.setTexture(`glyph_${b.glyph}`).setTint(b.accent);
    this.chugName.setText(b.name);
    this.chugTagline.setText(b.tagline);
    this.chugEnterLine.setText(vocabLine(this.avatarId, "enter"));
    this.chugFeedback.setText("");
    this.enterPickPhase();
  }

  private get selectedBeer(): BeerDef {
    return this.currentBrewery!.taps[this.tapIndex];
  }

  private enterPickPhase(): void {
    this.chugPhase = "pick";
    this.tapIndex = 0;
    this.pickPhaseUI();
    this.refreshTapUI();
  }

  private pickPhaseUI(): void {
    this.chugMarker.setVisible(false);
    this.chugSweetSpot.setVisible(false);
    this.chugFillBar.setVisible(false);
    this.chugMeterBg.setVisible(true);
    this.dartboard.setVisible(false);
    this.crosshair.setVisible(false);
    for (const m of this.dartMarks) m.setVisible(false);
    for (const s of this.tapSlots) {
      s.box.setVisible(true);
      s.glass.setVisible(true);
      s.label.setVisible(true);
    }
    this.chugFeedback.setText("").setY(35);
    this.chugPrompt.setText("choose a beer, then order");
    this.chugAnotherBtn.setVisible(false);
    this.chugRideOnBtn.setVisible(true);
    const hg = this.currentBrewery?.houseGame;
    this.houseBtn.setVisible(!!hg && !this.houseGamePlayed);
    if (hg) this.houseBtn.setText(`[ ${hg.toUpperCase()} (G) ]`);
    this.touchTap = false;
    this.touchEnter = false;
  }

  private tabLabel(): string {
    return `TAB ${"O".repeat(this.tabRemaining)}${".".repeat(TAB_LIMIT - this.tabRemaining)}`;
  }

  private onTapSlot(i: number): void {
    if (this.mode !== "chugging") return;
    if (!this.currentBrewery || i >= this.currentBrewery.taps.length) return;
    if (this.chugPhase === "flight" && this.flightGuess >= 0) {
      this.flightTapGuess = i;
      return;
    }
    if (this.chugPhase !== "pick") return;
    if (this.tapIndex === i) {
      this.beginChug();
    } else {
      this.tapIndex = i;
      this.refreshTapUI();
    }
  }

  private refreshTapUI(): void {
    const taps = this.currentBrewery!.taps;
    const accent = this.currentBrewery!.accent;
    this.tapSlots.forEach((slot, i) => {
      const beer = taps[i];
      const has = !!beer;
      slot.box.setVisible(has);
      slot.glass.setVisible(has);
      slot.label.setVisible(has);
      if (!has) return;
      slot.glass.setTexture(`glass_${beer.id}`);
      slot.label.setText(beer.name);
      slot.box.setStrokeStyle(i === this.tapIndex ? 2 : 1, i === this.tapIndex ? accent : 0x555566);
      slot.box.setFillStyle(0xffffff, i === this.tapIndex ? 0.12 : 0.04);
    });
    const sel = this.selectedBeer;
    this.chugInfo.setText(
      `${styleLabel(sel)}   ${this.tabLabel()}   STREAK x${this.streak}` +
        `${this.happyHour ? "   HAPPY HOUR 2X" : ""}`,
    );
  }

  private beginChug(): void {
    const beer = this.selectedBeer;
    this.chugPhase = "active";
    this.chugMarker.setVisible(true);
    this.chugSweetSpot.setVisible(true);
    this.chugAnotherBtn.setVisible(false);
    this.chugRideOnBtn.setVisible(false);
    this.touchTap = false;
    this.prevPourHeld = false;
    const mech = mechanicFor(beer.style);
    if (mech === "fill") {
      // Careful pour: sweet zone sits near the rim.
      this.fillLevel = 0;
      this.chugFillBar.setVisible(true).setFillStyle(
        Phaser.Display.Color.HexStringToColor(beer.color).color,
      );
      this.chugFillBar.width = 0;
      this.chugSweetSpot.setPosition(0.885 * 180 - 90, 52).setSize(30, 10);
      this.chugMarker.x = -90;
      this.chugPrompt.setText("HOLD (space or touch) to pour — release at the line");
    } else {
      this.markerPhase = Math.random() * Math.PI * 2;
      this.markerSpeed = markerSpeedFor(beer.style) * (1 + 0.22 * (this.beerNum - 1));
      this.jitterCd = 0.4;
      this.chugFillBar.setVisible(false);
      this.chugSweetSpot.setPosition(0, 52).setSize(28, 10);
      this.chugPrompt.setText(
        mech === "jitter" ? "SPACE / tap: slam it (it puckers)" : "SPACE / tap: slam it",
      );
    }
  }

  private lockBeer(accuracy: number, overflow: boolean): void {
    const beer = this.selectedBeer;
    // One foam mulligan per stop on an overfilled pour.
    if (overflow && !this.mulliganUsed) {
      this.mulliganUsed = true;
      this.fillLevel = 0;
      this.prevPourHeld = false;
      audio.sfx("buzzer");
      this.chugFeedback.setText("FOAM! ONE MULLIGAN — pour again");
      return; // stay in the active fill phase
    }
    const perfect = !overflow && accuracy > 0.85;
    let points = Math.round(pointsFor(beer) * (0.4 + 0.6 * accuracy) * this.streak);
    if (perfect) points = Math.round(points * 1.5);
    if (this.happyHour) points *= 2;
    this.score += points;
    this.buzz.drink(buzzFor(beer) + 4 * (this.beerNum - 1));
    audio.sfx(perfect ? "pour" : "chug");
    const effect = effectFor(beer.style);
    if (effect === "heavy") this.heavyTimer = 5;
    if (effect === "refresh") this.boostTimer = 5;
    if (effect === "chili") {
      this.chiliTimer = 4;
      this.cameras.main.shake(250, 0.012);
    }
    if (perfect) {
      this.smugTimer = 1.2;
      this.chugFeedback.setText(`${vocabLine(this.avatarId, "perfect")} +${points}`);
    } else {
      this.chugFeedback.setText(overflow ? `FOAM. EVERYWHERE. +${points}` : `+${points}`);
    }
    this.tabRemaining--;
    this.chugInfo.setText(
      `${styleLabel(beer)}   ${this.tabLabel()}   STREAK x${this.streak}` +
        `${this.happyHour ? "   HAPPY HOUR 2X" : ""}`,
    );
    this.chugPhase = "result";
    this.resultTimer = 0.7;
    this.chugPrompt.setText("");
    this.touchTap = false;
  }

  // --- House mini-games (beercycle-49i) --------------------------------

  private startHouseGame(): void {
    if (this.mode !== "chugging" || this.chugPhase !== "pick") return;
    const hg = this.currentBrewery?.houseGame;
    if (!hg || this.houseGamePlayed) return;
    for (const s of this.tapSlots) {
      s.box.setVisible(hg === "flight");
      s.glass.setVisible(hg === "flight");
      s.label.setVisible(hg === "flight");
    }
    this.houseBtn.setVisible(false);
    this.chugRideOnBtn.setVisible(false);
    this.chugMeterBg.setVisible(false);
    this.touchTap = false;
    if (hg === "darts") {
      this.chugPhase = "darts";
      this.dartNum = 1;
      this.dartTotal = 0;
      this.dartPhaseX = Math.random() * 6;
      this.dartPhaseY = Math.random() * 6;
      this.dartboard.setVisible(true);
      this.crosshair.setVisible(true);
      this.chugInfo.setText("");
      this.chugFeedback.setText("").setY(50);
      this.chugPrompt.setText("dart 1 of 3 — SPACE / tap to throw");
    } else {
      this.chugPhase = "flight";
      this.flightSeq = Array.from({ length: 4 }, () =>
        Phaser.Math.Between(0, this.currentBrewery!.taps.length - 1),
      );
      this.flightShow = 0;
      this.flightGuess = -1;
      this.flightTimer = 0.6;
      this.flightTotal = 0;
      this.flightTapGuess = -1;
      this.chugInfo.setText(`FLIGHT   STREAK x${this.streak}`);
      this.chugFeedback.setText("");
      this.chugPrompt.setText("watch the flight...");
    }
  }

  private flashSlot(i: number): void {
    const slot = this.tapSlots[i];
    if (!slot) return;
    slot.box.setFillStyle(0xffffff, 0.4);
    this.time.delayedCall(220, () => slot.box.setFillStyle(0xffffff, 0.05));
  }

  private finishHouseGame(message: string): void {
    this.houseGamePlayed = true;
    this.dartboard.setVisible(false);
    this.crosshair.setVisible(false);
    for (const m of this.dartMarks) m.setVisible(false);
    this.chugFeedback.setText(message).setY(35);
    this.chugPhase = "result";
    this.resultTimer = 0.7;
    this.chugPrompt.setText("");
    this.touchTap = false;
  }

  private dartsUpdate(dt: number): void {
    this.dartPhaseX += dt * (1.6 + 0.4 * this.dartNum);
    this.dartPhaseY += dt * (2.3 + 0.5 * this.dartNum);
    const dx = Math.sin(this.dartPhaseX) * 55;
    const dy = Math.sin(this.dartPhaseY) * 30;
    this.crosshair.setPosition(dx, 6 + dy);
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey) || this.consumeTap()) {
      const r = Math.hypot(dx, dy);
      let pts: number;
      let label: string;
      if (r < 7) { pts = 150; label = "BULLSEYE!"; }
      else if (r < 15) { pts = 90; label = "inner ring"; }
      else if (r < 25) { pts = 60; label = "on the board"; }
      else if (r < 34) { pts = 30; label = "outer ring"; }
      else { pts = 10; label = "you hit the wall"; }
      pts *= this.streak;
      this.dartTotal += pts;
      audio.sfx("thunk");
      this.dartMarks[this.dartNum - 1].setPosition(dx, 6 + dy).setVisible(true);
      this.chugFeedback.setText(`${label} +${pts}`);
      if (this.dartNum >= 3) {
        this.score += this.dartTotal;
        this.buzz.drink(6); // you sip between throws
        this.finishHouseGame(`DARTS TOTAL +${this.dartTotal}`);
      } else {
        this.dartNum++;
        this.chugPrompt.setText(`dart ${this.dartNum} of 3 — SPACE / tap to throw`);
      }
    }
  }

  private flightUpdate(dt: number): void {
    if (this.flightGuess < 0) {
      // Showing the sequence.
      this.flightTimer -= dt;
      if (this.flightTimer > 0) return;
      if (this.flightShow < this.flightSeq.length) {
        const idx = this.flightSeq[this.flightShow];
        this.flashSlot(idx);
        audio.blip(idx);
        this.flightShow++;
        this.flightTimer = 0.55;
      } else {
        this.flightGuess = 0;
        this.flightTapGuess = -1;
        this.chugPrompt.setText("your turn — repeat the order (tap or 1/2/3)");
      }
      return;
    }
    let guess = -1;
    if (Phaser.Input.Keyboard.JustDown(this.oneKey)) guess = 0;
    else if (Phaser.Input.Keyboard.JustDown(this.twoKey)) guess = 1;
    else if (Phaser.Input.Keyboard.JustDown(this.threeKey)) guess = 2;
    else if (this.flightTapGuess >= 0) {
      guess = this.flightTapGuess;
      this.flightTapGuess = -1;
    }
    if (guess < 0 || guess >= this.currentBrewery!.taps.length) return;
    if (guess === this.flightSeq[this.flightGuess]) {
      this.flashSlot(guess);
      audio.blip(guess);
      const pts = 40 * this.streak;
      this.flightTotal += pts;
      this.score += pts;
      this.flightGuess++;
      if (this.flightGuess >= this.flightSeq.length) {
        const bonus = 80 * this.streak;
        this.flightTotal += bonus;
        this.score += bonus;
        this.buzz.drink(8); // it's still four beers, tiny ones
        this.finishHouseGame(`FLIGHT COMPLETE +${this.flightTotal}`);
      }
    } else {
      audio.sfx("buzzer");
      this.finishHouseGame(`PALATE CONFUSION +${this.flightTotal}`);
    }
  }

  private chugUpdate(dt: number): void {
    this.smugTimer = Math.max(0, this.smugTimer - dt);
    const space = this.spaceKey;

    if (this.chugPhase === "darts") {
      this.dartsUpdate(dt);
      return;
    }
    if (this.chugPhase === "flight") {
      this.flightUpdate(dt);
      return;
    }

    if (this.chugPhase === "pick") {
      const taps = this.currentBrewery!.taps;
      if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
        this.tapIndex = (this.tapIndex + taps.length - 1) % taps.length;
        this.refreshTapUI();
      } else if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
        this.tapIndex = (this.tapIndex + 1) % taps.length;
        this.refreshTapUI();
      } else if (Phaser.Input.Keyboard.JustDown(this.gKey)) {
        this.startHouseGame();
      } else if (Phaser.Input.Keyboard.JustDown(space) || this.consumeTap()) {
        this.beginChug();
      } else if (Phaser.Input.Keyboard.JustDown(this.enterKey) || this.consumeEnterTap()) {
        this.exitStop();
      }
      return;
    }

    if (this.chugPhase === "active") {
      const mech = mechanicFor(this.selectedBeer.style);
      if (mech === "fill") {
        const heldNow = space.isDown || this.anyPointerDown();
        if (heldNow) this.fillLevel += 0.85 * dt;
        const shown = Math.min(this.fillLevel, 1.05);
        this.chugFillBar.width = 180 * shown;
        this.chugMarker.x = -90 + 180 * shown;
        const released =
          (Phaser.Input.Keyboard.JustUp(space) || (this.prevPourHeld && !heldNow)) &&
          this.fillLevel > 0.05;
        this.prevPourHeld = heldNow;
        if (released || this.fillLevel > 1.05) {
          const overflow = this.fillLevel > 1.0;
          const accuracy = overflow
            ? 0.08
            : Math.max(0, 1 - Math.abs(0.92 - this.fillLevel) / 0.35);
          this.lockBeer(accuracy, overflow);
        }
        return;
      }
      this.markerPhase += this.markerSpeed * dt;
      if (mech === "jitter") {
        this.jitterCd -= dt;
        if (this.jitterCd <= 0) {
          this.jitterCd = Phaser.Math.FloatBetween(0.25, 0.6);
          this.markerPhase += Phaser.Math.FloatBetween(-0.9, 0.9); // pucker
        }
      }
      const pos = 0.5 + 0.5 * Math.sin(this.markerPhase);
      this.chugMarker.x = -90 + 180 * pos;
      if (Phaser.Input.Keyboard.JustDown(space) || this.consumeTap()) {
        this.lockBeer(1 - Math.abs(pos - 0.5) * 2, false);
      }
      return;
    }

    // Result phase. Inputs during the flash are buffered, not dropped.
    if (this.resultTimer > 0) {
      this.resultTimer -= dt;
      if (Phaser.Input.Keyboard.JustDown(space) || this.consumeTap()) this.queuedSpace = true;
      if (Phaser.Input.Keyboard.JustDown(this.enterKey) || this.consumeEnterTap()) {
        this.queuedEnter = true;
      }
      if (this.resultTimer <= 0) {
        this.idleTimer = 0;
        if (this.queuedEnter) {
          this.queuedEnter = false;
          this.queuedSpace = false;
          this.exitStop();
          return;
        }
        if (this.queuedSpace && this.tabRemaining > 0) {
          this.queuedSpace = false;
          this.nextRound();
          return;
        }
        this.queuedSpace = false;
        if (this.tabRemaining <= 0) {
          // The bartender has opinions.
          this.chugFeedback.setText(`"${vocabLine(this.avatarId, "cutoff")}"`);
          this.chugPrompt.setText("that's your tab");
          this.chugAnotherBtn.setVisible(false);
          this.chugRideOnBtn.setVisible(true);
        } else {
          this.chugPrompt.setText("SPACE / ENTER");
          this.chugAnotherBtn.setVisible(true);
          this.chugRideOnBtn.setVisible(true);
        }
      }
      return;
    }
    this.idleTimer += dt;
    if (Phaser.Input.Keyboard.JustDown(space) || this.consumeTap()) {
      if (this.tabRemaining > 0) this.nextRound();
      else this.exitStop();
      return;
    }
    if (Phaser.Input.Keyboard.JustDown(this.enterKey) || this.consumeEnterTap()) {
      this.exitStop();
      return;
    }
    // Keep the pace: drift back to the tap list on idle.
    if (this.idleTimer > 2.2 && this.tabRemaining > 0) {
      this.nextRound();
    }
  }

  private nextRound(): void {
    this.beerNum++;
    this.chugPhase = "pick";
    this.pickPhaseUI();
    this.refreshTapUI();
  }

  private exitStop(): void {
    this.mode = "riding";
    this.happyHour = false;
    this.stopBackdrop.setVisible(false);
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
    this.progressFill.width = 78 * (this.d / this.routeDef.length);

    const state = this.portraitStateFor();
    if (state !== this.portraitState) {
      this.portraitState = state;
      this.portrait.setTexture(`av_${this.avatarId}_${state}`);
    }
    // The face itself rocks when you're deep in it.
    this.portrait.rotation = this.buzz.level >= 40 ? this.lastSway * 0.03 : 0;
  }

  private portraitStateFor(): AvatarState {
    if (this.crashTimer > 0) return this.lives <= 0 ? "dead" : "wince";
    if (this.mode === "chugging") return this.smugTimer > 0 ? "smug" : "chug";
    if (this.suspicion > 0.15) return "sweat";
    if (this.buzz.level >= 75) return "hammered";
    if (this.buzz.level >= 35) return "tipsy";
    return "sober";
  }

  // Project every prop and fixture from route space to the screen. All
  // stored lats are relative to the curving centerline except roadsegs
  // and stripes (which ARE the centerline) and curbs (edge signs).
  private layoutWorld(): void {
    for (const p of this.props) {
      while (p.d < this.d - 110) {
        p.d += p.span;
        if (p.kind === "cone") {
          p.lat = Phaser.Math.FloatBetween(-this.roadW / 2 + 12, this.roadW / 2 - 12);
        }
      }
      const center = this.centerLat(p.d);
      let abs: number;
      if (p.kind === "roadseg" || p.kind === "stripe") abs = center;
      else if (p.kind === "curb") abs = center + p.lat * (this.roadW / 2 + 4);
      else abs = center + p.lat;
      this.place(p.obj, p.d, abs);
      if (p.kind === "roadseg") p.obj.setDepth(-20);
      else if (p.kind === "stripe") p.obj.setDepth(-15);
    }
    for (const f of this.fixtures) {
      this.place(f.obj, f.d, this.centerLat(f.d) + f.lat);
    }
    for (const n of this.npcs) {
      this.place(n.obj, n.d, this.centerLat(n.d) + n.lat);
    }
    for (const p of this.pickups) {
      this.place(p.obj, p.d, this.centerLat(p.d) + p.lat);
    }
    for (const c of this.cops) {
      this.place(c.obj, c.d, this.centerLat(c.d) + c.lat);
    }
  }

  private place(obj: WorldObj, d: number, lat: number): void {
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
    audio.sfx("crash");
    this.popup(vocabLine(this.avatarId, "crash"), "#ff9a8a");
  }

  private endRun(finished: boolean, busted = false): void {
    this.cameras.main.setScroll(0, 0);
    const hasNext = finished && this.routeIndex < ROUTES.length - 1;
    const quote = busted
      ? vocabLine(this.avatarId, "bust")
      : finished
        ? vocabLine(this.avatarId, "finish")
        : vocabLine(this.avatarId, "crash");
    if (!finished) {
      // Failure endings get the LAST CALL screen; the Bugle is reserved
      // for transitions and finishing the crawl.
      this.scene.start("GameOver", {
        score: Math.floor(this.score),
        busted,
        riderName: AVATARS.find((a) => a.id === this.avatarId)?.name ?? "CYCLIST",
        avatarId: this.avatarId,
        quote,
      });
      return;
    }
    this.scene.start("Results", {
      score: Math.floor(this.score),
      finished,
      busted,
      breweries: this.visited.size,
      routeName: this.routeDef.name,
      riderName: AVATARS.find((a) => a.id === this.avatarId)?.name ?? "CYCLIST",
      quote,
      nextRouteName: hasNext ? ROUTES[this.routeIndex + 1].name : undefined,
      carry: hasNext
        ? {
            routeIndex: this.routeIndex + 1,
            score: Math.floor(this.score),
            lives: this.lives,
            buzz: this.buzz.level,
            streak: this.streak,
          }
        : undefined,
    });
  }
}
