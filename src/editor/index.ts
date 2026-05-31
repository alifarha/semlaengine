/**
 * Semla Editor — an optional, in-game editor overlay.
 *
 * Purely additive tooling: construct it with an {@link Engine} to get a
 * toggleable shell (toolbar + Hierarchy + Inspector + Data panels). Nothing in
 * the engine or game depends on it, so omit it from shipping builds by simply
 * not constructing it.
 *
 *   import { Editor } from "@editor";
 *   new Editor(engine, { dataSources: [...] });
 */
export { Editor, type EditorOptions } from "./Editor";
export { type DataSource } from "./panels/DataPanel";
export { type EditorContext } from "./EditorContext";
export { EditorPanel } from "./EditorPanel";
