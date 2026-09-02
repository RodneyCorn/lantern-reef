# Lantern Reef

*A bright, welcoming island you can run around in — built to feel like a
place you visited in 2002 and never quite forgot.*

A 3D exploration game in the upscaled early-2000s style: hard blue sky,
cyan-to-cobalt water, chunky low-poly palms and huts, painted low-resolution
textures shown clean and smooth. You play an original mascot character;
you run, jump, swim, climb, talk to islanders, and hunt for hidden Sundrops.
Nothing is threatening. Original characters, original music, original sound
effects — everything generated from code, no downloaded assets.

**Status:** planning. Read [docs/PLAN.md](docs/PLAN.md) for the style bible,
island layout, character options, audio plan, tech choice, and milestones.

## Planned stack

- Three.js (vendored, no CDN) in vanilla JavaScript modules
- Web Audio synthesizer for all music and sound
- Electron wrapper for desktop builds and Steam
- Headless Chromium smoke tests with screenshots per milestone

## Planned controls

| Key | Action |
|---|---|
| WASD / Arrows | Move |
| Mouse / Right stick | Orbit camera |
| SPACE | Jump (again in the air for a double jump) |
| SHIFT | Roll / dive |
| E | Talk / sit / climb |
| ESC | Pause |
