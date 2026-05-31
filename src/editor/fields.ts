/**
 * Generic property editors. Given any object, these build labelled inputs that
 * write edits straight back to the object — the engine reads the mutated values
 * on the next frame, so changes are live. Used by both the Inspector (live
 * component data) and the Data panel (balance definitions).
 */

/** Keys hidden from the UI (internal bookkeeping that shouldn't be edited). */
const SKIP_KEYS = new Set(["previousPosition", "timer"]);

type Editable = Record<string, unknown>;

/** Build editors for every own, public property of `obj` into `container`. */
export function buildFields(
  obj: Editable,
  container: HTMLElement,
  onChange: () => void,
  depth = 0,
): void {
  for (const key of Object.keys(obj)) {
    if (key.startsWith("_") || SKIP_KEYS.has(key)) continue;
    const value = obj[key];
    const field = makeField(obj, key, value, onChange, depth);
    if (field) container.appendChild(field);
  }
}

function makeField(
  obj: Editable,
  key: string,
  value: unknown,
  onChange: () => void,
  depth: number,
): HTMLElement | null {
  if (typeof value === "number") return numberField(obj, key, value, onChange);
  if (typeof value === "boolean") return boolField(obj, key, value, onChange);
  if (typeof value === "string") return stringField(obj, key, value, onChange);

  // One level of nesting for things like Vector2 (x, y) — skip deeper/cyclic.
  if (value && typeof value === "object" && depth < 1) {
    const group = document.createElement("div");
    group.className = "semla-group";
    const title = document.createElement("div");
    title.className = "group-title";
    title.textContent = key;
    const nested = document.createElement("div");
    nested.className = "nested";
    buildFields(value as Editable, nested, onChange, depth + 1);
    if (!nested.children.length) return null; // nothing editable inside
    group.append(title, nested);
    return group;
  }
  return null;
}

function row(labelText: string, control: HTMLElement): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "semla-field";
  const label = document.createElement("label");
  label.textContent = labelText;
  label.title = labelText;
  wrap.append(label, control);
  return wrap;
}

function numberField(
  obj: Editable,
  key: string,
  value: number,
  onChange: () => void,
): HTMLElement {
  const input = document.createElement("input");
  input.type = "number";
  input.step = Number.isInteger(value) ? "1" : "any";
  input.value = String(roundForDisplay(value));
  input.addEventListener("input", () => {
    const next = parseFloat(input.value);
    if (Number.isFinite(next)) {
      obj[key] = next;
      onChange();
    }
  });
  return row(key, input);
}

function boolField(
  obj: Editable,
  key: string,
  value: boolean,
  onChange: () => void,
): HTMLElement {
  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = value;
  input.addEventListener("change", () => {
    obj[key] = input.checked;
    onChange();
  });
  return row(key, input);
}

function stringField(
  obj: Editable,
  key: string,
  value: string,
  onChange: () => void,
): HTMLElement {
  // Hex colour strings get a colour swatch picker.
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)) {
    const input = document.createElement("input");
    input.type = "color";
    input.value = value.length === 4 ? expandHex(value) : value;
    input.addEventListener("input", () => {
      obj[key] = input.value;
      onChange();
    });
    return row(key, input);
  }

  const input = document.createElement("input");
  input.type = "text";
  input.value = value;
  input.addEventListener("input", () => {
    obj[key] = input.value;
    onChange();
  });
  return row(key, input);
}

function roundForDisplay(value: number): number {
  return Math.abs(value) < 1e-4 ? 0 : Math.round(value * 1000) / 1000;
}

function expandHex(short: string): string {
  return (
    "#" +
    short
      .slice(1)
      .split("")
      .map((c) => c + c)
      .join("")
  );
}
