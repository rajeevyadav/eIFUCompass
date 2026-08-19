# eIFUCompass — Regulatory Review Schedule

eIFUCompass cites primary regulatory sources (EU MDR Annex I §23, Implementing
Reg (EU) 2021/2226 as amended by (EU) 2025/1234, ISO 20417 / 15223-1 / 14971,
IEC 62366-1, 21 CFR Part 801). Those sources move and get superseded, so a
**lighter quarterly review** runs on a fixed cadence — **synchronised with
RegCompass and CyberCompass to a single family review date**.

## Next review

| Field | Value |
|---|---|
| **Next review due** | **2026-11-18** (synced with RegCompass + CyberCompass) |
| Cadence | Every 3 months (family-synced dates) |
| Tracking | GitHub issue (label `review`) once the repo is public/launched |

> Note: until public launch, this date is kept in sync with the family review
> window. At launch, confirm the launch date to the Director and open the
> tracking issue.

## What a quarterly review covers

A **link-check + awareness-check** (escalate to a full re-read only if something
looks off). Re-check the cited sources (see `/verification/log.md`) for:

1. **Dead / moved links** — every cited `href` still resolves (browser-confirm
   anti-bot CDNs: iso.org, EUR-Lex, health.ec.europa.eu).
2. **Superseded guidance / standards** — ISO 20417/15223-1 updates, MDCG docs.
3. **Regulatory change in progress** — MDR/IVDR timelines, **IR (EU) 2025/1234**
   application dates and any further eIFU amendments, FDA 21 CFR 801 revisions,
   EUDAMED eIFU-link mandate.
4. **Resolve the standing `*` (UNVERIFIED) flags** in `/verification/log.md`
   (2025/1234 subject; ISO standard numbers; §23.4 sub-clause letters).

## Process — directive-gated, always

Every finding goes through a `D-NNN` directive before any content change lands —
no silent patches. Produce a findings report → Director directive → apply + log.

## After each review

- Update **Next review due** (+3 months → keep synced with the family).
- Record the outcome in `/verification/log.md`.
- Open the next tracking issue.

---

_Family-synced cadence: RegCompass · CyberCompass · eIFUCompass all review on the
same date (currently 2026-11-18)._
