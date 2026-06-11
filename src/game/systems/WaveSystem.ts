import {
  System,
  type World,
  type Time,
  type Camera,
  Transform,
  MathUtils,
} from "@engine";
import { Player } from "../components/Player";
import { ENEMIES } from "../data/enemies";
import { WAVES, type WaveEvent } from "../data/waves";
import { createEnemy } from "../entities/createEnemy";
import { spawnFloatingText } from "../entities/createEffects";
import type { GameEventBus } from "../events";

/**
 * Fires the scripted {@link WAVES} as the run clock passes each event's time.
 * Formations spawn just outside the view like regular spawns; "ring" surrounds
 * the player evenly, "cluster" arrives bunched from one random direction.
 */
export class WaveSystem extends System {
  /** Index of the next unfired wave (WAVES is ordered by time). */
  private next = 0;

  constructor(
    private readonly events: GameEventBus,
    private readonly camera?: Camera,
  ) {
    super();
  }

  update(world: World, time: Time): void {
    if (this.next >= WAVES.length) return;
    const player = world.first(Player, Transform);
    if (player < 0) return;
    const pos = world.get(player, Transform)!.position;

    while (this.next < WAVES.length && time.elapsed >= WAVES[this.next].at) {
      this.spawnWave(world, WAVES[this.next], pos.x, pos.y);
      this.next++;
    }
  }

  private spawnRadius(): number {
    if (!this.camera) return 620; // headless fallback (tests)
    return (
      Math.hypot(this.camera.viewportWidth, this.camera.viewportHeight) /
        (2 * this.camera.zoom) +
      80
    );
  }

  private spawnWave(world: World, wave: WaveEvent, px: number, py: number): void {
    const def = ENEMIES[wave.enemyId];
    if (!def) return;

    const radius = this.spawnRadius();
    const baseAngle = MathUtils.randRange(0, MathUtils.TAU);
    for (let i = 0; i < wave.count; i++) {
      // Ring: evenly spaced. Cluster: bunched in a ~40° arc on one side.
      const angle =
        wave.formation === "ring"
          ? baseAngle + (i / wave.count) * MathUtils.TAU
          : baseAngle + MathUtils.randRange(-0.35, 0.35);
      createEnemy(
        world,
        def,
        px + Math.cos(angle) * radius,
        py + Math.sin(angle) * radius,
        { elite: wave.elite ?? false },
      );
    }

    if (wave.label) {
      spawnFloatingText(world, px, py - 40, wave.label, "#d4af6a", 15, 1.6);
    }
    this.events.emit("waveSpawned", { label: wave.label ?? "" });
  }
}
