import type { Entity } from "../ecs/Entity";

/**
 * A uniform spatial hash grid for broadphase collision queries.
 *
 * Checking every entity against every other is O(n²) — unworkable when a
 * survivor game has thousands of enemies. The grid buckets entities into cells
 * by position so each query only inspects nearby cells, bringing the average
 * cost down to roughly O(n) for evenly distributed entities.
 *
 * Usage per frame: `clear()`, `insert()` every collidable, then `queryCircle()`
 * (or `queryNeighbors()`) to get candidate pairs to test precisely.
 */
export class SpatialHashGrid {
  private readonly cells = new Map<number, Entity[]>();

  /** Choose a cell size close to the average collider diameter. */
  constructor(public cellSize = 64) {}

  clear(): void {
    this.cells.clear();
  }

  private hash(cx: number, cy: number): number {
    // Cantor-ish pairing into a single number key; cheap and good enough.
    return cx * 73856093 ^ cy * 19349663;
  }

  private cellCoord(value: number): number {
    return Math.floor(value / this.cellSize);
  }

  insert(entity: Entity, x: number, y: number): void {
    const key = this.hash(this.cellCoord(x), this.cellCoord(y));
    const bucket = this.cells.get(key);
    if (bucket) bucket.push(entity);
    else this.cells.set(key, [entity]);
  }

  /**
   * Collect every entity in cells overlapping the circle (x, y, radius).
   * Returns candidates only — the caller still performs the exact distance test.
   */
  queryCircle(x: number, y: number, radius: number, out: Entity[] = []): Entity[] {
    out.length = 0;
    const minCx = this.cellCoord(x - radius);
    const maxCx = this.cellCoord(x + radius);
    const minCy = this.cellCoord(y - radius);
    const maxCy = this.cellCoord(y + radius);

    for (let cy = minCy; cy <= maxCy; cy++) {
      for (let cx = minCx; cx <= maxCx; cx++) {
        const bucket = this.cells.get(this.hash(cx, cy));
        if (bucket) {
          for (let i = 0; i < bucket.length; i++) out.push(bucket[i]);
        }
      }
    }
    return out;
  }
}
