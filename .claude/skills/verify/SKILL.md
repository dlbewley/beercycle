---
name: verify
description: Build, launch, and drive BeerCycle in headless Chromium to verify changes at the game surface (menu, ride, results).
---

# Verifying BeerCycle changes

Build and serve the production bundle (background the server):

```bash
npm install && npm run build
npm run preview -- --port 4173 --strictPort
```

Drive with playwright-core (install it in a scratch dir, not the repo).
The pre-installed browser is the symlink `/opt/pw-browsers/chromium` —
pass it as `executablePath` with `args: ["--no-sandbox"]`. Do NOT run
`playwright install`.

```js
const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium",
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
await page.waitForTimeout(1500); // let Phaser boot + textures render
```

Flows that cover most changes:

- **Rider select**: `ArrowLeft`/`ArrowRight` cycle avatars on the menu;
  selection is written to registry + localStorage on each change.
- **Start ride**: `Space` on the menu. Steer with `ArrowLeft`/`ArrowRight`.
- **Bail out**: `Escape` mid-ride ends the run (LAST CALL / results path).
- Screenshot with `page.screenshot()`; use `clip` to zoom sprites
  (viewport 960x540 = 2x the 480x270 internal resolution).

Gotchas:

- Each `chromium.launch()` is a fresh profile — localStorage (chosen
  rider, leaderboard) does NOT persist across launches, only across
  `page.goto()` reloads in the same context.
- `npm install` may rewrite `package-lock.json` for platform-specific
  optional deps; revert it before committing unless deps changed.
- WebGL "GPU stall due to ReadPixels" console warnings are normal
  under headless screenshots; not a game bug.
