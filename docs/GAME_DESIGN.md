# BeerCycle — Game Design Document

*Status: v0.2 — core decisions locked (see Decisions at bottom)*

## Pitch

A web-hosted arcade game with a SNES *Paperboy 2* aesthetic. You pedal a bike
through Boulder, Colorado on a diagonal-scrolling pseudo-isometric street,
hitting popular breweries along the route. Every stop earns points — and raises
your Buzz meter, which makes the bike progressively harder to ride straight.
Get to the end of the route without crashing out or getting stopped by Boulder
PD for biking under the influence.

Tone: affectionate satire of Boulder culture, in the same spirit Paperboy
satirized suburbia. Splash screen carries a tongue-in-cheek "pedal responsibly
— this is a video game" disclaimer.

## Core Loop

1. **Ride** a scrolling route (Paperboy-style: road scrolls diagonally,
   constant forward motion, player steers left/right and modulates speed).
2. **Dodge** Boulder-flavored obstacles and grab pickups.
3. **Stop** at breweries along the route. Each stop is a quick timing
   minigame (a "knock one back" meter). More beers = more points = more Buzz.
4. **Buzz meter rises** → handling degrades (see Tipsiness Model).
5. **Finish** the route → end-of-run tally styled as a *Daily Camera*
   headline (Paperboy's newspaper-headline results screen, localized).

## Tipsiness Model (the signature mechanic)

Buzz is a 0–100 meter. Effects stack as it climbs:

| Buzz | Handling effect |
|------|-----------------|
| 0–20 | Clean controls |
| 20–40 | Slow sinusoidal drift added to steering; slight camera sway |
| 40–60 | Input lag (~100–200ms), stronger drift, occasional overcorrection |
| 60–80 | Random steering impulses ("wobbles"), screen blur/double-vision shader, mushier braking |
| 80–100 | Severe wobble, mirrored inputs for brief moments, tunnel-vision vignette |

Buzz decays slowly over time/distance. Counter-pickups reduce it faster:
water bottles, a food-truck taco, a Celestial Seasonings tea stand.

**Fail states:**
- Crash (hit obstacle at speed) — lose a life, Buzz drops a bit (adrenaline).
- **BUI bust**: a Boulder PD officer NPC watches sections of the route. Wobble
  visibly in their line of sight at high Buzz → pulled over, run ends.
  (BUI is a real ticket in Colorado — that's the joke.)

## Setting & Levels

Levels are Boulder neighborhoods, each a route with 2–4 brewery stops:

1. **Pearl Street Mall** — tutorial-ish; dodge buskers, tourists, the
   zip-code guesser; brewery stops on the bricks.
2. **The Hill / CU Campus** — students on e-scooters, game-day crowds,
   Ralphie cameo stampede as a hazard set piece.
3. **Boulder Creek Path** — narrow path, joggers, dogs off leash, tubers
   in summer; creek on one side (falling in = crash + sobering dunk).
4. **East Boulder industrial district** — where the real brewery density is;
   wide roads but delivery trucks and roundabouts.
5. **Bonus stage: Flagstaff climb** — Paperboy's training-course analog;
   pure handling test at your current Buzz, big points.

**Backdrop:** Flatirons parallax layer throughout. Other nods: prairie dog
colonies (they pop up from holes — never hittable, they always dodge you),
spandex road-cyclist pacelines that shout at you, a "300 days of sunshine"
weather system with an occasional upslope snow squall level modifier.

## Obstacles & Pickups

**Obstacles:** pedestrians, off-leash dogs, e-scooters, car doors opening,
buses, roundabouts, construction cones, other cyclists, sprinklers, geese.
**Pickups:** water (−Buzz), tacos (−Buzz), spare tube (extra life),
happy-hour token (2× points at next brewery), Kombucha (mystery effect).

## Scoring

- Points per beer at each brewery stop (multiplier for consecutive stops).
- Near-miss style points (grazing obstacles without crashing), like
  Paperboy's trick points.
- Route-completion bonus scaled by remaining Buzz (finish tipsy but upright
  = bigger bonus, rewarding risk).
- Local leaderboard (localStorage) for MVP; online later, maybe.

## Aesthetic

- SNES-era 16-bit pixel art, chunky sprites, limited palette per level.
- Paperboy camera: pseudo-isometric diagonal scroll (screen-space skew, not
  true isometric tiles), sprite Y-sorting.
- Chiptune soundtrack, one theme per neighborhood; SFX: bike bell, bottle
  clink, crowd noise, the wobble gets a warbly detune as Buzz rises.

## Tech Stack (recommended)

- **Phaser 3 + TypeScript + Vite.** Batteries-included 2D engine (arcade
  physics, sprite sorting, tilemaps, tweens, audio), huge community, trivially
  hosted as a static site.
- Deploy: GitHub Pages or Netlify — static, no backend needed for MVP.
- Art: Aseprite for sprites/tiles.

## MVP Scope

One route (Pearl Street), 3 brewery stops, full Tipsiness handling model,
5 obstacle types, crash + BUI fail states, score tally screen, one music
track. Everything else is post-MVP.

## Brewery Roster (parody names)

| In-game name | Winks at |
|---|---|
| Upslip Brewing | Upslope |
| Mountain Moon Pub & Brewery | Mountain Sun |
| Aviary Brewing | Avery |
| Sanitastic Brewing | Sanitas |
| Bolder Beer Co. | Boulder Beer |
| Best Flanders | West Flanders |
| Twisty Spruce | Twisted Pine |
| Mild Woods | Wild Woods |
| Fête Brewing | Fate |

MVP Pearl Street route stops: **Mountain Moon**, **Best Flanders**,
**Bolder Beer Co.** (the three with real-world Pearl-Street-area roots).

## The Riders (player avatars)

Three selectable riders, pixel likenesses of real friends of the project
(see beads epic beercycle-uju for canonical visual reference):

| Rider | Look | Personality | Flavor hooks |
|---|---|---|---|
| **DWNWRD** | white helmet, teal mirror shades, silver beard, chartreuse kit | hacker, vegan, all stoke | taco pickups are TOFU TACOS |
| **HOSKINS** | no helmet, thinning sandy hair, wire glasses, plaid | rotund prankster | smirks at near-misses ("HEH.") |
| **DRELLIS** | white helmet, dark shades, goatee, gray shirt + backpack | professorial, slim, beer snob | perfect pours are "IMPECCABLE MOUTHFEEL" |

The chosen rider's portrait is a **Doom-style status face** in the HUD
corner: degrades with Buzz (smile → flushed → swirly-eyed, and the
portrait physically rocks with the camera sway), winces during crashes,
sweats when a cop has line of sight, parties during chugs, goes X-eyed
when the run ends, smug on a PERFECT POUR. Road sprite palette matches
the rider (HOSKINS rides helmetless; Boulder judges silently). High
scores are signed DWN / HOS / DRE. The menu shows the trio as a tilted
polaroid ("the jokers").

## Decisions (locked 2026-07-19)

1. **Parody brewery names** — trademark-safe, on-tone. Roster above.
2. **Leaderboard: localStorage for MVP**, but code against a small
   `LeaderboardStore` interface so an online backend can be swapped in
   later without touching game code.
3. **Keyboard controls only for MVP.** Touch/mobile is post-MVP.
