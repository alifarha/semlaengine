import type { World } from "../ecs/World";
import { Transient } from "../ecs/components/Transient";
import type { ComponentRegistry } from "./ComponentRegistry";

export interface SerializedEntity {
  components: Record<string, unknown>;
}

export interface SerializedWorld {
  version: number;
  entities: SerializedEntity[];
}

const FORMAT_VERSION = 1;

/**
 * Serializes a {@link World} to a plain object (and back) using a
 * {@link ComponentRegistry}.
 *
 * Entity ids are intentionally not preserved: components in this engine hold no
 * cross-entity references, so entities can be recreated with fresh ids on load
 * without any remapping. Components whose type has no registered codec are
 * skipped — handy for transient/visual-only components you don't want saved.
 */
export class WorldSerializer {
  constructor(private readonly registry: ComponentRegistry) {}

  serialize(world: World): SerializedWorld {
    const entities: SerializedEntity[] = [];
    for (const entity of world.liveEntities()) {
      if (world.has(entity, Transient)) continue; // skip ephemeral effects
      const components: Record<string, unknown> = {};
      let serializedAny = false;
      for (const { type, component } of world.componentsOf(entity)) {
        const codec = this.registry.forType(type);
        if (codec) {
          components[codec.name] = codec.serialize(component);
          serializedAny = true;
        }
      }
      if (serializedAny) entities.push({ components });
    }
    return { version: FORMAT_VERSION, entities };
  }

  /** Replace the world's contents with the serialized data. */
  deserialize(world: World, data: SerializedWorld): void {
    world.clear();
    for (const entry of data.entities) {
      const entity = world.createEntity();
      for (const [name, componentData] of Object.entries(entry.components)) {
        const codec = this.registry.forName(name);
        if (codec) world.add(entity, codec.deserialize(componentData));
      }
    }
  }

  toJSON(world: World, pretty = true): string {
    return JSON.stringify(this.serialize(world), null, pretty ? 2 : undefined);
  }

  fromJSON(world: World, json: string): void {
    this.deserialize(world, JSON.parse(json) as SerializedWorld);
  }
}
