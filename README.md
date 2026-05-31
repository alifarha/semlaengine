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
```

**Controls:** WASD / arrow keys to move. Weapons fire automatically at the
nearest enemy. Collect green gems to gain XP and level up. Survive.

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
│   └── physics/              # SpatialHashGrid (broadphase)
└── game/                     # the vampire-survivor game
    ├── components/           # Player, Enemy, Weapon, Projectile, gems, progress
    ├── systems/              # control, AI, spawning, weapons, collision, XP…
    ├── entities/             # factory functions (createPlayer, createEnemy…)
    ├── data/                 # data-driven enemies, weapons, upgrades
    ├── scenes/               # MenuScene, GameScene, GameOverScene
    ├── ui/                   # Hud (screen-space overlay)
    └── events.ts             # typed gameplay event bus
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
- **Add an upgrade** — add an entry to [`data/upgrades.ts`](src/game/data/upgrades.ts)
  with an `apply(world, player)` mutation.
- **Add a behaviour** — write a `System` subclass and register it in the scene.
- **Add a component** — a plain class implementing `Component`; store it on
  entities via `world.add(entity, new MyComponent())`.

---

## Roadmap / TODOs

The scaffold is intentionally a foundation. The most impactful next steps:

- [ ] **Level-up upgrade selection UI** — currently the
      [`ExperienceSystem`](src/game/systems/ExperienceSystem.ts) auto-applies a
      random upgrade on level-up. Replace with a pause-and-choose-from-three
      screen (the signature meta-decision of the genre).
- [ ] **Multiple simultaneous weapons** per player (weapon inventory).
- [ ] **Object pooling** for projectiles/enemies/gems to cut GC pressure at high
      entity counts.
- [ ] **Sprite/animation support** — `Sprite` already supports images and sprite
      sheets; add an `Animator` component + system and wire up `AssetLoader`.
- [ ] **Audio** — an `AudioManager` subscribing to the gameplay event bus.
- [ ] **Boss / elite enemies and wave scripting.**
- [ ] **Persistence / meta-progression** between runs.
- [ ] **Responsive canvas** — handle window resize and DPI scaling.

---

## License

MIT
