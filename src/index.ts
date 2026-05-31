import { Engine, ComponentRegistry, WorldSerializer, registerBuiltinComponents } from "@engine";
import { MenuScene } from "@game/scenes/MenuScene";
import { ENEMIES, WEAPONS, registerGameComponents } from "@game";
import { Editor, type DataSource } from "@editor";

/**
 * Bootstraps the demo game. The `index.html` canvas drives a fixed-size view;
 * resize handling could be added by listening for window resize and calling
 * `engine.renderer` / camera resize.
 */
const canvas = document.getElementById("game") as HTMLCanvasElement | null;
if (!canvas) throw new Error("Semla: #game canvas not found in the document.");

const engine = new Engine({ canvas });
engine.start(new MenuScene(engine.context));

// A serializer that knows every engine + game component, for scene save/load.
const registry = new ComponentRegistry();
registerBuiltinComponents(registry);
registerGameComponents(registry);
const serializer = new WorldSerializer(registry);

// Attach the in-game editor (press ` / backtick to toggle). Expose the game's
// balance data so it can be tuned live. Omit this block in a shipping build.
const enemyData: DataSource = {
  name: "Enemies",
  entries: () =>
    Object.values(ENEMIES).map((def) => ({
      id: def.id,
      target: def as unknown as Record<string, unknown>,
    })),
};
const weaponData: DataSource = {
  name: "Weapons",
  entries: () =>
    Object.values(WEAPONS).map((def) => ({
      id: def.id,
      target: def.stats as unknown as Record<string, unknown>,
    })),
};
const editor = new Editor(engine, {
  dataSources: [enemyData, weaponData],
  serializer,
});

// Expose for quick debugging in the browser console.
Object.assign(window as unknown as Record<string, unknown>, { engine, editor });
