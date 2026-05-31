import type { Component } from "@engine";

/**
 * Tracks the player's level and experience for a run. Lives on the player
 * entity. The XP curve is intentionally simple here — tune `xpForLevel` to
 * shape pacing.
 */
export class PlayerProgress implements Component {
  level = 1;
  xp = 0;
  /** XP needed to reach the next level. */
  xpToNext = 5;

  /** Enemies defeated this run (for the HUD / results screen). */
  kills = 0;

  /** XP required to advance from `level` to `level + 1`. */
  static xpForLevel(level: number): number {
    return Math.floor(5 + level * level * 1.5);
  }
}
