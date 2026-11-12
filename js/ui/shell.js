// Header controls: trip dates, theme, offline status, and the about panel.
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

function applyTheme() {
  const theme = store.state.settings.theme;
  document.documentElement.dataset.theme = theme;
  $('#theme-label').textContent = theme[0].toUpperCase() + theme.slice(1);
}

function applyDates() {
  const start = parseISO(store.state.settings.startDate);
  const narrow = matchMedia('(max-width: 760px)').matches;
  $('#dates-label').textContent = start
    ? narrow ? dateShort(start) : `${dateShort(start)} – ${dateShort(addDays(start, TRIP.days - 1))}`
    : narrow ? 'Dates' : 'Set your dates';
}

function datesDialog() {
  const preview = (iso) => {
    const start = parseISO(iso);
    if (!start) return 'Without a date the site simply counts days: day 1, day 2 and so on.';
    return `Walking starts ${dateLong(addDays(start, TRIP.firstTrekDay - 1))}. Thorong La falls on ${dateLong(addDays(start, TRIP.passDay - 1))}. Day ${TRIP.days} is ${dateLong(addDays(start, TRIP.days - 1))}.`;
  };
  const m = openModal(html`
    <form class="stack" id="dates-form" method="dialog">
      <p class="eyebrow">Your trip</p>
      <h2 class="h2" id="modal-title">When do you arrive?</h2>
      <p class="muted">Pick the day you land in Kathmandu. That is day 1, and every stage, the altitude chart and the countdowns then show real dates. The date is stored in this browser and nowhere else.</p>
      <label class="lbl">Day 1 · arrival in Kathmandu
        <input class="field" type="date" name="start" value="${store.state.settings.startDate}">
      </label>
      <p class="small muted" id="dates-preview">${preview(store.state.settings.startDate)}</p>
      <div class="actions">
        <button class="btn" type="button" data-clear>Clear the date</button>
        <button class="btn btn-primary" type="submit">Save</button>
      </div>
    </form>`);
  const form = $('#dates-form', m);
  form.start.addEventListener('input', () => ($('#dates-preview', m).textContent = preview(form.start.value)));
  $('[data-clear]', m).addEventListener('click', () => {
    store.set('settings', { startDate: '' });
    closeModal();
  });
  form.addEventListener('submit', () => {
    store.set('settings', { startDate: form.start.value });
    if (form.start.value) toast('Dates saved on this device.');
  });
}

// ---------- offline status ----------
let offline = { supported: true, total: 0, saved: 0, missing: [] };
const offlineReady = () => offline.supported && offline.total > 0 && !offline.missing.length;
function applyOffline() {
  const dot = $('#offline-dot'), label = $('#offline-label');
  const online = navigator.onLine;
  const ready = offlineReady();
  dot.className = 'dot ' + (ready ? 'ok' : online ? '' : 'off');
  label.textContent = ready
    ? online ? 'Offline: ready' : 'Offline: in use'
    : !offline.supported ? 'Offline: unavailable'
    : offline.total ? `Saving ${offline.saved}/${offline.total}`
    : online ? 'Offline: not saved yet' : 'No connection';
}
export function setOffline(state) {
  offline = state;
  applyOffline();
}

function offlineDialog() {
  const ready = offlineReady();
  const m = openModal(html`
    <div class="stack">
      <p class="eyebrow">Without signal</p>
      <h2 class="h2" id="modal-title">${ready ? 'Saved for the trail.' : offline.supported ? 'Not fully saved yet.' : 'This browser cannot save the site.'}</h2>
      <p class="muted" id="off-state">${ready
        ? `All ${offline.total} files are on this device. The whole site, including the 3D relief and the satellite picture, opens with no connection.`
        : offline.supported
          ? `${offline.saved} of ${offline.total || '?'} files are saved. Stay connected and press the button to fetch the rest.`
          : 'Private windows and some in-app browsers keep nothing. Open the site in Safari or Chrome itself.'}</p>
      ${offline.supported ? html`<div><button class="btn btn-primary" type="button" id="off-save">${ready ? 'Check and refresh the copy' : 'Save everything now'}</button></div>` : ''}
      ${isIOS() && !installed() ? html`<div class="card callout"><h3 class="h4">On an iPhone: add it to the Home Screen</h3><p class="small muted">In Safari, tap Share, then “Add to Home Screen”. iOS may delete the saved copy of a website you have not opened for a week. A Home Screen app is kept, opens full screen, and holds your journal safely. Open it once from the Home Screen while you still have a connection.</p></div>` : ''}
      <ul class="bullets">
        <li><b>Works offline:</b> everything. The relief and route, every day, the altitude charts, the field map, the checklist and your journal.</li>
        <li><b>Needs a connection:</b> only the links to outside sources.</li>
        <li><b>Before you leave:</b> switch on flight mode and open each tab once, to see for yourself that it works.</li>
        <li><b>Stays on this device:</b> your dates, ticks and journal. Export a backup from “About & sources” now and then.</li>
      </ul>
      <div class="actions"><button class="btn" type="button" data-close>Close</button></div>
    </div>`);
  $('#off-save', m)?.addEventListener('click', async (e) => {
    if (!navigator.onLine) return toast('No connection right now. Try again when you have signal.');
    e.target.disabled = true;
    const state = await saveAll((saved, total) => ($('#off-state', m).textContent = `Saving… ${saved} of ${total} files.`));
    setOffline(state);
    $('#off-state', m).textContent = state.missing.length
      ? `${state.saved} of ${state.total} files saved. ${state.missing.length} could not be fetched: try again with a better connection.`
      : `All ${state.total} files are on this device.`;
    e.target.disabled = false;
  });
}

function aboutDialog() {
  const m = openModal(html`
    <div class="stack">
      <p class="eyebrow">About and sources</p>
      <h2 class="h2" id="modal-title">Himmelska Himalaya</h2>
      <p class="muted">A planning companion for the Annapurna Circuit. It is written for people walking the route, not as a substitute for a guide, a current map or a doctor. Rules, prices and trail conditions change: check them before you rely on a number here.</p>
      <div>
        <p class="h4">Data and credits</p>
        <ul class="bullets small" style="margin-top:8px">
          ${CREDITS.map((c) => html`<li><b>${c.what}:</b> ${c.who}${c.url ? html` · <a href="${c.url}" target="_blank" rel="noopener">${c.label || 'source'}</a>` : ''}</li>`)}
        </ul>
      </div>
      <div>
        <p class="h4">Your data</p>
        <p class="small muted" style="margin:6px 0 12px">Dates, checklist ticks and journal live only in this browser${store.canPersist() ? '' : ' (this window cannot store anything, so they last until you close it)'}.</p>
        <div class="chips">
          <button class="btn btn-sm" type="button" data-export>Export a backup</button>
          <label class="btn btn-sm" style="cursor:pointer">Import a backup<input type="file" accept="application/json,.json" hidden data-import></label>
          <button class="btn btn-sm" type="button" data-reset>Erase everything</button>
        </div>
      </div>
      <div class="actions"><button class="btn btn-primary" type="button" data-close>Close</button></div>
    </div>`);
  $('[data-export]', m).addEventListener('click', () => download('himmelska-himalaya-backup.json', store.exportAll(), 'application/json'));
  $('[data-import]', m).addEventListener('change', async (e) => {
    try {
      store.importAll(await e.target.files[0].text());
      toast('Backup imported.');
      closeModal();
    } catch (err) {
      toast('That file is not a backup from this site.');
    }
  });
  $('[data-reset]', m).addEventListener('click', () => {
    if (confirm('Erase your dates, ticks and journal from this browser? This cannot be undone.')) store.reset();
  });
}

export function initShell() {
  applyTheme();
  applyDates();
  applyOffline();
  store.on('settings', () => {
    applyTheme();
    applyDates();
  });
  $('#btn-theme').addEventListener('click', () => {
    const i = THEMES.indexOf(store.state.settings.theme);
    store.set('settings', { theme: THEMES[(i + 1) % THEMES.length] });
  });
  $('#btn-dates').addEventListener('click', datesDialog);
  $('#btn-offline').addEventListener('click', offlineDialog);
  $('#btn-about').addEventListener('click', aboutDialog);
  addEventListener('online', applyOffline);
  addEventListener('offline', applyOffline);

  // Modals close on the backdrop and on any [data-close] button.
  const modal = $('#modal');
  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.closest('[data-close]')) modal.close();
  });
}

export { datesDialog };
