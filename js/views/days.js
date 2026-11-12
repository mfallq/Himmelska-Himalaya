// "Days": the itinerary as a grid of cards, one per day.
import { html, $, $$, metres, dateShort, dateLong, pad2, clamp } from '../util.js';
import { store } from '../store.js';
import { DAYS, TRIP, STOPS, dateOf } from '../data.js';
import { KINDS } from '../content/itinerary.js';
import { VARIANTS } from '../content/guide.js';
import { drawDayStill } from '../terrain/scene.js';
import { openDay } from './daysheet.js';
import { datesDialog } from '../ui/shell.js';

function card(d) {
  const date = dateOf(d.n);
  const tone = d.kind === 'pass' ? 'warn' : d.kind === 'rest' ? 'ice' : '';
  return html`
    <article class="daycard" id="day-${d.n}" data-day="${d.n}">
      <header class="daycard-head">
        <span class="n num">${pad2(d.n)}</span>
        <span class="when">${date ? dateShort(date) : ''}<span class="chip ${tone}">${KINDS[d.kind]}</span></span>
      </header>
      <figure class="daycard-art">
        <canvas width="640" height="360" data-still="${d.n}" role="img" aria-label="Relief view: ${d.place}"></canvas>
        <figcaption>${d.place} · relief view</figcaption>
      </figure>
      <div class="daycard-body">
        <h3 class="h3">${d.kind === 'city' || d.kind === 'rest' ? d.title : d.route}</h3>
        <dl class="kv">
          <div><dt>Sleep</dt><dd>${metres(d.sleep)}</dd></div>
          <div><dt>Distance</dt><dd>${d.km}</dd></div>
          <div><dt>Time</dt><dd>${d.hours}</dd></div>
          ${d.high > d.sleep ? html`<div><dt>High point</dt><dd>${metres(d.high)}</dd></div>` : ''}
        </dl>
        <p class="note">${d.note}</p>
      </div>
      <button class="btn btn-light btn-block btn-caps" type="button" data-open="${d.n}">Day details <span aria-hidden="true">↗</span></button>
    </article>`;
}

export async function mount(root) {
  const draw = () => {
    const start = dateOf(1);
    root.innerHTML = html`
      <div class="wrap">
        <section class="section">
          <div class="section-head">
            <p class="eyebrow dim">The default itinerary · ${TRIP.days} days · ${TRIP.trekDays} on the trail</p>
            <h1 class="display">One long <em>circle</em>,<br>a day at a time.</h1>
            <p class="lede">Choose a day to open its plan: the thread of the day, what is worth a stop, what to wear, and what to ask your guide. Distances and times are typical figures. Yours will differ.</p>
          </div>
          <div class="card callout" style="margin-bottom:26px">
            <p>${start
              ? html`Your plan runs from <b>${dateLong(start)}</b> to <b>${dateLong(dateOf(TRIP.days))}</b>. Walking starts on day ${TRIP.firstTrekDay} and Thorong La falls on <b>${dateLong(dateOf(TRIP.passDay))}</b>.`
              : html`The plan counts from day 1, your arrival in Kathmandu. Add your arrival date to see a calendar date on every card.`}
              <button class="linkbtn" type="button" id="d-dates" style="margin-left:8px;color:var(--accent)">${start ? 'Change dates' : 'Set your dates'}</button></p>
          </div>
          <div class="toolbar" style="margin-bottom:18px">
            <p class="small"><b id="d-current"></b></p>
            <button class="btn btn-sm" type="button" id="d-jump">Go to the selected day</button>
          </div>
          <div class="daygrid">${DAYS.map(card)}</div>
        </section>

        <section class="section">
          <div class="section-head">
            <p class="eyebrow">A guide to each day</p>
            <h2 class="h2">Any day, in detail.</h2>
          </div>
          <div class="picker">
            <button class="btn" type="button" data-step="-1">← Previous day</button>
            <select class="field" id="d-select" aria-label="Day">
              ${DAYS.map((d) => html`<option value="${d.n}">Day ${d.n}${dateOf(d.n) ? ' · ' + dateShort(dateOf(d.n)) : ''} · ${d.title}</option>`)}
            </select>
            <button class="btn" type="button" data-step="1">Next day →</button>
          </div>
          <div style="margin-top:14px"><button class="btn btn-primary" type="button" id="d-open">Open this day ↗</button></div>
        </section>

        <section class="section">
          <div class="card">
            <h3 class="h3">With a team, at your own pace</h3>
            <p class="muted">On the trail you eat where you sleep: breakfast and dinner at the lodge, lunch at a tea house on the way. Rooms are twin, plain and unheated. A guide sets the pace and reads the weather; a porter carries the duffel and usually arrives before you.</p>
          </div>
          <div class="grid three" style="margin-top:16px">
            ${VARIANTS.map((v) => html`<div class="card"><h4 class="h4">${v.title}</h4><p class="muted small">${v.text}</p></div>`)}
          </div>
        </section>
      </div>`;
    sync(store.state.day);
    observe();
  };

  const sync = (n) => {
    const d = DAYS[n - 1], date = dateOf(n);
    $('#d-current', root).textContent = `Selected: day ${n}${date ? ' · ' + dateShort(date) : ''} · ${d.route}`;
    $('#d-select', root).value = n;
    $$('.daycard', root).forEach((c) => c.classList.toggle('is-selected', Number(c.dataset.day) === n));
  };

  // Draw each relief still when its card first comes near the screen.
  let observer;
  const observe = () => {
    observer?.disconnect();
    observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          observer.unobserve(e.target);
          drawDayStill(e.target, Number(e.target.dataset.still));
        }
      },
      { rootMargin: '300px' },
    );
    $$('[data-still]', root).forEach((c) => observer.observe(c));
  };

  root.addEventListener('click', (e) => {
    const t = e.target.closest('button');
    if (!t) return;
    if (t.dataset.open) openDay(Number(t.dataset.open));
    else if (t.dataset.step) store.set('day', clamp(store.state.day + Number(t.dataset.step), 1, TRIP.days));
    else if (t.id === 'd-open') openDay(store.state.day);
    else if (t.id === 'd-dates') datesDialog();
    else if (t.id === 'd-jump') $(`#day-${store.state.day}`, root)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  root.addEventListener('change', (e) => {
    if (e.target.id === 'd-select') store.set('day', Number(e.target.value));
  });

  draw();
  store.on('day', sync);
  store.on('settings', draw);
}
