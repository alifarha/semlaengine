import type { Component, ComponentClass } from "./Component";
import { type Entity, NULL_ENTITY } from "./Entity";

/**
 * The ECS database: owns entities and their components.
 *
 * Components are stored in a `Map<Entity, Component>` per component type
 * ("structure of maps"). Lookups and adds are O(1); queries iterate the
 * smallest matching store. This is a pragmatic design that performs well into
 * the thousands of entities without the complexity of archetype storage.
 *
 * Destruction is deferred: entities marked for removal are purged at the end of
 * the frame so systems can safely iterate while killing entities.
 */
export class World {
  private nextId = 0;
  private readonly living = new Set<Entity>();
  private readonly pendingDestroy = new Set<Entity>();

  /** componentClass -> (entity -> component instance) */
  private readonly stores = new Map<ComponentClass, Map<Entity, Component>>();

  // --- Entity lifecycle ---

  createEntity(): Entity {
    const id = this.nextId++;
    this.living.add(id);
    return id;
  }

  isAlive(entity: Entity): boolean {
    return this.living.has(entity) && !this.pendingDestroy.has(entity);
  }

  /** Mark an entity for removal at the next {@link flushDestroyed}. */
  destroyEntity(entity: Entity): void {
    if (this.living.has(entity)) this.pendingDestroy.add(entity);
  }

  /** Remove all components of entities marked for destruction. */
  flushDestroyed(): void {
    if (this.pendingDestroy.size === 0) return;
    for (const entity of this.pendingDestroy) {
      for (const store of this.stores.values()) store.delete(entity);
      this.living.delete(entity);
    }
    this.pendingDestroy.clear();
  }

  get entityCount(): number {
    return this.living.size;
  }

  // --- Components ---

  add<T extends Component>(entity: Entity, component: T): T {
    const ctor = component.constructor as ComponentClass<T>;
    let store = this.stores.get(ctor);
    if (!store) {
      store = new Map();
      this.stores.set(ctor, store);
    }
    store.set(entity, component);
    return component;
  }

  remove<T extends Component>(entity: Entity, ctor: ComponentClass<T>): void {
    this.stores.get(ctor)?.delete(entity);
  }

  get<T extends Component>(entity: Entity, ctor: ComponentClass<T>): T | undefined {
    return this.stores.get(ctor)?.get(entity) as T | undefined;
  }

  has(entity: Entity, ctor: ComponentClass): boolean {
    return this.stores.get(ctor)?.has(entity) ?? false;
  }

  /**
   * Iterate entities that have all of the given component types.
   *
   * Iterates the smallest matching store for efficiency, so put the most
   * selective (rarest) component first for a minor extra win, though the
   * implementation already picks the smallest store automatically.
   */
  *query(...ctors: ComponentClass[]): IterableIterator<Entity> {
    if (ctors.length === 0) return;

    // Find the smallest store to iterate as the "driver".
    let smallest: Map<Entity, Component> | undefined;
    for (const ctor of ctors) {
      const store = this.stores.get(ctor);
      if (!store) return; // some required component has no entities at all
      if (!smallest || store.size < smallest.size) smallest = store;
    }
    if (!smallest) return;

    outer: for (const entity of smallest.keys()) {
      if (this.pendingDestroy.has(entity)) continue;
      for (const ctor of ctors) {
        if (!this.stores.get(ctor)!.has(entity)) continue outer;
      }
      yield entity;
    }
  }

  /** Collect a query into an array — safe to mutate the world while iterating. */
  queryArray(...ctors: ComponentClass[]): Entity[] {
    return [...this.query(...ctors)];
  }

  /** Number of entities that have all of the given component types. */
  count(...ctors: ComponentClass[]): number {
    let n = 0;
    for (const _ of this.query(...ctors)) n++;
    return n;
  }

  /** First entity matching the query, or NULL_ENTITY. Useful for singletons. */
  first(...ctors: ComponentClass[]): Entity {
    for (const entity of this.query(...ctors)) return entity;
    return NULL_ENTITY;
  }

  // --- Reflection (for tooling: editor, debug inspector) ---

  /** Snapshot of all currently-live entities. */
  liveEntities(): Entity[] {
    const out: Entity[] = [];
    for (const entity of this.living) {
      if (!this.pendingDestroy.has(entity)) out.push(entity);
    }
    return out;
  }

  /** The component instances on an entity, paired with their class. */
  componentsOf(entity: Entity): { type: ComponentClass; component: Component }[] {
    const out: { type: ComponentClass; component: Component }[] = [];
    for (const [ctor, store] of this.stores) {
      const component = store.get(entity);
      if (component) out.push({ type: ctor, component });
    }
    return out;
  }

  /** Remove every entity and component. */
  clear(): void {
    this.stores.clear();
    this.living.clear();
    this.pendingDestroy.clear();
    this.nextId = 0;
  }
}
