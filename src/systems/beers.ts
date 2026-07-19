// Beer styles as gameplay (beercycle-bmi): ABV drives Buzz and points,
// style picks the chug mechanic and an after-effect on riding.

export type BeerStyle =
  | "lager" | "pilsner" | "kolsch" | "pale" | "ipa" | "dipa"
  | "wit" | "saison" | "sour" | "brown" | "porter" | "stout"
  | "quad" | "chili";

export type GlassShape = "pint" | "nonic" | "tulip" | "snifter" | "can";

export type ChugMechanic = "timing" | "jitter" | "fill";

export type DrinkEffect = "none" | "refresh" | "heavy" | "chili";

export interface BeerDef {
  id: string;
  name: string;
  style: BeerStyle;
  abv: number;
  color: string; // beer body
  head: string; // foam
  shape: GlassShape;
}

// Sours pucker the marker; stouts and porters are a careful pour.
export function mechanicFor(style: BeerStyle): ChugMechanic {
  if (style === "sour") return "jitter";
  if (style === "stout" || style === "porter") return "fill";
  return "timing";
}

// What the beer does to your legs afterward.
export function effectFor(style: BeerStyle): DrinkEffect {
  if (style === "lager" || style === "pilsner" || style === "kolsch") return "refresh";
  if (style === "stout" || style === "porter") return "heavy";
  if (style === "chili") return "chili";
  return "none";
}

export function buzzFor(beer: BeerDef): number {
  return Math.round(beer.abv * 2.4);
}

export function pointsFor(beer: BeerDef): number {
  return Math.round(60 + beer.abv * 12);
}

export function markerSpeedFor(style: BeerStyle): number {
  if (style === "ipa" || style === "dipa") return 3.1;
  if (style === "chili") return 2.8;
  if (style === "lager" || style === "pilsner" || style === "kolsch") return 1.9;
  if (style === "quad") return 2.0;
  return 2.4;
}

export function styleLabel(beer: BeerDef): string {
  return `${beer.style.toUpperCase()} * ${beer.abv}%`;
}
