// Brewery stop shape shared by the route definitions (src/systems/routes.ts).
// d is route distance; side is which road edge the stop zone sits on.

export interface Brewery {
  name: string;
  d: number;
  side: "left" | "right";
}
