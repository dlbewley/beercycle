// Pearl Street route breweries (parody roster, docs/GAME_DESIGN.md).
// d is route distance; side is which road edge the stop zone sits on.

export interface Brewery {
  name: string;
  d: number;
  side: "left" | "right";
}

export const PEARL_ST_BREWERIES: Brewery[] = [
  { name: "MOUNTAIN MOON", d: 1200, side: "left" },
  { name: "BEST FLANDERS", d: 2700, side: "right" },
  { name: "BOLDER BEER CO.", d: 4200, side: "left" },
];
