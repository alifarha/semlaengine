/**
 * A 2D vector.
 *
 * Instance methods mutate `this` and return it for chaining — this avoids
 * per-frame allocations in hot loops (movement, collision) where thousands of
 * entities are processed. Use the static helpers when you need a fresh result.
 */
export class Vector2 {
  constructor(
    public x = 0,
    public y = 0,
  ) {}

  set(x: number, y: number): this {
    this.x = x;
    this.y = y;
    return this;
  }

  copy(v: Vector2): this {
    this.x = v.x;
    this.y = v.y;
    return this;
  }

  clone(): Vector2 {
    return new Vector2(this.x, this.y);
  }

  add(v: Vector2): this {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  sub(v: Vector2): this {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }

  scale(s: number): this {
    this.x *= s;
    this.y *= s;
    return this;
  }

  /** Length of the vector. */
  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  /** Squared length — cheaper than `length()` when only comparing distances. */
  lengthSq(): number {
    return this.x * this.x + this.y * this.y;
  }

  /** Scale to unit length. A zero vector is left unchanged. */
  normalize(): this {
    const len = this.length();
    if (len > 1e-8) {
      this.x /= len;
      this.y /= len;
    }
    return this;
  }

  distanceTo(v: Vector2): number {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  distanceToSq(v: Vector2): number {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    return dx * dx + dy * dy;
  }

  dot(v: Vector2): number {
    return this.x * v.x + this.y * v.y;
  }

  /** Angle in radians from the +x axis. */
  angle(): number {
    return Math.atan2(this.y, this.x);
  }

  // --- Static helpers (allocate a new Vector2) ---

  static zero(): Vector2 {
    return new Vector2(0, 0);
  }

  static fromAngle(radians: number, length = 1): Vector2 {
    return new Vector2(Math.cos(radians) * length, Math.sin(radians) * length);
  }

  static lerp(a: Vector2, b: Vector2, t: number): Vector2 {
    return new Vector2(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
  }
}
