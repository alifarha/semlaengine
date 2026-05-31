import type { Component } from "@engine";

/** The two wolves of the Sköll & Hati encounter. */
export type BossRole = "skoll" | "hati";

/**
 * Marks an entity as a boss and links it to the encounter logic in
 * `BossSystem`. Bosses also carry the normal {@link Enemy}/{@link Health}
 * components so existing collision, damage and death handling apply to them.
 */
export class Boss implements Component {
  enraged = false;

  constructor(
    public name: string,
    public role: BossRole,
  ) {}
}
