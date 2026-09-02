# Sundrift Isle — 3D Island World Plan

*Working title. A bright, welcoming island you can run around in, built to feel
like a place you visited in 2002 and never quite forgot.*

This document is the agreement on **what** we are building and **how** before
any code is written. Sections marked **DECISION NEEDED** are the questions I
need answered to start; everything else is my recommendation and can be
changed.

---

## 1. The goal in one paragraph

A real, playable 3D game: a single hand-crafted tropical island rendered in the
upscaled early-2000s style (GameCube / Dreamcast / Wii era, as if played on a
modern screen). You control an original mascot character, run, jump, swim, and
explore. Islanders talk to you, seagulls wheel overhead, waves lap on the sand,
and original music plays. Nothing is threatening. The feeling is "summer
afternoon, nothing to do, everywhere to go." Everything — models, textures,
characters, music, sound effects — is original and generated from code. No
downloaded assets, ever.

## 2. What we are taking from each reference (and what we are NOT)

| Reference | What we borrow (the *feeling*) | What we leave alone (their IP) |
|---|---|---|
| **Kingdom Hearts – Destiny Islands** | Small cove hub: wooden docks with tied-up rowboats, thatched huts, a tree house up a giant tree, a waterfall pouring off a cliff into the cove, a leaning palm over the water you can sit on | Paopu fruit, the characters, the keyblade, the star-shaped fruit |
| **Sonic Adventure – Emerald Coast** | A very long plank bridge out over impossibly blue water to a tiny islet; rock stacks in the sea; a big landmark you can see from far away; cliffs with grass tops dropping straight into the ocean | The gold ring, loops, speed gameplay, Sonic |
| **Sonic Generations (3DS) beach** | Beach-resort strip: white hotel with balconies, striped umbrellas, deck chairs, a natural rock arch off the coast | Sonic, timer HUD, the hotel logo |
| **Wii Sports Resort – Wuhu Island** | Harbor town with stacked pastel houses, a lighthouse on a green cliff, windmills on the ridge, a ferry at the pier, something drifting in the sky | Miis, the Wii blimp, Wuhu's actual layout |
| **Super Mario Sunshine – Delfino Plaza** | Saturated color, strong sun with hard-ish shadows, sparkling water, plaza with fountain and market awnings, the "you can climb on everything" invitation | Mario, FLUDD, shine sprites, Piantas |

**The common thread we're actually chasing:** hard blue sky, white clouds with
volume, cyan-to-cobalt water, saturated greens, warm sand, chunky readable
shapes, low-resolution but *painted-looking* textures, and a camera that
follows you gently. That is the nostalgia. We build for that, not for any one
game.

## 3. Visual style bible

This is the most important section. If we agree on this, the rest is labor.

### 3.1 The rendering rule: "GameCube on a 4K TV"

Not pixelated, not blurry, not photoreal. The look of an emulator running an
old game at high resolution: clean edges, simple lighting, low-detail textures
that are filtered smooth. Concretely:

- **Geometry:** low-to-mid poly. Palms are ~200 triangles, huts ~300, the
  player ~1,500. Silhouettes chunky and exaggerated. No sub-pixel detail.
- **Textures:** generated on a canvas at **128×128 or 256×256**, hand-painted
  look (visible brush-like strokes, no photo noise), then displayed with
  linear filtering + mipmaps. This is exactly why old games look "soft but
  clean" on modern screens.
- **Lighting:** one fixed sun (about 2 PM, high and slightly behind the
  camera), a sky-blue hemisphere light, soft shadow maps for the player and
  large props only. Toon-ish shading with a smooth 3-step ramp, not hard cel
  lines. No outlines.
- **Baked look:** darkened vertex colors in corners and under trees to fake
  ambient occlusion, the way the era did it.
- **Post-processing:** a *tiny* amount of bloom on the water sparkle and sky,
  gentle vignette, mild warm color grade. That's all. No motion blur, no film
  grain, no depth of field.
- **Distance:** a light warm-blue fog starting far out so the horizon melts
  into the sky like the reference shots.
- **Resolution:** renders at the window's native resolution (1080p / 1440p).
  Optional "CRT-free retro" toggle that renders at 640×480 and upscales, for
  people who want it even crunchier.

### 3.2 Palette (locked, hex)

| Role | Color | Notes |
|---|---|---|
| Sky zenith | `#1E5BD6` | deep cobalt at the top |
| Sky horizon | `#9BD8F5` | pale cyan where it meets the sea |
| Cloud | `#FFFFFF` shaded to `#BFD8F0` | fluffy billboard clusters |
| Shallow water | `#4FE3E0` | the "you can see the sand" color |
| Deep water | `#1247B8` | cobalt, not navy |
| Foam / wave crest | `#F6FFFF` | |
| Wet sand | `#E4CFA0` | |
| Dry sand | `#FBF0D2` | almost white in sun |
| Grass | `#5DC24E` → `#2E8A3A` | vivid, two-tone painted |
| Palm frond | `#3FAE4A` / `#8CDD6A` | |
| Palm trunk / driftwood | `#B08050` / `#7A5333` | |
| Rock | `#8E8E96` → `#5A5A66` | cool gray, green mossy tops |
| Thatch | `#D9B36A` | |
| Town walls | `#FFF3E0`, `#F9D5B5`, `#CFE9F3`, `#F6E7A1` | pastel stack |
| Roof tiles | `#D9583A`, `#3D7AC4` | terracotta and blue |
| Sunlight | `#FFF4D6` | warm white |
| Shadow tint | `#6D8FC9` | bluish, never black |

### 3.3 The island layout (one island, five zones)

Roughly 600 m × 400 m — big enough to feel like a world, small enough that you
can run across it in about 90 seconds and learn it by heart (that "been here
before" feeling comes from *knowing* a place).

```
                     N
        ┌────────────────────────────┐
        │  ┌─ Windmill Ridge ─┐      │
        │  │ (grass hills,    │ ● Lighthouse Point
        │  │  windmills)      │   (cliff, lighthouse)
        │  └──────────────────┘      │
        │        Harbor Town         │
        │   (pastel houses, plaza,   │
        │    fountain, ferry pier)   │
        │                            │
   Rock │  Sunrise Cove  ◉ Big Tree  │
   Arch │  (hub: docks,    ╱waterfall│
    ◐   │   huts, boats)  ╱  grotto  │
        │        ~~~~~~~~~~          │
        │  Resort Beach   ══════════════▶ The Long Pier
        │ (hotel, umbrellas)          (islet + landmark)
        └────────────────────────────┘
                     S
```

1. **Sunrise Cove (start / hub)** — Destiny-Islands-style. Crescent beach,
   two wooden docks with rowboats, three thatched huts, a giant banyan-like
   tree with a rope ladder up to a tree house, a waterfall off the back cliff
   into a shallow grotto you can wade into. The leaning palm over the water.
2. **The Long Pier** — a 120 m plank bridge with rope rails running out over
   deep blue water to a tiny grass islet with one palm and a landmark: a
   ring-shaped weathered stone **Sun Gate** you can walk through (our
   original stand-in for the "big visible thing on the islet").
3. **Resort Beach** — a white three-story hotel with blue balconies, striped
   umbrellas, deck chairs, a beach volleyball net, and the rock arch just
   offshore that you can swim out to.
4. **Harbor Town** — pastel houses stacked up a slope, a plaza with a
   fountain and market awnings, a ferry docked at a stone pier, a bell tower.
   Climbable rooftops.
5. **Windmill Ridge + Lighthouse Point** — grassy hills with three slowly
   turning windmills, and a white lighthouse on a cliff with a spiral stair.
   The highest point; from here you see the whole island. This is the
   "reward view."

Always in the sky: a slow **hot-air balloon** drifting a loop over the island
(original stand-in for the blimp) and seagull flocks.

## 4. Characters (all original)

Built from chunky primitives — spheres, capsules, boxes — in code, with big
readable heads and simple faces. This is deliberately the Mii / early-mascot
approach: it reads instantly, animates cleanly, and matches the era.

### 4.1 Player — **DECISION NEEDED**, pick one (or describe your own)

| Option | Concept | Why it fits |
|---|---|---|
| **A. Nell (recommended)** | The lighthouse keeper's kid. Oversized straw sun hat, swim goggles on the forehead, striped tee, shorts, bare feet, permanent grin. | A human kid reads as "you" in a relaxing world; the hat makes the silhouette unmistakable from any camera angle. |
| **B. Pip** | A small round sea otter in a red life vest. | Animal mascot energy; fun swim animations; naturally cute. |
| **C. Skipper** | A puffin with a sailor cap who can flap-glide. | Gives a gentle glide mechanic for the cliffs; very "era" mascot. |

Animation set for v1: idle (breathing + occasional look-around), walk, run,
jump, double jump flip, land, swim, tread water, climb ladder, sit (on the
leaning palm), talk. All procedural blends, no external rigs.

### 4.2 Islanders (NPCs)

Six named locals with one-line looping dialogue that rotates by how many
things you've found. Examples: **Old Mabe** (mends nets on the dock),
**Coco** (kid who dares you to swim to the arch), **Mr. Fennimore** (hotel
concierge, very proud of the hotel), **Tallow** (baker in the plaza),
**Ines** (windmill keeper), **Captain Pell** (lighthouse). Each is the same
primitive rig with different hats, colors, and body proportions.

### 4.3 Ambient life

Seagulls (flocks that scatter when you run at them), crabs that scuttle
sideways on the sand, fish shadows in the shallows, butterflies on the ridge.

## 5. Gameplay scope for version 1

Deliberately small. The world *is* the game.

- Third-person camera: follows behind with soft lag, right stick / mouse to
  orbit, auto-recenters when running, pulls in near walls, never clips into
  the ground.
- Movement: run, jump, double jump, roll/dive, swim (surface only), climb
  rope ladders and vines, sit on marked spots.
- Collection: **Sundrops** (glowing warm-orange shells) scattered in
  places that reward looking around: rooftops, under the pier, top of the
  lighthouse, behind the waterfall. A counter on the HUD, a chime when you
  find one, and a small celebration at milestones (10 / 25 / 50).
- Talking: walk up, press E, speech bubble with the era's letter-by-letter
  text and a soft "blip" per character.
- Day cycle: **optional stretch**. A fixed 2 PM sun is easier and more
  "on-model". A slow drift to golden hour after 10 minutes of play would be
  lovely and is cheap if the lighting is set up for it from the start.
- Title screen: the island from the sea, camera slowly sailing in, music
  playing. "Press any key." Pause menu with volume and the retro-res toggle.
- Autosave of Sundrops and position.

**Not in v1:** combat, enemies, health, story quests, inventory, multiple
islands. All can be added later; none are needed for the feeling.

## 6. Audio (all original, all synthesized)

A Web Audio synthesizer that plays original compositions written as compact
note strings, with the voices this style needs:

- **New instruments:** steel-drum-like FM bell, marimba, plucked nylon guitar
  (Karplus-Strong), soft brass pad, shaker/bongo percussion, a synthesized
  reverb (generated impulse response) so it stops sounding like a chiptune.
- **Music (four tracks):**
  1. *"Sundrift Morning"* — main island theme. Bright major key, ~104 BPM,
     steel drum melody over marimba and guitar, light bongos. Loops cleanly.
  2. *"Harbor Bells"* — town variant, same key, slower, bell tower motif.
  3. *"Lighthouse Wind"* — ridge/lighthouse, airy pad, mostly melody, wind.
  4. *"Far Out Blue"* — title screen, a slow arrangement of theme 1.
  Tracks cross-fade by zone so the music changes as you walk.
- **Ambience:** layered wave wash near shore, seagull calls, wind on the
  ridge, waterfall roar that gets louder as you approach, creaking dock.
- **SFX:** footsteps per surface (sand / wood / grass / stone / shallow
  water), jump, double-jump whoosh, land, splash, swim strokes, Sundrop
  chime, milestone jingle, dialogue blip, menu tick, windmill creak.

## 7. Technology — **DECISION NEEDED** (I recommend the first row)

| Option | Pros | Cons |
|---|---|---|
| **Three.js in the browser, vanilla JS modules, packaged with Electron** (recommended) | Zero-install play (open `index.html`), `npm start` for a desktop window, and a straightforward Steam build path. I can build and test it end-to-end here, including screenshots with headless Chromium. No editor, no asset pipeline. Ships to web, desktop, and Steam. | Not as much out-of-the-box as a full engine; physics is hand-rolled (fine for a character controller). |
| Godot 4 | Real editor, built-in physics, exports everywhere. | Requires you to work in the editor; I can't run or verify it in this environment. Most of the "generated in code" approach is lost. |
| Unity / Unreal | Industry standard. | Heavy, license terms, and again not something I can build or test here. |

**Three.js details:** vendored copy in `vendor/` (no CDN, so it works
offline and in Electron), ES modules via import map, no bundler needed.
Custom lightweight physics: heightmap ground sampling for terrain, simple
capsule-vs-box / cylinder / sphere colliders for props, slope limits, ground
snapping. Deterministic seeded generation for scatter (rocks, grass tufts,
shells) so the island is identical every time — a place, not a roll of dice.

## 8. Project structure (proposed)

```
index.html                  entry point (open it in a browser to play)
vendor/three.module.js      vendored Three.js (pinned version)
electron/main.js            desktop wrapper
src/
  main.js                   boot, loop, resize, pause
  engine/
    input.js                keyboard + mouse + gamepad
    camera.js               third-person follow camera
    physics.js              heightmap ground, capsule colliders
    seeded.js               deterministic RNG
  render/
    materials.js            toon ramp, texture painter, palette
    textures.js             canvas-painted textures (sand, grass, wood…)
    sky.js                  sky dome, clouds, sun, fog, balloon
    water.js                water shader, foam, sparkle
    post.js                 bloom + vignette + retro-res toggle
  world/
    island.js               heightmap authoring for the 5 zones
    props/                  palm, hut, dock, hotel, houses, lighthouse…
    zones.js                zone bounds → music, ambience, names
    collectibles.js         Sundrop placement + counter
  characters/
    rig.js                  primitive character rig + procedural animation
    player.js               controller: run/jump/swim/climb/sit
    npcs.js                 six islanders + dialogue tables
    critters.js             gulls, crabs, fish, butterflies
  audio/
    synth.js                extended Web Audio synth (from src/audio.js)
    instruments.js          steel drum, marimba, guitar, pads, percussion
    music.js                the four tracks
    sfx.js                  all effects
    ambience.js             waves, wind, gulls, waterfall
  ui/
    hud.js                  Sundrop counter, prompts
    dialogue.js             speech bubbles
    menus.js                title, pause, settings
test/
  unit.test.js              heightmap/physics/seeded RNG (Node, no GPU)
  smoke.js                  boots the game in headless Chromium, walks the
                            player through each zone, screenshots, asserts
                            no errors
shots/                      reference screenshots per milestone
```

## 9. Milestones

Each milestone ends with screenshots committed to `shots/` so you can
judge the *look* without running anything.

| # | Milestone | What you'll be able to do | Definition of done |
|---|---|---|---|
| 0 | **Plan sign-off** (this doc) | Answer the decisions in §10 | You reply "go" |
| 1 | **Gray-box island** | Run and jump on a flat gray island, sky, water plane, follow camera. | Movement feels good. Camera never clips. 60 fps. |
| 2 | **Style lock** | Sunrise Cove fully dressed: sand, grass, water shader with foam and sparkle, clouds, palms, docks, huts, big tree, waterfall, the leaning palm. | Side-by-side with your reference images, you say "yes, that's it." **This is the milestone to be picky at.** |
| 3 | **The whole island** | All five zones built, Long Pier, hotel, town, windmills, lighthouse, balloon. Swim, climb, sit. | Can run everywhere in the map; nothing you can fall through. |
| 4 | **Life** | Player mascot with full animation set, six NPCs with dialogue, gulls, crabs, fish. | The island feels inhabited. |
| 5 | **Sound** | Four music tracks with zone cross-fade, ambience, all SFX. | Play with eyes closed and know where you are. |
| 6 | **Game** | Sundrops, HUD, title screen, pause/settings, autosave, retro-res toggle, gamepad. Electron build, tests green, README rewritten. | Ship-able. |

Rough proportions of effort: M2 and M3 are the big ones (about half the work
combined), M4 and M5 a quarter each, M1 and M6 small.

## 10. Decisions I need from you

1. **Player character:** A (Nell), B (Pip), C (Skipper), or your own idea?
2. **Tech:** Three.js-in-browser as recommended, or a full engine?
3. **Name:** "Sundrift Isle" is a placeholder. Keep it, or something else?
4. **Day cycle:** fixed 2 PM sun (simplest, most on-model), or slow drift to
   golden hour as a stretch goal?
5. **Gamepad:** worth supporting in v1? (Cheap to add; changes camera design
   slightly if yes.)

Anything in §3 (style bible) or §3.3 (layout) you want changed, say so now:
those are the decisions that are expensive to revisit after M2.
