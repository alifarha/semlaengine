import { Vector2 } from "./Vector2";

/** An axis-aligned rectangle defined by its top-left corner and size. */
export class Rect {
  constructor(
    public x = 0,
    public y = 0,
    public width = 0,
    public height = 0,
  ) {}

  get left(): number {
    return this.x;
  }
  get right(): number {
    return this.x + this.width;
  }
  get top(): number {
    return this.y;
  }
  get bottom(): number {
    return this.y + this.height;
  }

  get centerX(): number {
    return this.x + this.width / 2;
  }
  get centerY(): number {
    return this.y + this.height / 2;
  }

  contains(px: number, py: number): boolean {
    return px >= this.x && px <= this.right && py >= this.y && py <= this.bottom;
  }

  containsPoint(point: Vector2): boolean {
    return this.contains(point.x, point.y);
  }

  intersects(other: Rect): boolean {
    return (
      this.x < other.right &&
      this.right > other.x &&
      this.y < other.bottom &&
      this.bottom > other.y
    );
  }
}
