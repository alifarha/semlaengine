import { EditorPanel } from "../EditorPanel";
import type { EditorContext } from "../EditorContext";
import { buildFields } from "../fields";

/**
 * Shows the components of the selected entity and lets their values be edited
 * live — the edits write straight into the component instances the simulation
 * reads next frame. Rebuilding is skipped while a field is focused so typing is
 * never interrupted.
 */
export class InspectorPanel extends EditorPanel {
  constructor(ctx: EditorContext) {
    super("Inspector", ctx);
  }

  refresh(): void {
    // Never rebuild mid-edit: it would reset the input the user is typing in.
    if (this.hasFocusWithin()) return;

    const { world, selected } = this.ctx;
    this.body.replaceChildren();

    if (!world || selected === null) {
      this.body.appendChild(this.empty("Select an entity (list or canvas)"));
      return;
    }
    if (!world.isAlive(selected)) {
      this.body.appendChild(this.empty(`Entity #${selected} no longer exists`));
      return;
    }

    const heading = document.createElement("div");
    heading.className = "group-title";
    heading.textContent = `Entity #${selected}`;
    this.body.appendChild(heading);

    for (const { type, component } of world.componentsOf(selected)) {
      const group = document.createElement("div");
      group.className = "semla-group";

      const title = document.createElement("div");
      title.className = "group-title";
      title.textContent = type.name;

      const nested = document.createElement("div");
      nested.className = "nested";
      buildFields(
        component as Record<string, unknown>,
        nested,
        () => this.ctx.requestRefresh(),
      );
      if (!nested.children.length) {
        const none = document.createElement("div");
        none.className = "semla-empty";
        none.textContent = "(no editable fields)";
        nested.appendChild(none);
      }

      group.append(title, nested);
      this.body.appendChild(group);
    }

    const destroy = document.createElement("button");
    destroy.textContent = "Destroy entity";
    destroy.style.marginTop = "8px";
    destroy.addEventListener("click", () => {
      world.destroyEntity(selected);
      this.ctx.select(null);
    });
    this.body.appendChild(destroy);
  }

  private empty(text: string): HTMLElement {
    const el = document.createElement("div");
    el.className = "semla-empty";
    el.textContent = text;
    return el;
  }
}
