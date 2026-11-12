// App state, kept in this browser only (localStorage). No network, no account.

const KEY = 'hh:v1';
const defaults = {
  day: 1,
  settings: { startDate: '', theme: 'auto', home: '' },
  checks: {}, // checklist item id -> true
  journal: {}, // day number -> { note, check: { headache, stomach, fatigue, dizzy } }
  relief: { exaggeration: 1.4, mode: 'cinema', labels: true, satellite: false, orbit: true },
};

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
    return {
      ...defaults,
      ...saved,
      settings: { ...defaults.settings, ...saved.settings },
      relief: { ...defaults.relief, ...saved.relief },
      checks: saved.checks || {},
      journal: saved.journal || {},
    };
  } catch {
    return structuredClone(defaults);
  }
}

const state = load();
const listeners = new Map();
let persistable = true;

function save() {
  if (!persistable) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    persistable = false; // private mode or storage full: keep working in memory
  }
}

export const store = {
  get state() {
    return state;
  },
  /** Listen for a top-level key changing. Returns an unsubscribe function. */
  on(key, fn) {
    if (!listeners.has(key)) listeners.set(key, new Set());
    listeners.get(key).add(fn);
    return () => listeners.get(key).delete(fn);
  },
  /** Replace a top-level key (objects are merged shallowly) and notify. */
  set(key, value) {
    const next = value && typeof value === 'object' && !Array.isArray(value) ? { ...state[key], ...value } : value;
    if (next === state[key]) return;
    state[key] = next;
    save();
    listeners.get(key)?.forEach((fn) => fn(next));
  },
  canPersist: () => persistable,
  exportAll: () => JSON.stringify({ app: 'himmelska-himalaya', version: 1, exported: new Date().toISOString(), ...state }, null, 2),
  importAll(text) {
    const data = JSON.parse(text);
    if (data.app !== 'himmelska-himalaya') throw new Error('Not a Himmelska Himalaya backup');
    for (const key of ['settings', 'checks', 'journal']) {
      if (data[key] && typeof data[key] === 'object') {
        state[key] = key === 'settings' ? { ...defaults.settings, ...data[key] } : data[key];
        listeners.get(key)?.forEach((fn) => fn(state[key]));
      }
    }
    save();
  },
  reset() {
    localStorage.removeItem(KEY);
    location.reload();
  },
};
