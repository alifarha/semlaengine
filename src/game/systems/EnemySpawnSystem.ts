import {
  System,
  type World,
  type Time,
  type Camera,
  Transform,
  Vector2,
  MathUtils,
} from "@engine";
import { Player } from "../components/Player";
import { Enemy } from "../components/Enemy";
import { createEnemy } from "../entities/createEnemy";
import { ENEMY_LIST } from "../data/enemies";

/**
 * Spawns enemies in a ring just outside the camera view so the swarm appears to
 * close in from all sides. The spawn rate and enemy pool ramp up with run time
 * — the core difficulty curve of the genre.
 */
export class EnemySpawnSystem extends System {
  private timer = 0;

  /** Hard cap so the simulation stays performant. */
  private maxEnemies = 600;

  private readonly scratch = new Vector2();

  constructor(
    /** Used to size the spawn ring to whatever is currently visible. */
    private readonly camera?: Camera,
  ) {
    super();
  }

  /**
   * Distance from the player at which enemies appear: just past the viewport's
   * half-diagonal, so spawns never pop into view regardless of window size.
   */
  private spawnRadius(): number {
    if (!this.camera) return 620; // headless fallback (tests)
    const halfDiag =
      Math.hypot(this.camera.viewportWidth, this.camera.viewportHeight) /
      (2 * this.camera.zoom);
    return halfDiag + 80;
  }

  update(world: World, time: Time): void {
    const playerEntity = world.first(Player, Transform);
    if (playerEntity < 0) return;
    const playerPos = world.get(playerEntity, Transform)!.position;

    // Spawn interval shrinks from ~0.9s down to ~0.15s over ~5 minutes.
    const minutes = time.elapsed / 60;
    const interval = Math.max(0.15, 0.9 - minutes * 0.15);

    this.timer -= time.scaledDelta;
    if (this.timer > 0) return;
    this.timer = interval;

    // Count enemies specifically — total entityCount also includes gems,
    // projectiles, and particles, which would throttle spawning unrelatedly.
    if (world.count(Enemy) >= this.maxEnemies) return;

    // Larger batches as the run progresses.
    const batch = 1 + Math.floor(minutes);
    const available = ENEMY_LIST.filter((e) => e.unlockTime <= time.elapsed);
    if (available.length === 0) return;

    // Elite chance ramps from 0 to 8% over the first four minutes.
    const eliteChance = Math.min(0.08, minutes * 0.02);

    const spawnRadius = this.spawnRadius();
    for (let i = 0; i < batch; i++) {
      const angle = MathUtils.randRange(0, MathUtils.TAU);
      this.scratch
        .set(Math.cos(angle), Math.sin(angle))
        .scale(spawnRadius);
      const def = MathUtils.randChoice(available);
      createEnemy(
        world,
        def,
        playerPos.x + this.scratch.x,
        playerPos.y + this.scratch.y,
        { elite: Math.random() < eliteChance },
      );
    }
  }
}
