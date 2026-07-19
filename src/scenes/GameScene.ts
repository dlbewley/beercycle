import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../main";

// Placeholder ride: a diagonally scrolling road and a steerable bike
// rectangle. Real riding mechanics land with beercycle-ost; the tipsiness
// model with beercycle-2z7.
export class GameScene extends Phaser.Scene {
  private bike!: Phaser.GameObjects.Rectangle;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private stripes: Phaser.GameObjects.Rectangle[] = [];
  private score = 0;
  private scoreText!: Phaser.GameObjects.Text;

  constructor() {
    super("Game");
  }

  create(): void {
    this.score = 0;
    this.stripes = [];

    // Road surface.
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x3b3b45);

    // Diagonal lane stripes scrolling toward the lower-left, faking the
    // Paperboy camera until real level scrolling exists.
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 7; col++) {
        const stripe = this.add.rectangle(col * 90 + row * 30 - 60, row * 60 - 30, 24, 4, 0xf7f7e8);
        stripe.setAngle(-30);
        this.stripes.push(stripe);
      }
    }

    this.bike = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 50, 10, 18, 0xf7b32b);

    this.scoreText = this.add.text(6, 4, "SCORE 0", {
      fontFamily: "monospace",
      fontSize: "10px",
      color: "#ffffff",
    });

    this.add
      .text(GAME_WIDTH - 6, 4, "ESC: bail out", {
        fontFamily: "monospace",
        fontSize: "8px",
        color: "#9a9a9a",
      })
      .setOrigin(1, 0);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.input.keyboard!.once("keydown-ESC", () => {
      this.scene.start("Results", { score: Math.floor(this.score) });
    });
  }

  update(_time: number, delta: number): void {
    const dt = delta / 1000;
    const speed = 120;

    if (this.cursors.left.isDown) {
      this.bike.x -= speed * dt;
    } else if (this.cursors.right.isDown) {
      this.bike.x += speed * dt;
    }
    this.bike.x = Phaser.Math.Clamp(this.bike.x, 10, GAME_WIDTH - 10);

    for (const stripe of this.stripes) {
      stripe.x = Phaser.Math.Wrap(stripe.x - 90 * dt, -60, GAME_WIDTH + 90);
      stripe.y = Phaser.Math.Wrap(stripe.y + 52 * dt, -30, GAME_HEIGHT + 60);
    }

    this.score += 10 * dt;
    this.scoreText.setText(`SCORE ${Math.floor(this.score)}`);
  }
}
