import { Engine } from "@engine";
import { MenuScene } from "@game/scenes/MenuScene";

/**
 * Bootstraps the demo game. The `index.html` canvas drives a fixed-size view;
 * resize handling could be added by listening for window resize and calling
 * `engine.renderer` / camera resize.
 */
const canvas = document.getElementById("game") as HTMLCanvasElement | null;
if (!canvas) throw new Error("Semla: #game canvas not found in the document.");

const engine = new Engine({ canvas });
engine.start(new MenuScene(engine.context));

// Expose for quick debugging in the browser console.
(window as unknown as { engine: Engine }).engine = engine;
