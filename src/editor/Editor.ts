import {
  type Engine,
  type Entity,
  type World,
  Transform,
  CircleCollider,
} from "@engine";
import type { EditorContext } from "./EditorContext";
import { injectEditorStyles } from "./styles";
import { ToolbarPanel } from "./panels/ToolbarPanel";
import { HierarchyPanel } from "./panels/HierarchyPanel";
import { InspectorPanel } from "./panels/InspectorPanel";
import { DataPanel, type DataSource } from "./panels/DataPanel";

export interface EditorOptions {
  /** Key code that toggles the editor. Defaults to Backquote (`). */
  toggleKey?: string;
  /** Game data definitions to expose in the Data/Balance panel. */
  dataSources?: DataSource[];
}

interface ScheduledPanel {
  refresh(): void;
  interval: number;
  last: number;
}

/**
 * The editor shell: a DOM overlay over the game canvas, toggled with a key.
 *
 * It hosts a toolbar plus docked panels (Hierarchy, Inspector, Data) and wires
 * up the cross-cutting concerns those panels rely on — entity selection,
 * canvas click-picking, a selection highlight drawn via an engine render
 * overlay, and suspending game keyboard input while a field is focused.
 *
 * The editor is purely additive: nothing in the engine or game depends on it,
 * so it can be dropped from a shipping build by simply not constructing it.
 */
export class Editor implements EditorContext {
  readonly engine: Engine;

  private readonly root: HTMLElement;
  private readonly toolbar: ToolbarPanel;
  private readonly hierarchy: HierarchyPanel;
  private readonly inspector: InspectorPanel;
  private readonly dataPanel: DataPanel;
  private readonly scheduled: ScheduledPanel[];

  private readonly toggleKey: string;
  private visible = false;
  private _selected: Entity | null = null;
  private rafId = 0;
  private removeOverlay: (() => void) | null = null;

  constructor(engine: Engine, options: EditorOptions = {}) {
    this.engine = engine;
    this.toggleKey = options.toggleKey ?? "Backquote";

    injectEditorStyles();

    // --- DOM shell ---
    this.root = document.createElement("div");
    this.root.className = "semla-editor hidden";

    this.toolbar = new ToolbarPanel(this, () => this.hide());

    const leftDock = document.createElement("div");
    leftDock.className = "semla-dock left";
    this.hierarchy = new HierarchyPanel(this);
    leftDock.appendChild(this.hierarchy.element);

    const rightDock = document.createElement("div");
    rightDock.className = "semla-dock right";
    this.inspector = new InspectorPanel(this);
    this.dataPanel = new DataPanel(this, options.dataSources ?? []);
    rightDock.append(this.inspector.element, this.dataPanel.element);

    this.root.append(this.toolbar.element, leftDock, rightDock);
    document.body.appendChild(this.root);

    // Toolbar refreshes every frame (FPS counter); the rest are throttled.
    this.scheduled = [
      { refresh: () => this.toolbar.refresh(), interval: 0, last: 0 },
      { refresh: () => this.hierarchy.refresh(), interval: 120, last: 0 },
      { refresh: () => this.inspector.refresh(), interval: 120, last: 0 },
      { refresh: () => this.dataPanel.refresh(), interval: 120, last: 0 },
    ];

    this.attachEvents();
  }

  // --- EditorContext implementation ---

  get world(): World | null {
    return this.engine.scenes.active?.world ?? null;
  }

  get selected(): Entity | null {
    return this._selected;
  }

  select(entity: Entity | null): void {
    this._selected = entity;
    // Reflect the change immediately rather than waiting for the throttle.
    this.hierarchy.refresh();
    this.inspector.refresh();
  }

  requestRefresh(): void {
    // Edits are written directly to live objects; a structural rebuild isn't
    // required, but refresh the hierarchy in case labels/counts changed.
    this.hierarchy.refresh();
  }

  // --- Visibility ---

  toggle(): void {
    this.visible ? this.hide() : this.show();
  }

  show(): void {
    if (this.visible) return;
    this.visible = true;
    this.root.classList.remove("hidden");
    this.removeOverlay = this.engine.addRenderOverlay(() => this.drawSelection());
    this.refreshAll();
    this.loop();
  }

  hide(): void {
    if (!this.visible) return;
    this.visible = false;
    this.root.classList.add("hidden");
    this.engine.input.enabled = true;
    this.removeOverlay?.();
    this.removeOverlay = null;
    cancelAnimationFrame(this.rafId);
  }

  // --- Internals ---

  private attachEvents(): void {
    window.addEventListener("keydown", (e) => {
      if (e.code === this.toggleKey) {
        e.preventDefault();
        this.toggle();
      }
    });

    // Suspend game keyboard input while typing in an editor field, so WASD in a
    // number box doesn't also drive the player.
    this.root.addEventListener("focusin", () => {
      this.engine.input.enabled = false;
    });
    this.root.addEventListener("focusout", () => {
      this.engine.input.enabled = true;
    });

    // Click-to-pick entities on the canvas (clicks on panels never reach here).
    this.engine.renderer.canvas.addEventListener("pointerdown", (e) => {
      if (!this.visible) return;
      this.pickAt(e);
    });
  }

  private loop = (): void => {
    if (!this.visible) return;
    const now = performance.now();
    for (const item of this.scheduled) {
      if (now - item.last >= item.interval) {
        item.refresh();
        item.last = now;
      }
    }
    this.rafId = requestAnimationFrame(this.loop);
  };

  private refreshAll(): void {
    for (const item of this.scheduled) item.refresh();
  }

  /** Select the entity nearest to a canvas click, or clear the selection. */
  private pickAt(e: PointerEvent): void {
    const world = this.world;
    if (!world) return;

    const canvas = this.engine.renderer.canvas;
    const rect = canvas.getBoundingClientRect();
    const sx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const sy = (e.clientY - rect.top) * (canvas.height / rect.height);
    const point = this.engine.renderer.camera.screenToWorld(sx, sy);

    let best: Entity | null = null;
    let bestDist = Infinity;
    for (const entity of world.query(Transform)) {
      const pos = world.get(entity, Transform)!.position;
      const radius = world.get(entity, CircleCollider)?.radius ?? 8;
      const hit = Math.max(radius, 10);
      const dist = pos.distanceTo(point);
      if (dist <= hit && dist < bestDist) {
        bestDist = dist;
        best = entity;
      }
    }
    this.select(best);
  }

  /** Draw a ring around the selected entity (screen space, post-scene). */
  private drawSelection(): void {
    const world = this.world;
    if (!this.visible || world === null || this._selected === null) return;
    if (!world.isAlive(this._selected)) return;

    const transform = world.get(this._selected, Transform);
    if (!transform) return;

    const { renderer } = this.engine;
    const screen = renderer.camera.worldToScreen(
      transform.position.x,
      transform.position.y,
    );
    const radius =
      (world.get(this._selected, CircleCollider)?.radius ?? 12) *
        renderer.camera.zoom +
      6;

    const ctx = renderer.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.strokeStyle = "#ffd166";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, radius, 0, Math.PI * 2);
    ctx.stroke();
  }
}
