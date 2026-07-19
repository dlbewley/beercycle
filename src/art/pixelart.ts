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

export function createGameTextures(scene: Phaser.Scene): void {
  for (const [key, rows] of Object.entries(SPRITES)) {
    makeSpriteTexture(scene, key, rows);
  }
  makeSky(scene);
  makeFlatirons(scene);
  makeCloud(scene);
  makeBrewery(scene);
}
