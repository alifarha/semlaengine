import type { Renderer } from "../rendering/Renderer";
import type { InputManager } from "../input/InputManager";
import type { AssetLoader } from "../assets/AssetLoader";
import type { AudioManager } from "../audio/AudioManager";
import type { Time } from "./Time";
import type { SceneManager } from "./SceneManager";

/** Pause/resume controls surfaced to scenes (e.g. a player-facing pause key). */
export interface LoopControl {
  pause(): void;
  resume(): void;
  togglePause(): void;
  readonly isPaused: boolean;
}

/**
 * Shared services handed to every {@link Scene}. Bundling them keeps scene and
 * system constructors tidy and makes the available engine surface explicit.
 */
export interface EngineContext {
  readonly renderer: Renderer;
  readonly input: InputManager;
  readonly assets: AssetLoader;
  readonly audio: AudioManager;
  readonly time: Time;
  readonly scenes: SceneManager;
  readonly loop: LoopControl;
}
