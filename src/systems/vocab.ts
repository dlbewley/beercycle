import type { AvatarId } from "../art/pixelart";

// Per-rider voice lines (beercycle-bmi). Personalities per the avatar
// epic: DWNWRD hacker/vegan, HOSKINS prankster, DRELLIS beer snob.

export type VocabEvent = "enter" | "perfect" | "crash" | "bust" | "finish" | "water";

const LINES: Record<AvatarId, Record<VocabEvent, string[]>> = {
  dwnwrd: {
    enter: ["IS THE IPA VEGAN?", "SUDO POUR ME ONE.", "GREAT BIKE PARKING."],
    perfect: ["ZERO PACKET LOSS!", "CLEAN COMMIT.", "FLAWLESS DEPLOY."],
    crash: ["CTRL-Z! CTRL-Z!", "SEGFAULT.", "WORKS ON MY BIKE."],
    bust: ["I KNOW MY RIGHTS (I DON'T)", "IT'S OPEN SOURCE, OFFICER."],
    finish: ["SHIP IT.", "MERGED TO MAIN."],
    water: ["HYDRATION IS PRAXIS."],
  },
  hoskins: {
    enter: ["FIRST ROUND'S ON DRELLIS.", "DO YOU DO REFILLS?", "HELMETS ARE FOR COWARDS."],
    perfect: ["HEH. WATCH THIS.", "NAILED IT. PROBABLY.", "TOLD YOU."],
    crash: ["MEANT TO DO THAT.", "WHO PUT THAT THERE?", "THE GROUND STARTED IT."],
    bust: ["OFFICER, FUNNY STORY—", "THIS ISN'T EVEN MY BIKE."],
    finish: ["AGAIN! AGAIN!", "IS THERE A TROPHY?"],
    water: ["THIS BEER TASTES WRONG."],
  },
  drellis: {
    enter: ["LET ME SEE THE TAP LIST.", "A FLIGHT, IF YOU PLEASE.", "NOTES OF... COMMERCE."],
    perfect: ["IMPECCABLE MOUTHFEEL!", "EXQUISITE LACING.", "A DEFENSIBLE VINTAGE."],
    crash: ["INELEGANT.", "THE PAVEMENT IS OAKED.", "I MEANT TO DECANT."],
    bust: ["THIS IS TECHNICALLY A CLASS B.", "I DEMAND A SOMMELIER."],
    finish: ["A RESPECTABLE SESSION.", "SUFFICIENTLY PEATED."],
    water: ["A PALATE CLEANSER."],
  },
};

export function vocabLine(avatar: AvatarId, event: VocabEvent): string {
  const options = LINES[avatar]?.[event] ?? [""];
  return options[Math.floor(Math.random() * options.length)];
}
