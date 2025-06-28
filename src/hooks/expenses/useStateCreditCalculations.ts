import { useMemo, useState } from 'react';
import { StateCreditInput, StateCreditResult, StateCreditEligibility, StateCreditConfig, StateCreditYearConfig, EntityType } from '../../types/StateCredit';
import { STATE_CREDIT_CONFIGS } from '../../data/stateCreditConfigs';

function getApplicableConfig(stateCode: string, year: number): StateCreditYearConfig | null {
  const config = STATE_CREDIT_CONFIGS.find(c => c.stateCode === stateCode);
  if (!config) return null;

  // Check if there's a specific year config
  if (config.years[year]) {
    return config.years[year];
  }

  // Check effective dates for default config
  const defaultConfig = config.defaultConfig;
  if (!defaultConfig.effectiveDate) return defaultConfig;

  const effectiveDate = new Date(defaultConfig.effectiveDate);
  const targetDate = new Date(year, 0, 1); // January 1st of the target year

  if (targetDate >= effectiveDate) {
    return defaultConfig;
  }

  return null;
}

function calculateStateCredit(
  config: StateCreditYearConfig,
  input: StateCreditInput
): StateCreditResult {
  const { stateQREs, priorYearQREs, federalCredit } = input;
  
  // Calculate base amount based on formula
  let baseAmount = 0;
  let excessQREs = 0;
  
  if (config.formula.baseCalculation === 'Average3Year' && priorYearQREs.length >= 3) {
    const avg3Year = (priorYearQREs[0] + priorYearQREs[1] + priorYearQREs[2]) / 3;
    baseAmount = Math.round(avg3Year);
    excessQREs = Math.max(0, stateQREs - baseAmount);
  } else if (config.formula.baseCalculation === 'FixedPercentage' && config.formula.basePercentage) {
    baseAmount = Math.round(stateQREs * (config.formula.basePercentage / 100));
    excessQREs = stateQREs - baseAmount;
  } else {
    // Default to no base calculation
    excessQREs = stateQREs;
  }

  // Calculate credit based on method
  let credit = 0;
  let effectiveRate = config.creditRate;

  if (config.calculationMethod === 'Standard') {
    credit = Math.round(excessQREs * config.creditRate);
  } else if (config.calculationMethod === 'FederalBased' && config.formula.federalCreditPercentage) {
    credit = Math.round(federalCredit * (config.formula.federalCreditPercentage / 100));
  } else if (config.calculationMethod === 'Tiered' && config.formula.tiers) {
    credit = Math.round(config.formula.tiers.reduce((total, tier) => {
      const tierAmount = Math.min(excessQREs, tier.threshold);
      return total + (tierAmount * tier.rate);
    }, 0));
  }

  // Apply max credit limit if specified
  if (config.maxCredit !== null && config.maxCredit !== undefined) {
    credit = Math.min(credit, config.maxCredit);
  }

  // Apply special rules
  if (config.specialRules?.perTaxpayerCap) {
    credit = Math.min(credit, config.specialRules.perTaxpayerCap);
  }

  return {
    credit,
    creditAmount: credit, // For UI compatibility
    baseAmount,
    excessQREs,
    effectiveRate,
    calculationMethod: config.calculationMethod,
    carryForwardYears: config.carryForwardYears,
    refundable: config.refundable,
    transferable: config.transferable,
    maxCredit: config.maxCredit,
    notes: config.notes || [],
    breakdown: {
      step1: `Base QREs: ${baseAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`,
      step2: `Excess QREs: ${excessQREs.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`,
      step3: `Credit Rate: ${(config.creditRate * 100).toFixed(1)}%`,
      step4: `Credit Amount: ${credit.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`,
    },
  };
}

function checkEligibility(
  config: StateCreditYearConfig,
  input: StateCreditInput
): StateCreditEligibility {
  const reasons: string[] = [];
  const requirements: string[] = [];

  // Check entity type eligibility
  if (!config.eligibleEntities.includes('All') && !config.eligibleEntities.includes(input.businessType)) {
    reasons.push(`Entity type ${input.businessType} not eligible for ${config.calculationMethod} method`);
  }

  // Check employee count limits
  if (config.specialRules?.employeeCountLimits) {
    const { min, max } = config.specialRules.employeeCountLimits;
    if (input.employeeCount !== undefined) {
      if (min !== undefined && input.employeeCount < min) {
        reasons.push(`Minimum employee count not met: ${min} required, ${input.employeeCount} provided`);
      }
      if (max !== undefined && input.employeeCount > max) {
        reasons.push(`Maximum employee count exceeded: ${max} allowed, ${input.employeeCount} provided`);
      }
    }
  }

  // Check gross receipts limits
  if (config.specialRules?.grossReceiptsLimits) {
    const { min, max } = config.specialRules.grossReceiptsLimits;
    if (input.grossReceipts !== undefined) {
      if (min !== undefined && input.grossReceipts < min) {
        reasons.push(`Minimum gross receipts not met: ${min.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} required`);
      }
      if (max !== undefined && input.grossReceipts > max) {
        reasons.push(`Maximum gross receipts exceeded: ${max.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} allowed`);
      }
    }
  }

  // Add requirements
  if (config.preFilingRequired) {
    requirements.push(`Pre-filing required: ${config.preFilingForm || 'Form required'}`);
    if (config.preFilingDeadline) {
      requirements.push(`Deadline: ${config.preFilingDeadline}`);
    }
  }

  if (config.certificationRequired) {
    requirements.push('Certification required');
  }

  if (config.requiresFederalCredit) {
    requirements.push('Federal R&D credit required');
  }

  if (config.requiresForm6765) {
    requirements.push('Form 6765 required');
  }

  return {
    isEligible: reasons.length === 0,
    reasons,
    requirements,
    preFilingRequired: config.preFilingRequired,
    preFilingForm: config.preFilingForm,
    preFilingDeadline: config.preFilingDeadline,
  };
}

export function useStateCreditCalculations(input: StateCreditInput) {
  const [selectedConfigKey, setSelectedConfigKey] = useState<string | null>(null);

  return useMemo(() => {
    const config = getApplicableConfig(input.stateCode, input.year);
    
    if (!config) {
      return {
        result: null,
        eligibility: {
          isEligible: false,
          reasons: ['No credit available for this state and year'],
          requirements: [],
          preFilingRequired: false,
        },
        config: null,
        breakdown: {},
        configs: [],
        selectedConfig: null,
        setSelectedConfigKey,
      };
    }

    const eligibility = checkEligibility(config, input);
    const result = eligibility.isEligible ? calculateStateCredit(config, input) : null;

    return {
      result,
      eligibility,
      config,
      breakdown: result?.breakdown || {},
      configs: [{
        key: `${config.calculationMethod}-${input.year}`,
        label: `${config.calculationMethod} Method`,
        config,
      }],
      selectedConfig: config,
      setSelectedConfigKey,
    };
  }, [input.stateCode, input.year, input.stateQREs, input.priorYearQREs, input.federalCredit, input.businessType, selectedConfigKey]);
} 