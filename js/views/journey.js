// "Journey": a globe with the way to Kathmandu, and the trip from door to door.
import { html, $, $$, haversine, num, clamp, dateShort, prefersReducedMotion } from '../util.js';
import { store } from '../store.js';
import { TRIP, dateOf } from '../data.js';
import { HOMES, HUBS, DOOR_TO_DOOR } from '../content/guide.js';
import { openDay } from './daysheet.js';

const KTM = { name: 'Kathmandu', lon: 85.36, lat: 27.7 };
const RAD = Math.PI / 180;

const unit = (lon, lat) => [Math.cos(lat * RAD) * Math.sin(lon * RAD), Math.sin(lat * RAD), Math.cos(lat * RAD) * Math.cos(lon * RAD)];
function slerp(a, b, t) {
  const dot = clamp(a[0] * b[0] + a[1] * b[1] + a[2] * b[2], -1, 1);
  const w = Math.acos(dot);
  if (w < 1e-6) return a;
  const s = Math.sin(w), ka = Math.sin((1 - t) * w) / s, kb = Math.sin(t * w) / s;
  return [a[0] * ka + b[0] * kb, a[1] * ka + b[1] * kb, a[2] * ka + b[2] * kb];
}

/** Where the sun is overhead right now, as a unit vector. */
function sunVector(now = new Date()) {
  const start = Date.UTC(now.getUTCFullYear(), 0, 0);
  const dayOfYear = (now - start) / 86400000;
  const decl = -23.44 * Math.cos(((2 * Math.PI) / 365) * (dayOfYear + 10));
  const hours = now.getUTCHours() + now.getUTCMinutes() / 60;
  return unit(-15 * (hours - 12), decl);
}

class Globe {
  constructor(canvas, land) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.dots = [];
    for (let i = 0; i < land.dots.length; i += 2) this.dots.push(unit(land.dots[i] / 10, land.dots[i + 1] / 10));
    this.lon = 74;
    this.lat = 26;
    this.baseLon = 74;
    this.home = null;
    this.playing = true;
    this.active = true;
    this.t0 = performance.now();
    this._lastInput = 0;
    this._drag();
    this._tick = this._tick.bind(this);
    requestAnimationFrame(this._tick);
  }

  setHome(home) {
    this.home = home;
    if (home) {
      const mid = slerp(unit(home.lon, home.lat), unit(KTM.lon, KTM.lat), 0.62);
      this.baseLon = Math.atan2(mid[0], mid[2]) / RAD;
      this.lat = clamp(Math.asin(mid[1]) / RAD, -50, 55);
    } else {
      this.baseLon = 74;
      this.lat = 26;
    }
    this.lon = this.baseLon;
    this.t0 = performance.now();
  }

  _drag() {
    const c = this.canvas;
    let last = null;
    c.addEventListener('pointerdown', (e) => {
      last = { x: e.clientX, y: e.clientY };
      c.setPointerCapture(e.pointerId);
      c.classList.add('dragging');
    });
    c.addEventListener('pointermove', (e) => {
      if (!last) return;
      this.lon -= (e.clientX - last.x) * 0.3;
      if (e.pointerType !== 'touch') this.lat = clamp(this.lat + (e.clientY - last.y) * 0.3, -70, 70);
      this.baseLon = this.lon;
      last = { x: e.clientX, y: e.clientY };
      this._lastInput = performance.now();
      this.t0 = this._lastInput;
    });
    const end = () => {
      last = null;
      c.classList.remove('dragging');
    };
    c.addEventListener('pointerup', end);
    c.addEventListener('pointercancel', end);
  }

  /** Rotate a unit vector into view space: x right, y up, z toward the viewer. */
  _view(v) {
    const l = this.lon * RAD, p = this.lat * RAD;
    const x = v[0] * Math.cos(l) - v[2] * Math.sin(l);
    const z0 = v[0] * Math.sin(l) + v[2] * Math.cos(l);
    return [x, v[1] * Math.cos(p) - z0 * Math.sin(p), v[1] * Math.sin(p) + z0 * Math.cos(p)];
  }

  _tick(now) {
    requestAnimationFrame(this._tick);
    if (!this.active) return;
    if (this.playing && !prefersReducedMotion() && now - this._lastInput > 2500) {
      this.lon = this.baseLon + 16 * Math.sin((now - this.t0) * 0.00012);
    }
    this.draw(now);
  }

  draw(now = performance.now()) {
    const c = this.canvas, ctx = this.ctx;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = c.clientWidth, h = c.clientHeight;
    if (!w || !h) return;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const narrow = w < 760;
    const R = narrow ? Math.min(w * 0.42, h * 0.44) : Math.min(h * 0.38, w * 0.245);
    const cx = narrow ? w / 2 : w * 0.565, cy = narrow ? h * 0.5 : h * 0.455;
    const P = (v, lift = 1) => [cx + R * v[0] * lift, cy - R * v[1] * lift];

    // atmosphere and the sphere itself
    const glow = ctx.createRadialGradient(cx, cy, R * 0.96, cx, cy, R * 1.22);
    glow.addColorStop(0, 'rgba(110, 190, 205, .26)');
    glow.addColorStop(1, 'rgba(110, 190, 205, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.22, 0, 7);
    ctx.fill();
    const body = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R);
    body.addColorStop(0, '#1d3a47');
    body.addColorStop(0.7, '#10222b');
    body.addColorStop(1, '#0a161d');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, 7);
    ctx.fill();
    ctx.strokeStyle = 'rgba(140, 210, 220, .35)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // graticule
    ctx.strokeStyle = 'rgba(230, 224, 206, .07)';
    const arc = (pts) => {
      let pen = false;
      ctx.beginPath();
      for (const v0 of pts) {
        const v = this._view(v0);
        if (v[2] <= 0) {
          pen = false;
          continue;
        }
        const [x, y] = P(v);
        pen ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        pen = true;
      }
      ctx.stroke();
    };
    for (let lon = -180; lon < 180; lon += 30) arc(Array.from({ length: 61 }, (_, i) => unit(lon, -90 + i * 3)));
    for (let lat = -60; lat <= 60; lat += 30) arc(Array.from({ length: 121 }, (_, i) => unit(-180 + i * 3, lat)));

    // land, lit where it is daytime right now
    const sun = sunVector();
    const size = Math.max(1.4, R / 120);
    for (const d of this.dots) {
      const v = this._view(d);
      if (v[2] <= 0.02) continue;
      const day = d[0] * sun[0] + d[1] * sun[1] + d[2] * sun[2];
      const lit = clamp(day * 4 + 0.5, 0, 1);
      const a = (0.3 + 0.62 * v[2]) * (0.62 + 0.38 * lit);
      ctx.fillStyle = lit > 0.5 ? `rgba(236, 226, 200, ${a.toFixed(3)})` : `rgba(140, 170, 185, ${a.toFixed(3)})`;
      const [x, y] = P(v);
      ctx.fillRect(x - size / 2, y - size / 2, size, size);
    }

    // routes into Kathmandu
    const k = unit(KTM.lon, KTM.lat);
    const routes = this.home ? [this.home] : HUBS;
    const phase = ((now - this.t0) / 9000) % 1;
    for (const from of routes) {
      const a = unit(from.lon, from.lat);
      ctx.strokeStyle = this.home ? 'rgba(239, 177, 80, .9)' : 'rgba(239, 177, 80, .38)';
      ctx.lineWidth = this.home ? 1.6 : 1;
      let pen = false;
      ctx.beginPath();
      for (let i = 0; i <= 64; i++) {
        const t = i / 64;
        const v = this._view(slerp(a, k, t));
        if (v[2] <= 0) {
          pen = false;
          continue;
        }
        const [x, y] = P(v, 1 + 0.07 * Math.sin(Math.PI * t));
        pen ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        pen = true;
      }
      ctx.stroke();
      if (this.home && this.playing) {
        const v = this._view(slerp(a, k, phase));
        if (v[2] > 0) {
          const [x, y] = P(v, 1 + 0.07 * Math.sin(Math.PI * phase));
          ctx.fillStyle = '#fff3d6';
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, 7);
          ctx.fill();
        }
      }
    }

    // place marks
    ctx.font = '600 12px "Instrument Sans", system-ui, sans-serif';
    ctx.textBaseline = 'middle';
    const mark = (place, strong) => {
      const v = this._view(unit(place.lon, place.lat));
      if (v[2] <= 0.05) return;
      const [x, y] = P(v);
      ctx.fillStyle = strong ? '#efb150' : 'rgba(236, 231, 218, .8)';
      ctx.beginPath();
      ctx.arc(x, y, strong ? 4.5 : 2.6, 0, 7);
      ctx.fill();
      if (strong) {
        ctx.strokeStyle = 'rgba(239, 177, 80, .45)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, 9 + 3 * Math.sin(now * 0.003), 0, 7);
        ctx.stroke();
      }
      const label = place.name;
      const tw = ctx.measureText(label).width;
      const left = x + tw + 26 > w;
      const lx = left ? x - tw - 22 : x + 10;
      ctx.fillStyle = 'rgba(12, 24, 31, .82)';
      ctx.fillRect(lx, y - 11, tw + 12, 22);
      ctx.fillStyle = strong ? '#f6e3bd' : 'rgba(236, 231, 218, .9)';
      ctx.fillText(label, lx + 6, y + 0.5);
    };
    for (const from of routes) mark(from, false);
    mark(KTM, true);
  }
}

export async function mount(root) {
  root.innerHTML = html`
    <div class="hero night" id="j-hero">
      <div class="stars" style="inset:0;opacity:.6"></div>
      <canvas class="gl" id="j-globe" role="img" aria-label="Globe showing the way to Kathmandu"></canvas>
      <div class="hero-shade"></div>
      <div class="hero-ui">
        <div class="daychip"><span>The journey atlas</span><small id="j-dates"></small></div>
        <div class="hero-copy" style="width:min(520px,100% - 40px)">
          <h1 class="display">Around<br><em>Annapurna</em>.</h1>
          <p class="text">From your front door to ${num(TRIP.highPoint)} metres and home again. ${TRIP.days} days, about ${TRIP.walkKm} km on foot, between rice terraces, ice and high desert.</p>
          <div class="chips">
            <a class="btn btn-primary btn-caps" href="#/map">Enter the Himalaya ↗</a>
            <a class="btn btn-caps" href="#/days">See the days</a>
          </div>
          <div class="legs">
            <div><small>Start</small><b id="j-home-name">Home</b></div>
            <div><small>Nepal</small><b>Kathmandu</b></div>
            <div><small>Trailhead</small><b>Jagat</b></div>
            <div><small>${num(TRIP.highPoint)} m</small><b>Thorong La</b></div>
            <div><small>The lake</small><b>Pokhara</b></div>
          </div>
        </div>
        <div class="flightcard">
          <p class="eyebrow">Illustrative route</p>
          <p class="h4" id="j-route">Choose where you start</p>
          <label class="lbl">I travel from
            <select class="field" id="j-home"><option value="">The world’s gateways to Kathmandu</option>${HOMES.map((h) => html`<option value="${h.id}">${h.name}</option>`)}</select>
          </label>
          <p class="small muted" id="j-note"></p>
          <div class="chips"><button class="btn btn-sm" type="button" id="j-play">Pause</button></div>
          <p class="tiny faint">A straight line on the globe, for orientation. Not a flight plan and not live traffic. Day and night are shown as they are right now.</p>
        </div>
        <p class="credit">Coastlines: Natural Earth · day and night computed on this device</p>
      </div>
    </div>
    <div class="wrap">
      <section class="section">
        <div class="grid two" style="align-items:start;gap:clamp(24px,5vw,64px)">
          <div style="display:grid;gap:18px">
            <p class="eyebrow">The expedition file</p>
            <h2 class="h2">Every stage,<br>door to door.</h2>
            <p class="lede">Flights, roads and trail in one place. The plan keeps a spare day at each end, because mountain weather does not read schedules.</p>
            <div class="stats">
              <div class="stat"><b>${TRIP.days}</b><span>days, Kathmandu to Kathmandu</span></div>
              <div class="stat"><b>${num(TRIP.highPoint)}</b><span>metres at Thorong La</span></div>
              <div class="stat"><b>${TRIP.walkKm}</b><span>km on foot</span></div>
            </div>
            <div class="card callout"><h3 class="h3">The Himalaya, in relief</h3><p class="muted small">Open the 3D relief to follow the route stage by stage from Jagat over the pass to Poon Hill. It works without a connection.</p><div><a class="btn" href="#/map">Open the relief ↗</a></div></div>
          </div>
          <div>
            <p class="eyebrow dim" style="margin-bottom:22px">From door to door</p>
            <ol class="timeline">
              ${DOOR_TO_DOOR.map((leg) => html`<li><p class="when" data-when="${leg.when}" data-day="${leg.day || ''}"></p><p class="what">${leg.what}</p><p class="muted small">${leg.text}</p>${leg.day ? html`<button class="linkbtn" type="button" data-open="${leg.day}" style="margin-top:8px;color:var(--accent)">Open day ${leg.day} ↗</button>` : ''}</li>`)}
            </ol>
          </div>
        </div>
      </section>
    </div>`;

  const applyDates = () => {
    const first = dateOf(1);
    $('#j-dates', root).textContent = first ? `${dateShort(first)} – ${dateShort(dateOf(TRIP.days))}` : `${TRIP.days} days · set your dates above`;
    for (const el of $$('[data-when]', root)) {
      const date = el.dataset.day ? dateOf(Number(el.dataset.day)) : null;
      el.textContent = el.dataset.when + (date ? ' · ' + dateShort(date) : '');
    }
  };
  applyDates();
  store.on('settings', applyDates);

  let globe = null;
  try {
    const land = await (await fetch('data/land.json')).json();
    globe = new Globe($('#j-globe', root), land);
  } catch (err) {
    console.warn('globe unavailable:', err);
  }

  const applyHome = () => {
    const home = HOMES.find((h) => h.id === store.state.settings.home) || null;
    $('#j-home', root).value = home ? home.id : '';
    $('#j-home-name', root).textContent = home ? home.name : 'Home';
    $('#j-route', root).textContent = home ? `${home.name} → Kathmandu` : 'Seven gateways, one runway';
    $('#j-note', root).textContent = home
      ? `About ${num(Math.round(haversine([home.lon, home.lat], [KTM.lon, KTM.lat]) / 50) * 50)} km in a straight line. Most routes connect once, through Delhi, the Gulf or Istanbul.`
      : 'Direct flights reach Kathmandu from Delhi, Doha, Dubai, Istanbul, Bangkok, Kuala Lumpur and Singapore, among others.';
    globe?.setHome(home);
  };
  applyHome();

  root.addEventListener('change', (e) => {
    if (e.target.id === 'j-home') {
      store.set('settings', { home: e.target.value });
      applyHome();
    }
  });
  root.addEventListener('click', (e) => {
    const t = e.target.closest('button');
    if (!t) return;
    if (t.id === 'j-play' && globe) {
      globe.playing = !globe.playing;
      t.textContent = globe.playing ? 'Pause' : 'Play';
    } else if (t.dataset.open) openDay(Number(t.dataset.open));
  });

  return {
    onVisible(visible) {
      if (globe) globe.active = visible;
    },
  };
}
