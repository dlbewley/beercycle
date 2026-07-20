import type { Brewery } from "./breweries";

// Route/level definitions (beercycle-lnp). Each run plays the routes in
// order, Paperboy-style, carrying score, lives, Buzz, and the brewery
// streak between them. Parody brewery roster: docs/GAME_DESIGN.md;
// brewery identities and tap lists: beads epic beercycle-bmi.

export interface RouteDef {
  id: string;
  name: string; // HUD label
  length: number;
  roadColor: number;
  grassColor: number;
  // Road geometry (beercycle-zgh): width in world units, plus a curving
  // centerline C(d) = curveAmp * sin(d * curveFreq) that the road follows.
  roadWidth: number;
  curveAmp: number;
  curveFreq: number;
  forecast: string; // hazard line shown on the transition preview
  breweries: Brewery[];
  cones: number;
  peds: number;
  dogs: number;
  geese: number;
  doors: number;
  cops: number;
}

export const ROUTES: RouteDef[] = [
  {
    id: "pearl",
    name: "PEARL ST",
    length: 5000,
    roadColor: 0x3b3b45,
    grassColor: 0x4a6741,
    roadWidth: 130,
    curveAmp: 14,
    curveFreq: 1 / 520,
    forecast: "expect: tourists, cones, the occasional goose",
    breweries: [
      {
        id: "mountainmoon",
        name: "MOUNTAIN MOON",
        d: 1200,
        side: "left",
        accent: 0xe07b39,
        glyph: "moon",
        tagline: "cash only. it's a vibe.",
        houseGame: "darts",
        taps: [
          { id: "kinda", name: "KINDA COLORADO ALE", style: "pale", abv: 5.2, color: "#d9942b", head: "#f7f0dc", shape: "pint" },
          { id: "lunarhaze", name: "LUNAR HAZE", style: "ipa", abv: 7.1, color: "#e8a83c", head: "#f7f0dc", shape: "pint" },
          { id: "fmpils", name: "FM PILS", style: "pilsner", abv: 4.8, color: "#f0d878", head: "#ffffff", shape: "pint" },
        ],
      },
      {
        id: "bestflanders",
        name: "BEST FLANDERS",
        d: 2700,
        side: "right",
        accent: 0xa03a4a,
        glyph: "diamond",
        tagline: "ah, belgium.",
        houseGame: "flight",
        taps: [
          { id: "oudbruin", name: "OUD BRUIN YOU IN", style: "sour", abv: 6.0, color: "#a83248", head: "#f2d8d8", shape: "tulip" },
          { id: "witte", name: "WITTE OR NOT", style: "wit", abv: 4.9, color: "#f0e4b0", head: "#ffffff", shape: "tulip" },
          { id: "quadgoals", name: "QUAD GOALS", style: "quad", abv: 10.2, color: "#7a3820", head: "#e8d0b8", shape: "snifter" },
        ],
      },
      {
        id: "bolder",
        name: "BOLDER BEER CO.",
        d: 4200,
        side: "left",
        accent: 0xd9a516,
        glyph: "sun",
        tagline: "bolder since 1979.",
        houseGame: "darts",
        taps: [
          { id: "buffgold", name: "BUFF GOLD", style: "lager", abv: 4.6, color: "#e8c84a", head: "#ffffff", shape: "pint" },
          { id: "pucksporter", name: "PUCK'S PORTER", style: "porter", abv: 5.9, color: "#3a2418", head: "#d9b98a", shape: "nonic" },
        ],
      },
    ],
    cones: 5,
    peds: 4,
    dogs: 2,
    geese: 2,
    doors: 2,
    cops: 2,
  },
  {
    id: "hill",
    name: "THE HILL",
    length: 4200,
    roadColor: 0x44404a,
    grassColor: 0x55703f,
    roadWidth: 108,
    curveAmp: 30,
    curveFreq: 1 / 300,
    forecast: "expect: game-day crowds, loose dogs, a narrow twisty road",
    // Game-day crowds: it's all pedestrians and loose dogs up here.
    breweries: [
      {
        id: "upslip",
        name: "UPSLIP BREWING",
        d: 1400,
        side: "right",
        accent: 0x3f9fb0,
        glyph: "mountain",
        tagline: "aluminum is a lifestyle.",
        taps: [
          { id: "craftlager", name: "CRAFT LAGER, OBVIOUSLY", style: "lager", abv: 4.8, color: "#e8d060", head: "#ffffff", shape: "can" },
          { id: "thinair", name: "THIN AIR IPA", style: "ipa", abv: 6.8, color: "#dd9a30", head: "#f7f0dc", shape: "can" },
        ],
      },
      {
        id: "sanitastic",
        name: "SANITASTIC",
        d: 3000,
        side: "left",
        accent: 0x6fae4e,
        glyph: "flower",
        tagline: "dog friendly. extremely.",
        houseGame: "flight",
        taps: [
          { id: "foothillsfunk", name: "FOOTHILLS FUNK", style: "sour", abv: 5.5, color: "#d465a0", head: "#f7e0ec", shape: "tulip" },
          { id: "trailhead", name: "TRAILHEAD SAISON", style: "saison", abv: 6.3, color: "#e0c060", head: "#f7f0dc", shape: "tulip" },
        ],
      },
    ],
    cones: 3,
    peds: 7,
    dogs: 3,
    geese: 1,
    doors: 2,
    cops: 2,
  },
  {
    id: "east",
    name: "EAST BOULDER",
    length: 6000,
    roadColor: 0x3a3f3a,
    grassColor: 0x6b6b4f,
    roadWidth: 150,
    curveAmp: 42,
    curveFreq: 1 / 700,
    forecast: "expect: loading zones, geese, one more cop than usual",
    // Industrial brewery density; watch the loading zones.
    breweries: [
      {
        id: "aviary",
        name: "AVIARY BREWING",
        d: 1300,
        side: "left",
        accent: 0x7a5fae,
        glyph: "bird",
        tagline: "barrels all the way down.",
        houseGame: "flight",
        taps: [
          { id: "ravens", name: "RAVEN'S RESERVE", style: "stout", abv: 13.5, color: "#191014", head: "#c9a86a", shape: "snifter" },
          { id: "scoundrel", name: "PALE SCOUNDREL", style: "wit", abv: 5.1, color: "#f0e4b0", head: "#ffffff", shape: "tulip" },
        ],
      },
      {
        id: "twistyspruce",
        name: "TWISTY SPRUCE",
        d: 2900,
        side: "right",
        accent: 0xc23b2a,
        glyph: "pine",
        tagline: "we put WHAT in it?",
        houseGame: "darts",
        taps: [
          { id: "ghostface", name: "GHOST FACE CHILLAH", style: "chili", abv: 5.0, color: "#c23b2a", head: "#f2d8c8", shape: "pint" },
          { id: "billyrabbit", name: "BILLY RABBIT BROWN", style: "brown", abv: 5.4, color: "#5a3a22", head: "#e0c8a8", shape: "pint" },
        ],
      },
      {
        id: "mildwoods",
        name: "MILD WOODS",
        d: 4300,
        side: "left",
        accent: 0x9a6a3a,
        glyph: "fire",
        tagline: "campfire indoors, legally.",
        taps: [
          { id: "smores", name: "S'MORES STOUT", style: "stout", abv: 6.5, color: "#241812", head: "#e8d0b0", shape: "nonic" },
          { id: "ponderosa", name: "PONDEROSA PALE", style: "pale", abv: 5.3, color: "#d9942b", head: "#f7f0dc", shape: "pint" },
        ],
      },
      {
        id: "fete",
        name: "FETE BREWING",
        d: 5300,
        side: "right",
        accent: 0x9a8fb8,
        glyph: "halo",
        tagline: "gone but still pouring.",
        taps: [
          { id: "beloved", name: "DEARLY BELOVED", style: "kolsch", abv: 4.9, color: "#f0dc78", head: "#ffffff", shape: "pint" },
          { id: "mortalcoil", name: "MORTAL COIL", style: "dipa", abv: 9.0, color: "#dd8a28", head: "#f7f0dc", shape: "snifter" },
        ],
      },
    ],
    cones: 8,
    peds: 2,
    dogs: 1,
    geese: 3,
    doors: 4,
    cops: 3,
  },
];
