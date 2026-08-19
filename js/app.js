/* =====================================================================
   eIFUCompass — main controller / state
   ---------------------------------------------------------------------
   Orchestrates the shell (theme, market tabs, collapsible cards,
   back-to-top), reads the Device Profile (Module A), runs the rule
   engines (js/rules-eifu.js eligibility + js/checklist-engine.js), and
   renders the live output: eligibility banner, required-content checklist,
   completeness meter, gaps, and export. Deterministic; no AI, no network.
   Each rule cites its clause; verification status is tracked in
   /verification/log.md.
   ===================================================================== */
'use strict';

const $ = (id) => document.getElementById(id);
const STORE_KEY = 'eifucompass-session';

let market = 'fda';
let addressed = new Set();      // ids of checklist items the user marked done
let riskAcked = new Set();      // acknowledged eIFU risk-assessment elements
let lastItems = [];             // last built checklist (for export)
let lastElig = { eu: null, fda: null };

// eIFU risk-assessment elements (2021/2226 Art. 4 / amendments v1.1 §1.1)
const RISK_ELEMENTS = [
  'Knowledge and experience of the intended users',
  'Environment in which the device is used',
  'Access to electronic media / technology',
  'Protection against unauthorized changes or tampering',
  'User’s ability to obtain a paper copy'
];

/* ---- Theme (light default; dark via toggle; persisted) --------------- */
(function theme() {
  const root = document.documentElement;
  const btn = $('themeToggle');
  const set = (t) => {
    root.dataset.theme = t;
    btn.textContent = t === 'dark' ? '☀️ Light' : '🌙 Dark';
    try { localStorage.setItem('eifu-theme', t); } catch (_) {}
  };
  let saved = null;
  try { saved = localStorage.getItem('eifu-theme'); } catch (_) {}
  set(saved === 'dark' ? 'dark' : 'light');
  btn.addEventListener('click', () => set(root.dataset.theme === 'dark' ? 'light' : 'dark'));
})();

/* ---- Market selector ------------------------------------------------- */
$('market').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  document.querySelectorAll('#market button').forEach((x) => x.classList.remove('active'));
  b.classList.add('active');
  market = b.dataset.market;
  recompute();
});

/* ---- Collapsible cards ---------------------------------------------- */
document.querySelectorAll('.card-head').forEach((h) =>
  h.addEventListener('click', () => h.parentElement.classList.toggle('collapsed')));

/* ---- Read Device Profile -------------------------------------------- */
function readProfile() {
  const p = { market };
  document.querySelectorAll('[data-field]').forEach((el) => {
    const name = el.dataset.field;
    if (el.type === 'checkbox') p[name] = el.checked;
    else if (el.type === 'radio') { if (el.checked) p[name] = el.value; }
    else p[name] = el.value || '';
  });
  return p;
}

/* ---- Scope guard notice --------------------------------------------- */
function scopeNotice(p) {
  const el = $('scopeNotice');
  if (!el) return false;
  if (p.deviceType === 'combination') {
    el.classList.remove('hidden');
    el.textContent = 'Combination products (21 CFR Part 4 / MDR Art. 117) are not covered — no checklist is produced for this device type.';
    return true;
  } else if (p.deviceType === 'ivd') {
    el.classList.remove('hidden');
    el.textContent = 'IVD devices are not covered (this tool is FDA + EU MDR only).';
    return true;
  }
  el.classList.add('hidden');
  return false;
}

/* ---- Render: eligibility banner ------------------------------------- */
const CLS = { eligible: 'eligible', hybrid: 'hybrid', paper: 'paper', incomplete: 'neutral', na: 'neutral' };
function renderEligibility(elig) {
  const banner = $('eligBanner');
  const primary = (market === 'fda') ? elig.fda : elig.eu;
  banner.className = 'elig ' + (CLS[primary.status] || 'neutral');
  let html = '<div class="status"><span class="dot"></span>' + primary.title + '</div>';
  html += '<div class="rationale">' + primary.rationale;
  if (market === 'both') {
    const other = elig.fda;
    html += '<br><br><b>FDA:</b> ' + other.title + ' — ' + other.rationale;
  }
  if (primary.conditions && primary.conditions.length) {
    html += '<br><br><b>Conditions:</b><ul style="margin:6px 0 0;padding-left:18px">' +
      primary.conditions.map((c) => '<li>' + c + '</li>').join('') + '</ul>';
  }
  html += '</div>';
  banner.innerHTML = html;
}

/* ---- Render: checklist ---------------------------------------------- */
const ICON = { ok: '✓', warn: '!' };
function renderItem(it) {
  const done = addressed.has(it.id);
  const ic = done ? 'ok' : 'warn';
  const guide = it.guide ? '<span class="toggle" data-tg="' + it.id + '">Show guidance</span><div class="guide">' + it.guide + '</div>' : '';
  return '<div class="chk-item" data-cat="' + it.cat + '" data-id="' + it.id + '">' +
    '<div class="chk-ic ' + ic + '" title="Mark addressed">' + ICON[ic] + '</div>' +
    '<div class="chk-main"><div class="t">' + it.title + '</div>' +
    '<div class="ref">' + it.ref + ' · ' + it.market.toUpperCase() + '</div>' + guide + '</div></div>';
}
function renderChecklist(items) {
  const list = $('chkList');
  if (!items.length) {
    list.innerHTML = '<div class="chk-empty">No checklist items — set the device profile (and a supported device type) to generate the required content.</div>';
    return;
  }
  // Grouped by layer (amendments v1.1 §3): Always / Conditional / eIFU-specific.
  const labels = window.eIFUChecklist.LAYER_LABEL;
  let html = '';
  ['always', 'conditional', 'eifu'].forEach((L) => {
    const group = items.filter((it) => it.layer === L);
    if (!group.length) return;
    html += '<div class="chk-layer" data-layer="' + L + '">' + labels[L] + ' (' + group.length + ')</div>';
    html += group.map(renderItem).join('');
  });
  list.innerHTML = html;
}

/* ---- Render: gaps (prioritized: eIFU + warnings first) --------------- */
const GAP_RANK = { eifu: 0, warn: 1, ifu: 2, label: 3 };
function renderGaps(items) {
  const outstanding = items.filter((it) => !addressed.has(it.id))
    .sort((a, b) => (GAP_RANK[a.cat] ?? 9) - (GAP_RANK[b.cat] ?? 9));
  const box = $('gaps');
  if (!outstanding.length) { box.classList.add('hidden'); return; }
  box.classList.remove('hidden');
  $('gapsList').innerHTML = outstanding.slice(0, 8)
    .map((it) => '<li>' + it.title + ' <span class="mono" style="opacity:.7">(' + it.ref + ')</span></li>').join('');
}

/* ---- Render: dual-market divergence (Both + Compare) ---------------- */
function pill(status) {
  const s = (status === 'incomplete' || status === 'na') ? 'neutral' : status;
  return '<span class="pill ' + s + '">' + s + '</span>';
}
function renderDivergence(elig) {
  const box = $('divergence');
  if (market !== 'both' || !elig.eu || !elig.fda) { box.classList.add('hidden'); return; }
  box.classList.remove('hidden');
  const rows = [
    ['eIFU / e-labeling', pill(elig.eu.status) + ' ' + elig.eu.title, pill(elig.fda.status) + ' ' + elig.fda.title],
    ['Legal basis', 'IR (EU) 2021/2226 (am. 2025/1234)', '21 CFR 801.128'],
    ['Eligibility scope', 'Professional use; lay use not reasonably foreseeable', 'Prescription device used in a health-care facility'],
    ['Paper fallback', 'Free paper copy within 7 days on request', 'Free paper copy promptly on request'],
    ['Label statement', 'Must indicate eIFU + access method (Art. 5)', 'Must give notice labeling is electronic']
  ];
  $('cmpBody').innerHTML = rows.map((r) =>
    '<tr><th>' + r[0] + '</th><td>' + r[1] + '</td><td>' + r[2] + '</td></tr>').join('');
  const note = $('cmpNote');
  if (elig.eu.status !== elig.fda.status) {
    note.className = 'cmp-note diverge';
    note.textContent = '⚠ The two markets diverge for this device — the EU and FDA electronic-IFU routes have different scope and conditions. Treat each market’s requirements independently.';
  } else {
    note.className = 'cmp-note';
    note.textContent = 'Both markets reach a comparable electronic-IFU outcome for this profile, but each has its own conditions.';
  }
}

/* ---- Render: eIFU risk-assessment acknowledgment -------------------- */
function renderRiskAck(p) {
  const box = $('riskAck');
  const active = (p.eifuApproach === 'pure' || p.eifuApproach === 'hybrid');
  if (!active) { box.classList.add('hidden'); return; }
  box.classList.remove('hidden');
  $('riskAckChecks').innerHTML = RISK_ELEMENTS.map((el, i) =>
    '<label><input type="checkbox" data-risk="' + i + '"' + (riskAcked.has(i) ? ' checked' : '') + '> ' + el + '</label>').join('');
  const n = riskAcked.size, t = RISK_ELEMENTS.length;
  $('riskAckCount').textContent = n === t ? '✓ All ' + t + ' elements acknowledged' : (n + '/' + t + ' acknowledged — complete before relying on eIFU');
}

/* ---- Render: recommendations (actionable next steps) ---------------- */
function renderRecommendations(items, elig) {
  const recs = [];
  const primary = (market === 'fda') ? elig.fda : elig.eu;
  if (primary && primary.status === 'eligible') {
    recs.push('Document the eIFU/e-labeling conditions before relying on it (risk assessment, label statement, website availability, paper-on-request).');
  } else if (primary && (primary.status === 'hybrid')) {
    recs.push('Prepare a paper (or hybrid) IFU for the lay-user portion and document the justification/risk assessment.');
  } else if (primary && primary.status === 'paper') {
    recs.push('Provide a paper IFU — pure eIFU is not available for this device profile.');
  }
  if (market === 'both' && elig.eu && elig.fda && elig.eu.status !== elig.fda.status) {
    recs.push('Handle EU and FDA separately — their electronic-IFU routes diverge for this device.');
  }
  const gaps = items.filter((it) => !addressed.has(it.id))
    .sort((a, b) => (GAP_RANK[a.cat] ?? 9) - (GAP_RANK[b.cat] ?? 9));
  if (gaps.length) recs.push('Address the top outstanding items: ' + gaps.slice(0, 3).map((g) => g.title).join('; ') + '.');
  const box = $('recs');
  if (!recs.length) { box.classList.add('hidden'); return; }
  box.classList.remove('hidden');
  $('recsList').innerHTML = recs.map((r) => '<li>' + r + '</li>').join('');
}

/* ---- Completeness (checklist-driven, build-spec §3.C) --------------- */
function renderCompleteness(items) {
  const total = items.length;
  const done = items.filter((it) => addressed.has(it.id)).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  $('pct').textContent = total ? (pct + '%  (' + done + '/' + total + ')') : '0%';
  $('barFill').style.width = pct + '%';
}

/* ---- Main recompute -------------------------------------------------- */
function recompute() {
  const p = readProfile();
  const outOfScope = scopeNotice(p);

  if (outOfScope || !window.eIFUEligibility || !window.eIFUChecklist) {
    $('eligBanner').className = 'elig neutral';
    $('eligBanner').innerHTML = '<div class="status"><span class="dot"></span>Not assessed</div><div class="rationale">This device type is not covered by this tool.</div>';
    $('chkList').innerHTML = '<div class="chk-empty">No checklist for this device type.</div>';
    $('gaps').classList.add('hidden');
    $('divergence').classList.add('hidden');
    $('riskAck').classList.add('hidden');
    $('recs').classList.add('hidden');
    $('pct').textContent = '0%'; $('barFill').style.width = '0%';
    setExportEnabled(false);
    saveSession(p);
    return;
  }

  const elig = window.eIFUEligibility.evaluate(p);
  const items = window.eIFUChecklist.build(p);
  lastItems = items; lastElig = elig;

  renderEligibility(elig);
  renderDivergence(elig);
  renderRiskAck(p);
  renderChecklist(items);
  renderGaps(items);
  renderRecommendations(items, elig);
  renderCompleteness(items);
  reapplyChipFilter();
  setExportEnabled(items.length > 0);
  saveSession(p);
}

/* ---- Checklist interactions (toggle addressed / guidance) ----------- */
$('chkList').addEventListener('click', (e) => {
  const tg = e.target.closest('[data-tg]');
  if (tg) {
    const it = tg.closest('.chk-item'); it.classList.toggle('open');
    tg.textContent = it.classList.contains('open') ? 'Hide guidance' : 'Show guidance';
    return;
  }
  const item = e.target.closest('.chk-item');
  if (!item) return;
  const id = item.dataset.id;
  if (addressed.has(id)) addressed.delete(id); else addressed.add(id);
  renderChecklist(lastItems);
  renderGaps(lastItems);
  renderCompleteness(lastItems);
  reapplyChipFilter();
  saveSession(readProfile());
});

/* ---- Checklist filter chips ----------------------------------------- */
let activeFilter = 'all';
$('chips').addEventListener('click', (e) => {
  const c = e.target.closest('.chip');
  if (!c) return;
  document.querySelectorAll('.chip').forEach((x) => x.classList.remove('active'));
  c.classList.add('active');
  activeFilter = c.dataset.f;
  reapplyChipFilter();
});
function reapplyChipFilter() {
  document.querySelectorAll('#chkList .chk-item').forEach((it) => {
    it.style.display = (activeFilter === 'all' || it.dataset.cat === activeFilter) ? '' : 'none';
  });
  // Layer headers only make sense in the unfiltered view.
  document.querySelectorAll('#chkList .chk-layer').forEach((h) => {
    h.style.display = (activeFilter === 'all') ? '' : 'none';
  });
}

/* ---- Session persistence -------------------------------------------- */
function saveSession(p) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify({ profile: p, addressed: [...addressed], riskAcked: [...riskAcked] })); } catch (_) {}
}
// Risk-assessment acknowledgment toggles
$('riskAckChecks').addEventListener('change', (e) => {
  const cb = e.target.closest('[data-risk]');
  if (!cb) return;
  const i = Number(cb.dataset.risk);
  if (cb.checked) riskAcked.add(i); else riskAcked.delete(i);
  renderRiskAck(readProfile());
  saveSession(readProfile());
});
function loadSession() {
  let data = null;
  try { data = JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); } catch (_) {}
  if (!data || !data.profile) return false;
  const d = data.profile;
  document.querySelectorAll('[data-field]').forEach((el) => {
    const name = el.dataset.field;
    if (!(name in d)) return;
    if (el.type === 'checkbox') el.checked = !!d[name];
    else if (el.type === 'radio') el.checked = (el.value === d[name]);
    else el.value = d[name];
  });
  if (d.market) {
    market = d.market;
    document.querySelectorAll('#market button').forEach((x) => x.classList.toggle('active', x.dataset.market === market));
  }
  addressed = new Set(data.addressed || []);
  riskAcked = new Set(data.riskAcked || []);
  return true;
}

/* ---- Export ---------------------------------------------------------- */
function setExportEnabled(on) {
  $('exportReport').disabled = !on;
  $('exportCsv').disabled = !on;
}
$('exportCsv').addEventListener('click', () => {
  if (window.eIFUExport) window.eIFUExport.csv(readProfile(), lastItems, addressed, lastElig);
});
$('exportReport').addEventListener('click', () => {
  if (window.eIFUExport) window.eIFUExport.json(readProfile(), lastItems, addressed, lastElig);
});

/* ---- Wire inputs, reset, load --------------------------------------- */
document.querySelectorAll('[data-field]').forEach((el) => el.addEventListener('input', recompute));
$('evaluate').addEventListener('click', recompute);
$('reset').addEventListener('click', () => {
  if (!confirm('Clear the device profile and results?')) return;
  document.querySelectorAll('[data-field]').forEach((el) => {
    if (el.type === 'checkbox' || el.type === 'radio') el.checked = false; else el.value = '';
  });
  addressed = new Set();
  riskAcked = new Set();
  try { localStorage.removeItem(STORE_KEY); } catch (_) {}
  recompute();
});
const loadBtn = $('loadSession');
if (loadBtn) loadBtn.addEventListener('click', () => { if (loadSession()) recompute(); });

/* ---- Print-optimized report (build-spec §6) ------------------------- */
function esc(s) { return String(s == null ? '' : s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }
function buildPrintReport() {
  if (!window.eIFUChecklist) return;
  const p = readProfile();
  const date = new Date().toISOString().slice(0, 10);
  const primary = (market === 'fda') ? lastElig.fda : lastElig.eu;
  let h = '<h1>eIFUCompass — IFU / Labeling / eIFU report</h1>';
  h += '<div class="pr-meta">Device: ' + esc(p.deviceName || '(unnamed)') + ' · Market(s): ' + esc(p.market) + ' · Generated: ' + date + ' · Tool v1.0.0-dev</div>';
  h += '<div class="pr-disc"><b>Decision-support only</b> — not legal/regulatory advice; does not create compliance. FDA + EU MDR only (no IVDR/IVD, no UK, no combination products). Always verify against the official sources.</div>';

  h += '<h2>Device profile</h2><table><tbody>';
  [['Device type', p.deviceType], ['EU MDR class', p.euClass], ['FDA class', p.fdaClass],
   ['Intended users', p.intendedUsers], ['Patient population', p.patientPopulation],
   ['Use environment', p.useEnvironment], ['Lay use foreseeable', p.layUseForeseeable],
   ['eIFU approach', p.eifuApproach]].forEach((r) => { if (r[1]) h += '<tr><th>' + esc(r[0]) + '</th><td>' + esc(r[1]) + '</td></tr>'; });
  h += '</tbody></table>';
  if (p.intendedPurpose) h += '<p><b>Intended purpose:</b> ' + esc(p.intendedPurpose) + '</p>';

  h += '<h2>eIFU eligibility decision</h2>';
  if (lastElig.eu) h += '<p><b>EU:</b> <span class="pr-status">' + esc(lastElig.eu.title) + '</span> — ' + esc(lastElig.eu.rationale) + '</p>';
  if (lastElig.fda) h += '<p><b>FDA:</b> <span class="pr-status">' + esc(lastElig.fda.title) + '</span> — ' + esc(lastElig.fda.rationale) + '</p>';
  if (primary && primary.conditions && primary.conditions.length) h += '<p><b>Conditions:</b></p><ul>' + primary.conditions.map((c) => '<li>' + esc(c) + '</li>').join('') + '</ul>';

  h += '<h2>Content checklist</h2>';
  const labels = window.eIFUChecklist.LAYER_LABEL;
  ['always', 'conditional', 'eifu'].forEach((L) => {
    const g = lastItems.filter((it) => it.layer === L);
    if (!g.length) return;
    h += '<div class="layerhdr">' + labels[L] + '</div><table><thead><tr><th>Item</th><th>Reference</th><th>Status</th></tr></thead><tbody>';
    g.forEach((it) => { h += '<tr><td>' + esc(it.title) + '</td><td>' + esc(it.ref) + ' (' + it.market.toUpperCase() + ')</td><td>' + (addressed.has(it.id) ? 'Addressed' : 'Outstanding') + '</td></tr>'; });
    h += '</tbody></table>';
  });

  const gaps = lastItems.filter((it) => !addressed.has(it.id));
  if (gaps.length) h += '<h2>Critical gaps</h2><ul>' + gaps.slice(0, 10).map((it) => '<li>' + esc(it.title) + ' (' + esc(it.ref) + ')</li>').join('') + '</ul>';
  const recsEl = $('recsList');
  if (recsEl && recsEl.children.length) h += '<h2>Recommended next steps</h2><ul>' + recsEl.innerHTML + '</ul>';
  const refs = [...new Set(lastItems.map((it) => it.ref))];
  if (refs.length) h += '<h2>Regulatory references used</h2><ul>' + refs.map((r) => '<li>' + esc(r) + '</li>').join('') + '</ul>';
  h += '<div class="pr-disc">Generated by eIFUCompass — decision-support only. No liability is accepted for decisions made using this tool.</div>';
  $('printReport').innerHTML = h;
}
window.addEventListener('beforeprint', buildPrintReport);

/* ---- Back-to-top ----------------------------------------------------- */
(function backToTop() {
  const b = $('toTop');
  if (!b) return;
  const on = () => b.classList.toggle('show', window.scrollY > 400);
  window.addEventListener('scroll', on, { passive: true });
  on();
  b.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
})();

/* ---- PWA service worker (install/offline; no-op on file://) ---------- */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
}

/* ---- Boot ------------------------------------------------------------ */
loadSession();
recompute();
