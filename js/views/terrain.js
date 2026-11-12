// "Relief 3D": the cinematic relief with the route, a day slider and labels.
import { html, $, $$, metres, dateShort, toast, bearing, clamp, pad2 } from '../util.js';
import { store } from '../store.js';
import { data, DAYS, TRIP, STOPS, PEAKS, day as dayOf, stopsOf, dateOf, walked, trackAt } from '../data.js';
import { KINDS } from '../content/itinerary.js';
import { getScene, repaint, cameraOf, usesPhoto } from '../terrain/scene.js';
import { openDay } from './daysheet.js';

const OVERNIGHT = new Set(DAYS.map((d) => d.to));

function template() {
  return html`
    <div class="hero night" id="t-hero">
      <div class="stars"></div>
      <div class="hero-shade"></div>
      <div class="labels" id="t-labels"></div>
      <div class="hero-ui">
        <div class="daychip"><span id="t-chip"></span><small id="t-chip-sub"></small></div>
        <p class="hint">Drag to orbit · Shift-drag to move · Ctrl + scroll or pinch to zoom</p>
        <div class="hero-tools">
          <button class="pill icon" type="button" data-zoom="0.75" aria-label="Zoom in">+</button>
          <button class="pill icon" type="button" data-zoom="1.33" aria-label="Zoom out">−</button>
          <button class="pill" type="button" id="t-orbit" aria-pressed="true">Slow orbit</button>
          <button class="pill" type="button" id="t-haze" aria-pressed="true">Atmosphere</button>
        </div>
        <div class="hero-copy">
          <p class="eyebrow"><span class="dim" id="t-count"></span> · The plan</p>
          <h1 class="display" id="t-head"></h1>
          <p class="place" id="t-place"></p>
          <p class="text" id="t-text"></p>
        </div>
        <div class="relief-controls">
          <div class="row">
            <label for="t-exag">Offline relief</label>
            <select class="field" id="t-exag" aria-label="Vertical exaggeration">
              <option value="1">1× · true to scale</option>
              <option value="1.4">1.4× · clear</option>
              <option value="1.85">1.85× · cinematic</option>
            </select>
          </div>
          <div class="modes" role="group" aria-label="View">
            <button type="button" data-mode="cinema">Cinema</button>
            <button type="button" data-mode="atlas">Atlas</button>
            <button type="button" data-toggle="labels">Landmarks</button>
            <button type="button" class="sat" data-toggle="satellite">Satellite</button>
          </div>
          <div class="altbox"><b class="num" id="t-alt"></b><span>metres / sleeping altitude</span></div>
        </div>
        <div class="daypanel">
          <div class="meta" id="t-meta"></div>
          <div><button class="btn btn-primary btn-caps" type="button" id="t-fly">Fly the route</button></div>
          <input class="slider" type="range" id="t-slider" min="1" max="${TRIP.days}" step="1" aria-label="Day of the trip">
          <div class="nav">
            <button class="linkbtn" type="button" data-step="-1">← Previous day</button>
            <button class="linkbtn" type="button" data-step="1">Next day →</button>
          </div>
        </div>
        <p class="credit" id="t-credit"></p>
        <button class="linkbtn frame-all" type="button" id="t-all">Whole circuit</button>
      </div>
    </div>
    <div class="wrap">
      <section class="section">
        <div class="grid two" style="align-items:start">
          <div style="display:grid;gap:16px;padding-top:22px;border-top:1px solid var(--line)">
            <h2 class="h2" id="t-title"></h2>
            <div class="chips" id="t-chips"></div>
            <p class="muted" id="t-note"></p>
            <div><button class="btn" type="button" id="t-open">Day details and kit</button></div>
          </div>
          <details class="fold" open>
            <summary>Stops, peaks and small discoveries</summary>
            <div class="fold-body" id="t-stops"></div>
          </details>
        </div>
        <p class="small faint" style="margin-top:34px;max-width:86ch">
          Places and the trail come from OpenStreetMap; expect the line to be within a few hundred metres of where you actually walk.
          The relief is an elevation model (Mapzen terrain tiles, about 130 m per cell) draped with a cloud-free satellite picture
          from 2016, so snow and vegetation are not today’s. The light is cinematic: it is not the weather and not a computed sunrise.
        </p>
      </section>
      <section class="section" id="field" hidden></section>
    </div>`;
}

export async function mount(root) {
  root.innerHTML = template();
  const hero = $('#t-hero', root);
  const labelsEl = $('#t-labels', root);
  let scene = null;
  let flying = null;

  // ---------- day texts ----------
  function renderDay(n) {
    const d = dayOf(n);
    const date = dateOf(n);
    const to = STOPS[d.to];
    const inFrame = scene ? scene.dem.contains(to.lon, to.lat) : true;
    $('#t-chip', root).textContent = `Day ${n} · ${to.name}`;
    $('#t-chip-sub', root).textContent = `${to.name} / ${inFrame ? '' : 'off the relief / '}${metres(d.sleep)}`;
    $('#t-count', root).textContent = `Day ${n} of ${TRIP.days}${date ? ' · ' + dateShort(date) : ''}`;
    $('#t-head', root).innerHTML = html`${d.headline[0]}<br>${d.headline[1]}`;
    $('#t-place', root).textContent = d.place;
    $('#t-text', root).textContent = d.text;
    $('#t-alt', root).textContent = new Intl.NumberFormat('en-GB').format(d.sleep);
    $('#t-meta', root).innerHTML = html`<span>Day <b>${n}</b> of ${TRIP.days}${date ? ' · ' + dateShort(date) : ''}</span>
      <span class="chip ${d.kind === 'pass' ? 'warn' : d.kind === 'rest' ? 'ice' : ''}">${KINDS[d.kind]}</span>`;
    $('#t-slider', root).value = n;
    $('#t-title', root).textContent = d.title;
    const w = walked(n);
    $('#t-chips', root).innerHTML = html`
      <span class="chip accent">Sleep ${metres(d.sleep)}</span>
      ${d.high > d.sleep ? html`<span class="chip">High point ${metres(d.high)}</span>` : ''}
      <span class="chip">${d.km}</span><span class="chip">${d.hours}</span>
      ${w ? html`<span class="chip">≈ ${Math.round(w.ascent / 50) * 50} m up · ${Math.round(w.descent / 50) * 50} m down</span>` : ''}`;
    $('#t-note', root).textContent = d.note;
    const stopIds = stopsOf(n);
    $('#t-stops', root).innerHTML = html`
      <ul class="bullets">
        ${stopIds.map((id) => html`<li><b>${STOPS[id].name}</b> · ${metres(STOPS[id].ele)}</li>`)}
      </ul>
      <p class="small"><b>In view:</b> ${d.peaks.map((id) => PEAKS.find((p) => p.id === id)).filter(Boolean).map((p) => `${p.name} (${metres(p.ele)})`).join(', ')}.</p>`;
  }

  // ---------- labels ----------
  const markers = [];
  function buildMarkers() {
    for (const [id, s] of Object.entries(STOPS)) {
      if (!scene.dem.contains(s.lon, s.lat)) continue;
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'label is-dim';
      el.textContent = s.name;
      el.addEventListener('click', () => {
        const hit = DAYS.find((d) => d.to === id) || DAYS.find((d) => stopsOf(d.n).includes(id));
        if (hit) store.set('day', hit.n);
        toast(`${s.name} · about ${metres(s.ele)}`);
      });
      const pin = document.createElement('i');
      pin.className = 'pin is-dim';
      labelsEl.append(pin, el);
      markers.push({ id, kind: 'stop', lon: s.lon, lat: s.lat, el, pin, w: 0, h: 0 });
    }
    for (const p of PEAKS) {
      if (!scene.dem.contains(p.lon, p.lat)) continue;
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'label peak is-dim';
      el.textContent = p.name;
      el.addEventListener('click', () => toast(`${p.name} · ${metres(p.ele)}`));
      labelsEl.append(el);
      markers.push({ id: p.id, kind: 'peak', lon: p.lon, lat: p.lat, el, major: p.major, w: 0, h: 0 });
    }
  }

  function placeLabels(relief) {
    const n = store.state.day;
    const d = dayOf(n);
    const r = store.state.relief;
    const wide = r.mode === 'atlas' || relief.view.dist > 95;
    const dayStops = new Set(stopsOf(n));
    // Keep labels out from under the day chip in the corner.
    const box = labelsEl.getBoundingClientRect(), chip = $('.daychip', root).getBoundingClientRect();
    const placed = [{ x: chip.left - box.left, y: chip.top - box.top, w: chip.width, h: chip.height }];
    for (const m of markers) {
      if (m.kind === 'stop') {
        const ends = m.id === d.from || m.id === d.to;
        m.want = dayStops.has(m.id) || (wide && OVERNIGHT.has(m.id));
        m.prio = ends ? 100 : dayStops.has(m.id) ? 80 : 40;
        m.el.classList.toggle('is-current', ends);
        m.pinWanted = !m.want && (OVERNIGHT.has(m.id) || STOPS[m.id].kind === 'village');
      } else {
        const today = d.peaks.includes(m.id);
        m.want = r.labels && (today || (wide && m.major));
        m.prio = today ? (m.major ? 66 : 60) : 30;
      }
    }
    markers.sort((a, b) => b.prio - a.prio);
    for (const m of markers) {
      const p = relief.project(m.lon, m.lat, 0);
      const hidden = !p.visible || relief.occluded([p.world[0], p.world[1] + 0.12, p.world[2]]);
      if (!m.w && m.el.offsetWidth) {
        m.w = m.el.offsetWidth;
        m.h = m.el.offsetHeight;
      }
      let show = m.want && !hidden && m.w > 0;
      const x = p.x - m.w / 2, y = p.y - m.h - 15;
      if (show) {
        for (const q of placed) {
          if (x < q.x + q.w + 4 && x + m.w + 4 > q.x && y < q.y + q.h + 3 && y + m.h + 3 > q.y) {
            show = false;
            break;
          }
        }
        if (show) placed.push({ x, y, w: m.w, h: m.h });
      }
      m.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      m.el.classList.toggle('is-dim', !show);
      if (m.pin) {
        m.pin.style.transform = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px)`;
        m.pin.classList.toggle('is-dim', hidden || !(m.pinWanted || (m.want && !show)));
      }
    }
  }

  // ---------- controls ----------
  function syncControls() {
    const r = store.state.relief;
    $('#t-exag', root).value = String(r.exaggeration);
    $$('[data-mode]', root).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === r.mode)));
    $('[data-toggle="labels"]', root).setAttribute('aria-pressed', String(r.labels));
    const photo = scene ? usesPhoto(scene) : r.photo !== false;
    $('[data-toggle="satellite"]', root).setAttribute('aria-pressed', String(photo));
    $('#t-orbit', root).setAttribute('aria-pressed', String(r.orbit));
    $('#t-credit', root).textContent = photo
      ? `Offline relief · Sentinel-2 cloudless 2016, EOX, CC BY 4.0 · vertical ×${r.exaggeration}`
      : `Offline relief · painted ground cover · vertical ×${r.exaggeration}`;
  }

  function frame(n, duration = 2600) {
    if (!scene) return;
    const cam = cameraOf(n);
    if (store.state.relief.mode === 'atlas') scene.relief.setView({ ...cam, az: 0, pitch: 80, dist: cam.dist * 1.25 }, { duration });
    else scene.relief.setView(cam, { duration });
  }

  let repaintTimer;
  function selectDay(n, { move = true } = {}) {
    renderDay(n);
    if (!scene) return;
    if (move && !flying) frame(n);
    clearTimeout(repaintTimer);
    repaintTimer = setTimeout(() => repaint(scene, store.state.day), flying ? 0 : 140);
  }

  function stopFlight() {
    if (!flying) return;
    scene.relief.driver = null;
    flying = null;
    $('#t-fly', root).textContent = 'Fly the route';
    scene.relief.base = { ...scene.relief.view };
  }
  function startFlight() {
    const track = data.track;
    if (!scene || !track.length) return;
    const n = store.state.day;
    const first = track.find((p) => p.day >= n) || track[0];
    flying = { km: first.km >= data.trackKm - 1 ? 0 : first.km, last: performance.now(), az: scene.relief.view.az };
    $('#t-fly', root).textContent = 'Stop the flight';
    scene.relief.driver = (now) => {
      const dt = Math.min(0.1, (now - flying.last) / 1000);
      flying.last = now;
      flying.km += dt * 1.5; // km of trail per second
      if (flying.km >= data.trackKm) {
        stopFlight();
        return true;
      }
      const here = trackAt(flying.km), ahead = trackAt(Math.min(data.trackKm, flying.km + 4));
      const heading = bearing([here.lon, here.lat], [ahead.lon, ahead.lat]);
      flying.az += ((((heading - flying.az) % 360) + 540) % 360 - 180) * Math.min(1, dt * 0.7);
      const v = scene.relief.view;
      const [u, vv] = scene.dem.uv(here.lon, here.lat);
      v.x = (u - 0.5) * scene.dem.widthKm;
      v.z = (vv - 0.5) * scene.dem.heightKm;
      v.az = (flying.az + 360) % 360;
      v.pitch += (24 - v.pitch) * Math.min(1, dt * 1.5);
      v.dist += (13 - v.dist) * Math.min(1, dt * 1.2);
      if (here.day !== store.state.day) store.set('day', here.day);
      return true;
    };
  }

  root.addEventListener('click', (e) => {
    const t = e.target.closest('button');
    if (!t) return;
    if (t.dataset.step) store.set('day', clamp(store.state.day + Number(t.dataset.step), 1, TRIP.days));
    else if (t.dataset.zoom) scene?.relief.zoom(Number(t.dataset.zoom));
    else if (t.dataset.mode) {
      store.set('relief', { mode: t.dataset.mode });
      frame(store.state.day, 1100);
    } else if (t.dataset.toggle === 'labels') store.set('relief', { labels: !store.state.relief.labels });
    else if (t.dataset.toggle === 'satellite') {
      if (scene && !scene.photo) toast('The satellite picture could not be loaded. Showing the painted relief.');
      else store.set('relief', { photo: store.state.relief.photo === false });
    }
    else if (t.id === 't-orbit') store.set('relief', { orbit: !store.state.relief.orbit });
    else if (t.id === 't-haze') {
      const on = t.getAttribute('aria-pressed') !== 'true';
      t.setAttribute('aria-pressed', String(on));
      if (scene) {
        scene.relief.haze = on ? 0.9 : 0.2;
        scene.relief.invalidate();
      }
    } else if (t.id === 't-fly') (flying ? stopFlight : startFlight)();
    else if (t.id === 't-all') {
      stopFlight();
      scene?.relief.setView({ lon: 84.02, lat: 28.56, az: 350, pitch: 52, dist: 150 });
    } else if (t.id === 't-open') openDay(store.state.day);
  });

  $('#t-slider', root).addEventListener('input', (e) => {
    stopFlight();
    store.set('day', Number(e.target.value));
  });
  $('#t-exag', root).addEventListener('change', (e) => store.set('relief', { exaggeration: Number(e.target.value) }));

  store.on('day', (n) => selectDay(n));
  store.on('settings', () => renderDay(store.state.day));
  store.on('relief', (r) => {
    syncControls();
    if (!scene) return;
    scene.relief.setExaggeration(r.exaggeration);
    scene.relief.orbit = r.orbit;
    if (usesPhoto(scene) !== shownPhoto) {
      shownPhoto = usesPhoto(scene);
      repaint(scene, store.state.day);
    }
    scene.relief.invalidate();
  });
  let shownPhoto = store.state.relief.photo !== false;

  syncControls();
  renderDay(store.state.day);

  try {
    scene = await getScene();
    hero.insertBefore(scene.canvas, hero.children[1]);
    buildMarkers();
    scene.relief.onFrame = placeLabels;
    scene.canvas.addEventListener('pointerdown', stopFlight);
    renderDay(store.state.day);
    syncControls();
    frame(store.state.day, 0);
    // The field file is heavy to build, so it waits until it is nearly on screen.
    const field = $('#field', root);
    field.hidden = false;
    field.style.minHeight = '320px';
    const watcher = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        watcher.disconnect();
        field.style.minHeight = '';
        import('./field.js').then((m) => m.mountField(field)).catch((err) => console.warn('field file unavailable:', err));
      },
      { rootMargin: '700px' },
    );
    watcher.observe(field);
  } catch (err) {
    hero.insertAdjacentHTML(
      'beforeend',
      html`<div class="gl-fallback"><p>The 3D relief needs WebGL, which this browser has switched off.<br>Everything else on the site works without it.</p></div>`,
    );
    console.warn('relief unavailable:', err);
  }

  return {
    onVisible(visible) {
      if (!scene) return;
      scene.relief.active = visible;
      if (visible) scene.relief.invalidate();
      else stopFlight();
    },
  };
}
