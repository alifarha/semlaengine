/**
 * Meta-progression persisted between runs: sál shards earned on death and the
 * permanent "Barrow" upgrades bought with them (see `UpgradeScene`).
 *
 * Storage is injectable so headless tests can run without a browser; in the
 * browser it defaults to `localStorage`.
 */

export interface MetaState {
  shards: number;
  /** upgrade id -> purchased level */
  upgrades: Record<string, number>;
}

export interface MetaUpgradeDef {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly maxLevel: number;
  /** Cost of level n+1 is `baseCost * (n + 1)`. */
  readonly baseCost: number;
}

export const META_UPGRADES: readonly MetaUpgradeDef[] = [
  {
    id: "vigour",
    name: "Barrow-Flesh",
    description: "+20 starting vigour per level.",
    maxLevel: 5,
    baseCost: 10,
  },
  {
    id: "might",
    name: "Grave-Strength",
    description: "+8% weapon damage per level.",
    maxLevel: 5,
    baseCost: 15,
  },
  {
    id: "swiftness",
    name: "Wind-Walker",
    description: "+6% movement speed per level.",
    maxLevel: 5,
    baseCost: 12,
  },
  {
    id: "hoard",
    name: "Hoard-Call",
    description: "+20% sál pickup range per level.",
    maxLevel: 4,
    baseCost: 10,
  },
];

export interface MetaStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const STORAGE_KEY = "semla.meta.v1";

let storage: MetaStorage | null =
  typeof localStorage !== "undefined" ? localStorage : null;

/** Swap the backing store (tests use an in-memory fake). */
export function setMetaStorage(s: MetaStorage | null): void {
  storage = s;
}

export function loadMeta(): MetaState {
  const empty: MetaState = { shards: 0, upgrades: {} };
  if (!storage) return empty;
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as Partial<MetaState>;
    return {
      shards: typeof parsed.shards === "number" ? Math.max(0, parsed.shards) : 0,
      upgrades:
        parsed.upgrades && typeof parsed.upgrades === "object"
          ? { ...parsed.upgrades }
          : {},
    };
  } catch {
    return empty; // corrupted save: start fresh rather than crash
  }
}

export function saveMeta(state: MetaState): void {
  storage?.setItem(STORAGE_KEY, JSON.stringify(state));
}

/** Shards awarded for a run's results. */
export function shardsForRun(level: number, kills: number): number {
  return Math.max(1, level * 2 + Math.floor(kills / 10));
}

export function addShards(amount: number): MetaState {
  const state = loadMeta();
  state.shards += amount;
  saveMeta(state);
  return state;
}

export function upgradeCost(def: MetaUpgradeDef, currentLevel: number): number {
  return def.baseCost * (currentLevel + 1);
}

/** Buy one level of an upgrade if affordable. Returns the new state, or null. */
export function buyUpgrade(id: string): MetaState | null {
  const def = META_UPGRADES.find((u) => u.id === id);
  if (!def) return null;
  const state = loadMeta();
  const level = state.upgrades[id] ?? 0;
  if (level >= def.maxLevel) return null;
  const cost = upgradeCost(def, level);
  if (state.shards < cost) return null;
  state.shards -= cost;
  state.upgrades[id] = level + 1;
  saveMeta(state);
  return state;
}

export interface MetaBonuses {
  vigour: number;
  mightMul: number;
  speedMul: number;
  magnetMul: number;
}

/** The stat bonuses the current purchases grant a fresh player. */
export function metaBonuses(state: MetaState = loadMeta()): MetaBonuses {
  const level = (id: string) => state.upgrades[id] ?? 0;
  return {
    vigour: level("vigour") * 20,
    mightMul: 1 + level("might") * 0.08,
    speedMul: 1 + level("swiftness") * 0.06,
    magnetMul: 1 + level("hoard") * 0.2,
  };
}
