// Header controls: the menu, trip dates, theme, offline status, your data and the about panel.
import { $, html, toast, dateShort, dateLong, addDays, parseISO, download } from '../util.js';
import { store } from '../store.js';
import { TRIP } from '../data.js';
import { CREDITS } from '../content/guide.js';
import { saveAll, isIOS, installed } from '../offline.js';

export function openModal(content) {
  const m = $('#modal');
  m.innerHTML = String(content);
  if (!m.open) m.showModal();
  return m;
}
export const closeModal = () => $('#modal').close();

const THEMES = ['auto', 'dark', 'light'];
const cap = (s) => s[0].toUpperCase() + s.slice(1);

function applyTheme() {
  const theme = store.state.settings.theme;
  document.documentElement.dataset.theme = theme;
  $('#theme-label').textContent = cap(theme);
}

function datesText() {
  const start = parseISO(store.state.settings.startDate);
  return start ? `${dateShort(start)} – ${dateShort(addDays(start, TRIP.days - 1))}` : 'Not set';
}
function applyDates() {
  const start = parseISO(store.state.settings.startDate);
  $('#dates-label').textContent = start ? datesText() : 'Set your dates';
}

function cycleTheme() {
  const i = THEMES.indexOf(store.state.settings.theme);
  store.set('settings', { theme: THEMES[(i + 1) % THEMES.length] });
}

export function datesDialog() {
  const preview = (iso) => {
    const start = parseISO(iso);
    if (!start) return 'Without a date the site counts days: day 1, day 2 and so on.';
    return `Walking starts ${dateLong(addDays(start, TRIP.firstTrekDay - 1))}. Thorong La: ${dateLong(addDays(start, TRIP.passDay - 1))}. Day ${TRIP.days}: ${dateLong(addDays(start, TRIP.days - 1))}.`;
  };
  const m = openModal(html`
    <form class="stack" id="dates-form" method="dialog">
      <p class="eyebrow">Your trip</p>
      <h2 class="h2" id="modal-title">Arrival date</h2>
      <p class="muted">The day you land in Kathmandu is day 1. Every stage then gets a real date, and Today opens on the right one. The date stays on this phone.</p>
      <label class="lbl">Day 1, Kathmandu
        <input class="field" type="date" name="start" value="${store.state.settings.startDate}">
      </label>
      <p class="small muted" id="dates-preview">${preview(store.state.settings.startDate)}</p>
      <div class="actions">
        <button class="btn" type="button" data-clear>Clear</button>
        <button class="btn btn-primary" type="submit">Save</button>
      </div>
    </form>`);
  const form = $('#dates-form', m);
  form.start.addEventListener('input', () => ($('#dates-preview', m).textContent = preview(form.start.value)));
  $('[data-clear]', m).addEventListener('click', () => {
    store.set('settings', { startDate: '', shift: 0 });
    closeModal();
  });
  form.addEventListener('submit', () => {
    store.set('settings', { startDate: form.start.value, shift: 0 });
    if (form.start.value) toast('Dates saved.');
  });
}

// ---------- offline status ----------
let offline = { supported: true, total: 0, saved: 0, missing: [] };
const offlineReady = () => offline.supported && offline.total > 0 && !offline.missing.length;
function offlineText() {
  const online = navigator.onLine;
  return offlineReady()
    ? online ? 'Offline: ready' : 'Offline: in use'
    : !offline.supported ? 'Offline: unavailable'
    : offline.total ? `Saving ${offline.saved}/${offline.total}`
    : online ? 'Offline: not saved yet' : 'No connection';
}
function applyOffline() {
  const ready = offlineReady();
  const cls = 'dot ' + (ready ? 'ok' : navigator.onLine ? '' : 'off');
  const text = offlineText();
  document.querySelectorAll('[data-offline-dot], #offline-dot').forEach((d) => (d.className = cls));
  document.querySelectorAll('[data-offline-text], #offline-label').forEach((l) => (l.textContent = text));
}
export function setOffline(state) {
  offline = state;
  applyOffline();
}

export function offlineDialog() {
  const ready = offlineReady();
  const m = openModal(html`
    <div class="stack">
      <p class="eyebrow">Without signal</p>
      <h2 class="h2" id="modal-title">${ready ? 'Saved for the trail' : offline.supported ? 'Not fully saved' : 'This browser cannot save the site'}</h2>
      <p class="muted" id="off-state">${ready
        ? `All ${offline.total} files are on this phone. Everything opens with no connection, including the 3D relief and the satellite picture.`
        : offline.supported
          ? `${offline.saved} of ${offline.total || '?'} files saved. Stay connected and press the button.`
          : 'Private windows and some in-app browsers keep nothing. Open the site in Safari or Chrome.'}</p>
      ${offline.supported ? html`<div><button class="btn btn-primary" type="button" id="off-save">${ready ? 'Check the copy' : 'Save everything'}</button></div>` : ''}
      ${isIOS() && !installed() ? html`<div class="card callout"><h3 class="h4">Add it to the Home Screen</h3><p class="small muted">In Safari, tap Share, then Add to Home Screen. iOS can delete the saved copy of a website you have not opened for a week. A Home Screen app is kept and opens full screen. Open it once from the Home Screen while you have a connection.</p></div>` : ''}
      <ul class="bullets">
        <li><b>Works offline:</b> everything. Relief, route, days, charts, map, checklist, journal and your position.</li>
        <li><b>Needs a connection:</b> links to outside sources, and updates.</li>
        <li><b>Before you leave:</b> switch on flight mode and open each tab once.</li>
        <li><b>Stays on the phone:</b> dates, ticks, journal and numbers. Back them up under Your data.</li>
      </ul>
      <div class="actions"><button class="btn" type="button" data-close>Close</button></div>
    </div>`);
  $('#off-save', m)?.addEventListener('click', async (e) => {
    if (!navigator.onLine) return toast('No connection. Try again when you have signal.');
    e.target.disabled = true;
    const state = await saveAll((saved, total) => ($('#off-state', m).textContent = `Saving ${saved} of ${total} files`));
    setOffline(state);
    $('#off-state', m).textContent = state.missing.length
      ? `${state.saved} of ${state.total} saved. ${state.missing.length} failed. Try again with a better connection.`
      : `All ${state.total} files are on this phone.`;
    e.target.disabled = false;
  });
}

export function dataDialog() {
  const m = openModal(html`
    <div class="stack">
      <p class="eyebrow">Your data</p>
      <h2 class="h2" id="modal-title">Backup</h2>
      <p class="muted">Dates, checklist ticks, journal and emergency numbers live only in this browser${store.canPersist() ? '' : ' (this window cannot store anything, so they last until you close it)'}. No account, no tracking. Save a backup before you change phone.</p>
      <div class="chips">
        <button class="btn btn-sm" type="button" data-export>Save backup</button>
        <label class="btn btn-sm" style="cursor:pointer">Restore backup<input type="file" accept="application/json,.json" hidden data-import></label>
        <button class="btn btn-sm" type="button" data-reset>Erase everything</button>
      </div>
      <div class="actions"><button class="btn btn-primary" type="button" data-close>Close</button></div>
    </div>`);
  $('[data-export]', m).addEventListener('click', () => download('himmelska-himalaya-backup.json', store.exportAll(), 'application/json'));
  $('[data-import]', m).addEventListener('change', async (e) => {
    try {
      store.importAll(await e.target.files[0].text());
      toast('Backup restored.');
      closeModal();
    } catch (err) {
      toast('That file is not a backup from this site.');
    }
  });
  $('[data-reset]', m).addEventListener('click', () => {
    if (confirm('Erase dates, ticks, journal and numbers from this browser? This cannot be undone.')) store.reset();
  });
}

export function aboutDialog() {
  openModal(html`
    <div class="stack">
      <p class="eyebrow">About</p>
      <h2 class="h2" id="modal-title">Himmelska Himalaya</h2>
      <p class="muted">A planning companion for the Annapurna Circuit. It is no substitute for a guide, a current map or a doctor. Rules, prices and trail conditions change: check them before you rely on a number here.</p>
      <div>
        <p class="h4">Data and credits</p>
        <ul class="bullets small" style="margin-top:8px">
          ${CREDITS.map((c) => html`<li><b>${c.what}:</b> ${c.who}${c.url ? html` · <a href="${c.url}" target="_blank" rel="noopener">${c.label || 'source'}</a>` : ''}</li>`)}
        </ul>
      </div>
      <div class="actions"><button class="btn btn-primary" type="button" data-close>Close</button></div>
    </div>`);
}

export function menuDialog() {
  const m = openModal(html`
    <div class="stack">
      <h2 class="h2" id="modal-title">Menu</h2>
      <ul class="menu">
        <li><button type="button" data-m="dates"><b>Dates</b><span>${datesText()}</span></button></li>
        <li><button type="button" data-m="offline"><b>Offline</b><span data-offline-text>${offlineText()}</span></button></li>
        <li><button type="button" data-m="theme"><b>Theme</b><span id="menu-theme">${cap(store.state.settings.theme)}</span></button></li>
        <li><button type="button" data-m="sos"><b>Emergency</b><span>Signs, numbers, my position</span></button></li>
        <li><button type="button" data-m="data"><b>Your data</b><span>Backup and restore</span></button></li>
        <li><button type="button" data-m="about"><b>About and sources</b><span></span></button></li>
      </ul>
      <div class="actions"><button class="btn" type="button" data-close>Close</button></div>
    </div>`);
  if (m._menuHandler) m.removeEventListener('click', m._menuHandler);
  m._menuHandler = function once(e) {
    const b = e.target.closest('[data-m]');
    if (!b) return;
    const which = b.dataset.m;
    if (which === 'theme') {
      cycleTheme();
      $('#menu-theme', m).textContent = cap(store.state.settings.theme);
      return;
    }
    m.removeEventListener('click', once);
    m._menuHandler = null;
    if (which === 'dates') datesDialog();
    else if (which === 'offline') offlineDialog();
    else if (which === 'sos') import('./emergency.js').then((x) => x.openEmergency());
    else if (which === 'data') dataDialog();
    else if (which === 'about') aboutDialog();
  };
  m.addEventListener('click', m._menuHandler);
}

export function initShell() {
  applyTheme();
  applyDates();
  applyOffline();
  store.on('settings', () => {
    applyTheme();
    applyDates();
  });
  $('#btn-theme').addEventListener('click', cycleTheme);
  $('#btn-dates').addEventListener('click', datesDialog);
  $('#btn-offline').addEventListener('click', offlineDialog);
  $('#btn-about').addEventListener('click', aboutDialog);
  $('#btn-menu').addEventListener('click', menuDialog);
  $('#btn-sos').addEventListener('click', () => import('./emergency.js').then((x) => x.openEmergency()));
  addEventListener('online', applyOffline);
  addEventListener('offline', applyOffline);
  document.addEventListener('hh:offline-refresh', applyOffline);

  // Modals close on the backdrop and on any [data-close] button.
  const modal = $('#modal');
  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.closest('[data-close]')) modal.close();
  });
}
