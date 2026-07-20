import type { AvatarId } from "../art/pixelart";

// Per-rider voice lines (beercycle-bmi). Personalities per the avatar
// epic: DWNWRD hacker/vegan, HOSKINS prankster, DRELLIS beer snob,
// JILLBAKE berkeley feminist (beercycle-8tb), PEN smooth jazz
// clarinetist (beercycle-0ay), AAFRAN no-shit professor (beercycle-1u8).

export type VocabEvent =
  | "enter" | "perfect" | "crash" | "bust" | "finish" | "water" | "cutoff";

const LINES: Record<AvatarId, Record<VocabEvent, string[]>> = {
  dwnwrd: {
    enter: ["IS THE IPA VEGAN?", "SUDO POUR ME ONE.", "GREAT BIKE PARKING."],
    perfect: ["ZERO PACKET LOSS!", "CLEAN COMMIT.", "FLAWLESS DEPLOY."],
    crash: ["CTRL-Z! CTRL-Z!", "SEGFAULT.", "WORKS ON MY BIKE."],
    bust: ["I KNOW MY RIGHTS (I DON'T)", "IT'S OPEN SOURCE, OFFICER."],
    finish: ["SHIP IT.", "MERGED TO MAIN."],
    water: ["HYDRATION IS PRAXIS."],
    cutoff: ["429: TOO MANY REQUESTS.", "FINE. I HAVE COLD BREW AT HOME."],
  },
  hoskins: {
    enter: ["FIRST ROUND'S ON DRELLIS.", "DO YOU DO REFILLS?", "HELMETS ARE FOR COWARDS."],
    perfect: ["HEH. WATCH THIS.", "NAILED IT. PROBABLY.", "TOLD YOU."],
    crash: ["MEANT TO DO THAT.", "WHO PUT THAT THERE?", "THE GROUND STARTED IT."],
    bust: ["OFFICER, FUNNY STORY—", "THIS ISN'T EVEN MY BIKE."],
    finish: ["AGAIN! AGAIN!", "IS THERE A TROPHY?"],
    water: ["THIS BEER TASTES WRONG."],
    cutoff: ["YOU'LL HEAR FROM MY LAWYER (DRELLIS).", "I'VE BEEN CUT OFF IN NICER BARS."],
  },
  drellis: {
    enter: ["LET ME SEE THE TAP LIST.", "A FLIGHT, IF YOU PLEASE.", "NOTES OF... COMMERCE."],
    perfect: ["IMPECCABLE MOUTHFEEL!", "EXQUISITE LACING.", "A DEFENSIBLE VINTAGE."],
    crash: ["INELEGANT.", "THE PAVEMENT IS OAKED.", "I MEANT TO DECANT."],
    bust: ["THIS IS TECHNICALLY A CLASS B.", "I DEMAND A SOMMELIER."],
    finish: ["A RESPECTABLE SESSION.", "SUFFICIENTLY PEATED."],
    water: ["A PALATE CLEANSER."],
    cutoff: ["PROBABLY WISE.", "A RESPONSIBLE POUR COUNT."],
  },
  jillbake: {
    enter: ["WHO BREWED THIS? A WOMAN, I HOPE.", "OFFICE HOURS ARE CANCELED.", "THE SYLLABUS SAYS DRINK LOCAL."],
    perfect: ["A+. NO NOTES.", "THAT'S HOW IT'S DONE, PEOPLE.", "GRADED ON MY CURVE."],
    crash: ["PATRIARCHY BUILT THIS POTHOLE.", "THE ROAD IS A SOCIAL CONSTRUCT.", "I MEANT THAT AS CRITIQUE."],
    bust: ["THIS IS A TEACHABLE MOMENT, OFFICER.", "I'VE READ FOUCAULT. I KNOW HOW THIS ENDS."],
    finish: ["CLASS DISMISSED.", "ONE STUDENT AT A TIME."],
    water: ["SELF-CARE IS RESISTANCE."],
    cutoff: ["SILENCED AGAIN. TYPICAL.", "FINE. I HAVE PAPERS TO GRADE."],
  },
  pen: {
    enter: ["WHAT'S ON DRAFT, MAN.", "GOT A GIG AT NINE. ISH.", "SMOOTH POURS ONLY."],
    perfect: ["SMOOOOTH.", "RIGHT IN THE POCKET.", "THAT'S THE GOOD STUFF."],
    crash: ["BAD NOTE. HAPPENS.", "WE'LL CALL THAT A REST.", "OW. ANYWAY."],
    bust: ["EASY, OFFICER. IT'S SMOOTH JAZZ.", "I BLOW CLARINET, NOT LIMITS."],
    finish: ["AND THAT'S THE SET.", "TIP YOUR BARTENDER."],
    water: ["GOTTA PACE THE SOLO."],
    cutoff: ["COOL, COOL. I'LL VAMP.", "FAIR. THE REED'S DRY ANYWAY."],
  },
  aafran: {
    enter: ["TENURED. TRY ME.", "THE COMMITTEE CAN WAIT.", "I'VE READ YOUR TAP LIST. AMBITIOUS."],
    perfect: ["CORRECT.", "SEE? RIGOR.", "PUBLISHABLE."],
    crash: ["REJECTED. RESUBMIT.", "THE ROAD GETS AN F.", "NOTED. MOVING ON."],
    bust: ["THIS WON'T SURVIVE PEER REVIEW, OFFICER.", "CITE YOUR PROBABLE CAUSE."],
    finish: ["SEMINAR ADJOURNED.", "OFFICE HOURS: NEVER."],
    water: ["HYDRATION IS NON-NEGOTIABLE."],
    cutoff: ["FINE. I GRADE HARDER SOBER.", "A DEFENSIBLE RULING."],
  },
};

export function vocabLine(avatar: AvatarId, event: VocabEvent): string {
  const options = LINES[avatar]?.[event] ?? [""];
  return options[Math.floor(Math.random() * options.length)];
}
