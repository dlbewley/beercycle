import type { BeerDef } from "./beers";

// Brewery stop shape shared by the route definitions (src/systems/routes.ts).
// d is route distance; side is which road edge the stop zone sits on.
// accent/glyph/tagline theme the chug panel; taps are the beer menu.

export type HouseGame = "darts" | "flight";

export interface Brewery {
  name: string;
  d: number;
  side: "left" | "right";
  accent: number;
  glyph: string; // glyph texture suffix, e.g. "moon" -> "glyph_moon"
  tagline: string;
  taps: BeerDef[];
  houseGame?: HouseGame; // optional venue mini-game, once per stop
}
