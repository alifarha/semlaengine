/**
 * Editor chrome styles, injected once into the document head. The editor UI is
 * built from real DOM (not canvas-drawn) because forms, scrolling lists and
 * text inputs are far simpler and more accessible as HTML.
 */
export const EDITOR_CSS = `
.semla-editor {
  position: fixed;
  inset: 0;
  z-index: 1000;
  font-family: ui-monospace, "SF Mono", Menlo, monospace;
  font-size: 12px;
  color: #cfd2e0;
  pointer-events: none; /* let clicks through to the canvas for picking */
}
.semla-editor.hidden { display: none; }

/* Always-visible button to open the editor (keyboard-independent). */
.semla-editor-fab {
  position: fixed;
  right: 12px;
  bottom: 12px;
  z-index: 1001;
  font-family: ui-monospace, "SF Mono", Menlo, monospace;
  font-size: 12px;
  color: #cfd2e0;
  background: #14141fdd;
  border: 1px solid #b8922a;
  border-radius: 6px;
  padding: 7px 12px;
  cursor: pointer;
  backdrop-filter: blur(4px);
  opacity: 0.7;
  transition: opacity 0.15s;
}
.semla-editor-fab:hover { opacity: 1; }

.semla-editor .semla-toolbar,
.semla-editor .semla-dock {
  pointer-events: auto; /* but panels themselves capture input */
}

.semla-toolbar {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 34px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  background: #14141fee;
  border-bottom: 1px solid #2a2a3d;
  backdrop-filter: blur(4px);
}
.semla-toolbar .title { color: #ffd166; font-weight: 700; letter-spacing: 1px; }
.semla-toolbar .spacer { flex: 1; }
.semla-toolbar .stat { color: #8a8ca6; }
.semla-toolbar .stat b { color: #cfd2e0; font-weight: 600; }

.semla-editor button {
  font: inherit;
  color: #cfd2e0;
  background: #23233a;
  border: 1px solid #34344d;
  border-radius: 4px;
  padding: 3px 9px;
  cursor: pointer;
}
.semla-editor button:hover { background: #2d2d48; }
.semla-editor button.active { background: #3a5bd0; border-color: #3a5bd0; color: #fff; }

.semla-dock {
  position: absolute;
  top: 42px;
  bottom: 10px;
  width: 270px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
}
.semla-dock.left { left: 8px; }
.semla-dock.right { right: 8px; }

.semla-panel {
  background: #14141fee;
  border: 1px solid #2a2a3d;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}
.semla-panel > header {
  padding: 6px 10px;
  background: #1c1c2c;
  border-bottom: 1px solid #2a2a3d;
  color: #9b9bb5;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-size: 11px;
  user-select: none;
}
.semla-panel > .body {
  padding: 8px 10px;
  overflow-y: auto;
}

.semla-list { display: flex; flex-direction: column; gap: 1px; }
.semla-list .row {
  padding: 3px 6px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  gap: 8px;
}
.semla-list .row:hover { background: #23233a; }
.semla-list .row.selected { background: #3a5bd0; color: #fff; }
.semla-list .row .tag { color: #8a8ca6; }
.semla-list .row.selected .tag { color: #dfe3ff; }

.semla-field {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 3px 0;
}
.semla-field > label { flex: 0 0 92px; color: #8a8ca6; overflow: hidden; text-overflow: ellipsis; }
.semla-field input[type="number"],
.semla-field input[type="text"] {
  flex: 1;
  min-width: 0;
  font: inherit;
  color: #e8e8f0;
  background: #0e0e16;
  border: 1px solid #2a2a3d;
  border-radius: 3px;
  padding: 2px 5px;
}
.semla-field input[type="color"] { width: 26px; height: 20px; padding: 0; border: 1px solid #2a2a3d; background: none; }
.semla-field input:focus { outline: 1px solid #3a5bd0; }

.semla-group { margin: 6px 0; }
.semla-group > .group-title { color: #ffd166; margin-bottom: 2px; }
.semla-group .nested { padding-left: 10px; border-left: 1px solid #2a2a3d; }

.semla-empty { color: #6a6c86; padding: 6px 0; font-style: italic; }
.semla-tabs { display: flex; gap: 4px; margin-bottom: 8px; flex-wrap: wrap; }
.semla-tabs button { padding: 2px 8px; font-size: 11px; }
`;

let injected = false;

/** Inject the editor stylesheet exactly once. */
export function injectEditorStyles(): void {
  if (injected) return;
  const style = document.createElement("style");
  style.textContent = EDITOR_CSS;
  document.head.appendChild(style);
  injected = true;
}
