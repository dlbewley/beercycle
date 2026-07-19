import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../main";
import { getLeaderboard } from "../systems/leaderboard";
import type { RunCarry } from "./GameScene";

// End-of-run tally styled as a local-paper front page (Paperboy's
// spinning-headline homage). Parody masthead, no real-paper branding.

const INK = "#1a1423";
const FADED_INK = "#4a4438";

interface ResultsData {
  score?: number;
  finished?: boolean;
  busted?: boolean;
  breweries?: number;
  routeName?: string;
  nextRouteName?: string;
  carry?: RunCarry;
}

function headline(
  finished: boolean,
  breweries: number,
  busted: boolean,
  route: string,
): string {
  if (busted) return `CYCLIST CITED FOR BUI ON ${route}`;
  if (finished && breweries >= 3) return `CYCLIST SWEEPS ${route} PUB CRAWL`;
  if (finished && breweries > 0) return "CYCLIST WOBBLES ONWARD, SMILING";
  if (finished) return "SOBER CYCLIST SETS COURSE RECORD";
  return `BICYCLE MISHAP SNARLS ${route}`;
}

export class ResultsScene extends Phaser.Scene {
  constructor() {
    super("Results");
  }

  create(data: ResultsData): void {
    const score = data.score ?? 0;
    const breweries = data.breweries ?? 0;
    const finished = data.finished ?? false;
    const busted = data.busted ?? false;
    const routeName = data.routeName ?? "PEARL ST";
    const isFinal = !data.carry;

    // Only a finished run's final tally makes the record books.
    const board = getLeaderboard();
    if (isFinal) {
      board.submit({ name: "CYC", score, date: new Date().toISOString() });
    }
    const top = board.getTop(5);

    const style = (size: string, color: string, wrap?: number) => ({
      fontFamily: "monospace",
      fontSize: size,
      color,
      align: "center" as const,
      ...(wrap ? { wordWrap: { width: wrap } } : {}),
    });

    const paper = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2, [
      this.add.rectangle(0, 0, 380, 230, 0xf2ead8).setStrokeStyle(2, 0x1a1423),
      this.add.text(0, -98, "THE BOULDER BUGLE", style("16px", INK)).setOrigin(0.5),
      this.add.rectangle(0, -86, 340, 1, 0x1a1423),
      this.add
        .text(0, -84, "BOULDER'S SECOND-MOST-TRUSTED NEWS SOURCE  *  25¢", style("6px", FADED_INK))
        .setOrigin(0.5, 0),
      this.add.rectangle(0, -72, 340, 1, 0x1a1423),
      this.add
        .text(0, -56, headline(finished, breweries, busted, routeName), style("13px", INK, 340))
        .setOrigin(0.5),
      this.add
        .text(
          0, -30,
          `Witnesses report ${breweries} brewery stop${breweries === 1 ? "" : "s"} on ${routeName}.` +
            `  ${isFinal ? "Final score" : "Score so far"}: ${score}.`,
          style("8px", FADED_INK, 320),
        )
        .setOrigin(0.5),
      this.add.rectangle(0, -18, 340, 1, 0x1a1423),
      this.add.text(0, -8, "— HIGH SCORES —", style("9px", INK)).setOrigin(0.5),
      ...top.map((entry, i) => {
        const isThisRun = entry.score === score;
        return this.add
          .text(
            0, 8 + i * 12,
            `${i + 1}. ${entry.name}  ${String(entry.score).padStart(6, ".")}${isThisRun ? "  <" : ""}`,
            style("9px", isThisRun ? "#8a2b2b" : FADED_INK),
          )
          .setOrigin(0.5);
      }),
      this.add
        .text(
          0, 96,
          isFinal
            ? "PRESS SPACE FOR MENU"
            : `NEXT STOP: ${data.nextRouteName} — PRESS SPACE TO RIDE ON`,
          style("9px", isFinal ? INK : "#8a2b2b"),
        )
        .setOrigin(0.5),
    ]);

    // Paperboy-style spin-in.
    paper.setScale(0.05).setAngle(720);
    this.tweens.add({
      targets: paper,
      scale: 1,
      angle: 0,
      duration: 700,
      ease: "Cubic.easeOut",
    });

    this.input.keyboard?.once("keydown-SPACE", () => {
      if (data.carry) {
        this.scene.start("Game", data.carry);
      } else {
        this.scene.start("Menu");
      }
    });
  }
}
