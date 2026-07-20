import Phaser from "phaser";
import { ROUTES } from "../systems/routes";

// Per-brewery interior backdrops (beercycle-cpg): full-screen 480x270
// pixel scenes shown behind the chug panel, each inspired by the real
// parody source (research notes in the beads issue). Drawn procedurally
// like the rest of the art pipeline; texture key bg_<brewery id>.

type Ctx = CanvasRenderingContext2D;

const W = 480;
const H = 270;

function px(ctx: Ctx, x: number, y: number, w: number, h: number, c: string): void {
  ctx.fillStyle = c;
  ctx.fillRect(x, y, w, h);
}

function wallAndFloor(ctx: Ctx, wall: string, floor: string, split = 190): void {
  px(ctx, 0, 0, W, split, wall);
  px(ctx, 0, split, W, H - split, floor);
}

// Horizontal planks with seam lines (wood walls everywhere in Boulder).
function planks(ctx: Ctx, y0: number, y1: number, base: string, seam: string): void {
  for (let y = y0; y < y1; y += 16) {
    px(ctx, 0, y, W, 15, base);
    px(ctx, 0, y + 15, W, 1, seam);
    px(ctx, ((y * 37) % W + W) % W, y, 1, 15, seam); // staggered joints
  }
}

function stringLights(ctx: Ctx, y: number, colors: string[]): void {
  for (let x = 0; x < W; x += 4) {
    const yy = y + Math.sin((x / W) * Math.PI * 3) * 8;
    px(ctx, x, Math.round(yy), 2, 1, "#3a3a3a");
    if (x % 24 === 12) {
      px(ctx, x, Math.round(yy) + 2, 3, 4, colors[(x / 24) % colors.length | 0]);
    }
  }
}

function framedPoster(ctx: Ctx, x: number, y: number, w: number, h: number, inner: string[]): void {
  px(ctx, x - 2, y - 2, w + 4, h + 4, "#1a1410");
  for (let i = 0; i < inner.length; i++) {
    px(ctx, x, y + (h / inner.length) * i, w, h / inner.length, inner[i]);
  }
}

function barCounter(ctx: Ctx, wood: string, edge: string): void {
  px(ctx, 0, 226, W, 44, wood);
  px(ctx, 0, 224, W, 3, edge);
  for (let x = 40; x < W; x += 90) {
    px(ctx, x, 204, 4, 20, "#2b2b2b"); // tap handles
    px(ctx, x - 2, 200, 8, 6, "#d9a516");
  }
}

const DRAWERS: Record<string, (ctx: Ctx) => void> = {
  // Hippie living room: tapestries, jam-band posters, a ceiling creature.
  mountainmoon: (ctx) => {
    wallAndFloor(ctx, "#6b4226", "#4a3220");
    planks(ctx, 0, 190, "#6b4226", "#523018");
    for (let i = 0; i < 3; i++) {
      const x = 40 + i * 150;
      // Tie-dye tapestry: concentric rings.
      const rings = ["#c23b2a", "#e8a83c", "#e8e05a", "#4f9a4e", "#3f6fb0", "#8a4fae"];
      rings.forEach((c, r) => {
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.arc(x + 40, 78, 42 - r * 7, 0, Math.PI * 2);
        ctx.fill();
      });
      px(ctx, x - 4, 30, 88, 4, "#3a2a18"); // hanging rod
    }
    framedPoster(ctx, 110, 140, 30, 38, ["#c23b2a", "#e8e05a", "#3f6fb0"]);
    framedPoster(ctx, 330, 138, 30, 40, ["#8a4fae", "#4f9a4e", "#e8a83c"]);
    // The dangling kooky creature.
    px(ctx, 238, 0, 2, 26, "#3a3a3a");
    px(ctx, 230, 26, 18, 14, "#6fae4e");
    px(ctx, 233, 30, 4, 4, "#ffffff");
    px(ctx, 241, 30, 4, 4, "#ffffff");
    px(ctx, 234, 31, 2, 2, "#1a1a1a");
    px(ctx, 242, 31, 2, 2, "#1a1a1a");
    stringLights(ctx, 14, ["#e8e05a", "#c23b2a", "#3f6fb0", "#4f9a4e"]);
    barCounter(ctx, "#523018", "#6b4226");
  },

  // Belgian brasserie: dark panels, stained glass, chalice shelf.
  bestflanders: (ctx) => {
    wallAndFloor(ctx, "#3a2a20", "#2b1f16");
    planks(ctx, 120, 190, "#3a2a20", "#2b1c12");
    const paneColors = ["#a03a4a", "#d9a516", "#3f6fb0", "#4f9a4e"];
    for (let i = 0; i < 3; i++) {
      const x = 60 + i * 140;
      // Arched window.
      ctx.fillStyle = "#1a1410";
      ctx.beginPath();
      ctx.arc(x + 30, 46, 34, Math.PI, 0);
      ctx.fill();
      px(ctx, x - 4, 46, 68, 60, "#1a1410");
      for (let py = 0; py < 3; py++) {
        for (let pxi = 0; pxi < 3; pxi++) {
          px(ctx, x + pxi * 20, 50 + py * 18, 17, 15, paneColors[(pxi + py + i) % 4]);
        }
      }
      ctx.fillStyle = paneColors[i % 4];
      ctx.beginPath();
      ctx.arc(x + 30, 44, 26, Math.PI, 0);
      ctx.fill();
    }
    px(ctx, 90, 160, 300, 4, "#523018"); // chalice shelf
    for (let i = 0; i < 5; i++) {
      const x = 110 + i * 60;
      px(ctx, x, 140, 14, 12, "#d9a516");
      px(ctx, x + 5, 152, 4, 6, "#d9a516");
      px(ctx, x + 2, 158, 10, 2, "#d9a516");
    }
    barCounter(ctx, "#2b1c12", "#523018");
  },

  // Colorado's first craft brewery: copper kettles and a 1979 pennant.
  bolder: (ctx) => {
    wallAndFloor(ctx, "#4a4440", "#38322e");
    for (const x of [70, 290]) {
      ctx.fillStyle = "#b87333";
      ctx.beginPath();
      ctx.arc(x + 55, 90, 55, Math.PI, 0);
      ctx.fill();
      px(ctx, x, 90, 110, 90, "#b87333");
      px(ctx, x + 12, 52, 10, 110, "#d99a5b"); // highlight
      px(ctx, x + 45, 20, 8, 20, "#8a5a28"); // chimney pipe
      px(ctx, x + 30, 130, 50, 8, "#8a5a28"); // band
    }
    // Pennant string.
    for (let x = 0; x < W; x += 36) {
      ctx.fillStyle = x % 72 === 0 ? "#d9a516" : "#f2ead8";
      ctx.beginPath();
      ctx.moveTo(x, 8);
      ctx.lineTo(x + 30, 8);
      ctx.lineTo(x + 15, 30);
      ctx.closePath();
      ctx.fill();
    }
    px(ctx, 196, 150, 88, 26, "#1a1410");
    ctx.fillStyle = "#d9a516";
    ctx.font = "16px monospace";
    ctx.fillText("1979", 218, 170);
    barCounter(ctx, "#38322e", "#4a4440");
  },

  // Après-everything can palace: corrugated wall, garage door, gear.
  upslip: (ctx) => {
    wallAndFloor(ctx, "#8a9096", "#5a5f64");
    for (let x = 0; x < W; x += 12) px(ctx, x, 0, 6, 190, "#7a8086"); // corrugation
    // Open garage door with mountain view.
    px(ctx, 150, 20, 180, 130, "#9fd0e8");
    ctx.fillStyle = "#6a7d92";
    ctx.beginPath();
    ctx.moveTo(150, 150);
    ctx.lineTo(210, 60);
    ctx.lineTo(260, 150);
    ctx.moveTo(240, 150);
    ctx.lineTo(290, 80);
    ctx.lineTo(330, 150);
    ctx.closePath();
    ctx.fill();
    px(ctx, 146, 12, 188, 8, "#5a5f64"); // door track
    // Wall of teal cans.
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 6; c++) {
        px(ctx, 20 + c * 16, 40 + r * 22, 12, 18, "#c8ccd4");
        px(ctx, 20 + c * 16, 46 + r * 22, 12, 7, "#3f9fb0");
      }
    }
    // Hanging kayak.
    px(ctx, 350, 40, 110, 14, "#3f9fb0");
    px(ctx, 344, 44, 8, 6, "#3f9fb0");
    px(ctx, 460, 44, 8, 6, "#3f9fb0");
    px(ctx, 380, 44, 20, 6, "#1a1a1a");
    barCounter(ctx, "#5a5f64", "#8a9096");
  },

  // Dusk patio: string lights, taco truck, dogs, Flatirons.
  sanitastic: (ctx) => {
    const grad = ctx.createLinearGradient(0, 0, 0, 160);
    grad.addColorStop(0, "#2a3550");
    grad.addColorStop(1, "#d98a4a");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, 160);
    px(ctx, 0, 160, W, 110, "#3a4030"); // patio ground
    // Flatirons silhouettes.
    ctx.fillStyle = "#232c3d";
    for (const [x, top] of [[0, 70], [90, 50], [200, 66], [300, 56], [390, 74]] as const) {
      ctx.beginPath();
      ctx.moveTo(x, 160);
      ctx.lineTo(x + 55, top);
      ctx.lineTo(x + 110, 160);
      ctx.closePath();
      ctx.fill();
    }
    // Taco truck.
    px(ctx, 300, 96, 130, 64, "#c8ccd4");
    px(ctx, 310, 108, 60, 26, "#f7d98c"); // warm serving window
    px(ctx, 300, 88, 130, 8, "#c23b2a"); // awning
    px(ctx, 316, 160, 18, 12, "#1a1a1a");
    px(ctx, 396, 160, 18, 12, "#1a1a1a");
    ctx.fillStyle = "#c23b2a";
    ctx.font = "10px monospace";
    ctx.fillText("TACOS", 382, 122);
    // Picnic table + dogs.
    px(ctx, 60, 170, 120, 8, "#6b4226");
    px(ctx, 70, 178, 8, 22, "#523018");
    px(ctx, 162, 178, 8, 22, "#523018");
    for (const [dx, c] of [[210, "#8b5a2b"], [255, "#e8e4d8"]] as const) {
      px(ctx, dx, 196, 26, 12, c);
      px(ctx, dx + 22, 188, 10, 10, c);
      px(ctx, dx + 2, 208, 4, 8, c);
      px(ctx, dx + 18, 208, 4, 8, c);
    }
    stringLights(ctx, 30, ["#f7d98c", "#f7d98c", "#e8a83c"]);
  },

  // Barrel cathedral: stacked bourbon barrels, catwalk, one watchful bird.
  aviary: (ctx) => {
    wallAndFloor(ctx, "#241a2e", "#1a1422");
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 8; c++) {
        const x = 14 + c * 60;
        const y = 30 + r * 56;
        ctx.fillStyle = "#6b4226";
        ctx.beginPath();
        ctx.arc(x + 24, y + 24, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#3a2a18";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x + 24, y + 24, 16, 0, Math.PI * 2);
        ctx.stroke();
        px(ctx, x + 20, y + 20, 8, 8, "#8a5fae"); // purple rim light glint
      }
    }
    px(ctx, 0, 196, W, 6, "#3a3444"); // catwalk
    for (let x = 0; x < W; x += 30) px(ctx, x, 202, 2, 12, "#3a3444");
    // The bird.
    px(ctx, 400, 182, 14, 12, "#1a1a1a");
    px(ctx, 411, 176, 8, 8, "#1a1a1a");
    px(ctx, 416, 178, 2, 2, "#ff5555"); // red eye
    barCounter(ctx, "#1a1422", "#3a3444");
  },

  // Chalkboard chaos, chili garlands, a well-placed extinguisher.
  twistyspruce: (ctx) => {
    wallAndFloor(ctx, "#2e2a28", "#241f1c");
    px(ctx, 40, 20, 400, 130, "#1f2422"); // chalkboard
    px(ctx, 36, 16, 408, 4, "#6b4226");
    px(ctx, 36, 150, 408, 4, "#6b4226");
    ctx.fillStyle = "#e8e4d8";
    ctx.font = "13px monospace";
    ctx.fillText("TODAY: ???", 60, 48);
    ctx.fillText("WHAT?!", 300, 60);
    ctx.fillText("no refunds", 190, 92);
    ctx.fillText("->", 260, 92);
    ctx.fillText("5000 SCOVILLE", 90, 128);
    // Chalk ghost pepper doodle.
    ctx.strokeStyle = "#e8e4d8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(350, 110, 16, 0.3, Math.PI * 1.4);
    ctx.stroke();
    // Chili garlands.
    for (let x = 0; x < W; x += 20) {
      const yy = 8 + Math.sin((x / W) * Math.PI * 2) * 5;
      px(ctx, x, Math.round(yy), 12, 2, "#3a5a2a");
      px(ctx, x + 4, Math.round(yy) + 2, 5, 10, "#c23b2a");
    }
    // Fire extinguisher, just in case.
    px(ctx, 440, 160, 18, 34, "#c23b2a");
    px(ctx, 446, 152, 6, 8, "#9aa0a8");
    barCounter(ctx, "#241f1c", "#3a2a20");
  },

  // Cabin in the woods: beetle-kill pine, tree-slice tables, campfire.
  mildwoods: (ctx) => {
    wallAndFloor(ctx, "#c9a86a", "#6b5436");
    planks(ctx, 0, 190, "#c9a86a", "#9a7a4a");
    // Beetle-kill blue streaks.
    for (let i = 0; i < 30; i++) {
      const x = (i * 61) % W;
      const y = (i * 43) % 180;
      px(ctx, x, y, 20 + (i % 3) * 14, 2, "#7a90a8");
    }
    // Mounted antlers.
    px(ctx, 210, 30, 60, 24, "#523018");
    ctx.strokeStyle = "#e8e0d0";
    ctx.lineWidth = 3;
    for (const dir of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(240 + dir * 6, 40);
      ctx.quadraticCurveTo(240 + dir * 26, 20, 240 + dir * 34, 4);
      ctx.stroke();
    }
    // Tree-slice tables.
    for (const x of [90, 370]) {
      ctx.fillStyle = "#9a7a4a";
      ctx.beginPath();
      ctx.arc(x, 214, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#6b5436";
      for (const r of [22, 14, 7]) {
        ctx.beginPath();
        ctx.arc(x, 214, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    // The campfire (indoors, legally).
    px(ctx, 216, 216, 48, 8, "#523018");
    px(ctx, 224, 208, 32, 8, "#3a2a18");
    for (const [fx, fy, fw, fh, c] of [
      [230, 186, 20, 22, "#e8a83c"], [235, 176, 10, 16, "#e8e05a"],
      [238, 168, 4, 10, "#f7f0dc"],
    ] as const) {
      px(ctx, fx, fy, fw, fh, c);
    }
    ctx.fillStyle = "rgba(232,168,60,0.15)";
    ctx.beginPath();
    ctx.arc(240, 200, 70, 0, Math.PI * 2);
    ctx.fill();
  },

  // Gone but still pouring: dust sheets, one lit tap, a halo.
  fete: (ctx) => {
    wallAndFloor(ctx, "#3a3a42", "#2e2e34");
    // Furniture under dust sheets.
    for (const [x, w, h] of [[50, 90, 60], [180, 70, 46], [350, 100, 70]] as const) {
      ctx.fillStyle = "#c8c8cc";
      ctx.beginPath();
      ctx.moveTo(x, 220);
      ctx.quadraticCurveTo(x + w / 2, 220 - h - 20, x + w, 220);
      ctx.closePath();
      ctx.fill();
      px(ctx, x + 8, 200, w - 16, 3, "#a8a8ae"); // fold shadow
    }
    // The one lit tap handle.
    px(ctx, 236, 96, 8, 26, "#d9a516");
    px(ctx, 233, 90, 14, 8, "#f2ead8");
    ctx.fillStyle = "rgba(247,217,140,0.18)";
    ctx.beginPath();
    ctx.arc(240, 104, 44, 0, Math.PI * 2);
    ctx.fill();
    // Halo.
    ctx.strokeStyle = "#f7d98c";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(240, 74, 20, 6, 0, 0, Math.PI * 2);
    ctx.stroke();
    // Dust motes.
    for (let i = 0; i < 14; i++) {
      px(ctx, (i * 97) % W, (i * 53) % 180, 1, 1, "#8a8a96");
    }
  },
};

export function makeBreweryBackdrops(scene: Phaser.Scene): void {
  for (const route of ROUTES) {
    for (const b of route.breweries) {
      const key = `bg_${b.id}`;
      if (scene.textures.exists(key)) continue;
      const drawer = DRAWERS[b.id];
      if (!drawer) continue;
      const canvas = scene.textures.createCanvas(key, W, H)!;
      drawer(canvas.getContext());
      canvas.refresh();
    }
  }
}
