/**
 * Base interface for components. Components are plain data containers — they
 * hold state but no behaviour. Behaviour lives in {@link System}s.
 *
 * A "component type" is identified by its class constructor, which doubles as
 * the lookup key in the {@link World}'s component stores.
 */
export interface Component {}

/** A constructor for a component, used as a type-safe storage key. */
export type ComponentClass<T extends Component = Component> = new (
  ...args: never[]
) => T;
