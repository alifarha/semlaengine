import {
  System,
  type World,
  type Time,
  Transform,
  Vector2,
  MathUtils,
} from "@engine";
import { Player } from "../components/Player";
import { createEnemy } from "../entities/createEnemy";
import { ENEMY_LIST } from "../data/enemies";

/**
 * Spawns enemies in a ring just outside the camera view so the swarm appears to
 * close in from all sides. The spawn rate and enemy pool ramp up with run time
 * — the core difficulty curve of the genre.
 */
export class EnemySpawnSystem extends System {
  private timer = 0;

  /** Distance beyond the player at which enemies appear. */
  private spawnRadius = 420;

  /** Hard cap so the simulation stays performant. */
  private maxEnemies = 600;

  private readonly scratch = new Vector2();

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

    if (world.entityCount >= this.maxEnemies) return;

    // Larger batches as the run progresses.
    const batch = 1 + Math.floor(minutes);
    const available = ENEMY_LIST.filter((e) => e.unlockTime <= time.elapsed);
    if (available.length === 0) return;

    for (let i = 0; i < batch; i++) {
      const angle = MathUtils.randRange(0, MathUtils.TAU);
      this.scratch
        .set(Math.cos(angle), Math.sin(angle))
        .scale(this.spawnRadius);
      const def = MathUtils.randChoice(available);
      createEnemy(
        world,
        def,
        playerPos.x + this.scratch.x,
        playerPos.y + this.scratch.y,
      );
    }
  }
}
