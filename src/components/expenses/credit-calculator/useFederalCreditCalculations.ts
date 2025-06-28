import { useState, useMemo } from 'react';

export interface CreditCalculatorInput {
  currentYearQREs: number;
  priorYearQREs: number[]; // [y-1, y-2, y-3, y-4]
  priorYearGrossReceipts: number[]; // [y-1, y-2, y-3, y-4]
  businessType: 'C-Corp' | 'Pass-Through';
  overrideTaxRate?: number;
}

const ASC_RATE = 0.14;
const ASC_RATE_NO_BASE = 0.06;
const STANDARD_CREDIT_RATE = 0.20;
const DEFAULT_FIXED_BASE = 0.03;
const C_CORP_TAX_RATE = 0.21;
const PASS_THROUGH_TAX_RATE = 0.37;
const SECTION_280C_RATE = 0.79; // 1 - 0.21 = 0.79

export const useFederalCreditCalculations = (input: CreditCalculatorInput) => {
  const {
    currentYearQREs,
    priorYearQREs,
    priorYearGrossReceipts,
    businessType,
    overrideTaxRate,
  } = input;

  const [method, setMethod] = useState<'asc' | 'standard'>('asc');
  const [apply280c, setApply280c] = useState(true);

  const isStandardMethodAvailable = useMemo(() => {
    // Standard method requires at least 4 years of data and all gross receipts > 0
    return priorYearQREs.length >= 4 && priorYearGrossReceipts.length >= 4 && priorYearGrossReceipts.every(r => r > 0);
  }, [priorYearQREs, priorYearGrossReceipts]);

  const federalTaxRate = useMemo(() => {
    if (overrideTaxRate) return overrideTaxRate;
    return businessType === 'C-Corp' ? C_CORP_TAX_RATE : PASS_THROUGH_TAX_RATE;
  }, [businessType, overrideTaxRate]);
  
  const grossCredit = useMemo(() => {
    // ASC Method
    if (method === 'asc') {
      const validPriorYearQREs = priorYearQREs.slice(0, 3).filter(qre => qre > 0);
      if (validPriorYearQREs.length === 3) {
        const ascBase = validPriorYearQREs.reduce((sum, qre) => sum + qre, 0) / 3;
        return Math.round(ASC_RATE * (currentYearQREs - 0.5 * ascBase));
      } else {
        return Math.round(ASC_RATE_NO_BASE * currentYearQREs);
      }
    }

    // Standard Method
    if (method === 'standard' && isStandardMethodAvailable) {
        const avgGrossReceipts = priorYearGrossReceipts.reduce((sum, r) => sum + r, 0) / 4;
        let baseAmount = DEFAULT_FIXED_BASE * avgGrossReceipts;
        
        if (baseAmount < 0.5 * currentYearQREs) {
            baseAmount = 0.5 * currentYearQREs;
        }

        const credit = STANDARD_CREDIT_RATE * (currentYearQREs - baseAmount);
        return Math.round(credit); // Can be negative for display purposes
    }

    return 0;
  }, [method, currentYearQREs, priorYearQREs, priorYearGrossReceipts, isStandardMethodAvailable]);

  const finalCredit = useMemo(() => {
    let calculatedCredit = grossCredit;
    
    if (apply280c) {
      calculatedCredit = Math.round(grossCredit * SECTION_280C_RATE);
    }
    
    // Ensure final credit is never less than 0
    return Math.max(0, calculatedCredit);
  }, [grossCredit, apply280c]);

  return {
    method,
    setMethod,
    apply280c,
    setApply280c,
    isStandardMethodAvailable,
    grossCredit,
    finalCredit,
    federalTaxRate,
  };
}; 