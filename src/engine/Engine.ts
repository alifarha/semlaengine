import { GameLoop } from "./core/GameLoop";
import { SceneManager } from "./core/SceneManager";
import { Renderer } from "./rendering/Renderer";
import { InputManager } from "./input/InputManager";
import { AssetLoader } from "./assets/AssetLoader";
import { AudioManager } from "./audio/AudioManager";
import type { EngineContext } from "./core/EngineContext";
import type { Scene } from "./core/Scene";

export interface EngineOptions {
  canvas: HTMLCanvasElement;
}

/**
 * Top-level orchestrator. Constructs the core services (renderer, input,
 * assets), drives the fixed-timestep {@link GameLoop}, and routes update/render
 * to the active scene via the {@link SceneManager}.
 *
 * @example
 *   const engine = new Engine({ canvas });
 *   engine.start(new GameScene(engine.context));
 */
/** A draw callback invoked after the scene, in screen space, each frame. */
export type RenderOverlay = (renderer: Renderer, alpha: number) => void;

export class Engine {
  readonly renderer: Renderer;
  readonly input: InputManager;
  readonly assets: AssetLoader;
  readonly audio: AudioManager;
  readonly scenes: SceneManager;
  readonly context: EngineContext;

  private readonly loop: GameLoop;
  private readonly overlays: RenderOverlay[] = [];

  constructor(options: EngineOptions) {
    this.renderer = new Renderer(options.canvas);
    this.input = new InputManager(options.canvas);
    this.assets = new AssetLoader();
    this.audio = new AudioManager();
    this.audio.unlockOnGesture();
    this.scenes = new SceneManager();

    this.loop = new GameLoop({
      update: (time) => {
        this.scenes.update(time);
        this.input.postUpdate();
      },
      render: (alpha) => {
        this.scenes.render(this.renderer, alpha);
        for (const overlay of this.overlays) overlay(this.renderer, alpha);
        // While paused no fixed updates run, so flush input edges here instead
        // — otherwise presses made during the pause pile up and replay as a
        // burst of stale "pressed this frame" edges on the first resumed step.
        if (this.loop.isPaused) this.input.postUpdate();
      },
    });

    this.context = {
      renderer: this.renderer,
      input: this.input,
      assets: this.assets,
      audio: this.audio,
      time: this.loop.getTime(),
      scenes: this.scenes,
    };
  }

  /** Activate an initial scene and begin the loop. */
  start(initialScene: Scene): void {
    this.scenes.change(initialScene);
    this.loop.start();
  }

  stop(): void {
    this.loop.stop();
  }

  // --- Loop control (surfaced for tooling such as the editor) ---

  pause(): void {
    this.loop.pause();
  }
  resume(): void {
    this.loop.resume();
  }
  togglePause(): void {
    this.loop.togglePause();
  }
  get isPaused(): boolean {
    return this.loop.isPaused;
  }
  /** Advance a single fixed simulation step while paused. */
  step(): void {
    this.loop.requestStep(1);
  }

  /** Register a screen-space draw callback run after the scene each frame. */
  addRenderOverlay(overlay: RenderOverlay): () => void {
    this.overlays.push(overlay);
    return () => {
      const i = this.overlays.indexOf(overlay);
      if (i >= 0) this.overlays.splice(i, 1);
    };
  }

  dispose(): void {
    this.stop();
    this.input.dispose();
  }
}
