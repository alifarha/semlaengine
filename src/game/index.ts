/**
 * Game layer barrel — the vampire-survivor content built on top of the engine.
 * Import scenes from here to start a game:
 *   import { MenuScene } from "@game";
 */

// Scenes
export { MenuScene } from "./scenes/MenuScene";
export { GameScene } from "./scenes/GameScene";
export { GameOverScene, type RunSummary } from "./scenes/GameOverScene";
export { UpgradeScene } from "./scenes/UpgradeScene";

// Components
export { Player } from "./components/Player";
export { Enemy } from "./components/Enemy";
export { Boss, type BossRole } from "./components/Boss";
export { Weapon } from "./components/Weapon";
export { WeaponInventory } from "./components/WeaponInventory";
export { Projectile } from "./components/Projectile";
export { ExperienceGem } from "./components/ExperienceGem";
export { PlayerProgress } from "./components/PlayerProgress";
export {
  DraugrForm,
  FormState,
  formForFullness,
  type FormProfile,
} from "./components/DraugrForm";

// Data
export { ENEMIES, ENEMY_LIST, type EnemyDef } from "./data/enemies";
export {
  WEAPONS,
  STARTING_WEAPON,
  weaponFromDef,
  type WeaponDef,
  type WeaponStats,
} from "./data/weapons";
export { RUNES, rollKennings, type Rune } from "./data/runes";
export { WAVES, type WaveEvent } from "./data/waves";

// Meta-progression
export {
  META_UPGRADES,
  loadMeta,
  saveMeta,
  setMetaStorage,
  addShards,
  buyUpgrade,
  upgradeCost,
  shardsForRun,
  metaBonuses,
  type MetaState,
  type MetaStorage,
  type MetaUpgradeDef,
  type MetaBonuses,
} from "./meta";

// Events
export { createGameEventBus, type GameEvents, type GameEventBus } from "./events";

// Serialization
export { registerGameComponents } from "./serialization";
