import type { Engine, World, Entity } from "@engine";

/**
 * The shared surface panels use to read engine state and drive selection.
 * Implemented by {@link Editor}; passed to every panel so they stay decoupled
 * from each other and from the editor's DOM wiring.
 */
export interface EditorContext {
  readonly engine: Engine;
  /** The active scene's world, or null between scene transitions. */
  readonly world: World | null;
  /** Currently selected entity, or null. */
  readonly selected: Entity | null;
  /** Select an entity (or clear with null); refreshes dependent panels. */
  select(entity: Entity | null): void;
  /** Request a refresh of all panels (e.g. after an edit changes structure). */
  requestRefresh(): void;
}
