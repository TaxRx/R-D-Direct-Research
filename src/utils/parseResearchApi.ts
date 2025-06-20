import Papa from 'papaparse';
import { normalizeResearchActivityRow, ResearchActivityRow as NormalizedResearchActivityRow } from './normalizeResearchActivityRow';

export interface ResearchActivityRow {
  Category: string;
  Area: string;
  Focus: string;
  'Research Activity': string;
  [key: string]: any;
}

export function parseResearchApiCsv(csvText: string): NormalizedResearchActivityRow[] {
  const parsed = Papa.parse<ResearchActivityRow>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });
  if (parsed.data && parsed.data.length > 0) {
    // Debug: log the first row to check keys
    // eslint-disable-next-line no-console
    console.log('First parsed row:', parsed.data[0]);
  }
  // Normalize all rows before returning
  return parsed.data.map(normalizeResearchActivityRow);
} 