const SAVE_KEY = "ssa_save_v1";

export const DEFAULT_SETTINGS = {
  quality: null,
  music: 0.7,
  sfx: 0.85,
  shake: true,
};

let cache = null;

export function load() {
  if (cache) return cache;
  let data = null;
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) data = JSON.parse(raw);
  } catch (e) { data = null; }
  cache = {
    unlocked: 1,
    records: {},
    coinsTotal: 0,
    settings: { ...DEFAULT_SETTINGS },
    ...(data || {}),
  };
  cache.settings = { ...DEFAULT_SETTINGS, ...(data && data.settings ? data.settings : {}) };
  if (!cache.settings.quality) {
    const coarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
    cache.settings.quality = coarse ? "medium" : "high";
  }
  cache.records = cache.records && typeof cache.records === "object" ? cache.records : {};
  return cache;
}

export function save() {
  if (!cache) return;
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(cache)); } catch (e) { /* stockage indisponible */ }
}

export function getRecords(worldId) {
  const s = load();
  return Array.isArray(s.records[worldId]) ? s.records[worldId] : [];
}

export function addRecord(worldId, timeMs, coins) {
  const s = load();
  const list = getRecords(worldId);
  const best = list.length ? list[0] : null;
  list.push({ t: Math.round(timeMs), c: coins, d: Date.now() });
  list.sort((a, b) => a.t - b.t);
  s.records[worldId] = list.slice(0, 5);
  save();
  return { isNewBest: !best || timeMs < best.t, previousBest: best };
}

export function addCoins(n) {
  const s = load();
  s.coinsTotal += n;
  save();
}

export function unlockWorld(index) {
  const s = load();
  if (index + 1 > s.unlocked) {
    s.unlocked = index + 1;
    save();
  }
}

export function updateSettings(patch) {
  const s = load();
  Object.assign(s.settings, patch);
  save();
  return s.settings;
}
