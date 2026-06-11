/**
 * Enemy archetype definitions. Spawning is data-driven: the spawn system reads
 * these and the entity factory builds the matching entity. Add new enemies by
 * appending an entry — no system changes needed.
 */
export interface EnemyDef {
  readonly id: string;
  readonly health: number;
  readonly speed: number;
  readonly contactDamage: number;
  readonly radius: number;
  readonly xpValue: number;
  readonly color: string;
  /** Earliest run-time (seconds) at which this enemy may start to spawn. */
  readonly unlockTime: number;
}

export const ENEMIES: Record<string, EnemyDef> = {
  bat: {
    id: "bat",
    health: 12,
    speed: 55,
    contactDamage: 6,
    radius: 7,
    xpValue: 1,
    color: "#9b7ede",
    unlockTime: 0,
  },
  zombie: {
    id: "zombie",
    health: 30,
    speed: 38,
    contactDamage: 10,
    radius: 9,
    xpValue: 2,
    color: "#6fae6f",
    unlockTime: 30,
  },
  ghoul: {
    id: "ghoul",
    health: 70,
    speed: 48,
    contactDamage: 16,
    radius: 11,
    xpValue: 4,
    color: "#d27d5a",
    unlockTime: 90,
  },
  wraith: {
    id: "wraith",
    health: 40,
    speed: 78,
    contactDamage: 12,
    radius: 8,
    xpValue: 6,
    color: "#7fd6e0",
    unlockTime: 150,
  },
  troll: {
    id: "troll",
    health: 220,
    speed: 26,
    contactDamage: 28,
    radius: 16,
    xpValue: 12,
    color: "#5a6e4a",
    unlockTime: 240,
  },
};

export const ENEMY_LIST: readonly EnemyDef[] = Object.values(ENEMIES);
