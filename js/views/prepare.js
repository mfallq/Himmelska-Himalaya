// "Prepare": the checklist first, then what to sort out before leaving, what to
// know on the trail, how to get there, the journal and the sources.
import { html, $, $$, dateShort, dateLong, daysBetween, download, toast, metres } from '../util.js';
import { store } from '../store.js';
import { DAYS, TRIP, STOPS, dateOf } from '../data.js';
import { PRACTICAL_CARDS, TOWNS, SEASONS, ALERTS, CULTURE, PHONE, CHECKLIST, SOURCES, CREDITS, DOOR_TO_DOOR } from '../content/guide.js';
import { buildGpx } from '../lib/gpx.js';
import { datesDialog } from '../ui/shell.js';
import { openDay } from './daysheet.js';

const TOTAL = CHECKLIST.reduce((n, g) => n + g.items.length, 0);
const TABS = [
  ['checklist', 'Checklist'],
  ['before', 'Before you go'],
  ['trail', 'On the trail'],
  ['getting', 'Getting there'],
  ['journal', 'Journal'],
  ['sources', 'Sources'],
];
const card = (c) => html`<div class="card"><h3 class="h3">${c.title}</h3><p class="muted">${c.text}</p></div>`;
const practical = (ids) => PRACTICAL_CARDS.filter((c) => ids.includes(c.id)).map((c) => html`<div class="card">
  <h3 class="h3">${c.title}</h3>
  ${c.lead ? html`<p><b>${c.lead}</b></p>` : ''}
  ${c.bar ? html`<div class="loadbar" role="img" aria-label="${c.barNote}"><i style="flex:${c.bar[0]}"></i><i style="flex:${c.bar[1]}"></i></div><p class="small muted">${c.barNote}</p>` : ''}
  <ul class="bullets">${c.points.map((p) => html`<li>${p}</li>`)}</ul></div>`);

function countdown() {
  const start = dateOf(1);
  if (!start) return html`<p class="small muted">No dates yet. <button class="linkbtn" type="button" data-dates style="color:var(--accent)">Set your dates</button> for countdowns and real dates on every stage.</p>`;
  const line = (label, date) => {
    const diff = daysBetween(new Date(), date);
    const text = diff > 1 ? `in ${diff} days` : diff === 1 ? 'tomorrow' : diff === 0 ? 'today' : diff === -1 ? 'yesterday' : `${-diff} days ago`;
    return html`<li><span class="muted">${label}</span> <b>${dateShort(date)}</b> · ${text}</li>`;
  };
  return html`<ul class="countlist">${line('Arrival in Kathmandu', start)}${line('Thorong La', dateOf(TRIP.passDay))}</ul>`;
}

function checklistPanel(query, filter) {
  const checks = store.state.checks;
  const q = query.trim().toLowerCase();
  const groups = CHECKLIST.map((g) => ({
    ...g,
    shown: g.items.filter(([id, text, note]) => {
      if (filter === 'open' && checks[id]) return false;
      if (filter === 'done' && !checks[id]) return false;
      return !q || (text + ' ' + note).toLowerCase().includes(q);
    }),
  })).filter((g) => g.shown.length);
  if (!groups.length) return html`<p class="muted">Nothing matches. Clear the search or change the filter.</p>`;
  return groups.map((g, i) => {
    const done = g.items.filter(([id]) => checks[id]).length;
    return html`<details class="fold"${i === 0 || q ? ' open' : ''}>
      <summary>${g.group}<span class="sub">${done} / ${g.items.length}</span></summary>
      <div class="fold-body checklist">
        ${g.shown.map(([id, text, note]) => html`<label class="check"><input type="checkbox" data-check="${id}"${checks[id] ? ' checked' : ''}><span><b>${text}</b>${note ? html`<small>${note}</small>` : ''}</span></label>`)}
      </div></details>`;
  });
}

function journalPanel() {
  const journal = store.state.journal;
  const written = DAYS.filter((d) => journal[d.n]?.note?.trim() || journal[d.n]?.s?.some(Boolean));
  return html`
    <p class="muted" style="max-width:70ch">Write in the Journal fold on each day. It stays on this phone. Save a backup in the menu before you change phone.</p>
    <div class="chips" style="margin:14px 0 20px">
      <button class="btn btn-sm" type="button" data-journal-export${written.length ? '' : ' disabled'}>Save as text</button>
      <button class="btn btn-sm" type="button" data-open-day="${store.state.day}">Write for day ${store.state.day}</button>
    </div>
    ${written.length
      ? written.map((d) => {
          const e = journal[d.n];
          const score = e.s ? e.s.reduce((a, b) => a + b, 0) : null;
          return html`<div class="card" style="margin-bottom:10px"><div class="toolbar"><h4 class="h4">Day ${d.n} · ${d.route}</h4><button class="linkbtn" type="button" data-open-day="${d.n}">Open</button></div>
            ${e.note ? html`<p class="muted" style="white-space:pre-wrap">${e.note}</p>` : ''}
            ${score !== null ? html`<p class="small faint">Evening altitude check: ${score} of 12</p>` : ''}</div>`;
        })
      : html`<p class="faint">Nothing written yet.</p>`}`;
}

function exportJournal() {
  const journal = store.state.journal;
  const lines = ['Annapurna Circuit: journal', ''];
  for (const d of DAYS) {
    const e = journal[d.n];
    if (!e?.note?.trim() && !e?.s?.some(Boolean)) continue;
    const date = dateOf(d.n);
    lines.push(`Day ${d.n}${date ? ' · ' + dateLong(date) : ''} · ${d.title}`);
    lines.push(`Sleep: ${STOPS[d.to].name}, ${metres(d.sleep)}`);
    if (e.s) lines.push(`Evening altitude check: ${e.s.reduce((a, b) => a + b, 0)} of 12`);
    if (e.note) lines.push('', e.note.trim());
    lines.push('', '---', '');
  }
  download('annapurna-journal.txt', lines.join('\n'));
}

export async function mount(root) {
  let tab = 'checklist', query = '', filter = 'all';

  const panel = () => {
    if (tab === 'checklist') {
      const done = Object.values(store.state.checks).filter(Boolean).length;
      return html`
        <div class="progress-head"><h2 class="h2">Checklist</h2><span class="count num" id="p-count">${done} / ${TOTAL} done</span></div>
        <div class="grid searchrow" style="grid-template-columns:minmax(0,2fr) minmax(0,1fr);margin:14px 0 10px">
          <input class="field" type="search" id="p-search" placeholder="Search the checklist" value="${query}" aria-label="Search the checklist">
          <select class="field" id="p-filter" aria-label="Filter">
            <option value="all"${filter === 'all' ? ' selected' : ''}>All items</option>
            <option value="open"${filter === 'open' ? ' selected' : ''}>Still open</option>
            <option value="done"${filter === 'done' ? ' selected' : ''}>Done</option>
          </select>
        </div>
        <p class="small faint" style="margin-bottom:14px">A tick is your own confirmation. Check items your agency handles with them.</p>
        <div id="p-list">${checklistPanel(query, filter)}</div>`;
    }
    if (tab === 'before') {
      return html`
        <div class="grid two">${practical(['papers', 'pack'])}</div>
        <h2 class="h3" style="margin:30px 0 12px">When to go</h2>
        <div class="grid four">
          ${SEASONS.map((s) => html`<div class="card"><p class="eyebrow ${s.level === 3 ? '' : 'dim'}">${s.months}</p><h3 class="h3">${s.name}</h3>
            <div class="loadbar" role="img" aria-label="${s.level} of 3"><i style="flex:${s.level}"></i><i style="flex:${3 - s.level || 0.001};opacity:.35"></i></div><p class="muted small">${s.text}</p></div>`)}
        </div>
        <h2 class="h3" style="margin:30px 0 12px">Read these once</h2>
        <div class="grid" style="gap:10px">${ALERTS.map((a) => html`<div class="card alert"><h3 class="h3">${a.title}</h3><p class="muted">${a.text}</p></div>`)}</div>`;
    }
    if (tab === 'trail') {
      return html`
        <div class="grid two">${practical(['cold', 'power'])}${PHONE.map(card)}</div>
        <div class="card callout" style="margin-top:16px"><h3 class="h3">Route as GPX</h3><p class="muted">The walking stages and stops, for any offline map app or GPS watch. Simplified from OpenStreetMap trails: a planning aid, not a recorded track.</p><div><button class="btn btn-primary" type="button" data-gpx>Save route as GPX</button></div></div>
        <h2 class="h3" style="margin:30px 0 12px">Nature and culture</h2>
        <div class="grid two">${CULTURE.map(card)}</div>`;
    }
    if (tab === 'getting') {
      return html`
        <ol class="timeline">
          ${DOOR_TO_DOOR.map((leg) => {
            const date = leg.day ? dateOf(leg.day) : null;
            return html`<li><p class="when">${leg.when}${date ? ' · ' + dateShort(date) : ''}</p><p class="what">${leg.what}</p><p class="muted small">${leg.text}</p>${leg.day ? html`<button class="linkbtn" type="button" data-open-day="${leg.day}" style="margin-top:8px;color:var(--accent)">Open day ${leg.day}</button>` : ''}</li>`;
          })}
        </ol>
        <div class="grid two" style="margin-top:6px">${TOWNS.map((t) => html`<div class="card"><h3 class="h3">${t.name}</h3><p class="muted small">${t.note}</p><div class="chips">${t.places.map((p) => html`<span class="chip">${p}</span>`)}</div></div>`)}</div>
        <div class="card callout" style="margin-top:16px"><h3 class="h3">The way to Kathmandu</h3><p class="muted small">A globe with the flight paths in. For orientation only.</p><div><a class="btn" href="#/journey">Open the globe</a></div></div>`;
    }
    if (tab === 'journal') return journalPanel();
    const groups = [...new Set(SOURCES.map((s) => s.group))];
    return html`
      <div class="grid two">${groups.map((g) => html`<div class="card"><h3 class="h3">${g}</h3><ul class="bullets">${SOURCES.filter((s) => s.group === g).map((s) => html`<li><a href="${s.url}" target="_blank" rel="noopener">${s.label}</a><br><span class="small">${s.note}</span></li>`)}</ul></div>`)}</div>
      <div class="card" style="margin-top:16px"><h3 class="h3">Built from</h3><ul class="bullets">${CREDITS.map((c) => html`<li><b>${c.what}:</b> ${c.who}${c.url ? html` · <a href="${c.url}" target="_blank" rel="noopener">${c.label}</a>` : ''}</li>`)}</ul>
      <p class="small faint">Facts checked in November 2026. Where sources disagree, the text says so.</p></div>`;
  };

  const draw = () => {
    root.innerHTML = html`
      <div class="wrap">
        <section class="section">
          <div class="section-head">
            <h1 class="display">Prepare</h1>
            ${countdown()}
          </div>
          <div class="subtabs" role="tablist" aria-label="Prepare sections" style="margin-bottom:24px">
            ${TABS.map(([id, label]) => html`<button type="button" role="tab" data-ptab="${id}" aria-selected="${String(id === tab)}">${label}</button>`)}
          </div>
          <div id="p-panel">${panel()}</div>
        </section>
      </div>`;
  };

  const redrawPanel = () => {
    $('#p-panel', root).innerHTML = String(panel());
    $$('[data-ptab]', root).forEach((b) => b.setAttribute('aria-selected', String(b.dataset.ptab === tab)));
  };

  root.addEventListener('click', (e) => {
    const t = e.target.closest('button');
    if (!t) return;
    if (t.dataset.ptab) {
      tab = t.dataset.ptab;
      redrawPanel();
    } else if (t.dataset.dates !== undefined) datesDialog();
    else if (t.dataset.gpx !== undefined) {
      download('annapurna-circuit.gpx', buildGpx(), 'application/gpx+xml');
      toast('Route saved. Open the file in your map app.');
    } else if (t.dataset.journalExport !== undefined) exportJournal();
    else if (t.dataset.openDay) openDay(Number(t.dataset.openDay));
  });
  root.addEventListener('change', (e) => {
    if (e.target.dataset.check) {
      store.set('checks', { [e.target.dataset.check]: e.target.checked });
      const done = Object.values(store.state.checks).filter(Boolean).length;
      $('#p-count', root).textContent = `${done} / ${TOTAL} done`;
      const fold = e.target.closest('details');
      const boxes = $$('[data-check]', fold);
      // the group counter counts every item in the group, shown or not
      const group = CHECKLIST.find((g) => g.items.some(([id]) => id === e.target.dataset.check));
      $('.sub', fold).textContent = `${group.items.filter(([id]) => store.state.checks[id]).length} / ${group.items.length}`;
      if (filter !== 'all' && boxes.length) setTimeout(() => ($('#p-list', root).innerHTML = String(html`${checklistPanel(query, filter)}`)), 350);
    } else if (e.target.id === 'p-filter') {
      filter = e.target.value;
      $('#p-list', root).innerHTML = String(html`${checklistPanel(query, filter)}`);
    }
  });
  root.addEventListener('input', (e) => {
    if (e.target.id !== 'p-search') return;
    query = e.target.value;
    $('#p-list', root).innerHTML = String(html`${checklistPanel(query, filter)}`);
  });

  draw();
  store.on('settings', draw);
  store.on('journal', () => tab === 'journal' && redrawPanel());
  store.on('day', () => tab === 'journal' && redrawPanel());
}
