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

  /** True if focus is inside this panel (user is interacting with an input). */
  protected hasFocusWithin(): boolean {
    return this.element.contains(document.activeElement);
  }

  /** Called repeatedly while the editor is visible to reflect live state. */
  abstract refresh(): void;
}
