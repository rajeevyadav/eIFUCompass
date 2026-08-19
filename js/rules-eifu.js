/* =====================================================================
   eIFUCompass — eIFU eligibility engine
   ---------------------------------------------------------------------
   Deterministic decision logic. Every branch cites the clause it rests on.
   Sources (see /verification/log.md for verification status):
     • EU: Commission Implementing Regulation (EU) 2021/2226 (electronic IFU
       for medical devices under the MDR), as amended by (EU) 2025/1234.
       - Art. 3  eligible device categories
       - Art. 4  manufacturer risk assessment
       - Art. 5/6 conditions of use (label indication, website, paper on
         request, versions, languages)
     • FDA: 21 CFR 801.128 — electronic labeling for prescription devices
       intended for use in health care facilities.
   NOTE: exact article numbers of the 2025/1234 amendment are flagged
   cited at the clause level; users verify against the current official text.
   No AI, no network.
   ===================================================================== */
'use strict';

window.eIFUEligibility = (function () {

  // --- EU MDR / 2021/2226 -------------------------------------------------
  function evaluateEU(p) {
    // Out-of-scope guards
    if (p.deviceType === 'combination' || p.deviceType === 'ivd') {
      return { status: 'na', title: 'Not assessed', rationale: 'Combination products and IVDs are not covered by this tool.', conditions: [] };
    }
    if (!p.intendedUsers || !p.layUseForeseeable) {
      return { status: 'incomplete', title: 'Complete the profile', rationale: 'Set intended users and whether lay use is reasonably foreseeable to determine eIFU eligibility.', conditions: [] };
    }

    // Art. 3 eligible categories (implantable/active, fixed installed, built-in
    // display, standalone software). The 2025/1234 amendment broadens eligibility
    // for devices intended for professional users.
    const category = p.implantable || p.fixedInstall || p.builtInDisplay ||
                     p.deviceType === 'software' || p.software;

    const professionalOnly = p.intendedUsers === 'professional';
    const layForeseeable = p.layUseForeseeable === 'yes';
    const layUsers = p.intendedUsers === 'lay';

    // Conditions that always attach when eIFU is used (Art. 4/5/6)
    const conditions = [
      'Label must state the IFU is provided electronically and how to access it (2021/2226 Art. 5).',
      'Website must host the current and previous IFU versions (2021/2226 Art. 6).',
      'A paper copy must be supplied free of charge within 7 days on request (2021/2226 Art. 5).',
      'A documented risk assessment must cover user knowledge, environment, access and tamper-protection (2021/2226 Art. 4).',
      'Provide the IFU in the language(s) of each Member State where the device is made available (2021/2226 / MDR Annex I §23.1).'
    ];

    // Decision tree per IR (EU) 2025/1234 (amendments doc v1.1 §1.1):
    // 1) Lay/home-use intended -> Paper mandatory (red).
    if (layUsers || p.useEnvironment === 'home') {
      return {
        status: 'paper',
        title: 'Paper IFU mandatory',
        rationale: 'The device is intended for lay/home use, so a paper IFU is required. An eIFU may still be offered in addition, but cannot replace paper here.',
        conditions: []
      };
    }
    // 2) Professional use + lay use reasonably foreseeable -> Hybrid (amber):
    //    paper (or hybrid) required for the lay-user portion.
    if (professionalOnly && layForeseeable) {
      return {
        status: 'hybrid',
        title: 'Hybrid — paper required for lay-user portion',
        rationale: 'Intended for professionals but lay use is reasonably foreseeable, so paper (or a hybrid arrangement) is required for the lay-user portion; pure eIFU is not available.',
        conditions
      };
    }
    // 3) Professional use only + lay use NOT reasonably foreseeable -> Pure eIFU (green).
    if (professionalOnly && p.layUseForeseeable === 'no') {
      const catNote = category
        ? 'Device falls within an eIFU-eligible category (2021/2226 Art. 3).'
        : 'Eligibility relies on the professional-use broadening (IR (EU) 2025/1234) rather than an Art. 3 device category — confirm this applies.';
      return {
        status: 'eligible',
        title: 'Eligible for pure eIFU',
        rationale: 'Intended for professional users only and lay use is not reasonably foreseeable — a pure electronic IFU may replace paper (paper optional). ' + catNote,
        conditions
      };
    }
    // 4) Both / near-patient / uncertain -> Hybrid (amber): document a justification.
    return {
      status: 'hybrid',
      title: 'Hybrid — conditions apply',
      rationale: 'Mixed or uncertain user profile: pure eIFU is not clearly available. Treat as hybrid and document a justification/risk assessment before relying on eIFU.',
      conditions
    };
  }

  // --- FDA 21 CFR 801.128 e-labeling -------------------------------------
  function evaluateFDA(p) {
    if (p.deviceType === 'combination' || p.deviceType === 'ivd') {
      return { status: 'na', title: 'Not assessed', rationale: 'Combination products and IVDs are not covered by this tool.', conditions: [] };
    }
    if (!p.intendedUsers || !p.useEnvironment) {
      return { status: 'incomplete', title: 'Complete the profile', rationale: 'Set intended users and use environment to assess FDA e-labeling eligibility.', conditions: [] };
    }
    const facilityOnly = (p.useEnvironment === 'hospital' || p.useEnvironment === 'clinic');
    const professional = p.intendedUsers === 'professional';
    const homeOrLay = p.useEnvironment === 'home' || p.intendedUsers === 'lay';

    if (homeOrLay) {
      return {
        status: 'paper',
        title: 'Paper labeling expected',
        rationale: 'For home use or lay users, FDA electronic labeling under 21 CFR 801.128 does not apply — adequate written directions for use are expected (21 CFR 801.5).',
        conditions: []
      };
    }
    if (facilityOnly && professional) {
      return {
        status: 'eligible',
        title: 'FDA e-labeling may be available',
        rationale: 'Prescription device used in a health care facility by professionals may use electronic labeling under 21 CFR 801.128, subject to its conditions (availability, paper on request, notice).',
        conditions: [
          'Provide notice that labeling is electronic and how to access it (21 CFR 801.128).',
          'Maintain a free paper copy available promptly on request (21 CFR 801.128).',
          'Meet website availability/continuity requirements (21 CFR 801.128).'
        ]
      };
    }
    return {
      status: 'hybrid',
      title: 'Conditions apply',
      rationale: 'Use environment/users are mixed — confirm the device is a prescription device used exclusively in health care facilities before relying on 21 CFR 801.128.',
      conditions: []
    };
  }

  function evaluate(p) {
    return { eu: evaluateEU(p), fda: evaluateFDA(p) };
  }

  return { evaluate };
})();
