// "Today": the stage you are on, with the few things to know before you set out.
// Opens on the day the plan puts you on. Before the trip it counts down and
// shows what is left to prepare; without dates it shows the selected day.
import { html, $, $$, metres, dateShort, dateLong, num, pad2, clamp } from '../util.js';
import { store } from '../store.js';
import { TRIP, STOPS, DAYS, day as dayOf, walked, dateOf } from '../data.js';
import { KINDS } from '../content/itinerary.js';
import { DETAILS } from '../content/details.js';
import { CHECKLIST } from '../content/guide.js';
import { tripState, nepalToday } from '../lib/tripday.js';
import { sunTimes, clock } from '../lib/sun.js';
import { drawDayStill } from '../terrain/scene.js';
import { openDay } from './daysheet.js';
import { datesDialog, offlineDialog } from '../ui/shell.js';

const CHECK_TOTAL = CHECKLIST.reduce((n, g) => n + g.items.length, 0);
const wide = () => matchMedia('(min-width: 1021px)').matches;

function head(st, n) {
  const d = dayOf(n);
  const date = st.phase === 'during' && n === st.day ? nepalToday() : dateOf(n);
  const bits = [`Day ${n} of ${TRIP.days}`];
  if (date) bits.push(dateLong(date));
  bits.push(KINDS[d.kind]);
  return bits.join(' · ');
}

function banner(st, n) {
  if (st.phase === 'nodates') {
    return html`<div class="card callout"><h2 class="h3">Set your dates</h2>
      <p class="muted">Add the day you land in Kathmandu. This page then opens on the right day.</p>
      <div class="chips"><button class="btn btn-primary" type="button" data-dates>Set dates</button></div></div>`;
  }
  if (st.phase === 'before') {
    const done = Object.values(store.state.checks).filter(Boolean).length;
    return html`<div class="card callout"><h2 class="h3">${st.daysTo === 1 ? 'Arrival tomorrow' : `${st.daysTo} days to arrival`}</h2>
      <p class="muted">Checklist: ${done} of ${CHECK_TOTAL} done.</p>
      <div class="chips"><a class="btn btn-primary" href="#/prepare">Open checklist</a><button class="btn" type="button" data-dates>Change dates</button></div></div>`;
  }
  if (st.phase === 'after') {
    return html`<div class="card callout"><h2 class="h3">The trip is over</h2><p class="muted">Welcome home. Your journal is under Prepare, Journal.</p></div>`;
  }
  return '';
}

function dayCard(st, n) {
  const d = dayOf(n), x = DETAILS[n] || {};
  const w = walked(n);
  const to = STOPS[d.to];
  const prev = n > 1 ? DAYS[n - 2] : null;
  const delta = prev ? d.sleep - prev.sleep : 0;
  const flag = delta > 500 && d.sleep >= 3000;
  const isToday = st.phase === 'during' && st.day === n;
  const date = isToday ? nepalToday() : dateOf(n);
  const sun = date ? sunTimes(date, to.lat, to.lon) : null;
  const next = n < TRIP.days ? DAYS[n] : null;
  const key = x.key || [d.note];
  return html`
    <article class="card today-card">
      <p class="eyebrow">${head(st, n)}</p>
      ${st.phase === 'during' && !isToday ? html`<p><button class="chip accent" type="button" data-today="${st.day}">Back to today, day ${st.day}</button></p>` : ''}
      <h1 class="h2 today-title">${d.title}</h1>
      <dl class="kv facts">
        <div><dt>Distance</dt><dd>${d.km}</dd></div>
        <div><dt>Time</dt><dd>${d.hours}</dd></div>
        ${w ? html`<div><dt>Climb</dt><dd>↑ ${num(Math.round(w.ascent / 50) * 50)} m · ↓ ${num(Math.round(w.descent / 50) * 50)} m</dd></div>` : ''}
        <div><dt>Sleep</dt><dd>${to.name}, ${metres(d.sleep)}</dd></div>
        ${d.high > d.sleep + 40 ? html`<div><dt>High point</dt><dd>${metres(d.high)}${d.highAt ? ' · ' + d.highAt : ''}</dd></div>` : ''}
        ${prev && delta !== 0 ? html`<div><dt>From last night</dt><dd>${delta > 0 ? '+' : '−'}${num(Math.abs(delta))} m${flag ? html` <span class="chip warn">over 500 m</span>` : ''}</dd></div>` : ''}
      </dl>
      <h2 class="h4">Know this</h2>
      <ul class="bullets know">${key.map((k) => html`<li>${k}</li>`)}</ul>
      <div class="chips actions">
        ${d.kind === 'trek' || d.kind === 'pass' || d.kind === 'rest' ? html`<a class="btn btn-primary" href="#/map/here">Where am I</a>` : ''}
        <button class="btn${d.kind === 'trek' || d.kind === 'pass' || d.kind === 'rest' ? '' : ' btn-primary'}" type="button" data-open="${n}">Open the day</button>
      </div>
      ${sun
        ? html`<p class="small muted">Light at ${to.name}: sunrise ${clock(sun.sunrise)}, sunset ${clock(sun.sunset)}, dark by ${clock(sun.dusk)}.</p>`
        : html`<p class="small faint">Set your dates for sunrise and sunset.</p>`}
      ${next ? html`<p class="small muted">Tomorrow: ${next.route}${next.km && next.km !== '0 km' ? ' · ' + next.km : ''}${next.hours && !/^(Free|Arrival|Departure|No trail)/.test(next.hours) ? ' · ' + next.hours : ''}</p>` : ''}
      <div class="stepper">
        <button class="btn btn-sm" type="button" data-step="-1"${n <= 1 ? ' disabled' : ''}>‹ Day ${Math.max(1, n - 1)}</button>
        <button class="btn btn-sm" type="button" data-step="1"${n >= TRIP.days ? ' disabled' : ''}>Day ${Math.min(TRIP.days, n + 1)} ›</button>
      </div>
    </article>`;
}

export async function mount(root) {
  const draw = () => {
    const st = tripState(store.state.settings);
    const n = store.state.day;
    const showStill = wide();
    root.innerHTML = html`
      <div class="wrap today">
        <section class="section">
          <div class="today-grid${showStill ? ' with-still' : ''}">
            <div class="today-main">
              ${banner(st, n)}
              ${dayCard(st, n)}
              ${st.phase === 'during' ? html`<p class="small muted slip">Plan running late? <button class="linkbtn" type="button" data-slip="1">Hold the plan one day</button>${st.shift ? html` · Held ${st.shift} day${st.shift > 1 ? 's' : ''}. <button class="linkbtn" type="button" data-slip="-1">Undo</button>` : ''}</p>` : ''}
              <p class="small muted"><button class="linkbtn" type="button" data-offline><i class="dot" data-offline-dot></i> <span data-offline-text>Offline</span></button> · <button class="linkbtn" type="button" data-emergency>Emergency</button></p>
            </div>
            ${showStill ? html`<figure class="viewfig today-still"><canvas width="1260" height="760" id="t-still" role="img" aria-label="Relief view of the day’s route"></canvas><figcaption><b>${dayOf(n).place}</b>The day on the relief. The bright line is today’s stage.</figcaption></figure>` : ''}
          </div>
        </section>
      </div>`;
    if (showStill) drawDayStill($('#t-still', root), n, { zoom: 0.92 });
    document.dispatchEvent(new CustomEvent('hh:offline-refresh'));
  };

  root.addEventListener('click', (e) => {
    const t = e.target.closest('button');
    if (!t) return;
    const n = store.state.day;
    if (t.dataset.dates !== undefined) datesDialog();
    else if (t.dataset.open) openDay(Number(t.dataset.open));
    else if (t.dataset.step) store.set('day', clamp(n + Number(t.dataset.step), 1, TRIP.days));
    else if (t.dataset.today) store.set('day', Number(t.dataset.today));
    else if (t.dataset.slip) {
      const shift = Math.max(0, (Number(store.state.settings.shift) || 0) + Number(t.dataset.slip));
      store.set('settings', { shift });
      const st = tripState(store.state.settings);
      if (st.phase === 'during') store.set('day', st.day);
    } else if (t.dataset.offline !== undefined) offlineDialog();
    else if (t.dataset.emergency !== undefined) import('../ui/emergency.js').then((m) => m.openEmergency());
  });

  let seen = tripState(store.state.settings).day || 0; // the stage the plan last put us on
  const sync = () => {
    // New dates or a held plan: go to the stage the plan now says.
    const st = tripState(store.state.settings);
    if (st.phase === 'during') {
      seen = st.day;
      store.set('day', st.day);
    } else if (st.phase === 'before') store.set('day', 1);
    draw();
  };
  draw();
  store.on('day', draw);
  store.on('settings', sync);
  matchMedia('(min-width: 1021px)').addEventListener('change', draw);

  return {
    onVisible(visible) {
      if (!visible) return;
      // A new day may have started while the app was in the pocket.
      const st = tripState(store.state.settings);
      if (st.phase === 'during' && st.day !== seen) {
        seen = st.day;
        store.set('day', st.day);
      } else draw();
    },
  };
}
