import { SubcomponentSelection, SubcomponentMetrics } from '../types';

export function validateSelections(
  selections: Record<string, SubcomponentSelection>,
  metrics: Record<string, SubcomponentMetrics>
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check if there are any selections
  if (Object.keys(selections).length === 0) {
    errors.push('No subcomponents selected');
    return { isValid: false, errors };
  }

  // Check if all selected subcomponents have metrics
  const missingMetrics = Object.keys(selections).filter(key => !metrics[key]);
  if (missingMetrics.length > 0) {
    errors.push(`Missing metrics for ${missingMetrics.length} subcomponents`);
  }

  // Check for duplicate selections
  const seen = new Set<string>();
  const duplicates = Object.entries(selections).filter(([key, selection]) => {
    const id = selection.sub.id;
    if (seen.has(id)) {
      return true;
    }
    seen.add(id);
    return false;
  });

  if (duplicates.length > 0) {
    errors.push(`Duplicate selections found: ${duplicates.length}`);
  }

  // Check if all metrics are valid
  const invalidMetrics = Object.entries(metrics).filter(([key, metric]) => {
    return (
      metric.timePercent < 0 ||
      metric.timePercent > 100 ||
      metric.frequencyPercent < 0 ||
      metric.frequencyPercent > 100 ||
      metric.yearPercent < 0 ||
      metric.yearPercent > 100 ||
      (metric.startMonth !== undefined && (metric.startMonth < 0 || metric.startMonth >= 12))
    );
  });

  if (invalidMetrics.length > 0) {
    errors.push(`Invalid metrics found for ${invalidMetrics.length} subcomponents`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateStepTimes(
  stepTimes: Record<string, number>,
  selections: Record<string, SubcomponentSelection>
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check if all steps with selections have time allocations
  const stepsWithSelections = new Set(
    Object.values(selections).map(selection => `${selection.phase}__${selection.step}`)
  );

  const missingTimes = Array.from(stepsWithSelections).filter(step => !(step in stepTimes));
  if (missingTimes.length > 0) {
    errors.push(`Missing time allocation for ${missingTimes.length} steps`);
  }

  // Check if all time allocations are valid
  const invalidTimes = Object.entries(stepTimes).filter(([_, time]) => time < 0 || time > 100);
  if (invalidTimes.length > 0) {
    errors.push(`Invalid time allocations found: ${invalidTimes.length}`);
  }

  // Check if total time allocation is 100%
  const totalTime = Object.values(stepTimes).reduce((sum, time) => sum + time, 0);
  if (Math.abs(totalTime - 100) > 0.01) {
    errors.push(`Total time allocation must be 100% (current: ${totalTime.toFixed(1)}%)`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateNonRDTime(nonRDTime: number): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (nonRDTime < 0 || nonRDTime > 100) {
    errors.push('Non-R&D time must be between 0% and 100%');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
} 