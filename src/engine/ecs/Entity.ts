/**
 * An entity is just an opaque numeric id. All state lives in components stored
 * on the {@link World}. This keeps entities cheap to create and destroy — the
 * genre routinely has thousands of them alive at once.
 */
export type Entity = number;

/** Reserved id meaning "no entity". */
export const NULL_ENTITY: Entity = -1;
