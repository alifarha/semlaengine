import { GameLoop } from "./core/GameLoop";
import { SceneManager } from "./core/SceneManager";
import { Renderer } from "./rendering/Renderer";
import { InputManager } from "./input/InputManager";
import { AssetLoader } from "./assets/AssetLoader";
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
export class Engine {
  readonly renderer: Renderer;
  readonly input: InputManager;
  readonly assets: AssetLoader;
  readonly scenes: SceneManager;
  readonly context: EngineContext;

  private readonly loop: GameLoop;

  constructor(options: EngineOptions) {
    this.renderer = new Renderer(options.canvas);
    this.input = new InputManager(options.canvas);
    this.assets = new AssetLoader();
    this.scenes = new SceneManager();

    this.loop = new GameLoop({
      update: (time) => {
        this.scenes.update(time);
        this.input.postUpdate();
      },
      render: (alpha) => {
        this.scenes.render(this.renderer, alpha);
      },
    });

    this.context = {
      renderer: this.renderer,
      input: this.input,
      assets: this.assets,
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

  dispose(): void {
    this.stop();
    this.input.dispose();
  }
}
