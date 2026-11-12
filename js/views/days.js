// "Days": the itinerary. A list on phones, cards with relief views on wide screens.
import { html, $, $$, metres, dateShort, dateLong, pad2 } from '../util.js';
import { store } from '../store.js';
import { DAYS, TRIP, dateOf } from '../data.js';
import { KINDS } from '../content/itinerary.js';
import { VARIANTS } from '../content/guide.js';
import { tripState } from '../lib/tripday.js';
import { drawDayStill } from '../terrain/scene.js';
import { openDay } from './daysheet.js';
import { datesDialog } from '../ui/shell.js';

const narrow = () => matchMedia('(max-width: 760px)').matches;
const tone = (d) => (d.kind === 'pass' ? 'warn' : d.kind === 'rest' ? 'ice' : '');
const title = (d) => (d.kind === 'city' || d.kind === 'rest' ? d.title : d.route);

function row(d, today) {
  const date = dateOf(d.n);
  const facts = [date ? dateShort(date) : '', d.km, d.hours].filter((s) => s && s !== '0 km');
  return html`
    <li><button class="dayrow${d.n === today ? ' is-today' : ''}${d.n === store.state.day ? ' is-selected' : ''}" type="button" data-open="${d.n}" id="day-${d.n}">
      <span class="n num">${pad2(d.n)}</span>
      <span class="dr-main"><b>${title(d)}</b><span class="small muted">${facts.join(' · ')}</span></span>
      <span class="dr-side">${d.n === today ? html`<span class="chip accent">Today</span>` : html`<span class="chip ${tone(d)}">${KINDS[d.kind]}</span>`}<span class="small muted">${metres(d.sleep)}</span></span>
    </button></li>`;
}

function card(d, today) {
  const date = dateOf(d.n);
  return html`
    <article class="daycard${d.n === store.state.day ? ' is-selected' : ''}" id="day-${d.n}" data-day="${d.n}">
      <header class="daycard-head">
        <span class="n num">${pad2(d.n)}</span>
        <span class="when">${date ? dateShort(date) : ''}${d.n === today ? html`<span class="chip accent">Today</span>` : ''}<span class="chip ${tone(d)}">${KINDS[d.kind]}</span></span>
      </header>
      <figure class="daycard-art">
        <canvas width="640" height="360" data-still="${d.n}" role="img" aria-label="Relief view: ${d.place}"></canvas>
        <figcaption>${d.place}</figcaption>
      </figure>
      <div class="daycard-body">
        <h3 class="h3">${title(d)}</h3>
        <dl class="kv">
          <div><dt>Sleep</dt><dd>${metres(d.sleep)}</dd></div>
          <div><dt>Distance</dt><dd>${d.km}</dd></div>
          <div><dt>Time</dt><dd>${d.hours}</dd></div>
          ${d.high > d.sleep ? html`<div><dt>High point</dt><dd>${metres(d.high)}</dd></div>` : ''}
        </dl>
        <p class="note">${d.note}</p>
      </div>
      <button class="btn btn-light btn-block btn-caps" type="button" data-open="${d.n}">Open day <span aria-hidden="true">↗</span></button>
    </article>`;
}

export async function mount(root) {
  let observer;
  const draw = () => {
    const start = dateOf(1);
    const st = tripState(store.state.settings);
    const today = st.phase === 'during' ? st.day : 0;
    const list = narrow();
    root.innerHTML = html`
      <div class="wrap">
        <section class="section">
          <div class="section-head">
            <p class="eyebrow dim">${TRIP.days} days · ${TRIP.trekDays} on the trail</p>
            <h1 class="display">Days</h1>
            <p class="lede">Kathmandu to Kathmandu. Tap a day for the plan. Distances and times are typical: yours will differ.</p>
          </div>
          <p class="small muted" style="margin-bottom:18px">${start
            ? html`${dateLong(start)} to ${dateLong(dateOf(TRIP.days))}. Thorong La: <b>${dateLong(dateOf(TRIP.passDay))}</b>.`
            : html`No dates yet.`}
            <button class="linkbtn" type="button" id="d-dates" style="color:var(--accent)">${start ? 'Change dates' : 'Set your dates'}</button></p>
          ${list ? html`<ul class="dayrows">${DAYS.map((d) => row(d, today))}</ul>` : html`<div class="daygrid">${DAYS.map((d) => card(d, today))}</div>`}
        </section>

        <section class="section">
          <div class="card">
            <h2 class="h3">On the trail</h2>
            <p class="muted">You eat where you sleep: breakfast and dinner at the lodge, lunch at a tea house on the way. Rooms are twin, plain and unheated. A guide sets the pace and reads the weather. A porter carries the duffel and usually arrives first.</p>
          </div>
          <h2 class="h3" style="margin:26px 0 12px">Other ways to walk it</h2>
          <div class="grid three">
            ${VARIANTS.map((v) => html`<div class="card"><h3 class="h4">${v.title}</h3><p class="muted small">${v.text}</p></div>`)}
          </div>
        </section>
      </div>`;
    observe();
  };

  // On wide screens each relief view is drawn when its card first comes near the screen.
  const observe = () => {
    observer?.disconnect();
    if (narrow()) return;
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
    else if (t.id === 'd-dates') datesDialog();
  });

  draw();
  store.on('settings', draw);
  store.on('day', () => {
    $$('.is-selected', root).forEach((el) => el.classList.remove('is-selected'));
    $(`#day-${store.state.day}`, root)?.classList.add('is-selected');
  });
  matchMedia('(max-width: 760px)').addEventListener('change', draw);
}
