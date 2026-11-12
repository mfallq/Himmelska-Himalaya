// The field file: mapped services along the route on a flat relief map, with
// search and category filters. Everything is local, so it works offline.
import { html, $, $$, clamp, download, toast, haversine } from '../util.js';
import { store } from '../store.js';
import { data, loadPois, DAYS, STOPS, legsOf } from '../data.js';
import { getScene } from '../terrain/scene.js';
import { paintLandcover } from '../terrain/paint.js';
import { buildGpx } from '../lib/gpx.js';

const OVERNIGHT = [...new Set(DAYS.map((d) => d.to))];

class FieldMap {
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
    let best = null, bestD = 18;
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
      const r = single ? 5.5 : Math.min(17, 8 + Math.sqrt(n) * 1.6);
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
        ctx.arc(x, y, 11, 0, 7);
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

export async function mountField(root) {
  root.hidden = false;
  root.innerHTML = html`
    <div class="section-head">
      <p class="eyebrow">The field file · works without signal</p>
      <div class="toolbar" style="align-items:flex-end">
        <div style="display:grid;gap:12px">
          <h2 class="display" style="font-size:clamp(40px,5.6vw,68px)">What is on the <em>ground</em>.</h2>
          <p class="lede">Water, beds, health posts, bridges and shrines mapped within a kilometre of the trail. Mapped does not mean open, and a gap on the map does not mean nothing is there.</p>
        </div>
        <button class="btn" type="button" data-gpx>Export the route as GPX</button>
      </div>
    </div>
    <div class="grid" style="grid-template-columns:minmax(0,2fr) minmax(0,1fr);gap:10px">
      <input class="field" type="search" id="f-search" placeholder="Search a village, lodge, water point, clinic…" aria-label="Search places">
      <select class="field" id="f-scope" aria-label="Which part of the route">
        <option value="all">Whole route</option>
        <option value="day">Selected day only</option>
      </select>
    </div>
    <p class="small muted" style="margin:14px 0 10px">Choose one or more categories, tap a dot to open the place. A numbered dot is a group: tap it to zoom in.</p>
    <div class="cats" id="f-cats"></div>
    <div class="card" style="margin:16px 0 12px;padding:16px 20px">
      <div class="toolbar"><p><b id="f-count"></b><br><span class="small muted" id="f-sub"></span></p>
        <div class="chips"><button class="btn btn-sm" type="button" data-fit="day">Frame the day</button><button class="btn btn-sm" type="button" data-fit="all">Frame the route</button><button class="btn btn-sm" type="button" data-reset>Reset filters</button></div></div>
    </div>
    <div class="mapwrap night">
      <canvas id="f-map" role="img" aria-label="Map of mapped services along the route"></canvas>
      <div class="zoom"><button class="pill icon" type="button" data-fzoom="1.6" aria-label="Zoom in">+</button><button class="pill icon" type="button" data-fzoom="0.625" aria-label="Zoom out">−</button></div>
      <div class="poicard" id="f-card" hidden></div>
      <div class="attrib">© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors · relief from Mapzen terrain tiles · <span id="f-date"></span></div>
    </div>
    <p class="tiny faint" style="margin-top:8px">Drag to move. Ctrl + scroll or pinch to zoom.</p>
    <details class="fold" style="margin-top:14px"><summary>See the places as a list<span class="sub" id="f-listcount"></span></summary><div class="fold-body"><div class="poilist" id="f-list"></div></div></details>
    <details class="fold"><summary>What this data is, and what it is not</summary><div class="fold-body">
      <p>Places come from OpenStreetMap, a map made by volunteers. Coverage is good in the villages and thin between them. Lodges open and close, water points run dry, and health posts are staffed only in season.</p>
      <p>Mapped water is not checked for safety: treat it. Ask your guide or the lodge each morning where the next water, the next meal and the next working phone signal are.</p>
    </div></details>`;

  const [scene, pois] = await Promise.all([getScene(), loadPois()]);
  const base = paintLandcover(scene.dem, 1.25, { shaded: true });
  const map = new FieldMap($('#f-map', root), scene.dem, base);
  map.categories = pois.categories;
  $('#f-date', root).textContent = pois.extracted ? `extracted ${pois.extracted}` : '';

  const state = { cats: new Set(), query: '', scope: 'all' };
  const trekDayOf = (n) => {
    if (legsOf(n).some((l) => l.mode === 'trek')) return n;
    return n === 8 ? 7 : 0; // the rest day in Manang looks at the day that arrives there
  };

  function filtered() {
    const q = state.query.trim().toLowerCase();
    const day = state.scope === 'day' ? trekDayOf(store.state.day) : 0;
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
    const day = state.scope === 'day' ? trekDayOf(store.state.day) : 0;
    for (const it of pois.items) {
      if (state.scope === 'day' && it[4] !== day) continue;
      if (q && !((it[3] || '').toLowerCase().includes(q) || pois.categories[it[2]].label.toLowerCase().includes(q))) continue;
      counts[it[2]]++;
    }
    $('#f-cats', root).innerHTML = html`
      <button class="cat" type="button" data-cat="all" aria-pressed="${String(!state.cats.size)}">All <span>${counts.reduce((a, b) => a + b, 0)}</span></button>
      ${pois.categories.map((c, i) => html`<button class="cat" type="button" data-cat="${i}" aria-pressed="${String(state.cats.has(i))}"><i style="background:${c.color}"></i>${c.label} <span>${counts[i]}</span></button>`)}`;
    const noWalk = state.scope === 'day' && !day;
    $('#f-count', root).textContent = noWalk
      ? `Day ${store.state.day} has no walking stage`
      : `${items.length} place${items.length === 1 ? '' : 's'}${state.scope === 'day' ? ` on day ${day}` : ' along the whole route'}`;
    $('#f-sub', root).textContent = noWalk
      ? 'Choose “Whole route”, or pick a trekking day.'
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
    const n = trekDayOf(store.state.day);
    const legs = which === 'day' && n ? legsOf(n).filter((l) => l.mode === 'trek') : data.route.legs.filter((l) => l.mode === 'trek');
    map.fit(legs.flatMap((l) => l.line));
  }

  function showCard(it) {
    const c = pois.categories[it[2]];
    const card = $('#f-card', root);
    const near = OVERNIGHT.map((id) => STOPS[id]).filter(Boolean).map((s) => ({ s, km: haversine([s.lon, s.lat], [it[0], it[1]]) })).sort((a, b) => a.km - b.km)[0];
    card.hidden = false;
    card.innerHTML = html`
      <div class="toolbar"><span class="chip" style="border-color:${c.color};color:${c.color}">${c.label}</span><button class="linkbtn" type="button" data-card-close aria-label="Close">Close ×</button></div>
      <h3 class="h4" style="font-size:16px">${it[3] || c.label}</h3>
      <p class="small muted">Day ${it[4]} · ${near ? (near.km < 0.3 ? `in ${near.s.name}` : `${near.km.toFixed(1)} km from ${near.s.name}`) : ''}</p>
      <p class="small faint">${it[1].toFixed(5)}, ${it[0].toFixed(5)} (WGS84)</p>
      <div class="chips"><button class="btn btn-sm" type="button" data-copy="${it[1].toFixed(5)}, ${it[0].toFixed(5)}">Copy position</button>
      <a class="btn btn-sm" target="_blank" rel="noopener" href="https://www.openstreetmap.org/?mlat=${it[1]}&mlon=${it[0]}#map=17/${it[1]}/${it[0]}">OpenStreetMap ↗</a></div>`;
  }
  map.onPick = showCard;

  root.addEventListener('click', async (e) => {
    const t = e.target.closest('button');
    if (!t) return;
    if (t.dataset.cat !== undefined) {
      if (t.dataset.cat === 'all') state.cats.clear();
      else {
        const i = Number(t.dataset.cat);
        state.cats.has(i) ? state.cats.delete(i) : state.cats.add(i);
      }
      refresh();
    } else if (t.dataset.fit) frame(t.dataset.fit);
    else if (t.dataset.fzoom) map.zoomAt(Number(t.dataset.fzoom));
    else if (t.dataset.reset !== undefined) {
      state.cats.clear();
      state.query = '';
      state.scope = 'all';
      $('#f-search', root).value = '';
      $('#f-scope', root).value = 'all';
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
      toast('Route exported. Open the file in your map app.');
    }
  });
  $('#f-search', root).addEventListener('input', (e) => {
    state.query = e.target.value;
    refresh();
  });
  $('#f-scope', root).addEventListener('change', (e) => {
    state.scope = e.target.value;
    refresh({ fit: true });
  });
  store.on('day', () => refresh({ fit: state.scope === 'day' }));

  refresh();
  frame('all');
}
