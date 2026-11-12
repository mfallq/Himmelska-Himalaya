// Emergency card: what to do, who to call, your own numbers, and your position.
// Works without a connection. Your numbers and position stay on the phone.
import { $, html, toast, metres } from '../util.js';
import { store } from '../store.js';
import { STOPS } from '../data.js';
import { ALTITUDE_CARDS } from '../content/guide.js';
import { locate, locateMessage } from '../lib/locate.js';
import { nearestStop } from '../lib/track.js';
import { openModal } from './shell.js';

const FIELDS = [
  ['insurer', 'Insurer, 24-hour line', 'tel', true],
  ['policy', 'Policy number', 'text', false],
  ['guide', 'Guide or agency', 'tel', true],
  ['embassy', 'Embassy', 'tel', true],
  ['home', 'Person at home', 'tel', true],
];
const digits = (v) => String(v || '').replace(/[^\d+]/g, '');

export function openEmergency() {
  const serious = ALTITUDE_CARDS.find((c) => c.warn);
  const mine = store.state.settings.contacts || {};
  const m = openModal(html`
    <div class="stack sos">
      <p class="eyebrow warn">Emergency</p>
      <h2 class="h2" id="modal-title">Go down, with help</h2>
      <div class="card alert">
        <h3 class="h3">${serious.title}</h3>
        <p class="muted">${serious.text}</p>
      </div>
      <p class="small muted">Mild symptoms: do not sleep higher. Rest, drink, and tell your guide.</p>

      <div>
        <h3 class="h4">Call in Nepal</h3>
        <div class="chips" style="margin-top:8px">
          <a class="btn" href="tel:100">Police 100</a>
          <a class="btn" href="tel:1144">Tourist police 1144</a>
        </div>
        <p class="small muted" style="margin-top:8px">Your guide and the lodge owner are the fastest help. Mobile signal can fail: ask them first.</p>
      </div>

      <div>
        <h3 class="h4">Your numbers</h3>
        <p class="small muted" style="margin:4px 0 10px">Saved on this phone only. Fill them in before you leave.</p>
        <div class="sos-fields">
          ${FIELDS.map(([key, label, type, callable]) => html`
            <div class="sos-row">
              <label class="lbl">${label}<input class="field" type="${type}" inputmode="${type === 'tel' ? 'tel' : 'text'}" autocomplete="off" data-contact="${key}" value="${mine[key] || ''}"></label>
              ${callable ? html`<a class="btn" data-call="${key}" href="tel:${digits(mine[key])}"${digits(mine[key]) ? '' : ' hidden'}>Call</a>` : ''}
            </div>`)}
        </div>
      </div>

      <div>
        <h3 class="h4">My position</h3>
        <p class="small muted" style="margin:4px 0 10px">Read out to a helper or rescuer. Uses GPS and needs no data.</p>
        <div id="sos-pos" aria-live="polite"></div>
        <button class="btn btn-primary" type="button" id="sos-locate">Get my position</button>
      </div>
      <div class="actions"><button class="btn" type="button" data-close>Close</button></div>
    </div>`);

  m.oninput = (e) => {
    const key = e.target.dataset.contact;
    if (!key) return;
    store.set('settings', { contacts: { ...(store.state.settings.contacts || {}), [key]: e.target.value } });
    const a = m.querySelector(`[data-call="${key}"]`);
    if (a) {
      a.href = 'tel:' + digits(e.target.value);
      a.hidden = !digits(e.target.value);
    }
  };

  const pos = $('#sos-pos', m);
  $('#sos-locate', m).addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true;
    pos.innerHTML = html`<p class="muted">Looking for GPS. Stand in the open.</p>`;
    try {
      const f = await locate({ onUpdate: (x) => (pos.innerHTML = html`<p class="muted">Looking for GPS · ±${Math.round(x.acc)} m so far</p>`) });
      const near = nearestStop(Object.values(STOPS), f.lon, f.lat);
      const text = `${f.lat.toFixed(5)}, ${f.lon.toFixed(5)}`;
      pos.innerHTML = html`
        <p class="sos-coords">${f.lat.toFixed(5)}° N, ${f.lon.toFixed(5)}° E</p>
        <p class="small muted">±${Math.round(f.acc)} m${f.alt != null ? ` · GPS height ${metres(f.alt)}` : ''}${near && near.km < 15 ? ` · ${near.km < 0.3 ? 'in' : near.km.toFixed(1) + ' km from'} ${near.stop.name}` : ''}</p>
        <div class="chips" style="margin:8px 0"><button class="btn btn-sm" type="button" data-copy="${text}">Copy position</button></div>`;
      pos.querySelector('[data-copy]').addEventListener('click', async (ev) => {
        try {
          await navigator.clipboard.writeText(ev.currentTarget.dataset.copy);
          toast('Position copied.');
        } catch {
          toast(text);
        }
      });
    } catch (err) {
      pos.innerHTML = html`<p class="muted">${locateMessage(err)}</p>`;
    }
    btn.disabled = false;
    btn.textContent = 'Update position';
  });
}
