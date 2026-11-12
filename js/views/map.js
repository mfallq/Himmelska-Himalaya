// "Map": a flat map of the trail with your position, and the 3D relief as a second mode.
// The flat map works without WebGL and without a connection. Your position is
// read from the phone's GPS when you ask for it, and is never stored or sent.
import { html, $, $$, clamp, download, toast, haversine, metres } from '../util.js';
import { store } from '../store.js';
import { data, loadPois, DAYS, STOPS, legsOf, stopsOf } from '../data.js';
import { getDem } from '../terrain/dem.js';
import { paintLandcover } from '../terrain/paint.js';
import { buildGpx } from '../lib/gpx.js';
import { locate, locateMessage } from '../lib/locate.js';
import { progress, nearestStop } from '../lib/track.js';

const OVERNIGHT = [...new Set(DAYS.map((d) => d.to))];

export class FieldMap {
  constructor(canvas, dem, base) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.dem = dem;
    this.base = base;
    this.cx = 0; // centre in km from the middle of the grid, x east, y south
    this.cy = 0;
    this.scale = 6; // CSS pixels per km
    this.items = [];
    this.categories = [];
    this.selected = null;
    this.day = 0;
    this.me = null; // { lon, lat, acc }
    this.onPick = null;
    this._hits = [];
    this._controls();
    new ResizeObserver(() => this.draw()).observe(canvas);
  }
  km(lon, lat) {
    const [u, v] = this.dem.uv(lon, lat);
    return [(u - 0.5) * this.dem.widthKm, (v - 0.5) * this.dem.heightKm];
  }
  screen(lon, lat) {
    const [x, y] = this.km(lon, lat);
    return [this.canvas.clientWidth / 2 + (x - this.cx) * this.scale, this.canvas.clientHeight / 2 + (y - this.cy) * this.scale];
  }
  fit(points, pad = 60) {
    if (!points.length) return;
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const p of points) {
      const [x, y] = this.km(p[0], p[1]);
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
    }
    const w = this.canvas.clientWidth - pad * 2, h = this.canvas.clientHeight - pad * 2;
    this.cx = (x0 + x1) / 2;
    this.cy = (y0 + y1) / 2;
    this.scale = clamp(Math.min(w / Math.max(0.5, x1 - x0), h / Math.max(0.5, y1 - y0)), 3, 400);
    this.draw();
  }
  zoomAt(factor, px, py) {
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    px ??= w / 2;
    py ??= h / 2;
    const kx = this.cx + (px - w / 2) / this.scale, ky = this.cy + (py - h / 2) / this.scale;
    this.scale = clamp(this.scale * factor, 3, 400);
    this.cx = kx - (px - w / 2) / this.scale;
    this.cy = ky - (py - h / 2) / this.scale;
    this.draw();
  }
  focus(item) {
    [this.cx, this.cy] = this.km(item[0], item[1]);
    this.scale = Math.max(this.scale, 90);
    this.selected = item;
    this.draw();
  }
  /** Centre on a position, zoomed in at least to `minScale` pixels per km. */
  centre(lon, lat, minScale = 45) {
    [this.cx, this.cy] = this.km(lon, lat);
    this.scale = Math.max(this.scale, minScale);
    this.draw();
  }

  _controls() {
    const c = this.canvas;
    const pointers = new Map();
    let moved = 0, pinch = 0;
    c.addEventListener('pointerdown', (e) => {
      c.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      moved = 0;
    });
    c.addEventListener('pointermove', (e) => {
      const p = pointers.get(e.pointerId);
      if (!p) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      p.x = e.clientX;
      p.y = e.clientY;
      moved += Math.abs(dx) + Math.abs(dy);
      if (pointers.size >= 2) {
        const [a, b] = [...pointers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch) this.scale = clamp((this.scale * d) / pinch, 3, 400);
        pinch = d;
      }
      this.cx -= dx / this.scale / Math.max(1, pointers.size);
      this.cy -= dy / this.scale / Math.max(1, pointers.size);
      this.draw();
    });
    const end = (e) => {
      const had = pointers.delete(e.pointerId);
      pinch = 0;
      if (!had || moved > 6 || e.type === 'pointercancel') return;
      const r = c.getBoundingClientRect();
      this._click(e.clientX - r.left, e.clientY - r.top);
    };
    c.addEventListener('pointerup', end);
    c.addEventListener('pointercancel', end);
    c.addEventListener(
      'wheel',
      (e) => {
        if (!e.ctrlKey && !e.metaKey) return;
        e.preventDefault();
        const r = c.getBoundingClientRect();
        this.zoomAt(Math.exp(-e.deltaY * 0.004), e.clientX - r.left, e.clientY - r.top);
      },
      { passive: false },
    );
  }
  _click(x, y) {
    let best = null, bestD = 22;
    for (const h of this._hits) {
      const d = Math.hypot(h.x - x, h.y - y) - h.r;
      if (d < bestD) {
        bestD = d;
        best = h;
      }
    }
    if (!best) return;
    if (best.items.length === 1) {
      this.selected = best.items[0];
      this.onPick?.(best.items[0]);
      this.draw();
    } else this.zoomAt(2.2, best.x, best.y);
  }

  draw() {
    const c = this.canvas, ctx = this.ctx;
    const w = c.clientWidth, h = c.clientHeight;
    if (!w || !h) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#0d1a21';
    ctx.fillRect(0, 0, w, h);
    const { widthKm: W, heightKm: H } = this.dem;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(this.base, w / 2 + (-W / 2 - this.cx) * this.scale, h / 2 + (-H / 2 - this.cy) * this.scale, W * this.scale, H * this.scale);

    // route
    ctx.lineJoin = ctx.lineCap = 'round';
    for (const pass of [0, 1]) {
      for (const leg of data.route.legs) {
        const sel = leg.day === this.day;
        ctx.beginPath();
        leg.line.forEach((p, i) => {
          const [x, y] = this.screen(p[0], p[1]);
          i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        });
        ctx.setLineDash(leg.mode === 'trek' ? [] : [6, 6]);
        if (pass === 0) {
          ctx.strokeStyle = 'rgba(10, 8, 4, .6)';
          ctx.lineWidth = sel ? 7 : 5;
        } else {
          ctx.strokeStyle = sel ? '#fff0c9' : leg.mode === 'trek' ? '#e9b55c' : 'rgba(236, 226, 200, .8)';
          ctx.lineWidth = sel ? 3.6 : 2.2;
        }
        ctx.stroke();
      }
    }
    ctx.setLineDash([]);

    // places, clustered while zoomed out
    this._hits = [];
    const cell = 30;
    const clusters = new Map();
    for (const it of this.items) {
      const [x, y] = this.screen(it[0], it[1]);
      if (x < -20 || y < -20 || x > w + 20 || y > h + 20) continue;
      const key = this.scale > 70 ? `${it[0]},${it[1]}` : `${Math.floor(x / cell)}:${Math.floor(y / cell)}`;
      let cl = clusters.get(key);
      if (!cl) clusters.set(key, (cl = { x: 0, y: 0, items: [] }));
      cl.x += x;
      cl.y += y;
      cl.items.push(it);
    }
    ctx.font = '600 11px "Instrument Sans", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const cl of clusters.values()) {
      const n = cl.items.length, x = cl.x / n, y = cl.y / n;
      const single = n === 1;
      const r = single ? 6 : Math.min(17, 9 + Math.sqrt(n) * 1.6);
      // a cluster takes the colour of its most common category
      const tally = {};
      for (const it of cl.items) tally[it[2]] = (tally[it[2]] || 0) + 1;
      const top = Object.keys(tally).sort((a, b) => tally[b] - tally[a])[0];
      ctx.fillStyle = this.categories[top].color;
      ctx.strokeStyle = 'rgba(8, 14, 18, .9)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 7);
      ctx.fill();
      ctx.stroke();
      if (!single) {
        ctx.fillStyle = '#0c1418';
        ctx.fillText(String(n), x, y + 0.5);
      }
      if (single && cl.items[0] === this.selected) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, 7);
        ctx.stroke();
      }
      this._hits.push({ x, y, r, items: cl.items });
    }

    // overnight stops by name
    ctx.font = '600 12px "Instrument Sans", system-ui, sans-serif';
    ctx.textAlign = 'left';
    for (const id of OVERNIGHT) {
      const s = STOPS[id];
      if (!s || !this.dem.contains(s.lon, s.lat)) continue;
      const [x, y] = this.screen(s.lon, s.lat);
      if (x < -60 || y < -20 || x > w + 20 || y > h + 20) continue;
      const tw = ctx.measureText(s.name).width;
      ctx.fillStyle = 'rgba(10, 18, 23, .82)';
      ctx.fillRect(x + 9, y - 22, tw + 12, 20);
      ctx.fillStyle = '#f1ede2';
      ctx.fillText(s.name, x + 15, y - 11.5);
    }

    // you, on top of everything
    if (this.me && this.dem.contains(this.me.lon, this.me.lat)) {
      const [x, y] = this.screen(this.me.lon, this.me.lat);
      const ring = (this.me.acc / 1000) * this.scale;
      if (ring > 9) {
        ctx.fillStyle = 'rgba(74, 168, 255, .16)';
        ctx.strokeStyle = 'rgba(74, 168, 255, .55)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, ring, 0, 7);
        ctx.fill();
        ctx.stroke();
      }
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, 7);
      ctx.fill();
      ctx.fillStyle = '#2f8cff';
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, 7);
      ctx.fill();
    }

    // scale bar
    const nice = [0.2, 0.5, 1, 2, 5, 10, 20, 50].find((k) => k * this.scale >= 70) || 50;
    ctx.fillStyle = 'rgba(10, 18, 23, .78)';
    ctx.fillRect(w - nice * this.scale - 30, h - 38, nice * this.scale + 18, 26);
    ctx.strokeStyle = '#f1ede2';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(w - 21 - nice * this.scale, h - 19);
    ctx.lineTo(w - 21, h - 19);
    ctx.stroke();
    ctx.fillStyle = '#f1ede2';
    ctx.textAlign = 'center';
    ctx.font = '600 10.5px "Instrument Sans", system-ui, sans-serif';
    ctx.fillText(nice < 1 ? `${nice * 1000} m` : `${nice} km`, w - 21 - (nice * this.scale) / 2, h - 28);
  }
}

const touch = () => matchMedia('(pointer: coarse)').matches;
const metresOrKm = (km) => (km < 1 ? `${Math.round(km * 100) * 10} m` : `${km.toFixed(1)} km`);

/** The flat map and everything under it. Returns { onVisible, locate }. */
async function mount2d(root) {
  root.innerHTML = html`
    <div class="mapwrap night mapfull">
      <canvas id="f-map" role="img" aria-label="Map of the trail and the places along it"></canvas>
      <div class="mapbtns">
        <button class="pill icon" type="button" data-locate aria-label="Where am I" title="Where am I">◎</button>
        <button class="pill icon" type="button" data-fzoom="1.6" aria-label="Zoom in">+</button>
        <button class="pill icon" type="button" data-fzoom="0.625" aria-label="Zoom out">−</button>
      </div>
      <div class="poicard" id="f-card" hidden></div>
      <div class="attrib">© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors · <span id="f-date"></span></div>
    </div>
    <p class="tiny faint maphint">${touch() ? 'Drag to move. Pinch to zoom. Tap a dot for the place.' : 'Drag to move. Ctrl + scroll to zoom. Click a dot for the place.'} A numbered dot is a group: tap it to zoom in.</p>

    <div class="card gps" id="m-gps" aria-live="polite"></div>

    <div class="scopebar">
      <div class="seg" role="group" aria-label="Part of the route">
        <button type="button" data-scope="day" id="f-scope-day">Day</button>
        <button type="button" data-scope="all">Whole route</button>
      </div>
    </div>

    <section class="places">
      <h2 class="h3">Places</h2>
      <input class="field" type="search" id="f-search" placeholder="Search village, lodge, water, clinic" aria-label="Search places">
      <div class="cats" id="f-cats"></div>
      <div class="toolbar">
        <p><b id="f-count"></b><br><span class="small muted" id="f-sub"></span></p>
        <button class="btn btn-sm" type="button" data-reset>Reset filters</button>
      </div>
      <details class="fold"><summary>List<span class="sub" id="f-listcount"></span></summary><div class="fold-body"><div class="poilist" id="f-list"></div></div></details>
      <details class="fold"><summary>About this data</summary><div class="fold-body">
        <p>Places come from OpenStreetMap, a map made by volunteers. Coverage is good in the villages and thin between them. Lodges open and close, water points run dry, and health posts are staffed only in season.</p>
        <p>Mapped water is not checked for safety: treat it. Each morning, ask where the next water, meal and phone signal are.</p>
      </div></details>
      <div><button class="btn" type="button" data-gpx>Export route as GPX</button></div>
    </section>`;

  const [dem, pois] = await Promise.all([getDem(data.terrain), loadPois()]);
  const base = paintLandcover(dem, 1.25, { shaded: true });
  const map = new FieldMap($('#f-map', root), dem, base);
  map.categories = pois.categories;
  $('#f-date', root).textContent = pois.extracted ? `extracted ${pois.extracted}` : '';

  const state = { cats: new Set(), query: '', scope: 'day' };
  const trekDayOf = (n) => {
    if (legsOf(n).some((l) => l.mode === 'trek')) return n;
    return n === 8 ? 7 : 0; // the rest day in Manang looks at the day that arrives there
  };
  const trekDay = () => trekDayOf(store.state.day);
  if (!trekDay()) state.scope = 'all';

  function filtered() {
    const q = state.query.trim().toLowerCase();
    const day = state.scope === 'day' ? trekDay() : 0;
    return pois.items.filter((it) => {
      if (state.cats.size && !state.cats.has(it[2])) return false;
      if (state.scope === 'day' && it[4] !== day) return false;
      if (!q) return true;
      return (it[3] || '').toLowerCase().includes(q) || pois.categories[it[2]].label.toLowerCase().includes(q);
    });
  }

  function refresh({ fit = false } = {}) {
    const items = filtered();
    map.items = items;
    map.day = store.state.day;
    const counts = pois.categories.map(() => 0);
    const q = state.query.trim().toLowerCase();
    const day = state.scope === 'day' ? trekDay() : 0;
    for (const it of pois.items) {
      if (state.scope === 'day' && it[4] !== day) continue;
      if (q && !((it[3] || '').toLowerCase().includes(q) || pois.categories[it[2]].label.toLowerCase().includes(q))) continue;
      counts[it[2]]++;
    }
    $('#f-scope-day', root).textContent = `Day ${store.state.day}`;
    $$('[data-scope]', root).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.scope === state.scope)));
    $('#f-cats', root).innerHTML = html`
      <button class="cat" type="button" data-cat="all" aria-pressed="${String(!state.cats.size)}">All <span>${counts.reduce((a, b) => a + b, 0)}</span></button>
      ${pois.categories.map((c, i) => html`<button class="cat" type="button" data-cat="${i}" aria-pressed="${String(state.cats.has(i))}"><i style="background:${c.color}"></i>${c.label} <span>${counts[i]}</span></button>`)}`;
    const noWalk = state.scope === 'day' && !day;
    $('#f-count', root).textContent = noWalk
      ? `Day ${store.state.day} has no walking stage`
      : `${items.length} place${items.length === 1 ? '' : 's'}${state.scope === 'day' ? ` on day ${day}` : ' on the whole route'}`;
    $('#f-sub', root).textContent = noWalk
      ? 'Choose Whole route, or pick a walking day.'
      : state.cats.size
        ? [...state.cats].map((i) => pois.categories[i].label).join(', ')
        : 'All categories';
    $('#f-listcount', root).textContent = `${Math.min(items.length, 120)} of ${items.length}`;
    $('#f-list', root).innerHTML = html`${items.slice(0, 120).map((it) => {
      const c = pois.categories[it[2]];
      return html`<button type="button" data-poi="${pois.items.indexOf(it)}"><i style="width:12px;height:12px;border-radius:50%;background:${c.color};display:block"></i><span><b>${it[3] || c.label}</b><br><span class="small faint">${it[3] ? c.label + ' · ' : ''}day ${it[4]}</span></span><span class="small faint">→</span></button>`;
    })}`;
    if (fit) frame(state.scope === 'day' ? 'day' : 'all');
    else map.draw();
  }

  function frame(which) {
    const n = trekDay();
    const legs = which === 'day' && n ? legsOf(n).filter((l) => l.mode === 'trek') : data.route.legs.filter((l) => l.mode === 'trek');
    map.fit(legs.flatMap((l) => l.line));
  }

  function showCard(it) {
    const c = pois.categories[it[2]];
    const card = $('#f-card', root);
    const near = nearestStop(OVERNIGHT.map((id) => STOPS[id]).filter(Boolean), it[0], it[1]);
    card.hidden = false;
    card.innerHTML = html`
      <div class="toolbar"><span class="chip" style="border-color:${c.color};color:${c.color}">${c.label}</span><button class="linkbtn" type="button" data-card-close aria-label="Close">Close</button></div>
      <h3 class="h4" style="font-size:16px">${it[3] || c.label}</h3>
      <p class="small muted">Day ${it[4]} · ${near ? (near.km < 0.3 ? `in ${near.stop.name}` : `${near.km.toFixed(1)} km from ${near.stop.name}`) : ''}</p>
      <p class="small faint">${it[1].toFixed(5)}, ${it[0].toFixed(5)}</p>
      <div class="chips"><button class="btn btn-sm" type="button" data-copy="${it[1].toFixed(5)}, ${it[0].toFixed(5)}">Copy position</button>
      <a class="btn btn-sm" target="_blank" rel="noopener" href="https://www.openstreetmap.org/?mlat=${it[1]}&mlon=${it[0]}#map=17/${it[1]}/${it[0]}">OpenStreetMap ↗</a></div>`;
  }
  map.onPick = showCard;

  // ---------- where am I ----------
  let fix = null;
  let searching = false;
  function renderGps(error) {
    const el = $('#m-gps', root);
    if (searching) {
      el.innerHTML = html`<p><b>Looking for GPS</b>${fix ? ` · ±${Math.round(fix.acc)} m so far` : ''}</p><p class="small muted">Stand in the open. This can take up to a minute.</p>`;
      return;
    }
    if (error) {
      el.innerHTML = html`<p><b>No position</b></p><p class="small muted">${error}</p><div><button class="btn btn-sm" type="button" data-locate>Try again</button></div>`;
      return;
    }
    if (!fix) {
      el.innerHTML = html`<div class="toolbar"><div><p><b>Where am I</b></p><p class="small muted">Uses the phone's GPS. Works without data. The position stays on this phone.</p></div><button class="btn btn-primary" type="button" data-locate>Find me</button></div>`;
      return;
    }
    const n = trekDay();
    const stops = stopsOf(n).map((id) => ({ id, ...STOPS[id] }));
    const p = n ? progress(data.track, fix.lon, fix.lat, n, stops) : null;
    const hero = [];
    let note = '';
    if (p?.onDay) {
      hero.push(`<b>${p.done.toFixed(1)} km done · ${p.left.toFixed(1)} km left</b>`);
      hero.push(`About ${Math.round(p.up / 10) * 10} m up and ${Math.round(p.down / 10) * 10} m down to go`);
      if (p.next) hero.push(`Next: ${p.next.name}, ${metres(p.next.ele)}, in ${p.next.ahead.toFixed(1)} km`);
      note = p.onTrail ? 'On the trail.' : `${metresOrKm(p.off)} from the trail.`;
    } else if (p && p.off < 3) {
      hero.push(`<b>You are on the trail of day ${p.hitDay}</b>`);
      note = n ? `Day ${n} is selected. <button class="linkbtn" type="button" data-setday="${p.hitDay}">Show day ${p.hitDay}</button>` : '';
    } else {
      const near = nearestStop(OVERNIGHT.map((id) => STOPS[id]).filter(Boolean), fix.lon, fix.lat);
      hero.push(`<b>${p ? metresOrKm(p.off) : '?'} from the mapped trail</b>`);
      if (near) hero.push(`Nearest stop: ${near.stop.name}, ${metresOrKm(near.km)} away`);
      if (!n) note = `Day ${store.state.day} has no walking stage.`;
    }
    const height = fix.alt != null ? ` · GPS height ${metres(fix.alt)}${fix.altAcc ? ` ±${Math.round(fix.altAcc)}` : ''}` : '';
    el.innerHTML = `${hero.map((h) => `<p>${h.startsWith('<') ? h : esc(h)}</p>`).join('')}<p class="small muted">${note} ±${Math.round(fix.acc)} m${height}</p><div class="chips"><button class="btn btn-sm" type="button" data-locate>Update</button><button class="btn btn-sm" type="button" data-copy="${fix.lat.toFixed(5)}, ${fix.lon.toFixed(5)}">Copy position</button></div>`;
  }
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  async function findMe() {
    if (searching) return;
    searching = true;
    fix = null;
    renderGps();
    try {
      fix = await locate({
        onUpdate: (f) => {
          fix = f;
          renderGps();
        },
      });
      searching = false;
      map.me = fix;
      if (dem.contains(fix.lon, fix.lat)) map.centre(fix.lon, fix.lat, 45);
      else map.draw();
      renderGps();
    } catch (err) {
      searching = false;
      fix = null;
      map.me = null;
      map.draw();
      renderGps(locateMessage(err));
    }
  }

  root.addEventListener('click', async (e) => {
    const t = e.target.closest('button');
    if (!t) return;
    if (t.dataset.locate !== undefined) findMe();
    else if (t.dataset.setday) {
      store.set('day', Number(t.dataset.setday));
    } else if (t.dataset.scope) {
      state.scope = t.dataset.scope;
      refresh({ fit: true });
    } else if (t.dataset.cat !== undefined) {
      if (t.dataset.cat === 'all') state.cats.clear();
      else {
        const i = Number(t.dataset.cat);
        state.cats.has(i) ? state.cats.delete(i) : state.cats.add(i);
      }
      refresh();
    } else if (t.dataset.fzoom) map.zoomAt(Number(t.dataset.fzoom));
    else if (t.dataset.reset !== undefined) {
      state.cats.clear();
      state.query = '';
      $('#f-search', root).value = '';
      refresh({ fit: true });
    } else if (t.dataset.poi) {
      const it = pois.items[Number(t.dataset.poi)];
      map.focus(it);
      showCard(it);
      $('#f-map', root).scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (t.dataset.cardClose !== undefined) {
      $('#f-card', root).hidden = true;
      map.selected = null;
      map.draw();
    } else if (t.dataset.copy) {
      try {
        await navigator.clipboard.writeText(t.dataset.copy);
        toast('Position copied.');
      } catch {
        toast(t.dataset.copy);
      }
    } else if (t.dataset.gpx !== undefined) {
      download('annapurna-circuit.gpx', buildGpx(), 'application/gpx+xml');
      toast('Route saved. Open the file in your map app.');
    }
  });
  $('#f-search', root).addEventListener('input', (e) => {
    state.query = e.target.value;
    refresh();
  });
  store.on('day', () => {
    if (trekDay() === 0) state.scope = 'all';
    refresh({ fit: state.scope === 'day' });
    if (fix) renderGps();
  });

  renderGps();
  refresh();
  frame(state.scope === 'day' ? 'day' : 'all');
  return {
    onVisible: (v) => v && map.draw(),
    locate: findMe,
  };
}

export async function mount(root) {
  const narrow = matchMedia('(max-width: 760px)').matches;
  let mode = store.state.relief.map || (narrow ? '2d' : '3d');
  let visible = true;
  let api2 = null, api3 = null;
  root.innerHTML = html`
    <div class="mapmodes"><div class="seg" role="group" aria-label="Map type">
      <button type="button" data-mode="2d">Map</button>
      <button type="button" data-mode="3d">3D relief</button>
    </div></div>
    <div class="wrap map2d" id="m-2d" hidden></div>
    <div id="m-3d" hidden></div>`;
  const pane2 = $('#m-2d', root), pane3 = $('#m-3d', root);

  async function setMode(next, save = true) {
    mode = next;
    if (save) store.set('relief', { map: next });
    pane2.hidden = next !== '2d';
    pane3.hidden = next !== '3d';
    $$('[data-mode]', root).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === next)));
    try {
      if (next === '2d' && !api2) api2 = await mount2d(pane2);
      if (next === '3d' && !api3) api3 = (await (await import('./terrain.js')).mount(pane3)) || {};
    } catch (err) {
      console.error(err);
      (next === '2d' ? pane2 : pane3).innerHTML = '<p class="muted" style="padding:24px">This map could not be loaded. Reload the page to try again.</p>';
    }
    api2?.onVisible?.(visible && mode === '2d');
    api3?.onVisible?.(visible && mode === '3d');
  }
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-mode]');
    if (b && b.dataset.mode !== mode) setMode(b.dataset.mode);
  });
  await setMode(mode, false);

  return {
    onVisible(v) {
      visible = v;
      api2?.onVisible?.(v && mode === '2d');
      api3?.onVisible?.(v && mode === '3d');
    },
    async locate() {
      if (mode !== '2d') await setMode('2d');
      api2?.locate();
    },
  };
}
