import type { Entity, World } from "@engine";
import { EditorPanel } from "../EditorPanel";
import type { EditorContext } from "../EditorContext";

/** Core components that don't make a good "primary" label for an entity. */
const CORE = new Set([
  "Transform",
  "Velocity",
  "Sprite",
  "CircleCollider",
  "Health",
  "Lifetime",
]);

/** Max rows rendered — the swarm can be huge, so the list is capped. */
const MAX_ROWS = 80;

/**
 * Lists live entities so they can be selected. Shows a per-type count summary
 * (the swarm makes a flat list impractical) followed by a capped, clickable
 * list. Selection is also possible by clicking entities directly on the canvas.
 */
export class HierarchyPanel extends EditorPanel {
  constructor(ctx: EditorContext) {
    super("Hierarchy", ctx);
  }

  refresh(): void {
    const world = this.ctx.world;
    const scrollTop = this.body.scrollTop;
    this.body.replaceChildren();

    if (!world) {
      this.body.appendChild(empty("No active scene"));
      return;
    }

    const entities = world.liveEntities();

    // --- Per-type counts ---
    const counts = new Map<string, number>();
    for (const e of entities) {
      const name = primaryName(world, e);
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    const summary = document.createElement("div");
    summary.className = "semla-empty";
    summary.style.fontStyle = "normal";
    summary.textContent = [...counts.entries()]
      .map(([name, n]) => `${name} ×${n}`)
      .join("  ·  ");
    this.body.appendChild(summary);

    // --- Capped entity list ---
    const list = document.createElement("div");
    list.className = "semla-list";
    const shown = entities.slice(0, MAX_ROWS);
    for (const entity of shown) {
      list.appendChild(this.makeRow(world, entity));
    }
    this.body.appendChild(list);

    if (entities.length > shown.length) {
      this.body.appendChild(
        empty(`…showing ${shown.length} of ${entities.length}`),
      );
    }

    this.body.scrollTop = scrollTop;
  }

  private makeRow(world: World, entity: Entity): HTMLElement {
    const row = document.createElement("div");
    row.className = "row";
    if (entity === this.ctx.selected) row.classList.add("selected");

    const name = document.createElement("span");
    name.textContent = primaryName(world, entity);

    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = `#${entity}`;

    row.append(name, tag);
    row.addEventListener("click", () => this.ctx.select(entity));
    return row;
  }
}

function primaryName(world: World, entity: Entity): string {
  const names = world.componentsOf(entity).map((c) => c.type.name);
  return names.find((n) => !CORE.has(n)) ?? names[0] ?? "Entity";
}

function empty(text: string): HTMLElement {
  const el = document.createElement("div");
  el.className = "semla-empty";
  el.textContent = text;
  return el;
}
