import Phaser from "phaser";

// Loads assets (none yet) and hands off to the menu.
export class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  create(): void {
    this.scene.start("Menu");
  }
}
