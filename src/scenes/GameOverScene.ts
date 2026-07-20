import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../main";
import { getLeaderboard } from "../systems/leaderboard";
import { AVATARS, type AvatarId } from "../art/pixelart";
import { audio } from "../systems/audio";

// Failure endings only (crash-out, BUI citation, bailing). Deliberately
// nothing like the cream Bugle pages: black and red, a flickering LAST
// CALL sign, and the rider's last words as an epitaph (beercycle-afy).
// Finishing the crawl still makes the newspaper instead.

interface GameOverData {
  score?: number;
  busted?: boolean;
  riderName?: string;
  avatarId?: AvatarId;
  quote?: string;
}

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super("GameOver");
  }

  create(data: GameOverData): void {
    const score = data.score ?? 0;
    const busted = data.busted ?? false;
    const avatarId = data.avatarId ?? "dwnwrd";
    const riderName = data.riderName ?? "CYCLIST";
    const cx = GAME_WIDTH / 2;
    const mono = (size: string, color: string, wrap?: number) => ({
      fontFamily: "monospace",
      fontSize: size,
      color,
      align: "center" as const,
      ...(wrap ? { wordWrap: { width: wrap } } : {}),
    });

    audio.stopMusic();
    audio.sfx("lastcall");

    this.add.rectangle(cx, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0a0508);
    if (this.textures.exists("vignette")) {
      this.add.image(cx, GAME_HEIGHT / 2, "vignette").setTint(0x8a2b2b).setAlpha(0.5);
    }

    // Flickering neon.
    const title = this.add.text(cx, 34, "LAST CALL", mono("30px", "#ff5555")).setOrigin(0.5);
    this.tweens.add({
      targets: title,
      alpha: 0.5,
      duration: 850,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
    this.add
      .text(
        cx, 58,
        busted ? "boulder pd sends their regards." : "the pavement always wins.",
        mono("9px", "#9a8fb8"),
      )
      .setOrigin(0.5);

    if (busted) {
      // The citation tableau.
      this.add.image(cx - 44, 106, "cop").setScale(2.2);
      this.add.rectangle(cx, 108, 34, 24, 0xf2ead8).setAngle(-8);
      this.add
        .text(cx, 108, "BUI\n#420", mono("7px", "#8a2b2b"))
        .setOrigin(0.5)
        .setAngle(-8);
      this.add.image(cx + 52, 106, `av_${avatarId}_dead`).setScale(2);
    } else {
      // The wipeout tableau: bike on its side, rider seeing stars.
      this.add.image(cx - 22, 112, `bike_${avatarId}_a`).setRotation(1.35).setScale(1.6);
      this.add.image(cx + 46, 105, `av_${avatarId}_dead`).setScale(2);
      const stars = this.add.container(cx + 46, 92);
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2;
        stars.add(
          this.add.rectangle(Math.cos(a) * 20, Math.sin(a) * 7, 3, 3, 0xffe14d).setAngle(45),
        );
      }
      this.tweens.add({ targets: stars, angle: 360, duration: 1600, repeat: -1 });
    }

    this.add
      .text(cx, 152, `HERE LIES ${riderName} — "${data.quote ?? ""}"`, mono("8px", "#c9a86a", 420))
      .setOrigin(0.5);
    this.add.text(cx, 174, `FINAL SCORE ${score}`, mono("13px", "#ffffff")).setOrigin(0.5);

    const board = getLeaderboard();
    board.submit({
      name: AVATARS.find((a) => a.id === avatarId)?.initials ?? "CYC",
      score,
      date: new Date().toISOString(),
    });
    board.getTop(3).forEach((entry, i) => {
      const mine = entry.score === score;
      this.add
        .text(
          cx, 196 + i * 12,
          `${i + 1}. ${entry.name}  ${entry.score}${mine ? "  <" : ""}`,
          mono("9px", mine ? "#ff5555" : "#8a8a96"),
        )
        .setOrigin(0.5);
    });

    this.add.text(cx, 246, "SPACE OR TAP FOR MENU", mono("9px", "#cfcfcf")).setOrigin(0.5);
    let done = false;
    const advance = () => {
      if (done) return;
      done = true;
      this.scene.start("Menu");
    };
    this.input.keyboard?.once("keydown-SPACE", advance);
    this.input.once("pointerdown", advance);
  }
}
