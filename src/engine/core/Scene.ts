import { World } from "../ecs/World";
import type { System } from "../ecs/System";
import type { Time } from "./Time";
import type { Renderer } from "../rendering/Renderer";
import type { EngineContext } from "./EngineContext";

/**
 * A self-contained slice of the game — a menu, the main play field, a results
 * screen. Each scene owns its own ECS {@link World} and an ordered list of
 * simulation systems. Rendering is left to the subclass so it can mix ECS draws
 * with bespoke UI.
 */
export abstract class Scene {
  readonly world = new World();
  protected readonly systems: System[] = [];

  constructor(protected readonly ctx: EngineContext) {}

  /** Register a simulation system; its `init` runs immediately. */
  protected addSystem(system: System): void {
    system.init?.(this.world);
    this.systems.push(system);
  }

  /** Called when this scene becomes active. Build entities/systems here. */
  abstract onEnter(): void;

  /** Called when the scene is replaced. Default tears down systems + world. */
  onExit(): void {
    for (const system of this.systems) system.dispose?.(this.world);
    this.systems.length = 0;
    this.world.clear();
  }

  /** Run all enabled systems in order, then purge destroyed entities. */
  update(time: Time): void {
    for (const system of this.systems) {
      if (system.enabled) system.update(this.world, time);
    }
    this.world.flushDestroyed();
  }

  /** Draw the scene. `alpha` is the render interpolation factor [0,1]. */
  abstract render(renderer: Renderer, alpha: number): void;
}
