/**
 * Tracks timing for the game loop.
 *
 * `delta` is the fixed-step duration used by update logic (in seconds), while
 * `elapsed` accumulates total simulated time. Keeping a fixed delta makes the
 * simulation deterministic regardless of frame rate — important for a genre
 * where thousands of projectiles and enemies must behave consistently.
 */
export class Time {
  /** Seconds elapsed since the game started (simulated time). */
  elapsed = 0;

  /** Fixed timestep duration in seconds (e.g. 1/60). */
  delta = 1 / 60;

  /** Number of fixed updates run so far. */
  frame = 0;

  /** Global multiplier — set < 1 for slow-mo, 0 to pause, > 1 to speed up. */
  scale = 1;

  /** Delta already multiplied by `scale`; what gameplay systems should use. */
  get scaledDelta(): number {
    return this.delta * this.scale;
  }

  advance(): void {
    this.elapsed += this.scaledDelta;
    this.frame++;
  }
}
