// The day sheet: one day, opened from any tab. The first screen holds the
// numbers, what to know and the height profile; everything else is folded away.
import { html, $, $$, metres, num, dateLong, clamp } from '../util.js';
import { store } from '../store.js';
import { data, TRIP, STOPS, PEAKS, day as dayOf, stopsOf, dateOf, walked } from '../data.js';
import { KINDS } from '../content/itinerary.js';
import { DETAILS, NOTE_LABELS } from '../content/details.js';
import { drawDayStill } from '../terrain/scene.js';
import { sunTimes, clock } from '../lib/sun.js';
import { nearestOnTrack } from '../lib/track.js';

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
  if (!scores[0] || total < 3) return { tone: '', text: `Score ${total}. No sign of altitude sickness by this check. Check again morning and evening.` };
  if (total <= 5) return { tone: 'accent', text: `Score ${total}: mild altitude sickness is possible. Do not sleep higher tonight. Rest, drink, tell your guide.` };
  if (total <= 9) return { tone: 'warn', text: `Score ${total}: moderate. Do not go higher. If you are not clearly better within a few hours, go down.` };
  return { tone: 'warn', text: `Score ${total}: severe. Go down now, with someone, and get medical help.` };
}

/** Height along the day's trail, with its stops marked. Empty for days without walking. */
function profile(n) {
  const pts = data.track.filter((p) => p.day === n);
  if (pts.length < 2) return '';
  const W = 520, H = 220, L = 50, R = 16, T = 30, B = 42;
  const km0 = pts[0].km, km1 = pts[pts.length - 1].km;
  const eles = pts.map((p) => p.ele);
  const lo = Math.floor(Math.min(...eles) / 100) * 100, hi = Math.ceil(Math.max(...eles) / 100) * 100;
  const x = (km) => L + ((km - km0) / (km1 - km0 || 1)) * (W - L - R);
  const y = (e) => T + (1 - (e - lo) / (hi - lo || 1)) * (H - T - B);
  const step = Math.max(1, Math.floor(pts.length / 200));
  const line = [];
  for (let i = 0; i < pts.length; i += step) line.push(`${x(pts[i].km).toFixed(1)},${y(pts[i].ele).toFixed(1)}`);
  line.push(`${x(km1).toFixed(1)},${y(pts[pts.length - 1].ele).toFixed(1)}`);
  const marks = [];
  for (const id of stopsOf(n)) {
    const s = STOPS[id];
    const at = nearestOnTrack(data.track, s.lon, s.lat);
    if (!at || at.dist > 0.6 || at.km < km0 - 0.05 || at.km > km1 + 0.05) continue;
    marks.push({ name: s.name, km: Math.min(km1, Math.max(km0, at.km)), ele: at.ele });
  }
  marks.sort((a, b) => a.km - b.km);
  let lastX = -999;
  const shown = marks.filter((m) => {
    if (x(m.km) - lastX < 78) return false;
    lastX = x(m.km);
    return true;
  });
  return html`
    <figure class="profile">
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Height along the day, from ${metres(pts[0].ele)} to ${metres(pts[pts.length - 1].ele)}">
        <line class="grid-line" x1="${L}" x2="${W - R}" y1="${y(hi)}" y2="${y(hi)}"/><text class="axis" x="${L - 8}" y="${y(hi) + 5}" text-anchor="end">${num(hi)}</text>
        <line class="grid-line" x1="${L}" x2="${W - R}" y1="${y(lo)}" y2="${y(lo)}"/><text class="axis" x="${L - 8}" y="${y(lo) + 5}" text-anchor="end">${num(lo)}</text>
        <polygon class="area" points="${x(km0)},${y(lo)} ${line.join(' ')} ${x(km1)},${y(lo)}"/>
        <polyline class="profile-line" points="${line.join(' ')}"/>
        ${shown.map((m) => {
          const px = x(m.km), anchor = px < L + 44 ? 'start' : px > W - R - 44 ? 'end' : 'middle';
          return html`<circle class="node" cx="${px}" cy="${y(m.ele)}" r="5"/><text class="tag" x="${px}" y="${Math.max(14, y(m.ele) - 12)}" text-anchor="${anchor}">${m.name}</text>`;
        })}
        <text class="axis" x="${L}" y="${H - 12}">0 km</text>
        <text class="axis" x="${W - R}" y="${H - 12}" text-anchor="end">${(km1 - km0).toFixed(1)} km</text>
      </svg>
    </figure>`;
}

function render(n) {
  const d = dayOf(n), x = DETAILS[n] || {}, date = dateOf(n), w = walked(n);
  const to = STOPS[d.to];
  const entry = store.state.journal[n] || {};
  const scores = entry.s || [0, 0, 0, 0];
  const sun = date ? sunTimes(date, to.lat, to.lon) : null;
  const notes = Object.entries(x.notes || {});
  const key = x.key || [d.note];
  const fold = (id, title, sub, body) => html`<details class="fold" id="${id}"><summary>${title}${sub ? html`<span class="sub">${sub}</span>` : ''}</summary><div class="fold-body">${body}</div></details>`;
  const peaks = d.peaks.map((id) => PEAKS.find((p) => p.id === id)).filter(Boolean).map((p) => `${p.name} (${metres(p.ele)})`).join(', ');

  return html`
    <div class="sheet-bar">
      <span class="sheet-pos">Day ${n} of ${TRIP.days}</span>
      <button class="btn btn-sm" type="button" data-go="${n - 1}" aria-label="Previous day"${n <= 1 ? ' disabled' : ''}>‹</button>
      <button class="btn btn-sm" type="button" data-go="${n + 1}" aria-label="Next day"${n >= TRIP.days ? ' disabled' : ''}>›</button>
      <button class="btn btn-sm" type="button" data-close>Close</button>
    </div>
    <div class="sheet-body">
      <section class="sheet-top">
        <p class="eyebrow">${KINDS[d.kind]}${date ? ' · ' + dateLong(date) : ''}</p>
        <h2 class="sheet-title" id="day-dialog-title">${d.title}</h2>
        <dl class="kv sheet-meta">
          <div><dt>Distance</dt><dd>${d.km}</dd></div>
          <div><dt>Time</dt><dd>${d.hours}</dd></div>
          ${w ? html`<div><dt>Climb</dt><dd>↑ ${num(Math.round(w.ascent / 50) * 50)} m · ↓ ${num(Math.round(w.descent / 50) * 50)} m</dd></div>` : ''}
          <div><dt>Sleep</dt><dd>${to.name}, ${metres(d.sleep)}</dd></div>
          ${d.high > d.sleep + 40 ? html`<div><dt>High point</dt><dd>${metres(d.high)}${d.highAt ? ' · ' + d.highAt : ''}</dd></div>` : ''}
        </dl>
        <h3 class="h4">Know this</h3>
        <ul class="bullets know">${key.map((k) => html`<li>${k}</li>`)}</ul>
        ${profile(n)}
        ${sun
          ? html`<p class="small muted">Light at ${to.name}: first light ${clock(sun.dawn)}, sunrise ${clock(sun.sunrise)}, sunset ${clock(sun.sunset)}, dark by ${clock(sun.dusk)}. Nepal time, flat horizon: in a valley the sun comes later and goes earlier.</p>`
          : html`<p class="small faint">Set your arrival date in the menu for sunrise and sunset.</p>`}
      </section>

      <div class="folds">
        ${x.thread ? fold('s-thread', 'The day', 'morning to evening', html`
          <p>${x.summary || d.text}</p>
          <div class="grid two steps">
            ${x.thread.map((t, i) => html`<div class="card"><small class="idx">0${i + 1}</small><h4 class="h4">${t.label}</h4><p class="muted">${t.text}</p><ul class="bullets">${t.points.map((p) => html`<li>${p}</li>`)}</ul></div>`)}
          </div>`) : ''}
        ${x.paces ? fold('s-paces', 'Options', 'easier, normal, longer', html`<div class="grid three paces">${x.paces.map((p) => html`<div class="card"><h4 class="h4">${p.label}</h4><p class="muted small">${p.text}</p></div>`)}</div>`) : ''}
        ${x.stops ? fold('s-stops', 'Stops', `${x.stops.length} places`, html`
          <div class="grid two">${x.stops.map((s) => html`<div class="card"><h4 class="h4">${s.name}</h4><p class="muted">${s.text}</p><p class="small"><b>On the ground:</b> <span class="muted">${s.field}</span></p><p class="small"><b>A frame to look for:</b> <span class="muted">${s.frame}</span></p></div>`)}</div>`) : ''}
        ${fold('s-bring', 'Bring', 'wear, pack, ask', html`
          <div class="grid three">
            <div class="card"><h4 class="h4">Wear</h4><ul class="bullets">${(x.wear || []).map((t) => html`<li>${t}</li>`)}</ul></div>
            <div class="card"><h4 class="h4">Day pack</h4><ul class="bullets">${(x.pack || []).map((t) => html`<li>${t}</li>`)}</ul></div>
            <div class="card"><h4 class="h4">Ask your guide or host</h4><ul class="bullets">${(x.ask || []).map((t) => html`<li>${t}</li>`)}</ul></div>
          </div>`)}
        ${notes.length ? fold('s-notes', 'Notes', `${notes.length} topics`, html`${notes.map(([k, text]) => html`<div><h4 class="h4">${NOTE_LABELS[k]}</h4><p class="muted">${text}</p></div>`)}`) : ''}
        ${x.stories ? fold('s-stories', 'Background', 'history, culture, geography', html`
          ${x.stories.map((s) => html`<div><h4 class="h4">${s.title}</h4><p class="muted">${s.text}</p></div>`)}
          ${peaks ? html`<p class="small faint">In view today: ${peaks}.</p>` : ''}`) : ''}
        ${fold('s-view', 'Relief view', `looking ${facing(d.cam.az)}`, html`
          <figure class="viewfig">
            <canvas width="1260" height="540" id="sheet-still" role="img" aria-label="Relief view of the day’s route"></canvas>
            <figcaption><b>${d.place}</b>The bright line is today’s stage. An elevation model under a 2016 satellite picture, not a view from the trail.</figcaption>
          </figure>`)}
        ${fold('s-journal', 'Journal', 'kept on this phone', html`
          <label class="lbl">How the day went
            <textarea class="field" id="sheet-note" placeholder="Weather, people, what you ate, what you want to remember.">${entry.note || ''}</textarea>
          </label>
          <div class="card">
            <h4 class="h4">Evening altitude check</h4>
            <p class="small muted">Four questions from the Lake Louise score that mountain doctors use. It starts a talk with your guide. It does not diagnose.</p>
            <div class="grid two" id="sheet-score">
              ${SYMPTOMS.map(([label, options], i) => html`<label class="lbl">${label}
                <select class="field" data-symptom="${i}">${options.map((o, v) => html`<option value="${v}"${scores[i] === v ? ' selected' : ''}>${v} · ${o}</option>`)}</select></label>`)}
            </div>
            <p class="chip ${verdict(scores).tone}" id="sheet-verdict" style="white-space:normal;padding:8px 12px">${verdict(scores).text}</p>
            <p class="small faint">Confusion, unsteady walking or breathlessness at rest are emergencies whatever the score: go down and get help.</p>
          </div>`)}
      </div>

      <div class="toolbar">
        <button class="btn" type="button" data-go="${n - 1}"${n <= 1 ? ' disabled' : ''}>‹ Day ${Math.max(1, n - 1)}</button>
        <button class="btn" type="button" data-close>Close</button>
        <button class="btn" type="button" data-go="${n + 1}"${n >= TRIP.days ? ' disabled' : ''}>Day ${Math.min(TRIP.days, n + 1)} ›</button>
      </div>
    </div>`;
}

let wired = false;
let pushed = false; // we added a history entry, so Back should close the sheet
const sheetHash = () => /^#\/days\/\d+/.test(location.hash);

function wire(dlg) {
  if (wired) return;
  wired = true;
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg || e.target.closest('[data-close]')) return dlg.close();
    const go = e.target.closest('[data-go]');
    if (go && !go.disabled) return openDay(Number(go.dataset.go));
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
    if (pushed) {
      pushed = false;
      if (sheetHash()) history.back(); // not when Back already did it
    } else if (sheetHash()) history.replaceState(null, '', '#/days');
  });
  // Drawn when the fold opens: the still is large and most people never open it.
  dlg.addEventListener('toggle', (e) => {
    if (e.target.id === 's-view' && e.target.open) drawDayStill($('#sheet-still', dlg), Number(dlg.dataset.day), { zoom: 0.92 });
  }, true);
}

export function openDay(n) {
  n = clamp(Math.round(n), 1, TRIP.days);
  const dlg = $('#day-dialog');
  wire(dlg);
  const path = `#/days/${n}`;
  if (!dlg.open && !sheetHash()) {
    history.pushState(null, '', path);
    pushed = true;
  } else history.replaceState(null, '', path);
  dlg.dataset.day = n;
  dlg.innerHTML = String(render(n));
  if (!dlg.open) dlg.showModal();
  dlg.scrollTop = 0;
  if (store.state.day !== n) store.set('day', n);
}

export function closeDay() {
  const dlg = $('#day-dialog');
  if (dlg.open) dlg.close();
}
