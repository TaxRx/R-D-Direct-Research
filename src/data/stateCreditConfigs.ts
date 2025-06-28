import { StateCreditConfig } from '../types/StateCredit';

export const STATE_CREDIT_CONFIGS: StateCreditConfig[] = [
  // California
  {
    stateCode: 'CA',
    stateName: 'California',
    years: {
      2020: {
        creditRate: 0.15,
        carryForwardYears: 0,
        refundable: false,
        calculationMethod: 'Standard',
        eligibleEntities: ['C-Corp', 'S-Corp', 'LLC', 'Partnership'],
        preFilingRequired: false,
        effectiveDate: '2020-01-01',
        formula: {
          baseCalculation: 'Average3Year',
          excessCalculation: 'Simple',
        },
        requiresFederalCredit: true,
        requiresForm6765: true,
        notes: ['15% credit on excess QREs', 'Indefinite carryforward', 'No carryback', 'Must claim federal credit'],
      },
      2021: {
        creditRate: 0.15,
        carryForwardYears: 0,
        refundable: false,
        calculationMethod: 'Standard',
        eligibleEntities: ['C-Corp', 'S-Corp', 'LLC', 'Partnership'],
        preFilingRequired: false,
        effectiveDate: '2020-01-01',
        formula: {
          baseCalculation: 'Average3Year',
          excessCalculation: 'Simple',
        },
        requiresFederalCredit: true,
        requiresForm6765: true,
        notes: ['15% credit on excess QREs', 'Indefinite carryforward', 'No carryback', 'Must claim federal credit'],
      },
      2022: {
        creditRate: 0.15,
        carryForwardYears: 0,
        refundable: false,
        calculationMethod: 'Standard',
        eligibleEntities: ['C-Corp', 'S-Corp', 'LLC', 'Partnership'],
        preFilingRequired: false,
        effectiveDate: '2020-01-01',
        formula: {
          baseCalculation: 'Average3Year',
          excessCalculation: 'Simple',
        },
        requiresFederalCredit: true,
        requiresForm6765: true,
        notes: ['15% credit on excess QREs', 'Indefinite carryforward', 'No carryback', 'Must claim federal credit'],
      },
      2023: {
        creditRate: 0.15,
        carryForwardYears: 0,
        refundable: false,
        calculationMethod: 'Standard',
        eligibleEntities: ['C-Corp', 'S-Corp', 'LLC', 'Partnership'],
        preFilingRequired: false,
        effectiveDate: '2020-01-01',
        formula: {
          baseCalculation: 'Average3Year',
          excessCalculation: 'Simple',
        },
        requiresFederalCredit: true,
        requiresForm6765: true,
        notes: ['15% credit on excess QREs', 'Indefinite carryforward', 'No carryback', 'Must claim federal credit'],
      },
      2024: {
        creditRate: 0.15,
        carryForwardYears: 0,
        refundable: false,
        calculationMethod: 'Standard',
        eligibleEntities: ['C-Corp', 'S-Corp', 'LLC', 'Partnership'],
        preFilingRequired: false,
        effectiveDate: '2020-01-01',
        formula: {
          baseCalculation: 'Average3Year',
          excessCalculation: 'Simple',
        },
        requiresFederalCredit: true,
        requiresForm6765: true,
        notes: ['15% credit on excess QREs', 'Indefinite carryforward', 'No carryback', 'Must claim federal credit'],
      },
      2025: {
        creditRate: 0.15,
        carryForwardYears: 0,
        refundable: false,
        calculationMethod: 'Standard',
        eligibleEntities: ['C-Corp', 'S-Corp', 'LLC', 'Partnership'],
        preFilingRequired: false,
        effectiveDate: '2020-01-01',
        formula: {
          baseCalculation: 'Average3Year',
          excessCalculation: 'Simple',
        },
        requiresFederalCredit: true,
        requiresForm6765: true,
        notes: ['15% credit on excess QREs', 'Indefinite carryforward', 'No carryback', 'Must claim federal credit'],
      },
    },
    defaultConfig: {
      creditRate: 0.15,
      carryForwardYears: 0,
      refundable: false,
      calculationMethod: 'Standard',
      eligibleEntities: ['C-Corp', 'S-Corp', 'LLC', 'Partnership'],
      preFilingRequired: false,
      effectiveDate: '2020-01-01',
      formula: {
        baseCalculation: 'Average3Year',
        excessCalculation: 'Simple',
      },
      requiresFederalCredit: true,
      requiresForm6765: true,
      notes: ['15% credit on excess QREs', 'Indefinite carryforward', 'No carryback', 'Must claim federal credit'],
    },
  },

  // Missouri (2025)
  {
    stateCode: 'MO',
    stateName: 'Missouri',
    years: {
      2025: {
        creditRate: 0.10,
        maxCredit: 0.50, // 50% of liability
        carryForwardYears: 10,
        refundable: false,
        calculationMethod: 'Standard',
        eligibleEntities: ['C-Corp', 'S-Corp', 'LLC', 'Partnership'],
        preFilingRequired: true,
        preFilingForm: 'Form TC-18',
        specialRules: {
          perTaxpayerCap: 0.50, // 50% of liability
        },
        effectiveDate: '2025-01-01',
        formula: {
          baseCalculation: 'Average3Year',
          excessCalculation: 'Simple',
        },
        requiresFederalCredit: true,
        notes: ['Credit begins in 2025', '50% of liability cap', '10-year carryforward']
      },
    },
    defaultConfig: {
      creditRate: 0.10,
      maxCredit: 0.50,
      carryForwardYears: 10,
      refundable: false,
      calculationMethod: 'Standard',
      eligibleEntities: ['C-Corp', 'S-Corp', 'LLC', 'Partnership'],
      preFilingRequired: true,
      preFilingForm: 'Form TC-18',
      specialRules: {
        perTaxpayerCap: 0.50,
      },
      effectiveDate: '2025-01-01',
      formula: {
        baseCalculation: 'Average3Year',
        excessCalculation: 'Simple',
      },
      requiresFederalCredit: true,
      notes: ['Credit begins in 2025', '50% of liability cap', '10-year carryforward']
    },
  },

  // New York (2025) - Excelsior R&D Component
  {
    stateCode: 'NY',
    stateName: 'New York',
    years: {
      2025: {
        creditRate: 0.06,
        carryForwardYears: 0,
        refundable: true,
        calculationMethod: 'FederalBased',
        eligibleEntities: ['C-Corp', 'S-Corp', 'LLC', 'Partnership'],
        preFilingRequired: false,
        specialRules: {
          universityCollaborationBonus: 0.08,
        },
        effectiveDate: '2025-01-01',
        formula: {
          excessCalculation: 'FederalBased',
          federalCreditPercentage: 0.50,
        },
        notes: ['Excelsior R&D Component', '6% on 50% of Federal R&D Credit', '8% for green projects'],
      },
    },
    defaultConfig: {
      creditRate: 0.06,
      carryForwardYears: 0,
      refundable: true,
      calculationMethod: 'FederalBased',
      eligibleEntities: ['C-Corp', 'S-Corp', 'LLC', 'Partnership'],
      preFilingRequired: false,
      specialRules: {
        universityCollaborationBonus: 0.08,
      },
      effectiveDate: '2025-01-01',
      formula: {
        excessCalculation: 'FederalBased',
        federalCreditPercentage: 0.50,
      },
      notes: ['Excelsior R&D Component', '6% on 50% of Federal R&D Credit', '8% for green projects'],
    },
  },

  // New Jersey (2025)
  {
    stateCode: 'NJ',
    stateName: 'New Jersey',
    years: {
      2025: {
        creditRate: 0.10,
        carryForwardYears: 7,
        refundable: false,
        calculationMethod: 'Standard',
        eligibleEntities: ['C-Corp', 'S-Corp'],
        preFilingRequired: true,
        preFilingForm: 'Form 306 with CBT-100',
        preFilingDeadline: 'Due with tax return',
        specialRules: {
          basicResearchBonus: 0.10,
        },
        effectiveDate: '2025-01-01',
        formula: {
          baseCalculation: 'Average4Year',
          excessCalculation: 'Simple',
        },
        requiresFederalCredit: true,
        requiresForm6765: true,
        notes: ['S-corps credit limited to entity tax liability', 'Pass-through not allowed', '15 years for targeted industries'],
      },
    },
    defaultConfig: {
      creditRate: 0.10,
      carryForwardYears: 7,
      refundable: false,
      calculationMethod: 'Standard',
      eligibleEntities: ['C-Corp', 'S-Corp'],
      preFilingRequired: true,
      preFilingForm: 'Form 306 with CBT-100',
      preFilingDeadline: 'Due with tax return',
      specialRules: {
        basicResearchBonus: 0.10,
      },
      effectiveDate: '2025-01-01',
      formula: {
        baseCalculation: 'Average4Year',
        excessCalculation: 'Simple',
      },
      requiresFederalCredit: true,
      requiresForm6765: true,
      notes: ['S-corps credit limited to entity tax liability', 'Pass-through not allowed', '15 years for targeted industries'],
    },
  },

  // Ohio
  {
    stateCode: 'OH',
    stateName: 'Ohio',
    years: {
      2020: {
        creditRate: 0.07,
        carryForwardYears: 7,
        refundable: false,
        calculationMethod: 'Standard',
        eligibleEntities: ['C-Corp', 'S-Corp', 'LLC'],
        preFilingRequired: false,
        effectiveDate: '2020-01-01',
        formula: {
          baseCalculation: 'Average3Year',
          excessCalculation: 'Simple',
        },
        requiresFederalCredit: true,
        requiresForm6765: true,
        notes: ['Claim on CAT return', 'CAT audit may follow'],
      },
    },
    defaultConfig: {
      creditRate: 0.07,
      carryForwardYears: 7,
      refundable: false,
      calculationMethod: 'Standard',
      eligibleEntities: ['C-Corp', 'S-Corp', 'LLC'],
      preFilingRequired: false,
      effectiveDate: '2020-01-01',
      formula: {
        baseCalculation: 'Average3Year',
        excessCalculation: 'Simple',
      },
      requiresFederalCredit: true,
      requiresForm6765: true,
      notes: ['Claim on CAT return', 'CAT audit may follow'],
    },
  },

  // Idaho
  {
    stateCode: 'ID',
    stateName: 'Idaho',
    years: {
      2020: {
        creditRate: 0.05,
        carryForwardYears: 14,
        carryBackYears: 1,
        refundable: false,
        calculationMethod: 'Standard',
        eligibleEntities: ['C-Corp', 'S-Corp', 'LLC'],
        preFilingRequired: true,
        preFilingForm: 'Idaho Form 67',
        preFilingDeadline: 'Filed with corporate return',
        specialRules: {
          basicResearchBonus: 0.05,
        },
        effectiveDate: '2020-01-01',
        formula: {
          baseCalculation: 'Average3Year',
          excessCalculation: 'Simple',
        },
        requiresFederalCredit: true,
        requiresForm6765: true,
        notes: ['+5% for payments to qualified orgs', 'Keep records, include Form TC-40R'],
      },
    },
    defaultConfig: {
      creditRate: 0.05,
      carryForwardYears: 14,
      carryBackYears: 1,
      refundable: false,
      calculationMethod: 'Standard',
      eligibleEntities: ['C-Corp', 'S-Corp', 'LLC'],
      preFilingRequired: true,
      preFilingForm: 'Idaho Form 67',
      preFilingDeadline: 'Filed with corporate return',
      specialRules: {
        basicResearchBonus: 0.05,
      },
      effectiveDate: '2020-01-01',
      formula: {
        baseCalculation: 'Average3Year',
        excessCalculation: 'Simple',
      },
      requiresFederalCredit: true,
      requiresForm6765: true,
      notes: ['+5% for payments to qualified orgs', 'Keep records, include Form TC-40R'],
    },
  },

  // Illinois
  {
    stateCode: 'IL',
    stateName: 'Illinois',
    years: {
      2020: {
        creditRate: 0.065,
        carryForwardYears: 5,
        refundable: false,
        calculationMethod: 'Standard',
        eligibleEntities: ['C-Corp', 'Trust', 'ExemptOrg'],
        preFilingRequired: true,
        preFilingForm: 'Schedule 1299-D',
        preFilingDeadline: 'With IL-1120, IL-1041, or IL-990-T',
        effectiveDate: '2020-01-01',
        formula: {
          baseCalculation: 'Average3Year',
          excessCalculation: 'Simple',
        },
        notes: ['Available to corporations, trusts, exempt orgs'],
      },
    },
    defaultConfig: {
      creditRate: 0.065,
      carryForwardYears: 5,
      refundable: false,
      calculationMethod: 'Standard',
      eligibleEntities: ['C-Corp', 'Trust', 'ExemptOrg'],
      preFilingRequired: true,
      preFilingForm: 'Schedule 1299-D',
      preFilingDeadline: 'With IL-1120, IL-1041, or IL-990-T',
      effectiveDate: '2020-01-01',
      formula: {
        baseCalculation: 'Average3Year',
        excessCalculation: 'Simple',
      },
      notes: ['Available to corporations, trusts, exempt orgs'],
    },
  },

  // Indiana
  {
    stateCode: 'IN',
    stateName: 'Indiana',
    years: {
      2020: {
        creditRate: 0.15,
        carryForwardYears: 10,
        refundable: false,
        calculationMethod: 'Tiered',
        eligibleEntities: ['C-Corp', 'S-Corp', 'LLC', 'Partnership'],
        preFilingRequired: true,
        preFilingForm: 'Form IT-20 + Schedule IN-RC',
        effectiveDate: '2020-01-01',
        formula: {
          baseCalculation: 'Average3Year',
          excessCalculation: 'Tiered',
          tiers: [
            { threshold: 1000000, rate: 0.15, description: 'First $1M excess' },
            { threshold: Infinity, rate: 0.10, description: 'Excess over $1M' },
          ],
        },
        notes: ['Pass-throughs via substitution'],
      },
    },
    defaultConfig: {
      creditRate: 0.15,
      carryForwardYears: 10,
      refundable: false,
      calculationMethod: 'Tiered',
      eligibleEntities: ['C-Corp', 'S-Corp', 'LLC', 'Partnership'],
      preFilingRequired: true,
      preFilingForm: 'Form IT-20 + Schedule IN-RC',
      effectiveDate: '2020-01-01',
      formula: {
        baseCalculation: 'Average3Year',
        excessCalculation: 'Tiered',
        tiers: [
          { threshold: 1000000, rate: 0.15, description: 'First $1M excess' },
          { threshold: Infinity, rate: 0.10, description: 'Excess over $1M' },
        ],
      },
      notes: ['Pass-throughs via substitution'],
    },
  },

  // Iowa
  {
    stateCode: 'IA',
    stateName: 'Iowa',
    years: {
      2020: {
        creditRate: 0.10,
        carryForwardYears: 0,
        refundable: true,
        calculationMethod: 'Standard',
        eligibleEntities: ['C-Corp', 'S-Corp', 'LLC', 'Partnership'],
        preFilingRequired: true,
        preFilingForm: 'Form IA-128',
        specialRules: {
          industrySpecificRules: ['Excludes agriculture', 'Excludes finance', 'Excludes real estate', 'Excludes retail'],
        },
        effectiveDate: '2020-01-01',
        formula: {
          baseCalculation: 'Average3Year',
          excessCalculation: 'Simple',
        },
        notes: ['Refundable credit', 'Excludes certain industries'],
      },
    },
    defaultConfig: {
      creditRate: 0.10,
      carryForwardYears: 0,
      refundable: true,
      calculationMethod: 'Standard',
      eligibleEntities: ['C-Corp', 'S-Corp', 'LLC', 'Partnership'],
      preFilingRequired: true,
      preFilingForm: 'Form IA-128',
      specialRules: {
        industrySpecificRules: ['Excludes agriculture', 'Excludes finance', 'Excludes real estate', 'Excludes retail'],
      },
      effectiveDate: '2020-01-01',
      formula: {
        baseCalculation: 'Average3Year',
        excessCalculation: 'Simple',
      },
      notes: ['Refundable credit', 'Excludes certain industries'],
    },
  },

  // Kansas
  {
    stateCode: 'KS',
    stateName: 'Kansas',
    years: {
      2020: {
        creditRate: 0.10,
        carryForwardYears: 4,
        refundable: false,
        transferable: true,
        calculationMethod: 'Standard',
        eligibleEntities: ['C-Corp'],
        preFilingRequired: true,
        preFilingForm: 'Schedule K-53',
        effectiveDate: '2020-01-01',
        formula: {
          baseCalculation: 'Average3Year',
          excessCalculation: 'Simple',
        },
        notes: ['Only C-Corps eligible', 'Transferable once'],
      },
    },
    defaultConfig: {
      creditRate: 0.10,
      carryForwardYears: 4,
      refundable: false,
      transferable: true,
      calculationMethod: 'Standard',
      eligibleEntities: ['C-Corp'],
      preFilingRequired: true,
      preFilingForm: 'Schedule K-53',
      effectiveDate: '2020-01-01',
      formula: {
        baseCalculation: 'Average3Year',
        excessCalculation: 'Simple',
      },
      notes: ['Only C-Corps eligible', 'Transferable once'],
    },
  },

  // Louisiana
  {
    stateCode: 'LA',
    stateName: 'Louisiana',
    years: {
      2020: {
        creditRate: 0.05,
        carryForwardYears: 10,
        refundable: false,
        calculationMethod: 'Tiered',
        eligibleEntities: ['C-Corp', 'S-Corp', 'LLC', 'Partnership', 'SoleProprietorship'],
        preFilingRequired: true,
        preFilingForm: 'Form R-620',
        preFilingDeadline: 'Certification required within 1 year',
        certificationRequired: true,
        specialRules: {
          employeeCountLimits: { max: 99 },
          perTaxpayerCap: 300000,
        },
        effectiveDate: '2020-01-01',
        formula: {
          baseCalculation: 'FixedPercentage',
          basePercentage: 0.80,
          excessCalculation: 'Tiered',
          tiers: [
            { threshold: 50, rate: 0.30, description: '<50 employees' },
            { threshold: 99, rate: 0.10, description: '50-99 employees' },
            { threshold: Infinity, rate: 0.05, description: '100+ employees' },
          ],
        },
        notes: ['Excludes pro services w/o IP', 'Base = 80% avg QRE (or 50% if <50 emps)'],
      },
    },
    defaultConfig: {
      creditRate: 0.05,
      carryForwardYears: 10,
      refundable: false,
      calculationMethod: 'Tiered',
      eligibleEntities: ['C-Corp', 'S-Corp', 'LLC', 'Partnership', 'SoleProprietorship'],
      preFilingRequired: true,
      preFilingForm: 'Form R-620',
      preFilingDeadline: 'Certification required within 1 year',
      certificationRequired: true,
      specialRules: {
        employeeCountLimits: { max: 99 },
        perTaxpayerCap: 300000,
      },
      effectiveDate: '2020-01-01',
      formula: {
        baseCalculation: 'FixedPercentage',
        basePercentage: 0.80,
        excessCalculation: 'Tiered',
        tiers: [
          { threshold: 50, rate: 0.30, description: '<50 employees' },
          { threshold: 99, rate: 0.10, description: '50-99 employees' },
          { threshold: Infinity, rate: 0.05, description: '100+ employees' },
        ],
      },
      notes: ['Excludes pro services w/o IP', 'Base = 80% avg QRE (or 50% if <50 emps)'],
    },
  },

  // Maine
  {
    stateCode: 'ME',
    stateName: 'Maine',
    years: {
      2020: {
        creditRate: 0.05,
        carryForwardYears: 15,
        refundable: false,
        calculationMethod: 'Standard',
        eligibleEntities: ['C-Corp', 'S-Corp', 'LLC', 'Partnership'],
        preFilingRequired: true,
        preFilingForm: 'Form 1040RC',
        specialRules: {
          basicResearchBonus: 0.075,
        },
        effectiveDate: '2020-01-01',
        formula: {
          baseCalculation: 'Average3Year',
          excessCalculation: 'Simple',
        },
        notes: ['+7.5% for basic research payments'],
      },
    },
    defaultConfig: {
      creditRate: 0.05,
      carryForwardYears: 15,
      refundable: false,
      calculationMethod: 'Standard',
      eligibleEntities: ['C-Corp', 'S-Corp', 'LLC', 'Partnership'],
      preFilingRequired: true,
      preFilingForm: 'Form 1040RC',
      specialRules: {
        basicResearchBonus: 0.075,
      },
      effectiveDate: '2020-01-01',
      formula: {
        baseCalculation: 'Average3Year',
        excessCalculation: 'Simple',
      },
      notes: ['+7.5% for basic research payments'],
    },
  },

  // New Hampshire
  {
    stateCode: 'NH',
    stateName: 'New Hampshire',
    years: {
      2020: {
        creditRate: 0.10,
        maxCredit: 50000,
        carryForwardYears: 5,
        refundable: false,
        calculationMethod: 'Standard',
        eligibleEntities: ['All'],
        preFilingRequired: true,
        preFilingForm: 'Form DP-165',
        preFilingDeadline: 'Via DRA before June 30',
        specialRules: {
          statewideCap: 7000000,
        },
        effectiveDate: '2020-01-01',
        formula: {
          baseCalculation: 'None',
          excessCalculation: 'Simple',
        },
        notes: ['Cap $50k/company', '$7M statewide cap', 'Based on wages'],
      },
    },
    defaultConfig: {
      creditRate: 0.10,
      maxCredit: 50000,
      carryForwardYears: 5,
      refundable: false,
      calculationMethod: 'Standard',
      eligibleEntities: ['All'],
      preFilingRequired: true,
      preFilingForm: 'Form DP-165',
      preFilingDeadline: 'Via DRA before June 30',
      specialRules: {
        statewideCap: 7000000,
      },
      effectiveDate: '2020-01-01',
      formula: {
        baseCalculation: 'None',
        excessCalculation: 'Simple',
      },
      notes: ['Cap $50k/company', '$7M statewide cap', 'Based on wages'],
    },
  },

  // North Dakota
  {
    stateCode: 'ND',
    stateName: 'North Dakota',
    years: {
      2020: {
        creditRate: 0.25,
        carryForwardYears: 15,
        carryBackYears: 3,
        refundable: false,
        calculationMethod: 'Tiered',
        eligibleEntities: ['All'],
        preFilingRequired: true,
        preFilingForm: 'Form 40',
        specialRules: {
          grossReceiptsLimits: { max: 750000 },
          perTaxpayerCap: 100000,
        },
        effectiveDate: '2020-01-01',
        formula: {
          baseCalculation: 'Average3Year',
          excessCalculation: 'Tiered',
          tiers: [
            { threshold: 100000, rate: 0.25, description: 'First $100k excess' },
            { threshold: Infinity, rate: 0.08, description: 'Thereafter' },
          ],
        },
        notes: ['Refundable for < $750k gross receipts', 'Choose method annually'],
      },
    },
    defaultConfig: {
      creditRate: 0.25,
      carryForwardYears: 15,
      carryBackYears: 3,
      refundable: false,
      calculationMethod: 'Tiered',
      eligibleEntities: ['All'],
      preFilingRequired: true,
      preFilingForm: 'Form 40',
      specialRules: {
        grossReceiptsLimits: { max: 750000 },
        perTaxpayerCap: 100000,
      },
      effectiveDate: '2020-01-01',
      formula: {
        baseCalculation: 'Average3Year',
        excessCalculation: 'Tiered',
        tiers: [
          { threshold: 100000, rate: 0.25, description: 'First $100k excess' },
          { threshold: Infinity, rate: 0.08, description: 'Thereafter' },
        ],
      },
      notes: ['Refundable for < $750k gross receipts', 'Choose method annually'],
    },
  },

  // Pennsylvania
  {
    stateCode: 'PA',
    stateName: 'Pennsylvania',
    years: {
      2020: {
        creditRate: 0.10,
        carryForwardYears: 15,
        refundable: false,
        transferable: true,
        calculationMethod: 'Standard',
        eligibleEntities: ['C-Corp', 'SoleProprietorship'],
        preFilingRequired: true,
        preFilingForm: 'PA Schedule RC',
        preFilingDeadline: 'Application due Sept 15',
        specialRules: {
          grossReceiptsLimits: { max: 5000000 },
          smallBusinessRules: true,
        },
        effectiveDate: '2020-01-01',
        formula: {
          baseCalculation: 'Average3Year',
          excessCalculation: 'Simple',
        },
        notes: ['20% for small ≤$5M gross receipts', 'Transferable credit'],
      },
    },
    defaultConfig: {
      creditRate: 0.10,
      carryForwardYears: 15,
      refundable: false,
      transferable: true,
      calculationMethod: 'Standard',
      eligibleEntities: ['C-Corp', 'SoleProprietorship'],
      preFilingRequired: true,
      preFilingForm: 'PA Schedule RC',
      preFilingDeadline: 'Application due Sept 15',
      specialRules: {
        grossReceiptsLimits: { max: 5000000 },
        smallBusinessRules: true,
      },
      effectiveDate: '2020-01-01',
      formula: {
        baseCalculation: 'Average3Year',
        excessCalculation: 'Simple',
      },
      notes: ['20% for small ≤$5M gross receipts', 'Transferable credit'],
    },
  },

  // Rhode Island
  {
    stateCode: 'RI',
    stateName: 'Rhode Island',
    years: {
      2020: {
        creditRate: 0.225,
        carryForwardYears: 7,
        refundable: false,
        calculationMethod: 'Tiered',
        eligibleEntities: ['C-Corp', 'S-Corp', 'LLC', 'Partnership'],
        preFilingRequired: true,
        preFilingForm: 'Form RI-7690',
        specialRules: {
          perTaxpayerCap: 111111,
        },
        effectiveDate: '2020-01-01',
        formula: {
          baseCalculation: 'None',
          excessCalculation: 'Tiered',
          tiers: [
            { threshold: 111111, rate: 0.225, description: 'First $111,111' },
            { threshold: Infinity, rate: 0.169, description: 'Thereafter' },
          ],
        },
        notes: ['Cannot reduce below minimum tax'],
      },
    },
    defaultConfig: {
      creditRate: 0.225,
      carryForwardYears: 7,
      refundable: false,
      calculationMethod: 'Tiered',
      eligibleEntities: ['C-Corp', 'S-Corp', 'LLC', 'Partnership'],
      preFilingRequired: true,
      preFilingForm: 'Form RI-7690',
      specialRules: {
        perTaxpayerCap: 111111,
      },
      effectiveDate: '2020-01-01',
      formula: {
        baseCalculation: 'None',
        excessCalculation: 'Tiered',
        tiers: [
          { threshold: 111111, rate: 0.225, description: 'First $111,111' },
          { threshold: Infinity, rate: 0.169, description: 'Thereafter' },
        ],
      },
      notes: ['Cannot reduce below minimum tax'],
    },
  },

  // South Carolina
  {
    stateCode: 'SC',
    stateName: 'South Carolina',
    years: {
      2020: {
        creditRate: 0.05,
        maxCredit: 0.50, // 50% of liability
        carryForwardYears: 10,
        refundable: false,
        calculationMethod: 'Standard',
        eligibleEntities: ['All'],
        preFilingRequired: true,
        preFilingForm: 'Form TC-18',
        specialRules: {
          perTaxpayerCap: 0.50, // 50% of liability
        },
        effectiveDate: '2020-01-01',
        formula: {
          baseCalculation: 'None',
          excessCalculation: 'Simple',
        },
        requiresFederalCredit: true,
        notes: ['Max 50% of liability'],
      },
    },
    defaultConfig: {
      creditRate: 0.05,
      maxCredit: 0.50,
      carryForwardYears: 10,
      refundable: false,
      calculationMethod: 'Standard',
      eligibleEntities: ['All'],
      preFilingRequired: true,
      preFilingForm: 'Form TC-18',
      specialRules: {
        perTaxpayerCap: 0.50,
      },
      effectiveDate: '2020-01-01',
      formula: {
        baseCalculation: 'None',
        excessCalculation: 'Simple',
      },
      requiresFederalCredit: true,
      notes: ['Max 50% of liability'],
    },
  },

  // Texas
  {
    stateCode: 'TX',
    stateName: 'Texas',
    years: {
      2020: {
        creditRate: 0.05,
        carryForwardYears: 20,
        refundable: false,
        calculationMethod: 'Standard',
        eligibleEntities: ['C-Corp', 'S-Corp', 'LLC', 'Partnership'],
        preFilingRequired: true,
        preFilingForm: 'Form 05-178 for franchise credit',
        specialRules: {
          universityCollaborationBonus: 0.0625,
        },
        effectiveDate: '2020-01-01',
        formula: {
          baseCalculation: 'Average3Year',
          excessCalculation: 'Simple',
        },
        notes: ['6.25% when partnered with Texas college'],
      },
    },
    defaultConfig: {
      creditRate: 0.05,
      carryForwardYears: 20,
      refundable: false,
      calculationMethod: 'Standard',
      eligibleEntities: ['C-Corp', 'S-Corp', 'LLC', 'Partnership'],
      preFilingRequired: true,
      preFilingForm: 'Form 05-178 for franchise credit',
      specialRules: {
        universityCollaborationBonus: 0.0625,
      },
      effectiveDate: '2020-01-01',
      formula: {
        baseCalculation: 'Average3Year',
        excessCalculation: 'Simple',
      },
      notes: ['6.25% when partnered with Texas college'],
    },
  },

  // Utah
  {
    stateCode: 'UT',
    stateName: 'Utah',
    years: {
      2020: {
        creditRate: 0.06,
        maxCredit: 0.25, // 25% refundable
        carryForwardYears: 15,
        refundable: true,
        calculationMethod: 'Standard',
        eligibleEntities: ['C-Corp', 'S-Corp', 'LLC', 'Partnership'],
        preFilingRequired: true,
        preFilingForm: 'Form TC-18',
        specialRules: {
          universityCollaborationBonus: 0.115,
          perTaxpayerCap: 0.25, // 25% refundable
        },
        effectiveDate: '2020-01-01',
        formula: {
          baseCalculation: 'Average3Year',
          excessCalculation: 'Simple',
        },
        requiresFederalCredit: true,
        notes: ['Credit begins in 2020', '25% refundable', 'University collaboration bonus available']
      },
    },
    defaultConfig: {
      creditRate: 0.06,
      maxCredit: 0.25,
      carryForwardYears: 15,
      refundable: true,
      calculationMethod: 'Standard',
      eligibleEntities: ['C-Corp', 'S-Corp', 'LLC', 'Partnership'],
      preFilingRequired: true,
      preFilingForm: 'Form TC-18',
      specialRules: {
        universityCollaborationBonus: 0.115,
        perTaxpayerCap: 0.25,
      },
      effectiveDate: '2020-01-01',
      formula: {
        baseCalculation: 'Average3Year',
        excessCalculation: 'Simple',
      },
      requiresFederalCredit: true,
      notes: ['Credit begins in 2020', '25% refundable', 'University collaboration bonus available']
    },
  },

  // Vermont
  {
    stateCode: 'VT',
    stateName: 'Vermont',
    years: {
      2020: {
        creditRate: 0.27,
        carryForwardYears: 10,
        refundable: false,
        calculationMethod: 'FederalBased',
        eligibleEntities: ['All'],
        preFilingRequired: true,
        preFilingForm: 'Form BA-404',
        effectiveDate: '2020-01-01',
        formula: {
          excessCalculation: 'FederalBased',
          federalCreditPercentage: 1.0,
        },
        requiresFederalCredit: true,
        notes: ['27% of Federal Credit'],
      },
    },
    defaultConfig: {
      creditRate: 0.27,
      carryForwardYears: 10,
      refundable: false,
      calculationMethod: 'FederalBased',
      eligibleEntities: ['All'],
      preFilingRequired: true,
      preFilingForm: 'Form BA-404',
      effectiveDate: '2020-01-01',
      formula: {
        excessCalculation: 'FederalBased',
        federalCreditPercentage: 1.0,
      },
      requiresFederalCredit: true,
      notes: ['27% of Federal Credit'],
    },
  },

  // Virginia
  {
    stateCode: 'VA',
    stateName: 'Virginia',
    years: {
      2020: {
        creditRate: 0.15,
        carryForwardYears: 10,
        refundable: false,
        calculationMethod: 'Tiered',
        eligibleEntities: ['All'],
        preFilingRequired: true,
        preFilingForm: 'April 1 application via Dept of Taxation',
        preFilingDeadline: 'April 1',
        specialRules: {
          grossReceiptsLimits: { max: 300000 },
          universityCollaborationBonus: 0.20,
          perTaxpayerCap: 300000,
        },
        effectiveDate: '2020-01-01',
        formula: {
          baseCalculation: 'FixedPercentage',
          basePercentage: 0.50,
          excessCalculation: 'Tiered',
          tiers: [
            { threshold: 300000, rate: 0.15, description: 'Minor: ≤$300k QRE' },
            { threshold: Infinity, rate: 0.10, description: 'Major: >$300k QRE' },
          ],
        },
        notes: ['Minor: Refundable; Major: Non-refundable', '+20% if with university'],
      },
    },
    defaultConfig: {
      creditRate: 0.15,
      carryForwardYears: 10,
      refundable: false,
      calculationMethod: 'Tiered',
      eligibleEntities: ['All'],
      preFilingRequired: true,
      preFilingForm: 'April 1 application via Dept of Taxation',
      preFilingDeadline: 'April 1',
      specialRules: {
        grossReceiptsLimits: { max: 300000 },
        universityCollaborationBonus: 0.20,
        perTaxpayerCap: 300000,
      },
      effectiveDate: '2020-01-01',
      formula: {
        baseCalculation: 'FixedPercentage',
        basePercentage: 0.50,
        excessCalculation: 'Tiered',
        tiers: [
          { threshold: 300000, rate: 0.15, description: 'Minor: ≤$300k QRE' },
          { threshold: Infinity, rate: 0.10, description: 'Major: >$300k QRE' },
        ],
      },
      notes: ['Minor: Refundable; Major: Non-refundable', '+20% if with university'],
    },
  },

  // Wisconsin
  {
    stateCode: 'WI',
    stateName: 'Wisconsin',
    years: {
      2020: {
        creditRate: 0.0575,
        maxCredit: 0.25, // 25% refundable
        carryForwardYears: 0,
        refundable: true,
        calculationMethod: 'Standard',
        eligibleEntities: ['All'],
        preFilingRequired: true,
        preFilingForm: 'Schedule R',
        specialRules: {
          universityCollaborationBonus: 0.115,
        },
        effectiveDate: '2020-01-01',
        formula: {
          baseCalculation: 'Average3Year',
          excessCalculation: 'Simple',
        },
        notes: ['Partially refundable (up to 25%)', '11.5% for energy/engine research', 'Rest indefinite carryforward'],
      },
    },
    defaultConfig: {
      creditRate: 0.0575,
      maxCredit: 0.25,
      carryForwardYears: 0,
      refundable: true,
      calculationMethod: 'Standard',
      eligibleEntities: ['All'],
      preFilingRequired: true,
      preFilingForm: 'Schedule R',
      specialRules: {
        universityCollaborationBonus: 0.115,
      },
      effectiveDate: '2020-01-01',
      formula: {
        baseCalculation: 'Average3Year',
        excessCalculation: 'Simple',
      },
      notes: ['Partially refundable (up to 25%)', '11.5% for energy/engine research', 'Rest indefinite carryforward'],
    },
  },
];

// Helper function to get state config
export const getStateConfig = (stateCode: string, year: number): StateCreditConfig | null => {
  const state = STATE_CREDIT_CONFIGS.find(s => s.stateCode === stateCode);
  if (!state) return null;
  
  // Check if specific year config exists, otherwise use default
  if (state.years[year]) {
    return {
      ...state,
      defaultConfig: state.years[year],
    };
  }
  
  return state;
};

// Helper function to get all available states
export const getAvailableStates = (): string[] => {
  return STATE_CREDIT_CONFIGS.map(s => s.stateCode).sort();
}; 