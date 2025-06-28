import { ResearchStep } from '../types/ReportQRA';
import { 
  ResearchApiData, 
  findResearchDataForSubcomponent,
  loadSubcomponentResearchData 
} from './researchApiService';

export interface ResearchDesignExportData {
  activityId: string;
  activityName: string;
  businessId: string;
  year: number;
  steps: ResearchStepExportData[];
  exportDate: string;
  totalSubcomponents: number;
}

export interface ResearchStepExportData {
  stepId: string;
  stepName: string;
  subcomponents: SubcomponentExportData[];
}

export interface SubcomponentExportData {
  subcomponentId: string;
  subcomponentName: string;
  researchApiData: ResearchApiData | null;
  userNotes: string;
  userModifications: Partial<ResearchApiData>;
  finalData: ResearchApiData | null; // Combined API data + user modifications
}

export const exportResearchDesignData = async (
  activityId: string,
  activityName: string,
  steps: ResearchStep[],
  businessId: string,
  year: number,
  researchApiData: any[]
): Promise<ResearchDesignExportData> => {
  const exportSteps: ResearchStepExportData[] = [];

  for (const step of steps) {
    const stepExport: ResearchStepExportData = {
      stepId: step.id,
      stepName: step.name,
      subcomponents: []
    };

    for (const subcomponent of step.subcomponents) {
      // Get Research API data
      const apiData = findResearchDataForSubcomponent(
        subcomponent.name,
        activityName,
        researchApiData
      );

      // Get user modifications
      const savedData = loadSubcomponentResearchData(businessId, year, activityId, subcomponent.id);
      const userNotes = savedData?.userNotes || '';
      const userModifications = savedData?.userModifications || {};

      // Combine API data with user modifications
      let finalData: ResearchApiData | null = null;
      if (apiData) {
        finalData = {
          ...apiData,
          ...userModifications
        };
      }

      const subcomponentExport: SubcomponentExportData = {
        subcomponentId: subcomponent.id,
        subcomponentName: subcomponent.name,
        researchApiData: apiData,
        userNotes,
        userModifications,
        finalData
      };

      stepExport.subcomponents.push(subcomponentExport);
    }

    exportSteps.push(stepExport);
  }

  const totalSubcomponents = steps.reduce((sum, step) => sum + step.subcomponents.length, 0);

  return {
    activityId,
    activityName,
    businessId,
    year,
    steps: exportSteps,
    exportDate: new Date().toISOString(),
    totalSubcomponents
  };
};

export const generateResearchDesignReport = (
  exportData: ResearchDesignExportData
): string => {
  let report = `# Research Design Report\n\n`;
  report += `**Activity:** ${exportData.activityName}\n`;
  report += `**Business ID:** ${exportData.businessId}\n`;
  report += `**Year:** ${exportData.year}\n`;
  report += `**Export Date:** ${new Date(exportData.exportDate).toLocaleDateString()}\n`;
  report += `**Total Subcomponents:** ${exportData.totalSubcomponents}\n\n`;

  for (const step of exportData.steps) {
    report += `## Step: ${step.stepName}\n\n`;

    for (const subcomponent of step.subcomponents) {
      report += `### Subcomponent: ${subcomponent.subcomponentName}\n\n`;

      if (subcomponent.userNotes) {
        report += `**Notes:**\n${subcomponent.userNotes}\n\n`;
      }

      if (subcomponent.finalData) {
        const data = subcomponent.finalData;
        report += `**General Description:**\n${data.generalDescription || 'No data available'}\n\n`;
        report += `**Goal:**\n${data.goal || 'No data available'}\n\n`;
        report += `**Hypothesis:**\n${data.hypothesis || 'No data available'}\n\n`;
        report += `**Uncertainties:**\n${data.uncertainties || 'No data available'}\n\n`;
        report += `**Alternatives:**\n${data.alternatives || 'No data available'}\n\n`;
        report += `**Developmental Process:**\n${data.developmentalProcess || 'No data available'}\n\n`;

        // Additional metadata
        if (data.hint || data.phase || data.step || data.roles) {
          report += `**Additional Information:**\n`;
          if (data.hint) report += `- Hint: ${data.hint}\n`;
          if (data.phase) report += `- Phase: ${data.phase}\n`;
          if (data.step) report += `- Step: ${data.step}\n`;
          if (data.roles) report += `- Roles: ${data.roles}\n`;
          if (data.decisionCategory) report += `- Decision Category: ${data.decisionCategory}\n`;
          if (data.expectedOutcomeType) report += `- Expected Outcome Type: ${data.expectedOutcomeType}\n`;
          if (data.cptCodes) report += `- CPT Codes: ${data.cptCodes}\n`;
          if (data.cdtCodes) report += `- CDT Codes: ${data.cdtCodes}\n`;
          if (data.productTechnologyOptions) report += `- Product/Technology Options: ${data.productTechnologyOptions}\n`;
          report += `\n`;
        }
      } else {
        report += `*No Research API data available for this subcomponent*\n\n`;
      }

      report += `---\n\n`;
    }
  }

  return report;
};

export const exportResearchDesignToCSV = (
  exportData: ResearchDesignExportData
): string => {
  const headers = [
    'Activity Name',
    'Step Name',
    'Subcomponent Name',
    'Notes',
    'General Description',
    'Goal',
    'Hypothesis',
    'Uncertainties',
    'Alternatives',
    'Developmental Process',
    'Hint',
    'Phase',
    'Step',
    'Roles',
    'Decision Category',
    'Expected Outcome Type',
    'CPT Codes',
    'CDT Codes',
    'Product/Technology Options'
  ];

  let csv = headers.join(',') + '\n';

  for (const step of exportData.steps) {
    for (const subcomponent of step.subcomponents) {
      const data = subcomponent.finalData;
      const row = [
        exportData.activityName,
        step.stepName,
        subcomponent.subcomponentName,
        subcomponent.userNotes || '',
        data?.generalDescription || '',
        data?.goal || '',
        data?.hypothesis || '',
        data?.uncertainties || '',
        data?.alternatives || '',
        data?.developmentalProcess || '',
        data?.hint || '',
        data?.phase || '',
        data?.step || '',
        data?.roles || '',
        data?.decisionCategory || '',
        data?.expectedOutcomeType || '',
        data?.cptCodes || '',
        data?.cdtCodes || '',
        data?.productTechnologyOptions || ''
      ];

      // Escape commas and quotes in CSV
      const escapedRow = row.map(field => {
        const escaped = field.replace(/"/g, '""');
        return `"${escaped}"`;
      });

      csv += escapedRow.join(',') + '\n';
    }
  }

  return csv;
}; 