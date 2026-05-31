import { EditorPanel } from "../EditorPanel";
import type { EditorContext } from "../EditorContext";
import { buildFields } from "../fields";

/**
 * A source of editable data definitions, supplied by the game so the editor
 * stays decoupled from game content. Each entry's `target` is a live object;
 * edits to it take effect wherever the game reads it (e.g. the next spawn).
 */
export interface DataSource {
  readonly name: string;
  readonly entries: () => { id: string; target: Record<string, unknown> }[];
}

/**
 * Tweak game balance data live: pick a source (tab), pick an entry, edit its
 * fields. Because definitions are read at spawn/use time, changes apply to
 * subsequently created entities — ideal for tuning enemy waves on the fly.
 */
export class DataPanel extends EditorPanel {
  private activeSource = 0;
  private activeEntryId: string | null = null;

  constructor(
    ctx: EditorContext,
    private readonly sources: DataSource[],
  ) {
    super("Data / Balance", ctx);
  }

  refresh(): void {
    if (this.hasFocusWithin()) return;
    this.body.replaceChildren();

    if (this.sources.length === 0) {
      this.body.appendChild(text("No data sources registered"));
      return;
    }

    // --- Source tabs ---
    const tabs = document.createElement("div");
    tabs.className = "semla-tabs";
    this.sources.forEach((source, i) => {
      const btn = document.createElement("button");
      btn.textContent = source.name;
      btn.classList.toggle("active", i === this.activeSource);
      btn.addEventListener("click", () => {
        this.activeSource = i;
        this.activeEntryId = null;
        this.refresh();
      });
      tabs.appendChild(btn);
    });
    this.body.appendChild(tabs);

    const entries = this.sources[this.activeSource].entries();

    // --- Entry list ---
    const list = document.createElement("div");
    list.className = "semla-list";
    for (const entry of entries) {
      const row = document.createElement("div");
      row.className = "row";
      if (entry.id === this.activeEntryId) row.classList.add("selected");
      const label = document.createElement("span");
      label.textContent = entry.id;
      row.appendChild(label);
      row.addEventListener("click", () => {
        this.activeEntryId = entry.id;
        this.refresh();
      });
      list.appendChild(row);
    }
    this.body.appendChild(list);

    // --- Selected entry fields ---
    const selected = entries.find((e) => e.id === this.activeEntryId);
    if (selected) {
      const group = document.createElement("div");
      group.className = "semla-group";
      const title = document.createElement("div");
      title.className = "group-title";
      title.textContent = selected.id;
      const nested = document.createElement("div");
      nested.className = "nested";
      buildFields(selected.target, nested, () => this.ctx.requestRefresh());
      group.append(title, nested);
      this.body.appendChild(group);
    } else {
      this.body.appendChild(text("Select an entry to edit"));
    }
  }
}

function text(s: string): HTMLElement {
  const el = document.createElement("div");
  el.className = "semla-empty";
  el.textContent = s;
  return el;
}
