/**
 * Currency formatting utilities for expense inputs
 * These functions handle currency input formatting and parsing
 */

export const formatCurrencyInput = (value: string): string => {
  // Remove all non-numeric characters except decimal point
  const numericValue = value.replace(/[^\d.]/g, '');
  
  // Handle decimal places (max 2)
  const parts = numericValue.split('.');
  if (parts.length > 2) {
    parts.length = 2;
  }
  if (parts[1] && parts[1].length > 2) {
    parts[1] = parts[1].substring(0, 2);
  }
  
  const cleanValue = parts.join('.');
  
  // Format with commas
  if (cleanValue) {
    const num = parseFloat(cleanValue);
    if (!isNaN(num)) {
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(num);
    }
  }
  
  return cleanValue;
};

export const parseCurrencyInput = (formattedValue: string): string => {
  // Remove all non-numeric characters except decimal point
  return formattedValue.replace(/[^\d.]/g, '');
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}; 