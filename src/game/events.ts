import { EventEmitter } from "@engine";

/**
 * Typed gameplay events. Systems emit these; the HUD, audio, and other systems
 * subscribe — keeping them decoupled. A single shared bus is passed to the
 * systems that need it (see `GameScene`).
 */
export type GameEvents = {
  enemyKilled: { x: number; y: number; xpValue: number };
  gemCollected: { value: number };
  playerLeveledUp: { level: number };
  playerDamaged: { amount: number; remaining: number };
  playerDied: void;
};

export type GameEventBus = EventEmitter<GameEvents>;

export function createGameEventBus(): GameEventBus {
  return new EventEmitter<GameEvents>();
}
