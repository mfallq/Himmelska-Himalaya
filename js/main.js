// Boot: load the data, wire the header and tabs, and show the view in the URL.
import { loadData, TRIP } from './data.js';
import { store } from './store.js';
import { initShell, setOffline } from './ui/shell.js';
import { start as startOffline } from './offline.js';
import { tripState } from './lib/tripday.js';
import { $, $$ } from './util.js';
import { openDay, closeDay } from './views/daysheet.js';

const loaders = {
  today: () => import('./views/today.js'),
  map: () => import('./views/map.js'),
  days: () => import('./views/days.js'),
  altitude: () => import('./views/altitude.js'),
  prepare: () => import('./views/prepare.js'),
  journey: () => import('./views/journey.js'),
};
// Links from earlier versions keep working.
const ALIAS = { terrain: 'map', practical: 'prepare', '': 'today' };
// The globe is part of Prepare, so that tab stays lit.
const TAB_OF = { journey: 'prepare' };
const mounted = new Map();
let current = null;

async function show(name) {
  if (!loaders[name]) name = 'today';
  $$('.view').forEach((v) => (v.hidden = v.dataset.view !== name));
  $$('.tab').forEach((t) => {
    const on = t.dataset.tab === (TAB_OF[name] || name);
    if (on) t.setAttribute('aria-current', 'page');
    else t.removeAttribute('aria-current');
  });
  if (current !== name) scrollTo({ top: 0, behavior: 'instant' });
  current = name;
  if (!mounted.has(name)) {
    mounted.set(name, null);
    try {
      const mod = await loaders[name]();
      mounted.set(name, (await mod.mount($(`#view-${name}`))) || {});
    } catch (err) {
      console.error(err);
      $(`#view-${name}`).innerHTML = '<div class="wrap section"><p class="muted">This section could not be loaded. Reload the page to try again.</p></div>';
    }
  }
  for (const [n, api] of mounted) api?.onVisible?.(n === current);
}

function route() {
  const [, raw = '', arg] = location.hash.split('/');
  const name = ALIAS[raw] ?? raw;
  show(name).then(() => {
    const n = Number(arg);
    if (name === 'days' && n >= 1 && n <= TRIP.days) openDay(n);
    else closeDay();
    if (name === 'map' && arg === 'here') mounted.get('map')?.locate?.();
  });
}

async function boot() {
  initShell();
  await loadData();
  if (!(store.state.day >= 1 && store.state.day <= TRIP.days)) store.set('day', 1);
  // On the trail, open on the stage the plan puts you on.
  const st = tripState(store.state.settings);
  if (st.phase === 'during') store.set('day', st.day);
  else if (st.phase === 'before') store.set('day', 1);
  addEventListener('hashchange', route);
  route();

  startOffline(setOffline);
}

boot();
