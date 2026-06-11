import type { EditorContext } from "./EditorContext";

/**
 * Base class for editor panels. A panel owns a titled DOM section and is asked
 * to {@link refresh} periodically while the editor is open.
 *
 * Panels guard against clobbering a field the user is typing in via
 * {@link hasFocusWithin} — live refresh should never steal focus or reset an
 * input mid-edit.
 */
export abstract class EditorPanel {
  readonly element: HTMLElement;
  protected readonly body: HTMLElement;

  constructor(
    title: string,
    protected readonly ctx: EditorContext,
  ) {
    this.element = document.createElement("section");
    this.element.className = "semla-panel";

    const header = document.createElement("header");
    header.textContent = title;

    this.body = document.createElement("div");
    this.body.className = "body";

    this.element.append(header, this.body);
  }

  /**
   * True if the user is mid-edit in a form control inside this panel. Only
   * typing controls count: browsers also focus buttons on click, and treating
   * that as "editing" would swallow the very refresh the click triggered.
   */
  protected hasFocusWithin(): boolean {
    const active = document.activeElement;
    return (
      active instanceof HTMLElement &&
      this.element.contains(active) &&
      active.matches("input, textarea, select")
    );
  }

  /** Called repeatedly while the editor is visible to reflect live state. */
  abstract refresh(): void;
}
