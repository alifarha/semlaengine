import { EventEmitter, type Entity } from "@engine";

/**
 * Typed gameplay events. Systems emit these; the HUD, audio, and effects
 * systems subscribe — keeping them decoupled. A single shared bus is passed to
 * the systems that need it (see `GameScene`).
 */
export type GameEvents = {
  weaponFired: { x: number; y: number; count: number };
  enemyDamaged: { entity: Entity; x: number; y: number; amount: number; killed: boolean };
  enemyKilled: { x: number; y: number; xpValue: number };
  gemCollected: { value: number };
  playerLeveledUp: { level: number };
  playerDamaged: { amount: number; remaining: number };
  playerDied: void;
  draugrFormChanged: { state: string; ascending: boolean };
};

export type GameEventBus = EventEmitter<GameEvents>;

export function createGameEventBus(): GameEventBus {
  return new EventEmitter<GameEvents>();
}
