// "Altitude": sleeping heights, the walk in profile, and what thin air asks of you.
import { html, raw, $, $$, metres, dateShort, num } from '../util.js';
import { store } from '../store.js';
import { data, DAYS, TRIP, STOPS, dateOf } from '../data.js';
import { ALTITUDE_CARDS, ALTITUDE_RULES } from '../content/guide.js';
import { openDay } from './daysheet.js';

/** Share of sea-level air pressure at a height, from the standard atmosphere. */
export const pressure = (m) => (1 - 2.25577e-5 * m) ** 5.25588;

// ---- chart 1: where you sleep, day by day ----
function sleepChart(selected, narrow) {
  const W = narrow ? 520 : 1000, H = narrow ? 480 : 420, L = narrow ? 52 : 64, R = narrow ? 14 : 24, T = 28, B = 52, MAX = 6000;
  const x = (n) => L + ((n - 1) / (TRIP.days - 1)) * (W - L - R);
  const y = (m) => T + (1 - m / MAX) * (H - T - B);
  const pts = DAYS.map((d) => `${x(d.n).toFixed(1)},${y(d.sleep).toFixed(1)}`);
  return html`
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Sleeping altitude for each day of the trip">
      <defs><linearGradient id="alt-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--accent)" stop-opacity=".2"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></linearGradient></defs>
      ${[0, 2000, 4000, 6000].map((m) => html`<line class="grid-line" x1="${L}" x2="${W - R}" y1="${y(m)}" y2="${y(m)}"/><text class="axis" x="${L - 12}" y="${y(m) + 4}" text-anchor="end">${num(m)}</text>`)}
      <polygon class="area" points="${x(1)},${y(0)} ${pts.join(' ')} ${x(TRIP.days)},${y(0)}"/>
      <polyline class="sleep" points="${pts.join(' ')}"/>
      ${DAYS.filter((d) => d.high > d.sleep + 40).map((d) => html`<line class="high" x1="${x(d.n)}" x2="${x(d.n)}" y1="${y(d.sleep) - 9}" y2="${y(d.high)}"/><line class="high" style="stroke-dasharray:none" x1="${x(d.n) - 6}" x2="${x(d.n) + 6}" y1="${y(d.high)}" y2="${y(d.high)}"/>`)}
      ${DAYS.map((d) => html`
        <g data-day="${d.n}">
          <rect class="hit" x="${x(d.n) - 22}" y="${T}" width="44" height="${H - T - B + 30}"><title>Day ${d.n}: ${d.route}, sleep ${metres(d.sleep)}</title></rect>
          <circle class="node${d.n === selected ? ' sel' : ''}" cx="${x(d.n)}" cy="${y(d.sleep)}" r="6.5"/>
          ${d.kind === 'rest' ? html`<text class="tag" x="${x(d.n)}" y="${y(Math.max(d.sleep, d.high)) - 14}">rest</text>` : ''}
          ${d.kind === 'pass' ? html`<text class="tag" x="${x(d.n)}" y="${y(d.high) - 12}">${num(d.high)} m</text>` : ''}
          <text class="axis" x="${x(d.n)}" y="${H - 20}" text-anchor="middle" ${d.n === selected ? raw('style="fill:var(--accent);font-weight:700"') : ''}>${d.n}</text>
        </g>`)}
      <text class="axis" x="${L - 12}" y="${H - 20}" text-anchor="end">Day</text>
    </svg>`;
}

// ---- chart 2: the trail itself, by distance ----
function profileChart(selected, narrow) {
  const t = data.track;
  if (!t.length) return '';
  const W = narrow ? 520 : 1000, H = narrow ? 380 : 300, L = narrow ? 52 : 64, R = narrow ? 14 : 24, T = 22, B = 46, MAX = 6000, MIN = 500;
  const x = (km) => L + (km / data.trackKm) * (W - L - R);
  const y = (m) => T + (1 - (m - MIN) / (MAX - MIN)) * (H - T - B);
  const step = Math.max(1, Math.floor(t.length / 700));
  const line = [];
  for (let i = 0; i < t.length; i += step) line.push(`${x(t[i].km).toFixed(1)},${y(t[i].ele).toFixed(1)}`);
  line.push(`${x(t[t.length - 1].km).toFixed(1)},${y(t[t.length - 1].ele).toFixed(1)}`);
  // where each walking day starts and ends
  const spans = [];
  for (const p of t) {
    const last = spans[spans.length - 1];
    if (!last || last.day !== p.day) spans.push({ day: p.day, from: p.km, to: p.km });
    else last.to = p.km;
  }
  const sel = spans.find((s) => s.day === selected);
  return html`
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Elevation profile of the walking route by distance">
      ${[1000, 3000, 5000].map((m) => html`<line class="grid-line" x1="${L}" x2="${W - R}" y1="${y(m)}" y2="${y(m)}"/><text class="axis" x="${L - 12}" y="${y(m) + 4}" text-anchor="end">${num(m)}</text>`)}
      ${sel ? html`<rect x="${x(sel.from)}" y="${T}" width="${Math.max(2, x(sel.to) - x(sel.from))}" height="${H - T - B}" fill="var(--accent)" opacity=".13"/>` : ''}
      <polygon class="area" points="${x(0)},${y(MIN)} ${line.join(' ')} ${x(data.trackKm)},${y(MIN)}"/>
      <polyline class="profile" style="stroke:var(--accent);opacity:1;stroke-width:2" points="${line.join(' ')}"/>
      ${spans.map((s) => html`
        <g data-day="${s.day}">
          <rect class="hit" x="${x(s.from)}" y="${T}" width="${Math.max(2, x(s.to) - x(s.from))}" height="${H - T - B}"><title>Day ${s.day}: ${DAYS[s.day - 1].route}</title></rect>
          <line class="grid-line" style="stroke-dasharray:2 4" x1="${x(s.from)}" x2="${x(s.from)}" y1="${T}" y2="${H - B}"/>
          <text class="axis" x="${(x(s.from) + x(s.to)) / 2}" y="${H - 24}" text-anchor="middle" ${s.day === selected ? raw('style="fill:var(--accent);font-weight:700"') : ''}>${s.day}</text>
        </g>`)}
      <text class="axis" x="${L - 12}" y="${H - 24}" text-anchor="end">Day</text>
      <text class="axis" x="${L}" y="${H - 6}">0 km</text>
      <text class="axis" x="${W - R}" y="${H - 6}" text-anchor="end">${Math.round(data.trackKm)} km on foot</text>
    </svg>`;
}

function nights() {
  const rows = [];
  for (let i = 1; i < DAYS.length; i++) {
    const d = DAYS[i], prev = DAYS[i - 1];
    if (d.sleep < 3000) continue;
    const gain = d.sleep - prev.sleep;
    rows.push({ d, gain, flag: gain > 500 });
  }
  return rows;
}

export async function mount(root) {
  const draw = () => {
    const n = store.state.day, d = DAYS[n - 1], date = dateOf(n);
    const p = pressure(d.sleep), pHigh = pressure(d.high);
    const C = 2 * Math.PI * 50;
    const narrow = matchMedia('(max-width: 760px)').matches;
    root.innerHTML = html`
      <div class="wrap">
        <section class="section">
          <div class="section-head">
            <p class="eyebrow dim">We gain height and keep our patience</p>
            <h1 class="display">Thinner air.<br><em>Slower</em> steps.</h1>
            <p class="lede">The solid line is where you sleep. The dashed marks show how high each day goes. Select a day on either chart.</p>
          </div>
          <div class="card chartcard">
            <header><h2 class="h3">Day ${n}${date ? ' · ' + dateShort(date) : ''}</h2><span class="chip">${STOPS[d.to].name} · ${metres(d.sleep)}</span></header>
            <div class="chart${narrow ? ' narrow' : ''}" id="a-sleep">${sleepChart(n, narrow)}</div>
            <div class="legend"><span><i></i>Sleeping altitude</span><span><i class="dash"></i>Highest point of the day</span></div>
          </div>
          <div class="card chartcard" style="margin-top:16px">
            <header><h2 class="h3">The walk in profile</h2><span class="chip">${Math.round(data.trackKm)} km · Jagat to Nayapul</span></header>
            <div class="chart${narrow ? ' narrow' : ''}" id="a-profile">${profileChart(n, narrow)}</div>
            <p class="small faint" style="margin-top:8px">Walking days only, by distance along the mapped trail. Heights are pinned to the published altitude of each village, with the shape in between taken from an elevation model, so treat small bumps as approximate. The drop between days 13 and 14 is the road down the Kali Gandaki.</p>
          </div>
        </section>

        <section class="section" style="padding-top:28px">
          <div class="grid two">
            <div class="card">
              <div class="gauge">
                <div class="ring">
                  <svg viewBox="0 0 112 112"><circle cx="56" cy="56" r="50" fill="none" stroke="var(--line)" stroke-width="3"/><circle cx="56" cy="56" r="50" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linecap="round" stroke-dasharray="${(C * p).toFixed(1)} ${C.toFixed(1)}"/></svg>
                  <b>${Math.round(p * 100)}%</b>
                </div>
                <div style="display:grid;gap:8px">
                  <h3 class="h3">The same air,<br>less of it.</h3>
                  <p class="muted small">At ${metres(d.sleep)}, where you sleep on day ${n}, air pressure is about ${Math.round(p * 100)}% of sea level. The air is still 21% oxygen: each breath simply holds less.${d.high > d.sleep + 40 ? ` At the day’s high point, ${metres(d.high)}, it is about ${Math.round(pHigh * 100)}%.` : ''}</p>
                </div>
              </div>
            </div>
            ${ALTITUDE_CARDS.map((c) => html`<div class="card${c.warn ? ' alert' : ''}"><h3 class="h3">${c.title}</h3><p class="muted small">${c.text}</p></div>`)}
          </div>
        </section>

        <section class="section">
          <div class="section-head">
            <p class="eyebrow">The plan against the rule</p>
            <h2 class="h2">Every night above 3,000 m.</h2>
            <p class="lede">The usual advice is to raise your sleeping height by no more than about 500 m a night once above 3,000 m, with a rest day every few days. This is how the default itinerary measures up.</p>
          </div>
          <ul class="rules">
            ${nights().map(({ d: day, gain, flag }) => html`<li class="${flag ? 'flag' : ''}"><b>Day ${day.n}</b><span>${STOPS[day.to].name} · ${metres(day.sleep)}</span><span class="chip ${flag ? 'warn' : gain <= 0 ? 'ice' : ''}">${gain > 0 ? '+' : gain < 0 ? '−' : ''}${num(Math.abs(gain))} m${flag ? ' · above the guideline' : gain === 0 ? ' · rest' : ''}</span></li>`)}
          </ul>
          <div class="card callout" style="margin-top:16px">
            <p class="muted">Two nights go over the line. Day 6 crosses 3,000 m with a 630 m jump, softened by the two nights that follow at 3,540 m. Day 9 gains about 510 m. To stay within the guideline, sleep in Lower Pisang on day 6, or add a night in Chame, and take a second night at Yak Kharka if anyone is slow to adjust.</p>
          </div>
          <div class="card" style="margin-top:16px">
            <h3 class="h3">Five rules worth knowing by heart</h3>
            <ul class="bullets">${ALTITUDE_RULES.map((r) => html`<li>${r}</li>`)}</ul>
          </div>
          <p class="small faint" style="margin-top:16px">General information, not medical advice. The pressure figure comes from a standard atmosphere model: it is not your blood oxygen and cannot diagnose altitude sickness.
            Sources: <a href="https://www.cdc.gov/yellow-book/hcp/environmental-hazards-risks/high-altitude-travel-and-altitude-illness.html" target="_blank" rel="noopener">CDC Yellow Book</a>, Wilderness Medical Society guidelines.</p>
        </section>
      </div>`;
  };

  root.addEventListener('click', (e) => {
    const g = e.target.closest('[data-day]');
    if (!g) return;
    const n = Number(g.dataset.day);
    if (n === store.state.day) openDay(n);
    else store.set('day', n);
  });
  draw();
  matchMedia('(max-width: 760px)').addEventListener('change', draw);
  store.on('day', draw);
  store.on('settings', draw);
}
