import Phaser from "phaser";

// Programmatic pixel-art pipeline (beercycle-5rl): sprites are defined as
// character grids and rendered to textures at boot. This keeps the whole
// art set in code for now; any sprite can later be replaced by an
// Aseprite-exported PNG under the same texture key without touching game
// code.

type Palette = Record<string, string>;

const PAL: Palette = {
  K: "#1a1a1a", // tire / outline black
  G: "#9aa0a8", // metal gray
  J: "#f7b32b", // jersey / gold
  H: "#f7f7e8", // white
  S: "#d9a066", // skin
  D: "#14532d", // dark green
  R: "#8a2b2b", // red
  T: "#5ab9d9", // teal / water
  N: "#27408b", // police navy
  B: "#6b4226", // brown
  Y: "#e8c56a", // taco shell
  P: "#c77dff", // kombucha purple
  O: "#ff7f2a", // cone orange
  E: "#2b2b2b", // near-black
  L: "#7ea44e", // leaf light
  M: "#4f7a36", // leaf dark
  C: "#cddc39", // dwnwrd chartreuse
  A: "#7d9bc4", // hoskins plaid blue
  F: "#c9a86a", // hoskins sandy hair
  U: "#49b8d8", // jillbake blue hair
  I: "#e8517e", // jillbake pink hoodie
  V: "#cfcbd8", // plkstr lavender-gray tee
  W: "#8a6f52", // aafran ash-brown bob
};

const SPRITES: Record<string, string[]> = {
  bike_a: [
    "....KKK....",
    "....KKK....",
    "....KKK....",
    "...GGGGG...",
    "..S.GGG.S..",
    "..SJJJJJS..",
    "...JHHHJ...",
    "...JHHHJ...",
    "...JJJJJ...",
    "...JJJJJ...",
    "..DJJJJJ...",
    "...DDDDDD..",
    "....DDD....",
    "....KKK....",
    "....KKK....",
    "....KKK....",
    "....KKK....",
  ],
  bike_b: [
    "....KKK....",
    "....KKK....",
    "....KKK....",
    "...GGGGG...",
    "..S.GGG.S..",
    "..SJJJJJS..",
    "...JHHHJ...",
    "...JHHHJ...",
    "...JJJJJ...",
    "...JJJJJ...",
    "...JJJJJD..",
    "..DDDDDD...",
    "....DDD....",
    "....KKK....",
    "....KKK....",
    "....KKK....",
    "....KKK....",
  ],
  ped_a: [
    "..EEEE..",
    "..EEEE..",
    "..SSSS..",
    "..SSSS..",
    ".TTTTTT.",
    ".T.TT.T.",
    "..TTTT..",
    "..TTTT..",
    "..EEEE..",
    "..E..E..",
    "..E..E..",
    "..S..S..",
  ],
  ped_b: [
    "..BBBB..",
    "..BBBB..",
    "..SSSS..",
    "..SSSS..",
    ".RRRRRR.",
    ".R.RR.R.",
    "..RRRR..",
    "..RRRR..",
    "..KKKK..",
    "..K..K..",
    "..K..K..",
    "..S..S..",
  ],
  dog: [
    "..........BB.",
    ".........BBB.",
    ".B......BBBB.",
    ".BBBBBBBBBB..",
    ".BBBBBBBBBB..",
    "..B..B..B.B..",
    "..B..B..B.B..",
  ],
  goose: [
    "....EE..",
    "...EE...",
    "...EE...",
    "...EEO..",
    "...EE...",
    ".HHHE...",
    "HHHHHH..",
    "HHHHHH..",
    ".HHHH...",
    "..H.H...",
    "..O.O...",
  ],
  cop: [
    ".NNNNNNNN.",
    "NNNNNNNNNN",
    "...SSSS...",
    "...SSSS...",
    "..NNNNNN..",
    "..NNNNNN..",
    "..NJNNNN..",
    "..NNNNNN..",
    "..NNNNNN..",
    "...NNNN...",
    "...NNNN...",
    "...E..E...",
    "...E..E...",
  ],
  cone: [
    "...OO...",
    "...OO...",
    "..OOOO..",
    "..HHHH..",
    "..OOOO..",
    ".OOOOOO.",
    ".OOOOOO.",
    "OOOOOOOO",
  ],
  car_door: [
    ".GGGGG",
    "GGTTTG",
    "GGTTTG",
    "GGGGGG",
    "GGGGGG",
    "GG.GGG",
    "GGGGGG",
    "GGGGGG",
    "GGGGGG",
    "GGGGGG",
    "GGGGGG",
    ".GGGG.",
  ],
  water: [
    "..EE..",
    "..EE..",
    ".THHT.",
    ".TTTT.",
    ".TTTT.",
    ".THTT.",
    ".TTTT.",
    ".TTTT.",
    ".TTTT.",
  ],
  taco: [
    "..LLRLL...",
    ".YLRLLRY..",
    ".YYLLRYY..",
    ".YYYYYYY..",
    "..YYYYY...",
    "...YYY....",
  ],
  tube: [
    "..EEEEEE..",
    ".EEEEEEEE.",
    "EEE....EEE",
    "EE......EE",
    "EE......EE",
    "EE......EE",
    "EE......EE",
    "EEE....EEE",
    ".EEEEEEEE.",
    "..EEEEEE..",
  ],
  token: [
    "....J....",
    "...JJJ...",
    "..JJJJJ..",
    ".JJJHJJJ.",
    "JJJHJHJJJ",
    ".JJJHJJJ.",
    "..JJJJJ..",
    "...JJJ...",
    "....J....",
  ],
  booch: [
    "..EE..",
    "..EE..",
    ".PPPP.",
    ".PHPP.",
    ".PPPP.",
    ".PPPP.",
    ".PPPP.",
    ".PPPP.",
    ".PPPP.",
  ],
  tree: [
    ".....LLLL.....",
    "...LLLLLLLL...",
    "..LLLLLLLLLL..",
    ".LLLLMMLLLLL..",
    ".LLLMMMMLLLLL.",
    ".LLMMMMMMLLLL.",
    "..LMMMMMMMLL..",
    "..MMMMMMMMM...",
    "...MMMMMMM....",
    "....MMMMM.....",
    "......BB......",
    "......BB......",
    "......BB......",
    ".....BBBB.....",
  ],
  bush: [
    "..LLLLLL...",
    ".LLLLLLLL..",
    "LLLMMLLLLL.",
    "LLMMMMLLLL.",
    ".MMMMMMMM..",
    "..MMMMMM...",
  ],
  // Boulder Canyon set dressing (beercycle-a70).
  creek: [
    "TTTTTTTTTTTTTTTT",
    "TTHTTTTTTHHTTTTT",
    "TTTTTHTTTTTTTHTT",
    "THTTTTTTTHTTTTTT",
    "TTTTTTTTTTTTTTTT",
  ],
  crag: [
    "......GG..........",
    ".....GGGG....GG...",
    "....GGGGGG..GGGG..",
    "...GGGEGGGGGGGGG..",
    "..GGGGGGEGGGGEGG..",
    ".GGGEGGGGGGGGGGG..",
    ".GGGGGGGEGGGGGGGG.",
    "GGGGGGGGGGGGEGGGG.",
    "GGGGEGGGGGGGGGGGGG",
    "GGGGGGGGGGGGGGGGGG",
  ],
  // Dispensary counter goods (beercycle-4uh).
  gummy: [
    ".LL.LL.",
    "LLLLLLL",
    "LLLLLLL",
    ".LLLLL.",
    ".LL.LL.",
  ],
  brownie: [
    "BBBBBBB",
    "BEBBEBB",
    "BBBBBBB",
    "BBEBBEB",
    "BBBBBBB",
  ],
  taffy: [
    "P..PPP..P",
    "PPPPPPPPP",
    "P.PHPHP.P",
    "PPPPPPPPP",
    "P..PPP..P",
  ],
  flowers: [
    ".R...J.",
    "RRR.JJJ",
    ".M...M.",
    "..P.M..",
    ".PPP...",
    "..M....",
  ],
};

function makeSpriteTexture(scene: Phaser.Scene, key: string, rows: string[]): void {
  if (scene.textures.exists(key)) return;
  const w = rows[0].length;
  const h = rows.length;
  const canvas = scene.textures.createCanvas(key, w, h)!;
  const ctx = canvas.getContext();
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const c = rows[y][x];
      if (c === "." || c === undefined) continue;
      ctx.fillStyle = PAL[c] ?? "#ff00ff";
      ctx.fillRect(x, y, 1, 1);
    }
  }
  canvas.refresh();
}

function makeSky(scene: Phaser.Scene): void {
  if (scene.textures.exists("sky")) return;
  const w = 480;
  const h = 64;
  const canvas = scene.textures.createCanvas("sky", w, h)!;
  const ctx = canvas.getContext();
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "#9fd0e8");
  grad.addColorStop(1, "#e6f2ec");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  // 300 days of sunshine.
  ctx.fillStyle = "#fff3c4";
  ctx.beginPath();
  ctx.arc(404, 14, 9, 0, Math.PI * 2);
  ctx.fill();
  canvas.refresh();
}

function makeFlatirons(scene: Phaser.Scene): void {
  if (scene.textures.exists("flatirons")) return;
  const w = 320;
  const h = 74;
  const canvas = scene.textures.createCanvas("flatirons", w, h)!;
  const ctx = canvas.getContext();
  // Far ridge.
  ctx.fillStyle = "#93a4b5";
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(40, 26);
  ctx.lineTo(150, h);
  ctx.lineTo(200, 34);
  ctx.lineTo(320, h);
  ctx.closePath();
  ctx.fill();
  // The five slabs, leaning like the real ones.
  const slabs: Array<[number, number, string]> = [
    [10, 18, "#7d8fa3"],
    [70, 10, "#6a7d92"],
    [130, 14, "#7d8fa3"],
    [190, 8, "#6a7d92"],
    [250, 16, "#7d8fa3"],
  ];
  for (const [x, top, color] of slabs) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, h);
    ctx.lineTo(x + 34, top);
    ctx.lineTo(x + 62, h);
    ctx.closePath();
    ctx.fill();
  }
  // Pine treeline at the base.
  ctx.fillStyle = "#3f5c2e";
  ctx.fillRect(0, h - 8, w, 8);
  for (let x = 4; x < w; x += 14) {
    ctx.beginPath();
    ctx.moveTo(x, h - 6);
    ctx.lineTo(x + 5, h - 14);
    ctx.lineTo(x + 10, h - 6);
    ctx.closePath();
    ctx.fill();
  }
  canvas.refresh();
}

function makeCloud(scene: Phaser.Scene): void {
  if (scene.textures.exists("cloud")) return;
  const canvas = scene.textures.createCanvas("cloud", 32, 12)!;
  const ctx = canvas.getContext();
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.beginPath();
  ctx.ellipse(10, 7, 9, 4, 0, 0, Math.PI * 2);
  ctx.ellipse(20, 5, 10, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  canvas.refresh();
}

function makeBrewery(scene: Phaser.Scene): void {
  if (scene.textures.exists("brewery")) return;
  const w = 46;
  const h = 34;
  const canvas = scene.textures.createCanvas("brewery", w, h)!;
  const ctx = canvas.getContext();
  // Sign board up top (name text is overlaid by the scene).
  ctx.fillStyle = "#2b1a10";
  ctx.fillRect(1, 0, w - 2, 9);
  // Facade.
  ctx.fillStyle = "#b98a5e";
  ctx.fillRect(0, 9, w, h - 9);
  // Awning stripes.
  for (let x = 0; x < w; x += 8) {
    ctx.fillStyle = x % 16 === 0 ? "#8a2b2b" : "#f7f7e8";
    ctx.fillRect(x, 10, 8, 5);
  }
  // Warm windows.
  ctx.fillStyle = "#f7d98c";
  ctx.fillRect(5, 19, 9, 8);
  ctx.fillRect(32, 19, 9, 8);
  ctx.strokeStyle = "#2b1a10";
  ctx.lineWidth = 1;
  ctx.strokeRect(4.5, 18.5, 10, 9);
  ctx.strokeRect(31.5, 18.5, 10, 9);
  // Door.
  ctx.fillStyle = "#2b1a10";
  ctx.fillRect(19, 21, 8, 13);
  canvas.refresh();
}

// --- Beer glassware and brewery glyphs (beercycle-bmi) -----------------
// One texture per beer (glass shape filled with its color + foam head),
// plus tiny white logo glyphs tinted with the brewery accent at runtime.

import { ROUTES } from "../systems/routes";
import type { BeerDef } from "../systems/beers";
import { makeBreweryBackdrops } from "./breweryBackdrops";

function drawGlass(ctx: CanvasRenderingContext2D, beer: BeerDef): void {
  const p = (x: number, y: number, w: number, h: number, c: string) => {
    ctx.fillStyle = c;
    ctx.fillRect(x, y, w, h);
  };
  const GLASS = "#c8d4dc";
  switch (beer.shape) {
    case "pint": // shaker: slight taper
      p(3, 2, 9, 1, GLASS);
      p(3, 2, 1, 15, GLASS);
      p(11, 2, 1, 15, GLASS);
      p(3, 16, 9, 1, GLASS);
      p(4, 3, 7, 2, beer.head);
      p(4, 5, 7, 11, beer.color);
      break;
    case "nonic": // straight with a bulge hint
      p(3, 1, 9, 1, GLASS);
      p(3, 1, 1, 16, GLASS);
      p(11, 1, 1, 16, GLASS);
      p(2, 5, 1, 3, GLASS); // bulge
      p(12, 5, 1, 3, GLASS);
      p(3, 16, 9, 1, GLASS);
      p(4, 2, 7, 2, beer.head);
      p(4, 4, 7, 12, beer.color);
      break;
    case "tulip":
      p(2, 2, 11, 1, GLASS);
      p(2, 2, 1, 7, GLASS);
      p(12, 2, 1, 7, GLASS);
      p(3, 9, 9, 1, GLASS);
      p(3, 3, 9, 2, beer.head);
      p(3, 5, 9, 4, beer.color);
      p(7, 10, 1, 4, GLASS); // stem
      p(4, 15, 7, 1, GLASS); // foot
      break;
    case "snifter":
      p(2, 4, 11, 1, GLASS);
      p(1, 5, 1, 5, GLASS);
      p(13, 5, 1, 5, GLASS);
      p(2, 10, 11, 1, GLASS);
      p(3, 5, 9, 1, beer.head);
      p(2, 6, 11, 4, beer.color);
      p(7, 11, 1, 3, GLASS);
      p(4, 15, 7, 1, GLASS);
      break;
    case "can":
      p(4, 1, 7, 1, "#9aa0a8");
      p(6, 0, 2, 1, "#6a7078"); // tab
      p(3, 2, 9, 13, "#c8ccd4");
      p(3, 6, 9, 6, beer.color); // label band
      p(4, 15, 7, 1, "#9aa0a8");
      break;
  }
}

const GLYPHS: Record<string, string[]> = {
  moon: ["..###...", ".##.....", "##......", "##......", "##......", ".##.....", "..###...", "........"],
  diamond: ["...#....", "..###...", ".#####..", "#######.", ".#####..", "..###...", "...#....", "........"],
  sun: ["#..#..#.", "..###...", ".#####..", "#.###.#.", ".#####..", "..###...", "#..#..#.", "........"],
  mountain: ["........", "...#....", "..###...", ".##.##..", "..####..", ".######.", "########", "........"],
  flower: ["..#.#...", ".#####..", "..###...", ".#####..", "..#.#...", "...#....", "...#....", "........"],
  bird: ["........", "#.......", "##..##..", ".######.", "..####..", "...##...", "..#.....", "........"],
  pine: ["...#....", "..###...", ".#####..", "..###...", ".#####..", "#######.", "...#....", "...#...."],
  fire: ["...#....", "..##....", "..###...", ".####...", ".#####..", "######..", ".####...", "........"],
  halo: [".######.", "#......#", ".######.", "........", "...##...", "..####..", "..####..", "........"],
};

// Dispensary storefront (beercycle-4uh): calmer than a brewery — sage
// awning, a green cross where the windows would shout.
function makeDispensaryFront(scene: Phaser.Scene): void {
  if (scene.textures.exists("dispensary")) return;
  const w = 46;
  const h = 34;
  const canvas = scene.textures.createCanvas("dispensary", w, h)!;
  const ctx = canvas.getContext();
  // Sign board up top (name text overlaid by the scene).
  ctx.fillStyle = "#1c2418";
  ctx.fillRect(1, 0, w - 2, 9);
  // Facade.
  ctx.fillStyle = "#8f9a7e";
  ctx.fillRect(0, 9, w, h - 9);
  // Awning, one calm color.
  ctx.fillStyle = "#4e6a3e";
  ctx.fillRect(0, 10, w, 5);
  // Green cross in the window.
  ctx.fillStyle = "#f2f2e4";
  ctx.fillRect(5, 19, 11, 10);
  ctx.fillStyle = "#5a9a4a";
  ctx.fillRect(9, 20, 3, 8);
  ctx.fillRect(6, 22, 9, 3);
  // Second window, warm and low-key.
  ctx.fillStyle = "#e4d9a8";
  ctx.fillRect(30, 19, 11, 10);
  // Door.
  ctx.fillStyle = "#1c2418";
  ctx.fillRect(19, 21, 8, 13);
  canvas.refresh();
}

// Highway-green roadside sign announcing the next stretch of Boulder
// (beercycle-e2x). The label text is overlaid by the scene, like the
// brewery signboards.
function makeRoadSign(scene: Phaser.Scene): void {
  if (scene.textures.exists("roadsign")) return;
  const w = 46;
  const h = 32;
  const canvas = scene.textures.createCanvas("roadsign", w, h)!;
  const ctx = canvas.getContext();
  ctx.fillStyle = "#8a8a8a"; // posts
  ctx.fillRect(8, 20, 3, 12);
  ctx.fillRect(35, 20, 3, 12);
  ctx.fillStyle = "#14532d"; // the board
  ctx.fillRect(1, 1, 44, 20);
  ctx.strokeStyle = "#f7f7e8";
  ctx.lineWidth = 1;
  ctx.strokeRect(2.5, 2.5, 41, 17);
  canvas.refresh();
}

function makeDartboard(scene: Phaser.Scene): void {
  if (scene.textures.exists("dartboard")) return;
  const canvas = scene.textures.createCanvas("dartboard", 76, 76)!;
  const ctx = canvas.getContext();
  const ring = (r: number, color: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(38, 38, r, 0, Math.PI * 2);
    ctx.fill();
  };
  ring(36, "#1a1a1a");
  ring(34, "#f2ead8");
  ring(24, "#4f7a36");
  ring(14, "#d9a516");
  ring(6, "#c23b2a");
  canvas.refresh();
}

function makeBeerAndGlyphTextures(scene: Phaser.Scene): void {
  for (const route of ROUTES) {
    for (const b of route.breweries) {
      for (const beer of b.taps) {
        const key = `glass_${beer.id}`;
        if (scene.textures.exists(key)) continue;
        const canvas = scene.textures.createCanvas(key, 15, 18)!;
        drawGlass(canvas.getContext(), beer);
        canvas.refresh();
      }
    }
  }
  for (const [name, rows] of Object.entries(GLYPHS)) {
    const key = `glyph_${name}`;
    if (scene.textures.exists(key)) continue;
    const canvas = scene.textures.createCanvas(key, 8, 8)!;
    const ctx = canvas.getContext();
    ctx.fillStyle = "#ffffff";
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        if (row[x] === "#") ctx.fillRect(x, y, 1, 1);
      }
    });
    canvas.refresh();
  }
}

// --- Player avatars: the three jokers (beercycle-uju) ------------------
// Real-friend likenesses; canonical visual reference lives in the beads
// epic. Portraits are 24x24, drawn in code per expression state so the
// HUD can react Doom-status-face style.

export type AvatarId = "dwnwrd" | "hoskins" | "drellis" | "jillbake" | "plkstr" | "aafran";

export type AvatarState =
  | "sober" | "tipsy" | "hammered" | "wince" | "sweat" | "chug" | "dead" | "smug";

export const AVATAR_STATES: AvatarState[] = [
  "sober", "tipsy", "hammered", "wince", "sweat", "chug", "dead", "smug",
];

export interface AvatarDef {
  id: AvatarId;
  name: string;
  trait: string;
  initials: string;
}

export const AVATARS: AvatarDef[] = [
  { id: "dwnwrd", name: "DWNWRD", trait: "hacker * vegan * all stoke", initials: "DWN" },
  { id: "hoskins", name: "HOSKINS", trait: "prankster * helmet optional", initials: "HOS" },
  { id: "drellis", name: "DRELLIS", trait: "professorial * beer snob", initials: "DRE" },
  { id: "jillbake", name: "JILLBAKE", trait: "berkeley feminist * one student at a time", initials: "JIL" },
  { id: "plkstr", name: "PLKSTR", trait: "smooth jazz clarinet * extremely chill", initials: "PLK" },
  { id: "aafran", name: "AAFRAN", trait: "ivory tower * takes no shit", initials: "AAF" },
];

const SKIN = "#d9a066";
const INK_DARK = "#3a2b28";
const HAIR_BLUE = "#49b8d8";
const HAIR_BLUE_DK = "#2e7ea3";
const HAIR_BROWN = "#7a573a";
const HAIR_BROWN_DK = "#5a3f2a";
const HAIR_ASH = "#8a6f52";
const HAIR_ASH_DK = "#6a5540";

function drawPortrait(
  ctx: CanvasRenderingContext2D,
  id: AvatarId,
  state: AvatarState,
): void {
  const p = (x: number, y: number, w: number, h: number, c: string) => {
    ctx.fillStyle = c;
    ctx.fillRect(x, y, w, h);
  };
  const wide = id === "hoskins"; // rotund: wider face, fuller cheeks
  const fx = wide ? 5 : 6;
  const fw = wide ? 14 : 12;
  const drunkish = state === "hammered" || state === "chug";
  const flushed = state === "tipsy" || state === "sweat" || drunkish;

  // Face.
  p(fx, 7, fw, 11, SKIN);
  p(fx + 1, 18, fw - 2, wide ? 3 : 2, SKIN); // chin
  if (flushed) {
    const cheek = drunkish ? "#d97f6f" : "#e59a86";
    p(fx, 13, 3, 2, cheek);
    p(fx + fw - 3, 13, 3, 2, cheek);
    if (drunkish) p(11, 12, 2, 2, "#d97f6f"); // nose glow
  }

  // Headgear.
  if (id === "hoskins") {
    // Thinning sandy hair, gloriously helmet-free.
    p(4, 3, 16, 4, "#c9a86a");
    p(10, 3, 4, 2, SKIN); // the scalp gap
    p(3, 5, 1, 2, "#c9a86a");
    p(20, 5, 1, 2, "#c9a86a");
  } else if (id === "jillbake") {
    // Long blue hair, middle part, falling past the shoulders.
    p(5, 1, 14, 1, HAIR_BLUE);
    p(4, 2, 16, 5, HAIR_BLUE);
    p(11, 2, 2, 2, HAIR_BLUE_DK); // the part
    p(3, 4, 3, 17, HAIR_BLUE); // left fall
    p(18, 4, 3, 17, HAIR_BLUE); // right fall
    p(3, 6, 1, 15, HAIR_BLUE_DK);
    p(20, 6, 1, 15, HAIR_BLUE_DK);
    p(6, 7, 1, 1, HAIR_BLUE); // stray bangs
    p(17, 7, 1, 1, HAIR_BLUE);
  } else if (id === "plkstr") {
    // Brown hair, half pulled back, falling to the shoulders.
    p(5, 1, 14, 1, HAIR_BROWN);
    p(4, 2, 16, 5, HAIR_BROWN);
    p(8, 2, 8, 1, HAIR_BROWN_DK); // swept-back top
    p(3, 4, 3, 14, HAIR_BROWN); // left fall
    p(18, 4, 3, 14, HAIR_BROWN); // right fall
    p(3, 6, 1, 12, HAIR_BROWN_DK);
    p(20, 6, 1, 12, HAIR_BROWN_DK);
  } else if (id === "aafran") {
    // Sleek ash-brown bob, chin length, swept across the part.
    p(5, 1, 14, 1, HAIR_ASH);
    p(4, 2, 16, 5, HAIR_ASH);
    p(14, 2, 2, 1, HAIR_ASH_DK); // the part, off-center
    p(3, 4, 3, 12, HAIR_ASH); // left fall, jaw length
    p(18, 4, 3, 12, HAIR_ASH); // right fall
    p(3, 6, 1, 10, HAIR_ASH_DK);
    p(20, 6, 1, 10, HAIR_ASH_DK);
    p(14, 7, 3, 1, HAIR_ASH); // swept bangs
  } else {
    p(fx - 1, 1, fw + 2, 6, "#e8e8e8");
    for (let i = 0; i < 3; i++) p(fx + 2 + i * 4, 2, 1, 3, "#b9c0c8"); // vents
    if (id === "drellis") p(fx - 1, 6, 1, 6, "#7a8a4f"); // olive strap
  }

  // Eyewear (y 9-11). Hammered knocks it askew; dead gets X-eyes.
  const askew = state === "hammered" ? 1 : 0;
  if (id === "dwnwrd") {
    p(5, 9, 14, 1, "#f0f0f0");
    p(6, 9, 5, 3, "#3fd0c9");
    p(13, 9 + askew, 5, 3, "#3fd0c9");
    p(7, 9, 1, 1, "#c8fff8"); // glint
  } else if (id === "drellis") {
    p(6, 9, 5, 3, "#232323");
    p(13, 9 + askew, 5, 3, "#232323");
    p(11, 9, 2, 1, "#888888");
  } else if (id === "jillbake") {
    // Red frames, sky-mirrored lenses, nose studs both sides.
    const frame = "#c23a4a";
    p(5, 8, 14, 1, frame);
    p(5, 9, 1, 3, frame);
    p(18, 9 + askew, 1, 3, frame);
    p(11, 9, 2, 1, frame); // bridge
    p(6, 9, 5, 3, "#8fd4f0");
    p(13, 9 + askew, 5, 3, "#8fd4f0");
    p(7, 9, 1, 1, "#e8f8ff"); // sky glint
    p(14, 9 + askew, 1, 1, "#e8f8ff");
    p(8, 11, 2, 1, "#5a8a4a"); // treeline in the mirror
    p(15, 11 + askew, 2, 1, "#5a8a4a");
    p(10, 13, 1, 1, "#ffe14d"); // nose studs
    p(13, 13, 1, 1, "#ffe14d");
  } else if (id === "plkstr") {
    // No eyewear at all — brows and easy, unhurried eyes.
    p(7, 8, 3, 1, HAIR_BROWN_DK);
    p(14, 8, 3, 1, HAIR_BROWN_DK);
    const eye = (lx: number) => {
      if (state === "dead") {
        p(lx + 1, 9, 1, 1, INK_DARK); p(lx + 3, 11, 1, 1, INK_DARK);
        p(lx + 3, 9, 1, 1, INK_DARK); p(lx + 1, 11, 1, 1, INK_DARK);
        p(lx + 2, 10, 1, 1, INK_DARK);
      } else if (state === "hammered" || state === "chug") {
        p(lx + 1, 9, 1, 1, "#ffffff"); p(lx + 3, 10, 1, 1, INK_DARK);
        p(lx + 2, 11, 1, 1, "#ffffff");
      } else if (state === "tipsy" || state === "sweat" || state === "wince") {
        p(lx + 1, 10, 3, 1, INK_DARK);
      } else {
        p(lx + 1, 10, 3, 1, "#ffffff");
        p(lx + 2, 10, 1, 1, INK_DARK);
      }
    };
    eye(6);
    eye(13);
  } else if (id === "aafran") {
    // One brow raised, permanently. Level, unimpressed eyes.
    p(7, 7, 3, 1, HAIR_ASH_DK); // raised left brow
    p(14, 8, 3, 1, HAIR_ASH_DK);
    const eye = (lx: number) => {
      if (state === "dead") {
        p(lx + 1, 9, 1, 1, INK_DARK); p(lx + 3, 11, 1, 1, INK_DARK);
        p(lx + 3, 9, 1, 1, INK_DARK); p(lx + 1, 11, 1, 1, INK_DARK);
        p(lx + 2, 10, 1, 1, INK_DARK);
      } else if (state === "hammered" || state === "chug") {
        p(lx + 1, 9, 1, 1, "#ffffff"); p(lx + 3, 10, 1, 1, INK_DARK);
        p(lx + 2, 11, 1, 1, "#ffffff");
      } else if (state === "tipsy" || state === "sweat" || state === "wince") {
        p(lx + 1, 10, 3, 1, INK_DARK);
      } else {
        p(lx + 1, 9, 3, 1, INK_DARK); // heavy lid
        p(lx + 1, 10, 3, 1, "#ffffff");
        p(lx + 2, 10, 1, 1, "#5a7a8a"); // gray-blue stare
      }
    };
    eye(6);
    eye(13);
    p(10, 13, 1, 1, "#ffe14d"); // gold nose stud, left side
  } else {
    // Wire rims with visible eyes.
    const rim = "#555555";
    for (const lx of [6, 13]) {
      p(lx, 9, 5, 1, rim);
      p(lx, 11, 5, 1, rim);
      p(lx, 9, 1, 3, rim);
      p(lx + 4, 9, 1, 3, rim);
    }
    p(11, 9, 2, 1, rim);
    const eye = (lx: number) => {
      if (state === "dead") {
        p(lx + 1, 9, 1, 1, INK_DARK); p(lx + 3, 11, 1, 1, INK_DARK);
        p(lx + 3, 9, 1, 1, INK_DARK); p(lx + 1, 11, 1, 1, INK_DARK);
        p(lx + 2, 10, 1, 1, INK_DARK);
      } else if (state === "hammered" || state === "chug") {
        p(lx + 1, 9, 1, 1, "#ffffff"); p(lx + 3, 10, 1, 1, INK_DARK);
        p(lx + 2, 11, 1, 1, "#ffffff"); // swirl-ish
      } else if (state === "tipsy" || state === "sweat" || state === "wince") {
        p(lx + 1, 10, 3, 1, INK_DARK); // half-lidded / squeezed
      } else {
        p(lx + 2, 10, 1, 1, INK_DARK);
      }
    };
    eye(6);
    eye(13);
  }
  if (state === "dead" && id !== "hoskins" && id !== "plkstr" && id !== "aafran") {
    // X-eyes scrawled over the shades.
    for (const lx of [6, 13]) {
      p(lx + 1, 9, 1, 1, "#ffffff"); p(lx + 3, 11, 1, 1, "#ffffff");
      p(lx + 3, 9, 1, 1, "#ffffff"); p(lx + 1, 11, 1, 1, "#ffffff");
      p(lx + 2, 10, 1, 1, "#ffffff");
    }
  }

  // Beard (jillbake, sensibly, has none).
  if (id === "dwnwrd") {
    p(6, 13, 12, 7, "#b8b8b0");
  } else if (id === "hoskins") {
    p(5, 13, 14, 8, "#8a7a5e");
  } else if (id === "drellis") {
    p(8, 14, 8, 2, "#8a8a86"); // mustache
    p(8, 17, 8, 4, "#8a8a86"); // goatee
  }

  // Mouth (over the beard).
  switch (state) {
    case "sober":
      if (id === "drellis") p(10, 17, 5, 1, INK_DARK); // wry line
      else if (id === "jillbake") {
        p(9, 17, 6, 1, INK_DARK); // closed smile, corners up
        p(8, 16, 1, 1, INK_DARK);
        p(15, 16, 1, 1, INK_DARK);
      } else if (id === "aafran") {
        p(9, 17, 6, 1, INK_DARK); // flat. unimpressed. next question.
      } else {
        p(9, 16, 6, 2, INK_DARK);
        p(9, 16, 6, 1, "#ffffff");
      }
      break;
    case "tipsy":
    case "sweat":
      p(8, 16, 8, 2, INK_DARK);
      p(8, 16, 8, 1, "#ffffff");
      break;
    case "hammered":
      p(9, 17, 2, 1, INK_DARK); p(11, 16, 2, 1, INK_DARK); p(13, 17, 2, 1, INK_DARK);
      break;
    case "wince":
      p(9, 16, 6, 2, "#ffffff");
      for (const gx of [10, 12, 14]) p(gx, 16, 1, 2, INK_DARK);
      break;
    case "chug":
      p(10, 15, 5, 4, INK_DARK);
      p(10, 15, 5, 1, "#ffffff");
      break;
    case "dead":
      p(11, 17, 3, 2, INK_DARK);
      break;
    case "smug":
      p(9, 17, 5, 1, INK_DARK);
      p(14, 16, 1, 1, INK_DARK);
      break;
  }

  // State garnish.
  if (state === "sweat") {
    p(20, 6, 1, 1, "#7fd4ff");
    p(20, 7, 2, 3, "#7fd4ff");
  }
  if (state === "wince") {
    for (const [sx, sy] of [[2, 6], [21, 8], [3, 15], [20, 16]] as const) {
      p(sx, sy, 1, 1, "#ffe14d");
    }
  }

  // Shirt.
  if (id === "dwnwrd") {
    p(3, 21, 18, 3, "#cddc39");
  } else if (id === "jillbake") {
    p(9, 20, 6, 1, SKIN); // neck
    p(3, 21, 18, 3, "#e8517e"); // pink hoodie
    p(9, 21, 6, 1, "#c23a63"); // hood collar
    p(10, 21, 1, 3, "#f7f7e8"); // drawstrings
    p(13, 21, 1, 3, "#f7f7e8");
    p(3, 21, 2, 3, HAIR_BLUE); // hair over the shoulders
    p(19, 21, 2, 3, HAIR_BLUE);
  } else if (id === "plkstr") {
    p(9, 20, 6, 1, SKIN); // neck
    p(2, 21, 20, 3, "#cfcbd8"); // oversized tee, extra slouch
    p(2, 21, 1, 3, "#b3aec2");
    p(21, 21, 1, 3, "#b3aec2");
    p(8, 21, 2, 1, "#c49a5e"); // crossbody strap
    p(9, 22, 2, 1, "#c49a5e");
    p(10, 23, 2, 1, "#c49a5e");
  } else if (id === "aafran") {
    p(9, 20, 6, 1, SKIN); // neck
    p(3, 21, 18, 1, SKIN); // bare shoulders
    p(3, 22, 18, 2, "#26262b"); // black tank
    p(6, 21, 1, 1, "#26262b"); // straps
    p(17, 21, 1, 1, "#26262b");
    p(4, 21, 2, 1, "#9aa0a8"); // gray bag strap
    p(3, 22, 2, 1, "#9aa0a8");
    p(19, 21, 1, 1, "#5a8a4a"); // star tattoo, right shoulder
    p(10, 21, 1, 1, "#e8c56a"); // thin gold necklace
    p(13, 21, 1, 1, "#e8c56a");
    p(11, 22, 2, 1, "#e8c56a");
  } else if (id === "hoskins") {
    for (let y = 21; y < 24; y++) {
      for (let x = 2; x < 22; x += 2) {
        p(x, y, 2, 1, (x / 2 + y) % 2 === 0 ? "#7d9bc4" : "#e8e8f0");
      }
    }
  } else {
    p(3, 21, 18, 3, "#9a9a9a");
    p(4, 21, 2, 3, "#5f5f5f");
    p(18, 21, 2, 3, "#5f5f5f");
  }
}

function makeAvatarTextures(scene: Phaser.Scene): void {
  for (const av of AVATARS) {
    for (const state of AVATAR_STATES) {
      const key = `av_${av.id}_${state}`;
      if (scene.textures.exists(key)) continue;
      const canvas = scene.textures.createCanvas(key, 24, 24)!;
      drawPortrait(canvas.getContext(), av.id, state);
      canvas.refresh();
    }
  }
}

// Per-avatar rider sprites, derived from the base bike pixel maps:
// dwnwrd rides in chartreuse, hoskins in plaid with bare sandy hair,
// drellis in gray with backpack straps, jillbake in pink with blue hair
// streaming behind.
function bikeVariantRows(base: string[], id: AvatarId): string[] {
  return base.map((row, y) =>
    row
      .split("")
      .map((ch, x) => {
        if (id === "dwnwrd") return ch === "J" ? "C" : ch;
        if (id === "hoskins") {
          if (ch === "H") return "F"; // helmet -> hair
          if (ch === "J") return (x + y) % 2 === 0 ? "A" : "H"; // plaid
          return ch;
        }
        if (id === "jillbake") {
          if (ch === "H") return "U"; // helmet -> blue hair
          if (ch === "J") return y >= 9 && (x === 3 || x === 7) ? "U" : "I"; // hoodie + trailing hair
          return ch;
        }
        if (id === "plkstr") {
          if (ch === "H") return "B"; // helmet -> brown hair
          if (ch === "J") return y >= 8 && x === y - 4 ? "Y" : "V"; // strap across the tee
          return ch;
        }
        if (id === "aafran") {
          if (ch === "H") return "W"; // helmet -> ash-brown bob
          if (ch === "J") return "E"; // black tank
          return ch;
        }
        // drellis
        if (ch === "J") return y === 8 && (x === 3 || x === 7) ? "E" : "G"; // straps
        return ch;
      })
      .join(""),
  );
}

function makeBikeVariants(scene: Phaser.Scene): void {
  for (const av of AVATARS) {
    for (const frame of ["a", "b"] as const) {
      makeSpriteTexture(scene, `bike_${av.id}_${frame}`, bikeVariantRows(SPRITES[`bike_${frame}`], av.id));
    }
  }
}

export function createGameTextures(scene: Phaser.Scene): void {
  for (const [key, rows] of Object.entries(SPRITES)) {
    makeSpriteTexture(scene, key, rows);
  }
  makeSky(scene);
  makeFlatirons(scene);
  makeCloud(scene);
  makeBrewery(scene);
  makeAvatarTextures(scene);
  makeBikeVariants(scene);
  makeBeerAndGlyphTextures(scene);
  makeDispensaryFront(scene);
  makeRoadSign(scene);
  makeDartboard(scene);
  makeBreweryBackdrops(scene);
}
