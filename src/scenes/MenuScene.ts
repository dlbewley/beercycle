import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../main";
import { getLeaderboard } from "../systems/leaderboard";
import { audio } from "../systems/audio";
import { AVATARS } from "../art/pixelart";

const AVATAR_STORE_KEY = "beercycle.avatar.v1";

// The polaroid stream (beercycle-gnd): a rotating pile of ride photos,
// one gag per rider plus the original group shot. Scenes are collaged
// from existing game textures.
interface PolaroidShot {
  key: string;
  x: number;
  y: number;
  scale?: number;
  angle?: number;
  flipX?: boolean;
}

interface PolaroidSpec {
  caption: string;
  angle: number;
  shots: PolaroidShot[];
}

const POLAROIDS: PolaroidSpec[] = [
  {
    caption: "the jokers",
    angle: 6,
    shots: [
      { key: "av_dwnwrd_sober", x: -24, y: -2, scale: 1.7 },
      { key: "av_hoskins_chug", x: 8, y: -8, scale: 1.2 },
      { key: "av_drellis_sober", x: 28, y: -4, scale: 1.2 },
    ],
  },
  {
    caption: "the vegan audit",
    angle: -5,
    shots: [
      { key: "av_dwnwrd_chug", x: -16, y: -6, scale: 1.6 },
      { key: "taco", x: 10, y: 4, scale: 1.4 },
      { key: "booch", x: 24, y: -4, scale: 1.3 },
    ],
  },
  {
    caption: "the goose incident",
    angle: 5,
    shots: [
      { key: "av_hoskins_wince", x: -16, y: -4, scale: 1.6 },
      { key: "goose", x: 12, y: -8, scale: 1.3, flipX: true },
      { key: "goose", x: 26, y: 2, scale: 1.0, flipX: true, angle: -20 },
    ],
  },
  {
    caption: "a defensible vintage",
    angle: -4,
    shots: [
      { key: "av_drellis_smug", x: -18, y: -6, scale: 1.6 },
      { key: "glass_kinda", x: 8, y: 2, scale: 1.4 },
      { key: "dartboard", x: 28, y: -8, scale: 0.45 },
    ],
  },
  {
    caption: "a teachable moment",
    angle: 7,
    shots: [
      { key: "av_jillbake_smug", x: -18, y: -6, scale: 1.6 },
      { key: "cop", x: 14, y: -2, scale: 1.4 },
    ],
  },
  {
    caption: "creek soundcheck",
    angle: -6,
    shots: [
      { key: "av_plkstr_tipsy", x: -18, y: -6, scale: 1.6 },
      { key: "tube", x: 12, y: 2, scale: 1.3 },
      { key: "water", x: 28, y: -6, scale: 1.2 },
    ],
  },
  {
    caption: "grading the potholes",
    angle: 4,
    shots: [
      { key: "av_aafran_sober", x: -18, y: -6, scale: 1.6 },
      { key: "cone", x: 10, y: 4, scale: 1.3 },
      { key: "cone", x: 24, y: 0, scale: 1.0, angle: 30 },
    ],
  },
];

export class MenuScene extends Phaser.Scene {
  private avatarIndex = 0;
  private polaroidIndex = 0;
  private polaroid?: Phaser.GameObjects.Container;
  private portrait!: Phaser.GameObjects.Image;
  private nameText!: Phaser.GameObjects.Text;
  private traitText!: Phaser.GameObjects.Text;
  private bikePreview!: Phaser.GameObjects.Image;

  constructor() {
    super("Menu");
  }

  create(): void {
    const cx = GAME_WIDTH / 2;

    // Dusk-toned Flatirons silhouette behind the title.
    this.add
      .image(cx, GAME_HEIGHT - 30, "flatirons")
      .setOrigin(0.5, 1)
      .setScale(1.5)
      .setTint(0x3a3a55)
      .setAlpha(0.9);
    this.add.rectangle(cx, GAME_HEIGHT - 15, GAME_WIDTH, 30, 0x232338);

    // Rider select: portrait, name, trait, and the matching road sprite.
    const stored = localStorage.getItem(AVATAR_STORE_KEY);
    this.avatarIndex = Math.max(0, AVATARS.findIndex((a) => a.id === stored));

    const colX = 100;
    this.add
      .text(colX, 172, "choose your rider", {
        fontFamily: "monospace",
        fontSize: "8px",
        color: "#7a7a7a",
      })
      .setOrigin(0.5);

    // Tappable (and clickable) select arrows. The glyph is just the
    // visual; a much larger invisible zone catches the actual touch
    // (beercycle-dm1) so thumbs don't have to hit an 11px character.
    const arrow = (x: number, dir: number, glyph: string) => {
      this.add
        .text(x, 216, glyph, { fontFamily: "monospace", fontSize: "20px", color: "#f7b32b" })
        .setOrigin(0.5);
      this.add
        .zone(x, 216, 44, 64)
        .setInteractive({ useHandCursor: true })
        .on("pointerdown", () => {
          this.avatarIndex = (this.avatarIndex + dir + AVATARS.length) % AVATARS.length;
          this.refreshAvatar();
        });
    };
    arrow(colX - 44, -1, "<");
    arrow(colX + 44, 1, ">");
    this.nameText = this.add
      .text(colX, 184, "", { fontFamily: "monospace", fontSize: "10px", color: "#f7b32b" })
      .setOrigin(0.5);
    this.portrait = this.add.image(colX, 216, "").setScale(2.5);
    this.traitText = this.add
      .text(colX, 248, "", { fontFamily: "monospace", fontSize: "7px", color: "#9a9aa8" })
      .setOrigin(0.5);

    this.bikePreview = this.add.image(colX + 70, 220, "bike_a").setScale(2);
    this.tweens.add({
      targets: this.bikePreview,
      y: 216,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // The polaroid stream: fresh ride photo drops in every few seconds.
    this.showPolaroid(0);
    this.time.addEvent({
      delay: 3800,
      loop: true,
      callback: () => {
        this.polaroidIndex = (this.polaroidIndex + 1) % POLAROIDS.length;
        this.showPolaroid(this.polaroidIndex);
      },
    });

    this.refreshAvatar();
    this.input.keyboard?.on("keydown-LEFT", () => {
      this.avatarIndex = (this.avatarIndex + AVATARS.length - 1) % AVATARS.length;
      this.refreshAvatar();
    });
    this.input.keyboard?.on("keydown-RIGHT", () => {
      this.avatarIndex = (this.avatarIndex + 1) % AVATARS.length;
      this.refreshAvatar();
    });

    this.add
      .text(cx, 40, "BEERCYCLE", {
        fontFamily: "monospace",
        fontSize: "32px",
        color: "#f7b32b",
      })
      .setOrigin(0.5);

    this.add
      .text(cx, 66, "a Boulder bicycle odyssey", {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#cfcfcf",
      })
      .setOrigin(0.5);

    const top = getLeaderboard().getTop(3);
    top.forEach((entry, i) => {
      this.add
        .text(cx, 92 + i * 12, `${i + 1}. ${entry.name}  ${entry.score}`, {
          fontFamily: "monospace",
          fontSize: "10px",
          color: "#8fd694",
        })
        .setOrigin(0.5);
    });

    this.add
      .text(cx, 142, "PRESS SPACE OR TAP TO RIDE", {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.add
      .text(cx, GAME_HEIGHT - 6, "pedal responsibly — this is a video game", {
        fontFamily: "monospace",
        fontSize: "7px",
        color: "#7a7a7a",
      })
      .setOrigin(0.5);

    // Touchable sound toggle with live state (beercycle-q25) — doubles
    // as a "you are not muted" indicator. M still works on keyboard.
    const soundText = this.add
      .text(GAME_WIDTH - 6, GAME_HEIGHT - 8, "", {
        fontFamily: "monospace",
        fontSize: "8px",
        color: "#7a7a7a",
      })
      .setOrigin(1, 0.5);
    const refreshSound = () => {
      soundText
        .setText(audio.isMuted() ? "♪ sound OFF" : "♪ sound on")
        .setColor(audio.isMuted() ? "#d9756a" : "#7a7a7a");
    };
    refreshSound();
    this.add
      .zone(GAME_WIDTH - 30, GAME_HEIGHT - 12, 60, 24)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        audio.unlock(); // gesture-tied resume for mobile
        audio.toggleMute();
        if (!audio.isMuted()) audio.sfx("bell"); // audible confirmation
        refreshSound();
      });
    this.input.keyboard?.on("keydown-M", () => {
      audio.toggleMute();
      refreshSound();
    });
    let started = false;
    const startRide = () => {
      if (started) return;
      started = true;
      audio.startMusic();
      audio.sfx("bell");
      this.scene.start("Game");
    };
    this.input.keyboard?.once("keydown-SPACE", startRide);
    // Tap anywhere that isn't an interactive control to ride.
    this.input.on(
      "pointerdown",
      (_p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
        if (over.length === 0) startRide();
      },
    );
  }

  private showPolaroid(index: number): void {
    const spec = POLAROIDS[index];
    this.polaroid?.destroy();
    const kids: Phaser.GameObjects.GameObject[] = [
      this.add.rectangle(0, 0, 96, 84, 0xf2ead8),
      this.add.rectangle(0, -8, 84, 56, 0x9fd0e8),
      this.add.image(-6, 12, "flatirons").setScale(0.28).setOrigin(0.5, 1),
      ...spec.shots.map((s) => {
        const img = this.add.image(s.x, s.y, s.key).setScale(s.scale ?? 1);
        if (s.flipX) img.setFlipX(true);
        if (s.angle) img.setAngle(s.angle);
        return img;
      }),
      this.add
        .text(0, 32, spec.caption, { fontFamily: "monospace", fontSize: "7px", color: "#4a4438" })
        .setOrigin(0.5),
    ];
    const c = this.add.container(GAME_WIDTH - 62, GAME_HEIGHT - 60, kids);
    c.setAngle(spec.angle + 16).setScale(1.3).setAlpha(0);
    this.tweens.add({
      targets: c,
      angle: spec.angle,
      scale: 1,
      alpha: 1,
      duration: 420,
      ease: "Back.easeOut",
    });
    this.polaroid = c;
  }

  private refreshAvatar(): void {
    const av = AVATARS[this.avatarIndex];
    this.portrait.setTexture(`av_${av.id}_sober`);
    this.nameText.setText(av.name);
    this.traitText.setText(av.trait);
    this.bikePreview.setTexture(`bike_${av.id}_a`);
    this.registry.set("avatar", av.id);
    localStorage.setItem(AVATAR_STORE_KEY, av.id);
  }
}
