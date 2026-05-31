import type { Component } from "../Component";

/**
 * Marks an entity as ephemeral (particles, floating text, etc.). The
 * {@link WorldSerializer} skips entities tagged Transient so transient visual
 * effects never end up in a saved scene.
 */
export class Transient implements Component {}
