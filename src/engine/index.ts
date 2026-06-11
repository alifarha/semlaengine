/**
 * Semla Engine — public API barrel.
 *
 * Game code imports engine pieces from here:
 *   import { Engine, Scene, World, Vector2 } from "@engine";
 */

// Core
export { Engine, type EngineOptions, type RenderOverlay } from "./Engine";
export { GameLoop } from "./core/GameLoop";
export { Time } from "./core/Time";
export { Scene } from "./core/Scene";
export { SceneManager } from "./core/SceneManager";
export { EventEmitter } from "./core/EventEmitter";
export type { EngineContext, LoopControl } from "./core/EngineContext";

// ECS
export { World } from "./ecs/World";
export { System } from "./ecs/System";
export { type Entity, NULL_ENTITY } from "./ecs/Entity";
export type { Component, ComponentClass } from "./ecs/Component";

// Built-in components
export { Transform } from "./ecs/components/Transform";
export { Velocity } from "./ecs/components/Velocity";
export { Sprite } from "./ecs/components/Sprite";
export {
  CircleCollider,
  CollisionLayers,
  type CollisionLayer,
} from "./ecs/components/CircleCollider";
export { Health } from "./ecs/components/Health";
export { Lifetime } from "./ecs/components/Lifetime";
export { Transient } from "./ecs/components/Transient";
export { Animator } from "./ecs/components/Animator";

// Built-in reusable systems
export { MovementSystem } from "./ecs/systems/MovementSystem";
export { LifetimeSystem } from "./ecs/systems/LifetimeSystem";
export { AnimationSystem } from "./ecs/systems/AnimationSystem";

// Math
export { Vector2 } from "./math/Vector2";
export { Rect } from "./math/Rect";
export * as MathUtils from "./math/MathUtils";

// Rendering
export { Renderer } from "./rendering/Renderer";
export { Camera } from "./rendering/Camera";

// Input / assets / audio / physics
export { InputManager } from "./input/InputManager";
export { AssetLoader } from "./assets/AssetLoader";
export { AudioManager, type ToneOptions } from "./audio/AudioManager";
export { SpatialHashGrid } from "./physics/SpatialHashGrid";

// Serialization
export {
  ComponentRegistry,
  type ComponentCodec,
} from "./serialization/ComponentRegistry";
export {
  WorldSerializer,
  type SerializedWorld,
  type SerializedEntity,
} from "./serialization/WorldSerializer";
export { registerBuiltinComponents } from "./serialization/builtinComponents";
