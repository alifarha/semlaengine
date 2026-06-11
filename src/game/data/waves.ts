/**
 * Scripted wave events layered on top of the steady trickle from
 * `EnemySpawnSystem`. Each fires once when the run clock passes `at`,
 * spawning a formation just off-screen — these give a run its shape:
 * spikes of pressure with breathing room between.
 */
export interface WaveEvent {
  /** Run time (seconds) at which the wave spawns. */
  readonly at: number;
  /** Enemy archetype id (see data/enemies.ts). */
  readonly enemyId: string;
  readonly count: number;
  /** "ring" surrounds the player; "cluster" arrives from one direction. */
  readonly formation: "ring" | "cluster";
  /** Spawn every member as an elite. */
  readonly elite?: boolean;
  /** Announcement shown above the player. */
  readonly label?: string;
}

/** Must be ordered by `at` — WaveSystem walks the list once per run. */
export const WAVES: readonly WaveEvent[] = [
  { at: 45, enemyId: "bat", count: 14, formation: "ring", label: "The swarm circles!" },
  { at: 100, enemyId: "zombie", count: 10, formation: "cluster", label: "The barrow empties…" },
  { at: 160, enemyId: "ghoul", count: 12, formation: "ring", label: "Hunger answers hunger!" },
  { at: 220, enemyId: "wraith", count: 10, formation: "cluster", label: "Cold mist closes in!" },
  { at: 300, enemyId: "troll", count: 3, formation: "cluster", elite: true, label: "Stone-tread shakes the ground!" },
  { at: 360, enemyId: "wraith", count: 20, formation: "ring", label: "The dead ride the wind!" },
];
