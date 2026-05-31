import { System } from "../System";
import type { World } from "../World";
import type { Time } from "../../core/Time";
import { Lifetime } from "../components/Lifetime";

/** Counts down {@link Lifetime} and destroys entities whose time runs out. */
export class LifetimeSystem extends System {
  update(world: World, time: Time): void {
    const dt = time.scaledDelta;
    for (const entity of world.query(Lifetime)) {
      const lifetime = world.get(entity, Lifetime)!;
      lifetime.remaining -= dt;
      if (lifetime.remaining <= 0) world.destroyEntity(entity);
    }
  }
}
