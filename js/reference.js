/* =====================================================================
   eIFUCompass — reference panels: medical-device symbol glossary and the
   EU/EEA language-requirements lookup (data/eu-languages.json).

   Symbol graphics are the manufacturer-facing set from the open-source
   (MIT) repository github.com/t4dhg/medical-device-symbols, bundled in
   assets/symbols/ for offline use. The symbols follow ISO 15223-1 /
   ISO 7000 / IEC 60417; the authoritative symbol, exact title and
   conditions of use remain those of ISO 15223-1:2021. Not a substitute
   for the standard. No AI; the only network use is fetching the local
   language JSON.
   ===================================================================== */
'use strict';

// file (in assets/symbols/) · name · plain-language meaning
window.MD_SYMBOLS = [
  { f: 'manufacturer.svg', n: 'Manufacturer', m: 'The medical-device manufacturer (shown with name and address).' },
  { f: 'authorized-representative-in-the-european-community.svg', n: 'Authorised representative in the European Community', m: 'The EU authorised representative (name and address).' },
  { f: 'md.svg', n: 'Medical device', m: 'The item is a medical device.' },
  { f: 'udi.svg', n: 'Unique Device Identifier (UDI)', m: 'Carrier containing Unique Device Identifier information.' },
  { f: 'ce.svg', n: 'CE marking', m: 'CE conformity marking (MDR Art. 20 / Annex V).' },
  { f: 'ce-bsi.svg', n: 'CE marking with Notified Body number', m: 'CE marking accompanied by the Notified Body identification number (example shown: BSI 0086).' },
  { f: 'catalogue-number.svg', n: 'Catalogue number', m: 'Manufacturer’s catalogue / reference number.' },
  { f: 'batch-code.svg', n: 'Batch code', m: 'Manufacturer’s batch / lot code.' },
  { f: 'serial-number.svg', n: 'Serial number', m: 'Manufacturer’s serial number.' },
  { f: 'manufacture-date.svg', n: 'Date of manufacture', m: 'Date the device was manufactured.' },
  { f: 'consult-instructions-for-use.svg', n: 'Consult instructions for use', m: 'The user needs to consult the instructions for use (paper or eIFU).' },
  { f: 'caution.svg', n: 'Caution', m: 'Consult the IFU for important cautionary information.' },
  { f: 'do-not-re-use.svg', n: 'Do not re-use', m: 'Single-use device — do not reuse.' },
  { f: 'do-not-use-if-package-is-damaged.svg', n: 'Do not use if package is damaged', m: 'Do not use if the package is damaged; consult the IFU.' },
  { f: 'sterile.svg', n: 'Sterile', m: 'The device has been subjected to a sterilization process.' },
  { f: 'sterilized-using-ethylene-oxide.svg', n: 'Sterilized using ethylene oxide', m: 'Sterilized using ethylene oxide (STERILE EO).' },
  { f: 'sterilized-using-irradiation.svg', n: 'Sterilized using irradiation', m: 'Sterilized using irradiation (STERILE R).' },
  { f: 'sterilized-using-steam-or-dry-heat.svg', n: 'Sterilized using steam or dry heat', m: 'Sterilized using steam or dry heat.' },
  { f: 'sterilized-using-aseptic-processing-techniques.svg', n: 'Sterilized using aseptic processing techniques', m: 'Sterile device processed using aseptic techniques.' },
  { f: 'non-pyrogenic.svg', n: 'Non-pyrogenic', m: 'The device is non-pyrogenic.' },
  { f: 'latex.svg', n: 'Contains natural rubber latex', m: 'Indicates the presence of natural rubber latex.' },
  { f: 'fluid-path.svg', n: 'Fluid path', m: 'Indicates the (e.g. sterile) fluid path.' },
  { f: 'liquid-filter-with-pore-size.svg', n: 'Liquid filter with pore size', m: 'Liquid filter with a stated pore size.' },
  { f: 'temperature-limit.svg', n: 'Temperature limit', m: 'Storage / handling temperature limits.' },
  { f: 'lower-limit-of-temperature.svg', n: 'Lower limit of temperature', m: 'Lower storage / handling temperature limit.' },
  { f: 'upper-limit-of-temperature.svg', n: 'Upper limit of temperature', m: 'Upper storage / handling temperature limit.' },
  { f: 'humidity-limitation.svg', n: 'Humidity limitation', m: 'Humidity range for storage / transport.' },
  { f: 'atmospheric-pressure-limitation.svg', n: 'Atmospheric pressure limitation', m: 'Atmospheric-pressure range for storage / transport.' },
  { f: 'in-vitro-diagnostic-medical-device.svg', n: 'In vitro diagnostic medical device', m: 'The item is an IVD medical device (IVD is not covered by this tool — shown for label reference).' }
];

function renderGlossary() {
  const body = document.getElementById('glossaryBody');
  if (!body) return;
  body.innerHTML = window.MD_SYMBOLS.map((s) =>
    '<div class="sym"><img class="sym-img" src="assets/symbols/' + s.f + '" alt="' + s.n + '" width="40" height="40" loading="lazy">' +
    '<div><div class="sym-name">' + s.n + '</div><div class="sym-mean">' + s.m + '</div></div></div>').join('');
}

function renderLanguages(members) {
  const body = document.getElementById('langBody');
  if (!body) return;
  body.innerHTML = members.map((m) =>
    '<tr><td>' + m.state + '</td><td>' + m.languages.join(', ') + '</td></tr>').join('');
}
function loadLanguages() {
  const note = document.getElementById('langNote');
  fetch('data/eu-languages.json')
    .then((r) => r.json())
    .then((d) => { renderLanguages(d.members || []); if (note) note.textContent = d._note || ''; })
    .catch(() => { if (note) note.textContent = 'Language table loads in the online/installed app (needs the bundled data file).'; });
}

document.addEventListener('DOMContentLoaded', () => { renderGlossary(); loadLanguages(); });
