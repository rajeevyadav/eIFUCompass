/* =====================================================================
   eIFUCompass — checklist engine
   ---------------------------------------------------------------------
   Deterministic. Given a device profile, returns the label / IFU / eIFU /
   FDA content items that APPLY to that device, each with its regulatory
   reference. Applicability is decided by the profile (class, users,
   characteristics, market). Whether an item is actually satisfied is the
   manufacturer's call — the user marks items "addressed" (app.js), which
   drives the completeness meter and the gap list.

   Citations are given at the clause/section level that is confidently
   accurate (e.g. "MDR Annex I §23.4"); users are directed to verify exact
   sub-clause letters against the current official text.
   No AI, no network.
   ===================================================================== */
'use strict';

window.eIFUChecklist = (function () {
  const EU = 'eu', FDA = 'fda';
  const yes = () => true;

  // cat: label | ifu | eifu | warn      market: eu | fda
  const RULES = [
    /* ---- EU MDR label — Annex I §23.2 ---------------------------------- */
    { id: 'eu-lbl-id', market: EU, cat: 'label', title: 'Device name and manufacturer identification on the label', ref: 'MDR Annex I §23.2', applies: yes,
      guide: 'Name/trade name and the manufacturer’s name and registered address must appear on the label.' },
    { id: 'eu-lbl-ce', market: EU, cat: 'label', title: 'CE marking — visible and legible on the label', ref: 'MDR Art. 20 · Annex V', applies: yes,
      guide: 'The CE marking must be affixed visibly and legibly (and on packaging/IFU as applicable). Class I self-certified devices carry the CE mark without an NB number (except Is/Im/Ir).' },
    { id: 'eu-lbl-nb', market: EU, cat: 'label', title: 'Notified Body four-digit number immediately following the CE marking', ref: 'MDR Art. 20(5) · Annex V', applies: (p) => p.euClass && !['Class I', 'unknown', ''].includes(p.euClass),
      guide: 'Where a Notified Body carried out conformity assessment (Class IIa/IIb/III, and Class Is/Im/Ir), its four-digit identification number must appear immediately after the CE marking.' },
    { id: 'eu-lbl-arep', market: EU, cat: 'label', title: 'Authorised representative identification (non-EU manufacturers)', ref: 'MDR Art. 11 · Annex I §23.2', applies: yes,
      guide: 'For manufacturers outside the EU, the EU authorised representative’s name and address must appear on the label/packaging (EC REP).' },
    { id: 'eu-lbl-udi', market: EU, cat: 'label', title: 'UDI carrier placed on the label', ref: 'MDR Annex I §23.2 · Art. 27', applies: (p) => p.udi,
      guide: 'The UDI carrier (Basic UDI-DI is in the technical documentation/EUDAMED) must be on the label or packaging.' },
    { id: 'eu-lbl-sterile', market: EU, cat: 'label', title: 'Sterile state and sterilization method indicated (with ISO 15223-1 symbol)', ref: 'MDR Annex I §23.2 · ISO 15223-1', applies: (p) => p.sterile === 'Yes',
      guide: 'Indicate sterile status and method; use recognised ISO 15223-1 symbols where applicable.' },
    { id: 'eu-lbl-single', market: EU, cat: 'label', title: 'Single-use indication', ref: 'MDR Annex I §23.2', applies: (p) => p.reuse === 'single',
      guide: 'Single-use devices must carry the single-use indication/symbol.' },
    { id: 'eu-lbl-eifu', market: EU, cat: 'eifu', title: 'Label states the IFU is electronic and how to access it', ref: 'Reg (EU) 2021/2226 Art. 5', applies: (p) => p.eifuApproach === 'pure' || p.eifuApproach === 'hybrid',
      guide: 'When the IFU is supplied electronically, the label must indicate this and give the access method (e.g. URL/QR).' },
    { id: 'eu-lbl-lot', market: EU, cat: 'label', title: 'Lot / batch or serial number', ref: 'MDR Annex I §23.2', applies: yes,
      guide: 'Lot/batch code (or serial number for certain devices) enabling traceability.' },
    { id: 'eu-lbl-expiry', market: EU, cat: 'label', title: 'Use-by date / expiry (sterile or limited-life devices)', ref: 'MDR Annex I §23.2 · ISO 15223-1', applies: (p) => p.sterile === 'Yes',
      guide: 'Where relevant (e.g. sterile devices), the label must show the use-by date with the recognised symbol.' },
    { id: 'eu-lbl-consult', market: EU, cat: 'label', title: '"Consult instructions for use" / caution symbol on the label', ref: 'MDR Annex I §23.2 · ISO 15223-1', applies: yes,
      guide: 'Use the ISO 15223-1 "consult IFU" and any relevant caution symbols (see the symbol glossary).' },
    { id: 'eu-lbl-md', market: EU, cat: 'label', title: 'Medical Device ("MD") indication and Basic UDI-DI in technical docs', ref: 'MDR Annex I §23.2 · Art. 27', applies: yes },

    /* ---- EU MDR IFU — Annex I §23.4 ------------------------------------ */
    { id: 'eu-ifu-mfr', market: EU, cat: 'ifu', title: 'Manufacturer identification and contact', ref: 'MDR Annex I §23.4', applies: yes,
      guide: 'Name, registered address and contact for the manufacturer (and authorised representative where relevant).' },
    { id: 'eu-ifu-purpose', market: EU, cat: 'ifu', title: 'Intended purpose: indications, contraindications, patient groups, intended users', ref: 'MDR Annex I §23.4', applies: yes,
      guide: 'State the intended purpose with indications, contraindications, target patient population and intended users.' },
    { id: 'eu-ifu-perf', market: EU, cat: 'ifu', title: 'Performance characteristics and limitations', ref: 'MDR Annex I §23.4', applies: yes },
    { id: 'eu-ifu-residual', market: EU, cat: 'warn', title: 'Residual risks, contraindications and undesirable side-effects', ref: 'MDR Annex I §23.4 · ISO 14971', applies: yes,
      guide: 'Communicate residual risks and undesirable side-effects prominently (linked to the ISO 14971 risk file).' },
    { id: 'eu-ifu-usability', market: EU, cat: 'ifu', title: 'IFU validated as a user interface (usability engineering)', ref: 'IEC 62366-1 · MDR Annex I §23.4', applies: yes,
      guide: 'The IFU is a user-interface element; usability/human-factors validation and residual-risk communication apply (IEC 62366-1).' },
    { id: 'eu-ifu-symbols', market: EU, cat: 'label', title: 'Manufacturer information & symbols per ISO 20417 / ISO 15223-1', ref: 'ISO 20417 · ISO 15223-1', applies: yes,
      guide: 'ISO 20417 is the horizontal standard for information supplied by the manufacturer; ISO 15223-1 gives the recognised symbols.' },
    { id: 'eu-ifu-warn', market: EU, cat: 'warn', title: 'Warnings, precautions and safety information', ref: 'MDR Annex I §23.4', applies: yes },
    { id: 'eu-ifu-ops', market: EU, cat: 'ifu', title: 'Instructions for operation / use', ref: 'MDR Annex I §23.4', applies: yes },
    { id: 'eu-ifu-storage', market: EU, cat: 'ifu', title: 'Storage, handling and disposal instructions', ref: 'MDR Annex I §23.4', applies: yes },
    { id: 'eu-ifu-date', market: EU, cat: 'ifu', title: 'Date of issue or latest revision of the IFU', ref: 'MDR Annex I §23.4', applies: yes },
    { id: 'eu-ifu-incident', market: EU, cat: 'ifu', title: 'Notice to report serious incidents to manufacturer and competent authority', ref: 'MDR Annex I §23.4', applies: yes },
    // conditional
    { id: 'eu-ifu-install', market: EU, cat: 'ifu', title: 'Installation / calibration instructions', ref: 'MDR Annex I §23.4', applies: (p) => p.fixedInstall },
    { id: 'eu-ifu-reprocess', market: EU, cat: 'ifu', title: 'Cleaning, disinfection, sterilization and reprocessing instructions', ref: 'MDR Annex I §23.4 · ISO 17664', applies: (p) => p.reuse === 'reusable',
      guide: 'Reusable devices need validated reprocessing instructions (cleaning/disinfection/sterilization, cycle limits).' },
    { id: 'eu-ifu-software', market: EU, cat: 'ifu', title: 'Software / IT environment and minimum cybersecurity requirements', ref: 'MDR Annex I §23.4 · §17', applies: (p) => p.software || p.deviceType === 'software',
      guide: 'State IT environment, minimum hardware/network requirements and security measures for software-containing devices.' },
    { id: 'eu-ifu-implant', market: EU, cat: 'ifu', title: 'Implant card information for the patient', ref: 'MDR Art. 18 · Annex I §23.4', applies: (p) => p.implantable,
      guide: 'Implantable devices require patient implant card information (with defined exemptions).' },
    { id: 'eu-ifu-training', market: EU, cat: 'ifu', title: 'Required user training / qualification stated', ref: 'MDR Annex I §23.4', applies: (p) => p.specialTraining },
    { id: 'eu-ifu-sterilebarrier', market: EU, cat: 'warn', title: 'Instructions if sterile barrier is damaged; re-sterilization limits', ref: 'MDR Annex I §23.4', applies: (p) => p.sterile === 'Yes',
      guide: 'State what to do if the sterile packaging is damaged, and any re-sterilization method/limits (or that it must not be re-sterilized).' },
    { id: 'eu-ifu-life', market: EU, cat: 'ifu', title: 'Expected service life / residual life where relevant', ref: 'MDR Annex I §23.4', applies: (p) => p.implantable || p.fixedInstall || p.reuse === 'reusable' },
    { id: 'eu-ifu-singleuse', market: EU, cat: 'warn', title: 'Do-not-reuse warning for single-use devices', ref: 'MDR Annex I §23.4 · ISO 15223-1', applies: (p) => p.reuse === 'single' },
    { id: 'eu-ifu-ai', market: EU, cat: 'warn', title: 'AI transparency information for users (AI/ML device)', ref: 'EU AI Act (2024/1689) Art. 13 / Art. 50', applies: (p) => p.aiml && (p.software || p.deviceType === 'software'),
      guide: 'AI-enabled devices in scope of the AI Act must give users transparency information (capabilities, limitations, oversight). Additive to MDR §23.' },

    /* ---- eIFU-specific — 2021/2226 ------------------------------------- */
    { id: 'eu-eifu-web', market: EU, cat: 'eifu', title: 'Website hosts current and previous IFU versions', ref: 'Reg (EU) 2021/2226 Art. 6', applies: (p) => (p.eifuApproach === 'pure' || p.eifuApproach === 'hybrid') },
    { id: 'eu-eifu-paper', market: EU, cat: 'eifu', title: 'Free paper copy provided within 7 calendar days on request', ref: 'Reg (EU) 2021/2226 Art. 5', applies: (p) => (p.eifuApproach === 'pure' || p.eifuApproach === 'hybrid'),
      guide: 'A paper IFU must be supplied free of charge within 7 calendar days of a user request.' },
    { id: 'eu-eifu-eudamed', market: EU, cat: 'eifu', title: 'eIFU web address linked to EUDAMED via the UDI system', ref: 'Reg (EU) 2021/2226 · MDR Art. 27–29 (UDI/EUDAMED)', applies: (p) => (p.eifuApproach === 'pure' || p.eifuApproach === 'hybrid'),
      guide: 'The eIFU website/access must connect into the EUDAMED database through the device’s UDI, so users can reach the current IFU from the UDI.' },
    { id: 'eu-eifu-risk', market: EU, cat: 'eifu', title: 'Documented eIFU risk assessment (knowledge, environment, access, tampering)', ref: 'Reg (EU) 2021/2226 Art. 4', applies: (p) => (p.eifuApproach === 'pure' || p.eifuApproach === 'hybrid') },
    { id: 'eu-eifu-lang', market: EU, cat: 'eifu', title: 'IFU available in each Member State language of availability', ref: 'Reg (EU) 2021/2226 · MDR Annex I §23.1', applies: yes,
      guide: 'Language requirements are set per Member State — see data/eu-languages.json (added in a later increment).' },
    { id: 'eu-ifu-exempt', market: EU, cat: 'ifu', title: 'IFU exemption available? (Class I/IIa usable safely without instructions)', ref: 'MDR Annex I §23.1', applies: (p) => p.euClass === 'Class I' || p.euClass === 'Class IIa',
      guide: 'For Class I / IIa devices, the IFU may be omitted if the manufacturer can justify safe use without instructions (justification documented in the technical file). The exemption does not remove other §23 requirements.' },

    /* ---- FDA — 21 CFR 801 --------------------------------------------- */
    { id: 'fda-directions', market: FDA, cat: 'ifu', title: 'Adequate directions for use', ref: '21 CFR 801.5', applies: yes },
    { id: 'fda-intended', market: FDA, cat: 'label', title: 'Intended use statement', ref: '21 CFR 801.4', applies: yes },
    { id: 'fda-rx', market: FDA, cat: 'label', title: 'Prescription-device labeling statement ("Rx only") and adequate information for practitioners', ref: '21 CFR 801.109', applies: (p) => p.intendedUsers === 'professional' || p.useEnvironment === 'hospital' || p.useEnvironment === 'clinic' },
    { id: 'fda-warn', market: FDA, cat: 'warn', title: 'Warnings, precautions and contraindications', ref: '21 CFR 801.109', applies: yes },
    { id: 'fda-udi', market: FDA, cat: 'label', title: 'UDI on label and package', ref: '21 CFR 801.20 · Part 830', applies: (p) => p.udi },
    { id: 'fda-elabel', market: FDA, cat: 'eifu', title: 'Electronic labeling notice + prompt free paper copy (facility-use Rx device)', ref: '21 CFR 801.128', applies: (p) => (p.useEnvironment === 'hospital' || p.useEnvironment === 'clinic') && p.intendedUsers === 'professional',
      guide: 'Electronic labeling is available for prescription devices used in health care facilities, with notice + paper-on-request conditions.' }
  ];

  function markets(p) {
    if (p.market === 'both') return [EU, FDA];
    return [p.market === 'eu' ? EU : FDA];
  }

  // Three-layer structure (amendments v1.1 §3): Always required (applies to
  // virtually all devices), Conditionally required (profile-driven), and
  // eIFU-specific (only when pure/hybrid eIFU is in play).
  function layerOf(r) {
    if (r.cat === 'eifu') return 'eifu';
    return (r.applies === yes) ? 'always' : 'conditional';
  }

  function build(p) {
    const ms = markets(p);
    return RULES
      .filter((r) => ms.includes(r.market) && r.applies(p))
      .map((r) => ({ id: r.id, market: r.market, cat: r.cat, title: r.title, ref: r.ref, guide: r.guide, layer: layerOf(r) }));
  }

  const LAYER_LABEL = { always: 'Always required', conditional: 'Conditionally required', eifu: 'eIFU-specific obligations' };

  return { build, RULES, LAYER_LABEL };
})();
