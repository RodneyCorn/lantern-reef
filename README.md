# Lantern Reef

*A bright, welcoming island you can run around in — built to feel like a
place you visited in 2002 and never quite forgot.*

A 3D exploration game in the upscaled early-2000s style: hard blue sky,
cyan-to-cobalt water, chunky low-poly palms and huts, painted low-resolution
textures shown clean and smooth. You play an original mascot character;
you run, jump, swim, climb, talk to islanders, and hunt for hidden Sundrops.
Nothing is threatening. Original characters, original music, original sound
effects — everything generated from code, no downloaded assets.

**Status:** milestone 3 of 6, the whole island. All five zones are built:
Sunrise Cove, Resort Beach with the hotel and rock arch, the Long Pier out
to the Sun Gate islet, Harbor Town with its plaza, bell tower, stone pier
and ferry, Windmill Ridge with its windmills, and Lighthouse Point with a
climbable lighthouse whose beam sweeps the island at night. A hot-air
balloon drifts overhead.

Milestone 4, life, is in: Milo is built from his character sheet on a
jointed rig with idle, walk, run, jump, flip, landing, swim, sit, and talk
animations. Six islanders stand where they belong and talk in speech
bubbles; you can sit on the leaning palm, the dock, and the lighthouse
gallery. Gulls wheel and take off, crabs scuttle and flee, fish shadows
cruise the shallows, butterflies drift over the grass. No sound yet. See [docs/PLAN.md](docs/PLAN.md) for the style bible, island
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
| E | Talk to an islander, sit on a marked spot |
| ESC | Pause |
