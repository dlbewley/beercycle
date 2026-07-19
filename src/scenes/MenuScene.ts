import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../main";
import { getLeaderboard } from "../systems/leaderboard";

export class MenuScene extends Phaser.Scene {
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

    const bike = this.add.image(cx, GAME_HEIGHT - 38, "bike_a").setScale(2);
    this.tweens.add({
      targets: bike,
      y: GAME_HEIGHT - 42,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.add
      .text(cx, 60, "BEERCYCLE", {
        fontFamily: "monospace",
        fontSize: "32px",
        color: "#f7b32b",
      })
      .setOrigin(0.5);

    this.add
      .text(cx, 90, "a Boulder bicycle odyssey", {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#cfcfcf",
      })
      .setOrigin(0.5);

    const top = getLeaderboard().getTop(3);
    top.forEach((entry, i) => {
      this.add
        .text(cx, 125 + i * 12, `${i + 1}. ${entry.name}  ${entry.score}`, {
          fontFamily: "monospace",
          fontSize: "10px",
          color: "#8fd694",
        })
        .setOrigin(0.5);
    });

    this.add
      .text(cx, GAME_HEIGHT - 60, "PRESS SPACE TO RIDE", {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.add
      .text(cx, GAME_HEIGHT - 20, "pedal responsibly — this is a video game", {
        fontFamily: "monospace",
        fontSize: "8px",
        color: "#7a7a7a",
      })
      .setOrigin(0.5);

    this.input.keyboard?.once("keydown-SPACE", () => {
      this.scene.start("Game");
    });
  }
}
