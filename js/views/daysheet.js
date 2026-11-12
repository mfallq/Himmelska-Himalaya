// The day sheet: everything about one day, opened from any tab.
import { html, $, $$, metres, dateLong, clamp } from '../util.js';
import { store } from '../store.js';
import { TRIP, STOPS, PEAKS, day as dayOf, stopsOf, dateOf, walked } from '../data.js';
import { KINDS } from '../content/itinerary.js';
import { DETAILS, NOTE_LABELS } from '../content/details.js';
import { drawDayStill } from '../terrain/scene.js';
import { sunTimes, clock } from '../lib/sun.js';

const COMPASS = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];
const facing = (az) => COMPASS[Math.round((((az % 360) + 360) % 360) / 45) % 8];

const SYMPTOMS = [
  ['Headache', ['None', 'Mild', 'Moderate', 'Severe']],
  ['Stomach', ['Good appetite', 'Poor appetite or nausea', 'Moderate nausea or vomiting', 'Severe, incapacitating']],
  ['Tiredness', ['Not tired', 'Mild', 'Moderate', 'Severe']],
  ['Dizziness', ['None', 'Mild', 'Moderate', 'Severe']],
];

function verdict(scores) {
  const total = scores.reduce((a, b) => a + b, 0);
  if (!scores[0] || total < 3) return { tone: '', text: `Score ${total}. By this check there is no sign of altitude sickness. Keep checking, morning and evening.` };
  if (total <= 5) return { tone: 'accent', text: `Score ${total}: consistent with mild altitude sickness. Do not sleep higher tonight. Rest, drink, and tell your guide.` };
  if (total <= 9) return { tone: 'warn', text: `Score ${total}: moderate. Do not go higher. If you are not clearly better within a few hours, go down.` };
  return { tone: 'warn', text: `Score ${total}: severe. Go down now, with someone, and get medical help.` };
}

function render(n) {
  const d = dayOf(n), x = DETAILS[n] || {}, date = dateOf(n), w = walked(n);
  const stops = stopsOf(n);
  const to = STOPS[d.to];
  const entry = store.state.journal[n] || {};
  const scores = entry.s || [0, 0, 0, 0];
  const sun = date ? sunTimes(date, to.lat, to.lon) : null;
  const notes = Object.entries(x.notes || {});
  const section = (id, eyebrow, title, body) => html`<section id="${id}"><p class="eyebrow">${eyebrow}</p><h3 class="h2" style="font-size:clamp(26px,3vw,34px)">${title}</h3>${body}</section>`;

  return html`
    <div class="sheet-grab"></div>
    <button class="btn btn-sm sheet-close" type="button" data-close>Close ×</button>
    <div class="sheet-body">
      <section>
        <p class="eyebrow">Trail companion · ${KINDS[d.kind]}</p>
        <h2 class="sheet-title" id="day-dialog-title">${d.title}</h2>
        <dl class="kv sheet-meta">
          <div><dt>Stage</dt><dd>${n} / ${TRIP.days}${date ? ' · ' + dateLong(date) : ''}</dd></div>
          <div><dt>Sleep</dt><dd>${to.name}, ${metres(d.sleep)}</dd></div>
          ${d.high > d.sleep ? html`<div><dt>High point</dt><dd>${metres(d.high)}${d.highAt ? ' · ' + d.highAt : ''}</dd></div>` : ''}
          <div><dt>Distance</dt><dd>${d.km}</dd></div>
          <div><dt>Time</dt><dd>${d.hours}</dd></div>
          ${w ? html`<div><dt>Climb, roughly</dt><dd>${Math.round(w.ascent / 50) * 50} m up · ${Math.round(w.descent / 50) * 50} m down</dd></div>` : ''}
        </dl>
        <figure class="viewfig">
          <canvas width="1260" height="540" id="sheet-still" role="img" aria-label="Relief view of the day’s route"></canvas>
          <figcaption><b>${d.place}</b>The day on the relief, looking ${facing(d.cam.az)}. The bright line is today’s stage. Drawn from elevation data, not a photograph.</figcaption>
        </figure>
        <p style="max-width:76ch">${x.summary || d.text}</p>
        <div class="chips">${stops.map((id) => html`<span class="chip">${STOPS[id].name} · ${metres(STOPS[id].ele)}</span>`)}</div>
        <nav class="anchors" aria-label="Sections of this day">
          ${x.thread ? html`<button class="chip" type="button" data-jump="s-thread">The day</button>` : ''}
          ${x.stops ? html`<button class="chip" type="button" data-jump="s-stops">Worth a stop</button>` : ''}
          ${x.stories ? html`<button class="chip" type="button" data-jump="s-stories">Stories</button>` : ''}
          <button class="chip" type="button" data-jump="s-ready">Get ready</button>
          <button class="chip" type="button" data-jump="s-light">Daylight</button>
          <button class="chip" type="button" data-jump="s-journal">Journal</button>
        </nav>
      </section>

      ${x.thread ? section('s-thread', 'From morning to evening', 'The thread of the day', html`
        <div class="grid two steps">
          ${x.thread.map((t, i) => html`<div class="card"><small class="idx">0${i + 1}</small><h4 class="h4">${t.label}</h4><p class="muted">${t.text}</p><ul class="bullets">${t.points.map((p) => html`<li>${p}</li>`)}</ul></div>`)}
        </div>
        ${x.paces ? html`<div class="grid three paces">${x.paces.map((p) => html`<div class="card"><h4 class="h4">${p.label}</h4><p class="muted small">${p.text}</p></div>`)}</div>` : ''}`) : ''}

      ${x.stops ? section('s-stops', 'Stops with a reason', 'Worth exploring', html`
        <div class="grid two">
          ${x.stops.map((s) => html`<div class="card"><h4 class="h4">${s.name}</h4><p class="muted">${s.text}</p><p class="small"><b>On the ground:</b> <span class="muted">${s.field}</span></p><p class="small"><b>A frame to look for:</b> <span class="muted">${s.frame}</span></p></div>`)}
        </div>`) : ''}

      ${x.stories ? section('s-stories', 'History, culture and geography', 'Stories of the place', html`
        <div class="grid two">${x.stories.map((s) => html`<div class="card"><h4 class="h4">${s.title}</h4><p class="muted">${s.text}</p></div>`)}</div>
        <p class="small faint">In view today: ${d.peaks.map((id) => PEAKS.find((p) => p.id === id)).filter(Boolean).map((p) => `${p.name} (${metres(p.ele)})`).join(', ')}.</p>`) : ''}

      ${section('s-ready', 'Before bed and before leaving', 'Get ready for this day', html`
        <div class="grid three">
          <div class="card"><h4 class="h4">What you wear</h4><ul class="bullets">${(x.wear || []).map((t) => html`<li>${t}</li>`)}</ul></div>
          <div class="card"><h4 class="h4">What stays in the day pack</h4><ul class="bullets">${(x.pack || []).map((t) => html`<li>${t}</li>`)}</ul></div>
          <div class="card"><h4 class="h4">Questions for your guide or host</h4><ul class="bullets">${(x.ask || []).map((t) => html`<li>${t}</li>`)}</ul></div>
        </div>
        <div>${notes.map(([key, text], i) => html`<details class="fold"${i === 0 ? ' open' : ''}><summary>${NOTE_LABELS[key]}</summary><div class="fold-body"><p>${text}</p></div></details>`)}</div>`)}

      ${section('s-light', 'Sun and daylight', `Light at ${to.name}`, sun ? html`
        <dl class="kv card">
          <div><dt>First light</dt><dd>${clock(sun.dawn)}</dd></div>
          <div><dt>Sunrise</dt><dd>${clock(sun.sunrise)}</dd></div>
          <div><dt>Sunset</dt><dd>${clock(sun.sunset)}</dd></div>
          <div><dt>Dark by</dt><dd>${clock(sun.dusk)}</dd></div>
          <div><dt>Daylight</dt><dd>${Math.floor(sun.dayLength / 60)} h ${Math.round(sun.dayLength % 60)} min</dd></div>
        </dl>
        <p class="small faint">Nepal time (UTC+5:45), for ${dateLong(date)}, calculated on this device for a flat horizon. In a valley the sun arrives later and leaves earlier.</p>`
        : html`<p class="muted">Set your arrival date (top of the page) to see first light, sunrise and sunset for each day’s stop. They are calculated on your device and work offline.</p>`)}

      ${section('s-journal', 'Kept on this device only', 'Journal for the day', html`
        <label class="lbl">How the day went
          <textarea class="field" id="sheet-note" placeholder="Weather, people, what you ate, what you want to remember.">${entry.note || ''}</textarea>
        </label>
        <div class="card">
          <h4 class="h4">Evening altitude check</h4>
          <p class="small muted">Four questions from the Lake Louise score that mountain doctors use. It prompts a conversation with your guide. It does not diagnose anything.</p>
          <div class="grid two" id="sheet-score">
            ${SYMPTOMS.map(([label, options], i) => html`<label class="lbl">${label}
              <select class="field" data-symptom="${i}">${options.map((o, v) => html`<option value="${v}"${scores[i] === v ? ' selected' : ''}>${v} · ${o}</option>`)}</select></label>`)}
          </div>
          <p class="chip ${verdict(scores).tone}" id="sheet-verdict" style="white-space:normal;padding:8px 12px">${verdict(scores).text}</p>
          <p class="small faint">Confusion, unsteady walking or breathlessness while resting are emergencies whatever the score: go down and get help.</p>
        </div>`)}

      <div class="toolbar">
        <button class="btn" type="button" data-go="${n - 1}"${n <= 1 ? ' disabled' : ''}>← Day ${Math.max(1, n - 1)}</button>
        <button class="btn" type="button" data-close>Close</button>
        <button class="btn" type="button" data-go="${n + 1}"${n >= TRIP.days ? ' disabled' : ''}>Day ${Math.min(TRIP.days, n + 1)} →</button>
      </div>
    </div>`;
}

let wired = false;
function wire(dlg) {
  if (wired) return;
  wired = true;
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg || e.target.closest('[data-close]')) return dlg.close();
    const go = e.target.closest('[data-go]');
    if (go && !go.disabled) return openDay(Number(go.dataset.go));
    const jump = e.target.closest('[data-jump]');
    if (jump) $('#' + jump.dataset.jump, dlg)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  dlg.addEventListener('input', (e) => {
    const n = Number(dlg.dataset.day);
    const entry = { ...(store.state.journal[n] || {}) };
    if (e.target.id === 'sheet-note') entry.note = e.target.value;
    else if (e.target.dataset.symptom !== undefined) {
      entry.s = $$('[data-symptom]', dlg).map((s) => Number(s.value));
      const v = verdict(entry.s), el = $('#sheet-verdict', dlg);
      el.textContent = v.text;
      el.className = 'chip ' + v.tone;
    } else return;
    store.set('journal', { [n]: entry });
  });
  dlg.addEventListener('close', () => {
    if (/^#\/days\/\d+/.test(location.hash)) history.replaceState(null, '', '#/days');
  });
}

export function openDay(n) {
  n = clamp(Math.round(n), 1, TRIP.days);
  const dlg = $('#day-dialog');
  wire(dlg);
  dlg.dataset.day = n;
  dlg.innerHTML = String(render(n));
  if (!dlg.open) dlg.showModal();
  dlg.scrollTop = 0;
  if (store.state.day !== n) store.set('day', n);
  drawDayStill($('#sheet-still', dlg), n, { zoom: 0.92 });
}
