# eIFUCompass

**IFU / Labeling / eIFU Compliance Navigator — FDA + EU MDR**

[![Latest release](https://img.shields.io/github/v/release/rajeevyadav/eifucompass?label=version&color=2ea44f&cacheSeconds=300)](https://github.com/rajeevyadav/eifucompass/releases/latest)
[![Download for Windows](https://img.shields.io/badge/Download-Windows%20installer-0078d6?logo=windows)](https://github.com/rajeevyadav/eifucompass/releases/latest/download/eIFUCompass-Setup.exe)
[![Open the app](https://img.shields.io/badge/Open-web%20%2F%20mobile%20app-8250df)](https://rajeevyadav.github.io/eifucompass/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

_Last updated: **2026-08-18** · Next regulatory review: **2026-11-18** (see [NEXT_REVIEW.md](NEXT_REVIEW.md))_

🌐 **Use it now in your browser: https://rajeevyadav.github.io/eifucompass/**

eIFUCompass is a free, offline, dual-market decision-support tool for medical-device
teams. Enter a device profile and it works out **electronic IFU (eIFU) eligibility**
and builds the **label / IFU / eIFU content checklist** for **FDA** and **EU MDR** —
with the exact regulatory reference behind every item. Deterministic, rule-based and
fully auditable: **no AI in the compliance logic**.

## Features

- **eIFU eligibility engine** — EU Implementing Reg (EU) 2021/2226 (as amended by
  2025/1234) plus FDA electronic labeling (21 CFR 801.128), with a clear
  Eligible / Hybrid / Paper-mandatory decision and the conditions that apply.
- **Content checklist** — label, IFU and eIFU items generated from the device
  profile (EU MDR Annex I §23 + 21 CFR Part 801), grouped Always / Conditional /
  eIFU-specific, each with its clause reference.
- **Dual-market comparison** — side-by-side EU ↔ FDA divergence for "Both".
- **Completeness meter, prioritized gaps and recommended next steps.**
- **eIFU risk-assessment** acknowledgment (2021/2226 Art. 4).
- **Export** — CSV, JSON, and a print-optimized report.
- **References** — ISO 15223-1 symbol glossary and an EU/EEA language-requirements
  lookup.
- **Runs anywhere** — light/dark, installable PWA, works fully offline.

## Coverage

FDA and EU MDR. Not covered: IVDR / IVD devices, the UK and other jurisdictions,
and combination products (21 CFR Part 4 / MDR Art. 117).

## How to use

1. Pick a market (FDA / EU MDR / Both).
2. Fill in the device profile on the left — intended users, use environment,
   classification, characteristics, eIFU intent.
3. Read the eligibility decision and the live checklist on the right; mark items
   as addressed to track completeness.
4. Export a report (CSV / JSON / print).

## Run & build

A static single-page app (no build step for the web version) with an optional
[Electron](https://www.electronjs.org/) desktop wrapper that loads the same
`index.html`.

```bash
# run the web app locally (a service worker needs http, not file://)
npx serve .            # or:  python3 -m http.server

# run the desktop app
npm install
npm start

# build the desktop installers
npm run dist:win       # Windows (NSIS installer + portable)
npm run dist:mac       # macOS (.dmg)
npm run dist:linux     # Linux (.AppImage)
```

The Windows installer is **per-user** (no admin/UAC needed).

## No AI inside

The shipped page and its tooling contain no AI/ML code. Every result is produced
by fixed, human-written rules you can read in `js/` — the app runs entirely on
your device, works offline, and transmits nothing.

## Disclaimer

Decision-support only — provided "as is". eIFUCompass is not a substitute for
professional regulatory advice, Notified Body assessment or FDA interaction.
Classification, labeling, IFU content and eIFU eligibility remain the sole
responsibility of the manufacturer. Always verify against the current official
texts (EU MDR, the Implementing Regulations, FDA regulations and applicable
standards).

## License

MIT — see [`LICENSE`](LICENSE).

Maintainer: **Rajeev Yadav** · rajeevyadav@gmail.com
