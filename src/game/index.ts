/**
 * Game layer barrel — the vampire-survivor content built on top of the engine.
 * Import scenes from here to start a game:
 *   import { MenuScene } from "@game";
 */

// Scenes
export { MenuScene } from "./scenes/MenuScene";
export { GameScene } from "./scenes/GameScene";
export { GameOverScene, type RunSummary } from "./scenes/GameOverScene";

// Components
export { Player } from "./components/Player";
export { Enemy } from "./components/Enemy";
export { Weapon } from "./components/Weapon";
export { Projectile } from "./components/Projectile";
export { ExperienceGem } from "./components/ExperienceGem";
export { PlayerProgress } from "./components/PlayerProgress";

// Data
export { ENEMIES, ENEMY_LIST, type EnemyDef } from "./data/enemies";
export { WEAPONS, STARTING_WEAPON, type WeaponDef } from "./data/weapons";
export { UPGRADES, type UpgradeDef } from "./data/upgrades";

// Events
export { createGameEventBus, type GameEvents, type GameEventBus } from "./events";
