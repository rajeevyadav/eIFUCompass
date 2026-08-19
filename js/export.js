/* =====================================================================
   eIFUCompass — export (CSV / JSON). No network; generates a client-side
   download. The exported report carries the same disclaimer as the app.
   ===================================================================== */
'use strict';

window.eIFUExport = (function () {

  function download(filename, text, mime) {
    const blob = new Blob([text], { type: mime + ';charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  }

  function csvCell(v) {
    v = (v == null) ? '' : String(v);
    return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  }

  // items: [{cat,title,ref,market}], addressed: Set of ids, elig: {eu,fda}
  function csv(profile, items, addressed, elig) {
    const rows = [
      ['eIFUCompass — IFU / Labeling / eIFU checklist export'],
      ['Generated', new Date().toISOString().slice(0, 10)],
      ['Device', profile.deviceName || '(unnamed)'],
      ['Market(s)', profile.market],
      ['EU eIFU decision', elig.eu ? elig.eu.title : ''],
      ['FDA labeling decision', elig.fda ? elig.fda.title : ''],
      [],
      ['Market', 'Category', 'Item', 'Reference', 'Status']
    ];
    items.forEach((it) => rows.push([
      it.market.toUpperCase(), it.cat, it.title, it.ref,
      addressed.has(it.id) ? 'Addressed' : 'Outstanding'
    ]));
    rows.push([]);
    rows.push(['Decision-support only — not legal/regulatory advice. Verify against the official sources. FDA + EU MDR only (no IVDR/IVD, no UK, no combination products).']);
    const text = rows.map((r) => r.map(csvCell).join(',')).join('\n');
    download('eifucompass-checklist.csv', text, 'text/csv');
  }

  function json(profile, items, addressed, elig) {
    const payload = {
      tool: 'eIFUCompass', version: '1.0.0',
      generated: new Date().toISOString().slice(0, 10),
      profile, eligibility: elig,
      checklist: items.map((it) => ({
        id: it.id, market: it.market, category: it.cat, title: it.title,
        reference: it.ref, status: addressed.has(it.id) ? 'addressed' : 'outstanding'
      })),
      disclaimer: 'Decision-support only — not legal/regulatory advice. FDA + EU MDR only.'
    };
    download('eifucompass-session.json', JSON.stringify(payload, null, 2), 'application/json');
  }

  return { csv, json };
})();
