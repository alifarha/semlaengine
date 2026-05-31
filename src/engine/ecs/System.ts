import type { Time } from "../core/Time";
import type { World } from "./World";

/**
 * A system contains behaviour. Each fixed step the {@link Scene} calls `update`
 * on its systems in registration order; that order defines the simulation
 * pipeline (e.g. input → movement → collision → damage → cleanup).
 *
 * Systems hold no entity state of their own — they query the {@link World}.
 */
export abstract class System {
  /** Set to false to skip this system without removing it. */
  enabled = true;

  /** Called once when the system is added to a scene. */
  init?(world: World): void;

  /** Called every fixed timestep. */
  abstract update(world: World, time: Time): void;

  /** Called when the scene is torn down. */
  dispose?(world: World): void;
}
