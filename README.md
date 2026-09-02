# Lantern Reef

*A bright, welcoming island you can run around in — built to feel like a
place you visited in 2002 and never quite forgot.*

A 3D exploration game in the upscaled early-2000s style: hard blue sky,
cyan-to-cobalt water, chunky low-poly palms and huts, painted low-resolution
textures shown clean and smooth. You play an original mascot character;
you run, jump, swim, climb, talk to islanders, and hunt for hidden Sundrops.
Nothing is threatening. Original characters, original music, original sound
effects — everything generated from code, no downloaded assets.

**Status:** milestone 2 of 6, the style lock. Sunrise Cove is fully dressed
(painted textures, palms, huts, docks and rowboats, the big tree with its
tree house, the waterfall and cliff, clouds, foam shoreline) and the whole
island has grass, bushes, rocks, and beach palms. Milo is still a stand-in,
and there is no sound yet. See [docs/PLAN.md](docs/PLAN.md) for the style bible, island
layout, audio plan, and the milestone list; `shots/` has the latest
screenshots.

## Play it

Open `index.html` in any modern browser. No install, no server.

For a desktop window: `npm install` then `npm start`.

## Test it

```bash
npm install
npm test          # boots the game headless, drives Milo around, checks the world
npm run shots     # same, plus screenshots into shots/
```

Tests need a Chromium. They look for a Playwright-installed one first, or
set `LR_CHROME=/path/to/chrome`.

## Stack

- Three.js (vendored r158, no CDN) in plain JavaScript
- Web Audio synthesizer for all music and sound (milestone 5)
- Electron wrapper for desktop builds and Steam
- Headless Chromium smoke tests with screenshots per milestone

## Controls

| Key | Action |
|---|---|
| WASD / Arrows | Move |
| Mouse / Right stick | Orbit camera |
| SPACE | Jump (again in the air for a double jump) |
| SHIFT | Roll / dive |
| E | Talk / sit / climb |
| ESC | Pause |
