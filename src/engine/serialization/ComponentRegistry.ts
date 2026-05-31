import type { Component, ComponentClass } from "../ecs/Component";

/**
 * Describes how one component type converts to/from plain JSON-safe data.
 *
 * Components are class instances (often with nested objects like Vector2), so
 * each type provides explicit `serialize`/`deserialize` rather than relying on
 * structural copying — this keeps nested instances correct and lets a type omit
 * non-serializable fields (e.g. a Sprite's loaded image).
 */
export interface ComponentCodec<T extends Component = Component> {
  /** Stable name written into the JSON (the component's class name). */
  readonly name: string;
  readonly type: ComponentClass<T>;
  serialize(component: T): unknown;
  deserialize(data: unknown): T;
}

/**
 * Maps component classes ↔ names ↔ codecs so the {@link WorldSerializer} can
 * round-trip a world. The engine registers its built-in components; games
 * register their own (see `registerBuiltinComponents`).
 */
export class ComponentRegistry {
  private readonly byName = new Map<string, ComponentCodec>();
  private readonly byType = new Map<ComponentClass, ComponentCodec>();

  register<T extends Component>(codec: ComponentCodec<T>): this {
    this.byName.set(codec.name, codec as ComponentCodec);
    this.byType.set(codec.type, codec as ComponentCodec);
    return this;
  }

  forType(type: ComponentClass): ComponentCodec | undefined {
    return this.byType.get(type);
  }

  forName(name: string): ComponentCodec | undefined {
    return this.byName.get(name);
  }
}
