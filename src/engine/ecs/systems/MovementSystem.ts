import { System } from "../System";
import type { World } from "../World";
import type { Time } from "../../core/Time";
import { Transform } from "../components/Transform";
import { Velocity } from "../components/Velocity";

/**
 * Integrates {@link Velocity} into {@link Transform} position each step.
 *
 * Snapshots the previous position first so the renderer can interpolate between
 * fixed steps for smooth motion at any display refresh rate.
 */
export class MovementSystem extends System {
  update(world: World, time: Time): void {
    const dt = time.scaledDelta;
    for (const entity of world.query(Transform, Velocity)) {
      const transform = world.get(entity, Transform)!;
      const velocity = world.get(entity, Velocity)!;
      transform.savePrevious();
      transform.position.x += velocity.value.x * dt;
      transform.position.y += velocity.value.y * dt;
    }
  }
}
