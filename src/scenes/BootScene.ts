import Phaser from "phaser";
import { createGameTextures } from "../art/pixelart";

// Generates the programmatic pixel-art textures and hands off to the menu.
export class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  create(): void {
    createGameTextures(this);
    this.scene.start("Menu");
  }
}
