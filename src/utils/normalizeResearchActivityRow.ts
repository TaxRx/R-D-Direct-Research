export interface ResearchActivityRow {
  id: string;
  name: string;
  category: string;
  area: string;
  focus: string;
  step?: string;
  subcomponent?: string;
  researchActivity?: string;
  hint?: string;
  frequencyPercent?: number;
  timePercent?: number;
  practicePercent?: number;
}

export function normalizeResearchActivityRow(raw: any): ResearchActivityRow {
  return {
    id: raw['id'] || raw['Subcomponent ID'] || '',
    name: raw['name'] || raw['Subcomponent'] || raw['Research Activity'] || '',
    category: raw['category'] || raw['Category'] || '',
    area: raw['area'] || raw['Area'] || '',
    focus: raw['focus'] || raw['Focus'] || '',
    step: raw['Step'] || '',
    subcomponent: raw['Subcomponent'] || '',
    researchActivity: raw['Research Activity'] || '',
    hint: raw['Hint'] || '',
    frequencyPercent: raw['Frequency %'] ? Number(raw['Frequency %']) : 0,
    timePercent: raw['Time %'] ? Number(raw['Time %']) : 0,
    practicePercent: raw['Practice %'] ? Number(raw['Practice %']) : 0,
  };
} 