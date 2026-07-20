import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../main";
import { getLeaderboard } from "../systems/leaderboard";
import { audio } from "../systems/audio";
import { AVATARS } from "../art/pixelart";

const AVATAR_STORE_KEY = "beercycle.avatar.v1";

export class MenuScene extends Phaser.Scene {
  private avatarIndex = 0;
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

    // Tappable (and clickable) select arrows.
    const arrow = (x: number, dir: number, glyph: string) =>
      this.add
        .text(x, 216, glyph, { fontFamily: "monospace", fontSize: "18px", color: "#f7b32b" })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on("pointerdown", () => {
          this.avatarIndex = (this.avatarIndex + dir + AVATARS.length) % AVATARS.length;
          this.refreshAvatar();
        });
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

    // The polaroid: the three jokers, mid-ride selfie.
    const polaroid = this.add.container(GAME_WIDTH - 62, GAME_HEIGHT - 60, [
      this.add.rectangle(0, 0, 96, 84, 0xf2ead8),
      this.add.rectangle(0, -8, 84, 56, 0x9fd0e8),
      this.add.image(-6, 12, "flatirons").setScale(0.28).setOrigin(0.5, 1),
      this.add.image(-24, -2, "av_dwnwrd_sober").setScale(1.7),
      this.add.image(8, -8, "av_hoskins_chug").setScale(1.2),
      this.add.image(28, -4, "av_drellis_sober").setScale(1.2),
      this.add
        .text(0, 32, "the jokers", { fontFamily: "monospace", fontSize: "8px", color: "#4a4438" })
        .setOrigin(0.5),
    ]);
    polaroid.setAngle(6);

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

    this.add
      .text(GAME_WIDTH - 6, GAME_HEIGHT - 8, "M: mute", {
        fontFamily: "monospace",
        fontSize: "8px",
        color: "#7a7a7a",
      })
      .setOrigin(1, 0.5);

    this.input.keyboard?.on("keydown-M", () => audio.toggleMute());
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
