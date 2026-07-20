import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { MenuScene } from "./scenes/MenuScene";
import { GameScene } from "./scenes/GameScene";
import { ResultsScene } from "./scenes/ResultsScene";

export const GAME_WIDTH = 480;
export const GAME_HEIGHT = 270;

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    // Renders at a low internal resolution and upscales for the chunky
    // SNES look; FIT keeps the 16:9 canvas letterboxed on odd windows.
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: "arcade",
  },
  input: {
    activePointers: 3, // steer + speed button simultaneously on touch
  },
  scene: [BootScene, MenuScene, GameScene, ResultsScene],
});

// The FIT scaler can size against a zero-height parent when the page
// boots in a hidden/background tab; refresh once it becomes visible.
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) game.scale.refresh();
});
window.addEventListener("load", () => game.scale.refresh());

// Dev-only handle for poking at the running game from the console.
declare global {
  interface Window {
    __beercycle?: Phaser.Game;
  }
}
if (import.meta.env.DEV) {
  window.__beercycle = game;
}
