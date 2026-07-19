import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../main";
import { getLeaderboard } from "../systems/leaderboard";

// End-of-run tally. Will become the Daily Camera headline screen
// (beercycle-chx); for now it records the score and loops to the menu.
export class ResultsScene extends Phaser.Scene {
  constructor() {
    super("Results");
  }

  create(data: { score?: number; finished?: boolean }): void {
    const score = data.score ?? 0;
    getLeaderboard().submit({ name: "CYC", score, date: new Date().toISOString() });

    const cx = GAME_WIDTH / 2;
    this.add
      .text(cx, GAME_HEIGHT / 2 - 20, data.finished ? "MADE IT HOME" : "RIDE OVER", {
        fontFamily: "monospace",
        fontSize: "24px",
        color: "#f7b32b",
      })
      .setOrigin(0.5);

    this.add
      .text(cx, GAME_HEIGHT / 2 + 10, `SCORE ${score}`, {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.add
      .text(cx, GAME_HEIGHT - 40, "PRESS SPACE FOR MENU", {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#cfcfcf",
      })
      .setOrigin(0.5);

    this.input.keyboard?.once("keydown-SPACE", () => {
      this.scene.start("Menu");
    });
  }
}
