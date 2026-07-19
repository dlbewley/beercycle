import type { Brewery } from "./breweries";

// Route/level definitions (beercycle-lnp). Each run plays the routes in
// order, Paperboy-style, carrying score, lives, Buzz, and the brewery
// streak between them. Parody brewery roster: docs/GAME_DESIGN.md.

export interface RouteDef {
  id: string;
  name: string; // HUD label
  length: number;
  roadColor: number;
  grassColor: number;
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
    breweries: [
      { name: "MOUNTAIN MOON", d: 1200, side: "left" },
      { name: "BEST FLANDERS", d: 2700, side: "right" },
      { name: "BOLDER BEER CO.", d: 4200, side: "left" },
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
    // Game-day crowds: it's all pedestrians and loose dogs up here.
    breweries: [
      { name: "UPSLIP BREWING", d: 1400, side: "right" },
      { name: "SANITASTIC", d: 3000, side: "left" },
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
    // Industrial brewery density; watch the loading zones.
    breweries: [
      { name: "AVIARY BREWING", d: 1300, side: "left" },
      { name: "TWISTY SPRUCE", d: 2900, side: "right" },
      { name: "MILD WOODS", d: 4300, side: "left" },
      { name: "FETE BREWING", d: 5300, side: "right" },
    ],
    cones: 8,
    peds: 2,
    dogs: 1,
    geese: 3,
    doors: 4,
    cops: 3,
  },
];
