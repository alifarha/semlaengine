# Semla Engine

A 2D game engine focused on building **bullet-heaven / vampire-survivor** style
games — top-down survival against ever-growing swarms of enemies, auto-firing
weapons, experience gems, and level-up upgrades.

Built with **TypeScript + HTML5 Canvas**. No runtime dependencies; Vite is used
only for the dev server and bundling.

The repo ships as a **full architecture scaffold**: the engine core is
implemented and a small but genuinely playable demo game runs on top of it.
Game-specific systems that need design decisions (e.g. the level-up choice UI)
are marked with `TODO` and called out below.

---

## Quick start

```bash
npm install
npm run dev      # start the Vite dev server and open the demo
npm run build    # typecheck + production build into dist/
npm run typecheck
npm test         # headless logic tests (serialization, runes)
```

**Controls:** WASD / arrow keys to move. Weapons fire automatically at the
nearest enemy. Collect sál orbs to level up — each level pauses the game and
offers a choice of three **rune-kennings** (pick with the `1`/`2`/`3` keys or a
click). Survive.

> The demo is evolving into **DRAUGR**, a Norse vampire-survivor (see the game
> design document). The Kenning choice is the first DRAUGR system built on the
> engine; runes live in [`data/runes.ts`](src/game/data/runes.ts).

---

## Architecture at a glance

The codebase is split into a reusable **engine** and a game built on top of it.

```
src/
├── index.ts                  # bootstraps the Engine + first Scene
├── engine/                   # reusable, game-agnostic
│   ├── Engine.ts             # wires services together, owns the game loop
│   ├── core/                 # loop, time, scenes, events
│   │   ├── GameLoop.ts       # fixed-timestep loop w/ render interpolation
│   │   ├── Time.ts           # delta / elapsed / time scale (pause, slow-mo)
│   │   ├── Scene.ts          # owns a World + an ordered list of Systems
│   │   ├── SceneManager.ts   # deferred scene transitions
│   │   ├── EngineContext.ts  # shared services handed to scenes
│   │   └── EventEmitter.ts   # typed pub/sub
│   ├── ecs/                  # entity-component-system
│   │   ├── Entity.ts         # entities are just numeric ids
│   │   ├── Component.ts      # components are plain data
│   │   ├── System.ts         # systems hold behaviour
│   │   ├── World.ts          # the ECS database + queries
│   │   ├── components/       # Transform, Velocity, Sprite, Collider, Health…
│   │   └── systems/          # built-in MovementSystem, LifetimeSystem
│   ├── math/                 # Vector2, Rect, MathUtils
│   ├── rendering/            # Renderer (canvas) + Camera
│   ├── input/                # InputManager (keyboard + pointer)
│   ├── assets/               # AssetLoader (images)
│   ├── audio/                # AudioManager (procedural Web Audio SFX)
│   ├── physics/              # SpatialHashGrid (broadphase)
│   └── serialization/        # ComponentRegistry + WorldSerializer (save/load)
├── game/                     # the vampire-survivor game
│   ├── components/           # Player, Enemy, Weapon, Projectile, gems, progress
│   ├── systems/              # control, AI, spawning, weapons, collision, XP…
│   ├── entities/             # factory functions (createPlayer, createEnemy…)
│   ├── data/                 # data-driven enemies, weapons, upgrades
│   ├── scenes/               # MenuScene, GameScene, GameOverScene
│   ├── ui/                   # Hud (screen-space overlay)
│   └── events.ts             # typed gameplay event bus
└── editor/                   # optional in-game editor overlay
    ├── Editor.ts             # shell: toggle, selection, picking, highlight
    ├── EditorPanel.ts        # panel base class
    ├── fields.ts             # generic property editors (number/bool/color…)
    └── panels/               # Toolbar, Hierarchy, Inspector, Data/Balance
```

### Why an ECS?

The genre's defining technical challenge is **scale**: thousands of enemies,
projectiles, and pickups alive at once. An Entity-Component-System keeps entities
cheap (just an id) and lets systems process tightly-packed component data. See
[`World.ts`](src/engine/ecs/World.ts) for the storage model and querying.

### The fixed-timestep loop

[`GameLoop`](src/engine/core/GameLoop.ts) runs the simulation in fixed steps and
passes an interpolation `alpha` to rendering. This keeps gameplay deterministic
regardless of monitor refresh rate, and a "spiral of death" guard prevents
runaway catch-up after a stall. The renderer interpolates each entity between
its previous and current position for smooth motion.

### Broadphase collision

[`SpatialHashGrid`](src/engine/physics/SpatialHashGrid.ts) buckets entities into
cells so collision checks only consider nearby candidates — turning the naive
O(n²) all-pairs test into roughly O(n).
[`CollisionSystem`](src/game/systems/CollisionSystem.ts) rebuilds the grid each
frame and resolves projectile→enemy and enemy→player interactions against it.

### Game feel & audio

Impact is driven entirely off the gameplay event bus, so it stays decoupled
from combat logic. [`EffectsSystem`](src/game/systems/EffectsSystem.ts)
subscribes to events and produces:

- **Screen shake** — events add "trauma" to the [`Camera`](src/engine/rendering/Camera.ts);
  the offset scales with trauma² (subtle taps, punchy big hits) and decays over time.
- **Hit flashes** — a brief `Flash` component tints an entity white/red on hit.
- **Floating damage numbers** and "LEVEL UP!" popups (world-space text).
- **Particle bursts** on kills and player hits.
- **Procedural SFX** — [`AudioManager`](src/engine/audio/AudioManager.ts)
  synthesizes tones and noise bursts via the Web Audio API, so there are zero
  audio assets to ship. (It unlocks on the first input per browser autoplay rules.)

Transient effect entities are tagged `Transient` so the serializer never saves
them. Removing `EffectsSystem` strips all juice + audio without touching combat.

---

## The in-game editor

Press **`` ` ``** (backtick) at any time to toggle the editor overlay on top of
the running game. It's a DOM overlay built around the live engine — not a
separate mode — so you can tweak the game while it plays.

What's in the shell:

- **Toolbar** — play / pause, single-step (advance one fixed tick at a time), a
  time-scale slider (slow-mo → 3× fast-forward), **Save / Load** (download/restore
  the world as JSON), and live FPS + entity counts.
- **Hierarchy** — every live entity, grouped by type with counts (the swarm is
  capped to a readable list). Click to select.
- **Inspector** — the selected entity's components with **editable fields**.
  Edits write straight into the live component instances, so changing the
  player's `moveSpeed` or its `Weapon.cooldown` is reflected on the very next
  frame. Click an entity directly on the canvas to pick it; the selection is
  ringed in the viewport.
- **Data / Balance** — edit content definitions for **enemies** (`health`,
  `speed`, `contactDamage`…) and **weapons** (`cooldown`, `damage`, `count`…)
  live. Because content is read at spawn/build time, changes apply to subsequent
  waves and newly-equipped weapons — balancing without a rebuild.

### How it plugs in

The editor is **purely additive** — nothing in the engine or game depends on it.
It's constructed in [`src/index.ts`](src/index.ts) and can be dropped from a
shipping build by simply not creating it:

```ts
import { Editor } from "@editor";

const editor = new Editor(engine, {
  // expose game data to the Data/Balance panel (decoupled from the editor)
  dataSources: [{ name: "Enemies", entries: () => /* {id, target}[] */ }],
});
```

To make this work the engine grew a few small, reusable tooling hooks, all
useful beyond the editor:

- `Engine.pause() / resume() / step()` and a paused branch in
  [`GameLoop`](src/engine/core/GameLoop.ts) that keeps rendering a frozen world.
- `Engine.addRenderOverlay(fn)` — screen-space draw callbacks after the scene
  (the editor uses one to ring the selected entity).
- `World.liveEntities()` / `World.componentsOf(entity)` — read-only ECS
  reflection for tooling.
- `InputManager.enabled` — suspends game input while you type in an editor field
  so WASD in a number box doesn't also move the player.

Add your own panel by extending
[`EditorPanel`](src/editor/EditorPanel.ts) and appending it in `Editor`.

### Scene save/load

The Save/Load buttons round-trip the active world through
[`WorldSerializer`](src/engine/serialization/WorldSerializer.ts). Each component
type registers a small codec on a
[`ComponentRegistry`](src/engine/serialization/ComponentRegistry.ts) describing
how it converts to/from JSON — the engine registers its built-ins
(`registerBuiltinComponents`) and the game registers its own
(`registerGameComponents`). Entity ids aren't persisted because components hold
no cross-entity references, so loading recreates entities with fresh ids and no
remapping. A round-trip test lives in
[`scripts/roundtrip-test.mts`](scripts/roundtrip-test.mts) — run it with
`npm test`.

### The simulation pipeline

Systems run in a deliberate order each fixed step (defined in
[`GameScene`](src/game/scenes/GameScene.ts)):

```
input → enemy AI → spawning → weapons → movement →
collision/damage → experience/progression → death-reaping → lifetime cleanup
```

---

## Extending the engine

Everything is data-driven where it counts:

- **Add an enemy** — append an entry to [`data/enemies.ts`](src/game/data/enemies.ts).
  The spawner and factory pick it up automatically (respecting `unlockTime`).
- **Add a weapon** — add a blueprint to [`data/weapons.ts`](src/game/data/weapons.ts).
- **Add a rune** — add an entry to [`data/runes.ts`](src/game/data/runes.ts) with
  a glyph, flavour line, and an `apply(world, player)` mutation. It joins the
  Kenning choice pool automatically.
- **Add a behaviour** — write a `System` subclass and register it in the scene.
- **Add a component** — a plain class implementing `Component`; store it on
  entities via `world.add(entity, new MyComponent())`.

---

## Roadmap / TODOs

The scaffold is intentionally a foundation. The most impactful next steps:

- [x] **Level-up choice UI** — leveling pauses the sim and offers a pick-3 of
      rune-kennings ([`KenningScreen`](src/game/ui/KenningScreen.ts) +
      [`data/runes.ts`](src/game/data/runes.ts)).
- [ ] **Multiple simultaneous weapons** per player (weapon inventory).
- [ ] **Object pooling** for projectiles/enemies/gems to cut GC pressure at high
      entity counts.
- [ ] **Sprite/animation support** — `Sprite` already supports images and sprite
      sheets; add an `Animator` component + system and wire up `AssetLoader`.
- [x] **Audio** — `AudioManager` synthesizes SFX off the gameplay event bus.
- [x] **Game feel / juice** — screen shake, hit flashes, damage numbers, kill
      particles (see `EffectsSystem`).
- [ ] **Boss / elite enemies and wave scripting.**
- [ ] **Persistence / meta-progression** between runs.
- [ ] **Responsive canvas** — handle window resize and DPI scaling.

Editor:

- [x] **Scene save/load** — serialize the world to/from JSON.
- [x] **Data-driven weapons** — weapon stats are tunable in the Data panel.
- [ ] **Place-entities tool** — click to spawn entities from a palette into the
      world (building on save/load).
- [ ] **Add-component / add-entity** actions in the Inspector.
- [ ] **Undo/redo** for edits.

---

## License

MIT
