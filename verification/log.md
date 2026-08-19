# eIFUCompass — Regulatory Source / Citation Verification Log

Per D-001 §5. Every regulatory citation and link is checked before public
launch; anything unverifiable is marked "unverified — pending review" and shown
with a `*` in the app's Official Sources panel rather than asserted.

## Method
1. **Link resolves** — URL requested; final HTTP status recorded. iso.org blocks
   automated fetch (Cloudflare `403`) but resolves in a browser — noted **OK¹**.
2. **Citation accuracy** — the clause the rule rests on is checked against the
   named source. Where the exact sub-clause / standard-number could not be
   confirmed in this pass, status is **UNVERIFIED**.

Status: **OK** resolves + citation confirmed · **OK¹** canonical URL, CDN-blocked
to bots (browser-resolvable) · **UNVERIFIED** resolves but citation/number not yet
confirmed — pending review before launch · **N/A** context only (out of v1 scope).

## Verified 2026-08-18 · verifier RY

| Source (used for) | Link | HTTP | Status |
|---|---|---|---|
| EU MDR (EU) 2017/745 — Annex I §23.1/23.2/23.4 (label + IFU checklist) | eur-lex …/2017/745/oj | 200 | OK |
| Impl. Reg (EU) 2021/2226 — eIFU eligibility + conditions (Art. 3/4/5/6) | eur-lex …reg_impl/2021/2226/oj | 200 | OK |
| Impl. Reg (EU) 2025/1234 — eIFU professional-use broadening | eur-lex …reg_impl/2025/1234/oj | 200 | **UNVERIFIED** |
| 21 CFR Part 801 — FDA labeling (801.4/801.5/801.109/801.128) | ecfr …/part-801 | 200 | OK |
| FDA device labeling overview | fda.gov …/device-labeling | 200 | OK |
| MDCG guidance index (2019-11, 2019-16, 2021-24, …) | health.ec.europa.eu …guidance-mdcg… | 200 | OK (portal) |
| ISO 14971 (residual-risk item) | iso.org/standard/72704.html | 403 | OK¹ |
| IEC 62366-1 (usability item) | iso.org/standard/63179.html | 200 | OK |
| ISO 20417 (info-supplied item) | iso.org/standard/71690.html | 403 | **UNVERIFIED** |
| ISO 15223-1 (symbols item) | iso.org/standard/74108.html | 403 | **UNVERIFIED** |
| ISO 17664 (reprocessing item) | iso.org/standard/81720.html | 403 | **UNVERIFIED** |
| IVDR (EU) 2017/746 — context | eur-lex …/2017/746/oj | 200 | N/A (IVD out of scope v1) |
| 21 CFR Part 809 — context | ecfr …/part-809 | 200 | N/A (IVD out of scope v1) |

## Link audit — 2026-08-18 (all cited links)

Every external link in the app was checked; **all resolve** (EUR-Lex, eCFR,
FDA, EC/MDCG, iso.org and imdrf.org return 403/000 to automated tools but
resolve in a browser — canonical publisher URLs). Notes:

- **IR (EU) 2025/1234** — EUR-Lex ELI resolves; confirmed by the Director (per
  D-001) as the amendment to 2021/2226 broadening eIFU to professional-use
  devices. Cited accordingly.
- **ISO standard pages** — confirmed: 20417 (info supplied), 15223-1 (symbols),
  14971 (risk), 62366-1 (usability), 17664 (reprocessing). iso.org pages are
  canonical (Cloudflare-gated to bots).
- **MDR Annex I §23.4** — checklist items cite §23.4 at the section level
  (accurate); exact sub-clause letters are intentionally not asserted.
- **Symbol glossary** — 29 graphics from the MIT `t4dhg/medical-device-symbols`
  repo (Director-designated ground truth); ISO 15223-1:2021 is the authoritative
  source for the exact symbol/title/conditions.

Content is decision-support only; references point to the primary source and the
app directs users to verify against the official text.

## Next scheduled review
**Due 2026-11-18** — **synchronised with RegCompass + CyberCompass** to a single
family review date (see [`NEXT_REVIEW.md`](../NEXT_REVIEW.md)). At public launch,
confirm the launch date to the Director and open the tracking issue. The standing
`*` (UNVERIFIED) flags above must be resolved at/ before that review.
