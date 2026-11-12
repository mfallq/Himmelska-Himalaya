// Boot: load the data, wire the header and tabs, and show the view in the URL.
import { loadData, TRIP } from './data.js';
import { store } from './store.js';
import { initShell, setOfflineReady } from './ui/shell.js';
import { $, $$ } from './util.js';
import { openDay } from './views/daysheet.js';

const loaders = {
  journey: () => import('./views/journey.js'),
  terrain: () => import('./views/terrain.js'),
  days: () => import('./views/days.js'),
  altitude: () => import('./views/altitude.js'),
  practical: () => import('./views/practical.js'),
};
const mounted = new Map();
let current = null;

async function show(name) {
  if (!loaders[name]) name = 'journey';
  $$('.view').forEach((v) => (v.hidden = v.dataset.view !== name));
  $$('.tab').forEach((t) => t.setAttribute('aria-selected', String(t.dataset.tab === name)));
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
  const [, name, arg] = location.hash.split('/');
  show(name || 'journey').then(() => {
    const n = Number(arg);
    if (name === 'days' && n >= 1 && n <= TRIP.days) openDay(n);
  });
}

async function boot() {
  initShell();
  await loadData();
  if (!(store.state.day >= 1 && store.state.day <= TRIP.days)) store.set('day', 1);
  $$('.tab').forEach((t) => t.addEventListener('click', () => (location.hash = `#/${t.dataset.tab}`)));
  addEventListener('hashchange', route);
  route();

  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('sw.js');
      await navigator.serviceWorker.ready;
      setOfflineReady(true);
    } catch {
      setOfflineReady(false);
    }
  }
}

boot();
