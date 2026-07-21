import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../main";
import { getLeaderboard } from "../systems/leaderboard";
import type { RunCarry } from "./GameScene";
import { AVATARS } from "../art/pixelart";
import { ROUTES } from "../systems/routes";

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
  riderName?: string;
  quote?: string;
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

    // Only a finished run's final tally makes the record books, signed
    // with the chosen rider's initials.
    const initials =
      AVATARS.find((a) => a.id === this.registry.get("avatar"))?.initials ?? "CYC";
    const board = getLeaderboard();
    if (isFinal) {
      board.submit({ name: initials, score, date: new Date().toISOString() });
    }
    const top = board.getTop(5);

    const style = (size: string, color: string, wrap?: number) => ({
      fontFamily: "monospace",
      fontSize: size,
      color,
      align: "center" as const,
      ...(wrap ? { wordWrap: { width: wrap } } : {}),
    });

    const avatarId = (this.registry.get("avatar") as string) ?? "dwnwrd";
    const children: Phaser.GameObjects.GameObject[] = [
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
          0, -36,
          `Witnesses report ${breweries} brewery stop${breweries === 1 ? "" : "s"} on ${routeName}.` +
            // The final page's score lives in the high-score table below.
            (isFinal ? "" : `  Score so far: ${score}.`),
          style("8px", FADED_INK, 320),
        )
        .setOrigin(0.5),
    ];

    if (isFinal) {
      // The end-of-game page keeps the record books.
      children.push(
        this.add
          .text(
            0, -23,
            data.quote ? `${data.riderName ?? "RIDER"}: "${data.quote}"` : "",
            style("8px", INK, 320),
          )
          .setOrigin(0.5),
        this.add.rectangle(0, -14, 340, 1, 0x1a1423),
        this.add.text(0, -6, "— HIGH SCORES —", style("9px", INK)).setOrigin(0.5),
        ...top.slice(0, 5).map((entry, i) => {
          const isThisRun = entry.score === score;
          return this.add
            .text(
              0, 10 + i * 12,
              `${i + 1}. ${entry.name}  ${String(entry.score).padStart(6, ".")}${isThisRun ? "  <" : ""}`,
              style("9px", isThisRun ? "#8a2b2b" : FADED_INK),
            )
            .setOrigin(0.5);
        }),
      );
    } else if (data.quote) {
      // Transition page (beercycle-e2x): the rider's face next to a
      // quote you can actually read, and no scoreboard — this is a
      // pit stop, not a game over.
      children.push(
        this.add.rectangle(0, -24, 340, 1, 0x1a1423),
        this.add.image(-140, 2, `av_${avatarId}_smug`).setScale(2),
        this.add.text(-140, 34, data.riderName ?? "RIDER", style("6px", FADED_INK)).setOrigin(0.5),
        this.add
          .text(-108, 2, `"${data.quote}"`, style("9px", INK, 250))
          .setOrigin(0, 0.5),
      );
    }

    children.push(
      // Coming-attractions marquee for the next route (beercycle-zgh).
      ...this.nextRoutePreview(data, style),
      this.add
        .text(
          0, 96,
          isFinal
            ? "SPACE OR TAP FOR MENU"
            : `NEXT STOP: ${data.nextRouteName} — SPACE OR TAP TO RIDE ON`,
          style("9px", isFinal ? INK : "#8a2b2b"),
        )
        .setOrigin(0.5),
    );

    const paper = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2, children);

    // Paperboy-style spin-in.
    paper.setScale(0.05).setAngle(720);
    this.tweens.add({
      targets: paper,
      scale: 1,
      angle: 0,
      duration: 700,
      ease: "Cubic.easeOut",
    });

    let advanced = false;
    const advance = () => {
      if (advanced) return;
      advanced = true;
      if (data.carry) {
        this.scene.start("Game", data.carry);
      } else {
        this.scene.start("Menu");
      }
    };
    this.input.keyboard?.once("keydown-SPACE", advance);
    this.input.once("pointerdown", advance);
  }

  // Glyph + signature pour + name for each brewery on the next route,
  // plus the hazard forecast. Only rendered on transition pages.
  private nextRoutePreview(
    data: ResultsData,
    style: (size: string, color: string, wrap?: number) => object,
  ): Phaser.GameObjects.GameObject[] {
    const nextIndex = data.carry?.routeIndex;
    if (nextIndex === undefined || !ROUTES[nextIndex]) return [];
    const next = ROUTES[nextIndex];
    const shown = next.breweries.slice(0, 4);
    const objs: Phaser.GameObjects.GameObject[] = [
      this.add
        .text(0, 46, `— NEXT ON THE CRAWL: ${next.name} —`, style("8px", INK))
        .setOrigin(0.5),
      this.add.text(0, 84, next.forecast, style("7px", FADED_INK, 340)).setOrigin(0.5),
    ];
    shown.forEach((b, i) => {
      const x = (i - (shown.length - 1) / 2) * 84;
      objs.push(
        this.add.image(x - 12, 62, `glyph_${b.glyph}`).setTint(b.accent),
        this.add.image(x + 6, 62, `glass_${b.taps[0].id}`),
        this.add
          .text(x, 76, b.name, {
            fontFamily: "monospace",
            fontSize: "6px",
            color: FADED_INK,
            align: "center",
          })
          .setOrigin(0.5),
      );
    });
    return objs;
  }
}
