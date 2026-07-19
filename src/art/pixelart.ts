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

// --- Player avatars: the three jokers (beercycle-uju) ------------------
// Real-friend likenesses; canonical visual reference lives in the beads
// epic. Portraits are 24x24, drawn in code per expression state so the
// HUD can react Doom-status-face style.

export type AvatarId = "dwnwrd" | "hoskins" | "drellis";

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
];

const SKIN = "#d9a066";
const INK_DARK = "#3a2b28";

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
  if (state === "dead" && id !== "hoskins") {
    // X-eyes scrawled over the shades.
    for (const lx of [6, 13]) {
      p(lx + 1, 9, 1, 1, "#ffffff"); p(lx + 3, 11, 1, 1, "#ffffff");
      p(lx + 3, 9, 1, 1, "#ffffff"); p(lx + 1, 11, 1, 1, "#ffffff");
      p(lx + 2, 10, 1, 1, "#ffffff");
    }
  }

  // Beard.
  if (id === "dwnwrd") {
    p(6, 13, 12, 7, "#b8b8b0");
  } else if (id === "hoskins") {
    p(5, 13, 14, 8, "#8a7a5e");
  } else {
    p(8, 14, 8, 2, "#8a8a86"); // mustache
    p(8, 17, 8, 4, "#8a8a86"); // goatee
  }

  // Mouth (over the beard).
  switch (state) {
    case "sober":
      if (id === "drellis") p(10, 17, 5, 1, INK_DARK); // wry line
      else {
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
// drellis in gray with backpack straps.
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
}
