import { QRAActivityData, ResearchStep, ResearchSubcomponent } from '../types/ReportQRA';

// Local storage keys
const getResearchDesignKey = (activityId: string, year: number) => `research-design-${activityId}-${year}`;

// Color palettes
const STEP_COLORS = [
  '#1976d2', '#43a047', '#fbc02d', '#e64a19', '#8e24aa',
  '#00838f', '#c62828', '#6d4c41', '#3949ab', '#00acc1'
];

const SUBCOMPONENT_COLORS = [
  '#2196f3', '#4caf50', '#ff9800', '#9c27b0', '#009688',
  '#f44336', '#795548', '#3f51b5', '#00bcd4', '#ff5722'
];

// Helper functions
const getNextStepColor = (existingSteps: ResearchStep[]): string => {
  const usedColors = new Set(existingSteps.map(step => step.color).filter(Boolean));
  for (const color of STEP_COLORS) {
    if (!usedColors.has(color)) return color;
  }
  return STEP_COLORS[0];
};

const getNextSubcomponentColor = (existingSubcomponents: ResearchSubcomponent[]): string => {
  const usedColors = new Set(existingSubcomponents.map(sub => sub.color).filter(Boolean));
  for (const color of SUBCOMPONENT_COLORS) {
    if (!usedColors.has(color)) return color;
  }
  return SUBCOMPONENT_COLORS[0];
};

// Load research design data for an activity
export const loadResearchDesign = (activityId: string, year: number): ResearchStep[] => {
  try {
    const stored = localStorage.getItem(getResearchDesignKey(activityId, year));
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading research design data:', error);
  }
  return [];
};

// Save research design data for an activity
export const saveResearchDesign = (activityId: string, year: number, steps: ResearchStep[]): void => {
  try {
    localStorage.setItem(getResearchDesignKey(activityId, year), JSON.stringify(steps));
  } catch (error) {
    console.error('Error saving research design data:', error);
  }
};

// Convert QRAActivityData to ResearchStep format
export const convertActivityToResearchSteps = (activity: QRAActivityData, businessId: string, year: number): ResearchStep[] => {
  console.log('🔄 Converting activity to research steps:', activity);
  console.log('🔍 Using businessId:', businessId, 'and year:', year);
  
  if (!businessId || !year) {
    console.log('❌ Missing businessId or year parameters');
    return [];
  }
  
  try {
    // First, find the activity ID by name from business data (same approach as getQRAData)
    const STORAGE_KEY = 'businessInfoData';
    const savedData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const business = savedData.businesses?.find((b: any) => b.id === businessId);
    const yearData = business?.years?.[year];
    const activities = yearData?.activities || {};
    
    console.log('🔍 Business data found:', business);
    console.log('🔍 Year data found:', yearData);
    console.log('🔍 Activities found:', activities);
    
    // Find activity ID by name
    const activityEntry = Object.entries(activities).find(([id, activityData]: [string, any]) => 
      activityData.name === activity.name
    );
    
    if (!activityEntry) {
      console.log(`❌ Could not find activity with name: ${activity.name}`);
      console.log('🔍 Available activities:', Object.values(activities).map((a: any) => a.name));
      return [];
    }
    
    const activityId = activityEntry[0];
    console.log(`✅ Found activity ID: ${activityId} for activity: ${activity.name}`);
    
    // QRA data is stored in localStorage with keys like: qra_${businessId}_${year}_${activityId}
    // But the actual keys can be complex like: qra_1749509038145_2025_Healthcare_Dentistry_Orthodontics_Fixed_Appliance_1750192771660
    let storageKey = `qra_${businessId}_${year}_${activityId}`;
    console.log('🔍 Looking for QRA data with key:', storageKey);
    
    let storedData = localStorage.getItem(storageKey);
    
    if (!storedData) {
      console.log('❌ No QRA data found for simple key:', storageKey);
      
      // Debug: show all available QRA keys
      const allKeys = Object.keys(localStorage);
      const qraKeys = allKeys.filter(key => key.startsWith('qra_'));
      console.log('🔍 Available QRA keys:', qraKeys);
      
      // Search for keys containing the activity name
      const matchingKey = qraKeys.find(key => key.includes(activityId));
      if (matchingKey) {
        console.log('✅ Found matching QRA key:', matchingKey);
        storageKey = matchingKey;
        storedData = localStorage.getItem(matchingKey);
      } else {
        console.log('❌ No matching QRA key found for activity:', activityId);
        return [];
      }
    }
    
    if (!storedData) {
      console.log('❌ No QRA data found after key search');
      return [];
    }
    
    const parsedData = JSON.parse(storedData);
    console.log('📋 Parsed QRA data from key:', storageKey, parsedData);
    
    const { selectedSubcomponents } = parsedData;
    
    if (!selectedSubcomponents || Object.keys(selectedSubcomponents).length === 0) {
      console.log('❌ No selectedSubcomponents found in QRA data');
      return [];
    }
    
    console.log('📋 selectedSubcomponents:', selectedSubcomponents);
    
    // Group subcomponents by step
    const stepGroups: { [stepName: string]: any[] } = {};
    
    Object.entries(selectedSubcomponents).forEach(([key, subData]: [string, any]) => {
      const stepName = subData.step;
      const subcomponentName = subData.subcomponent || key;
      
      // Filter out Non-R&D Alternatives and similar non-research components
      if (subcomponentName.toLowerCase().includes('non-r&d') || 
          subcomponentName.toLowerCase().includes('non-rd') ||
          subcomponentName.toLowerCase().includes('non-research') ||
          subcomponentName.toLowerCase().includes('non-research & development')) {
        console.log(`🚫 Filtering out non-research subcomponent: ${subcomponentName}`);
        return;
      }
      
      if (!stepName) {
        console.log('⚠️ No step name found for subcomponent:', key);
        return;
      }
      
      if (!stepGroups[stepName]) {
        stepGroups[stepName] = [];
      }
      
      stepGroups[stepName].push({
        id: key,
        name: subcomponentName,
        timePercentage: subData.timePercent || 0,
        step: stepName
      });
    });
    
    console.log('📊 Step groups:', stepGroups);
    
    if (Object.keys(stepGroups).length === 0) {
      console.log('❌ No valid step groups found');
      return [];
    }
    
    // Convert to ResearchStep format
    const result = Object.entries(stepGroups).map(([stepName, subcomponents], index) => {
      console.log(`🔍 Processing step: ${stepName} with ${subcomponents.length} subcomponents`);
      
      const convertedStep = {
        id: `step_${index}`,
        name: stepName,
        color: STEP_COLORS[index % STEP_COLORS.length],
        timePercentage: 0, // Remove time percentage display
        subcomponents: subcomponents.map((sub, subIndex) => {
          console.log(`🔍 Processing subcomponent: ${sub.name} (${sub.timePercentage}%)`);
          
          return {
            id: sub.id,
            name: sub.name,
            color: SUBCOMPONENT_COLORS[subIndex % SUBCOMPONENT_COLORS.length],
            frequencyPercentage: 0, // Remove frequency percentage display
            parentId: `step_${index}`
          };
        }),
        parentId: activity.id
      };
      
      console.log(`✅ Converted step:`, convertedStep);
      return convertedStep;
    });
    
    console.log('✅ Final converted steps:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Error converting activity to research steps:', error);
    return [];
  }
};

// Convert ResearchStep back to QRAStep format
export const convertResearchStepsToActivity = (steps: ResearchStep[]): any[] => {
  return steps.map((step, index) => ({
    id: step.id,
    name: step.name,
    order: index,
    timePercent: step.timePercentage,
    subcomponents: step.subcomponents.map(sub => ({
      id: sub.id,
      name: sub.name,
      usageWeight: sub.frequencyPercentage
    }))
  }));
};

// Create a new step
export const createNewStep = (activityId: string, existingSteps: ResearchStep[]): ResearchStep => {
  return {
    id: `step_${Date.now()}`,
    name: `New Step ${existingSteps.length + 1}`,
    color: getNextStepColor(existingSteps),
    timePercentage: 0,
    subcomponents: [],
    parentId: activityId
  };
};

// Create a new subcomponent
export const createNewSubcomponent = (stepId: string, existingSubcomponents: ResearchSubcomponent[]): ResearchSubcomponent => {
  return {
    id: `sub_${Date.now()}`,
    name: `New Subcomponent ${existingSubcomponents.length + 1}`,
    color: getNextSubcomponentColor(existingSubcomponents),
    frequencyPercentage: 0,
    parentId: stepId
  };
};

// Validate time percentages
export const validateTimePercentages = (steps: ResearchStep[]): { isValid: boolean; total: number } => {
  const total = steps.reduce((sum, step) => sum + step.timePercentage, 0);
  return { isValid: total === 100, total };
};

// Validate frequency percentages for a step
export const validateFrequencyPercentages = (subcomponents: ResearchSubcomponent[]): { isValid: boolean; total: number } => {
  const total = subcomponents.reduce((sum, sub) => sum + sub.frequencyPercentage, 0);
  return { isValid: total === 100, total };
};

// Auto-distribute time percentages evenly
export const autoDistributeTimePercentages = (steps: ResearchStep[]): ResearchStep[] => {
  if (steps.length === 0) return steps;
  
  const equalPercentage = Math.round(100 / steps.length);
  const remainder = 100 % steps.length;
  
  return steps.map((step, index) => ({
    ...step,
    timePercentage: equalPercentage + (index < remainder ? 1 : 0)
  }));
};

// Auto-distribute frequency percentages evenly
export const autoDistributeFrequencyPercentages = (subcomponents: ResearchSubcomponent[]): ResearchSubcomponent[] => {
  if (subcomponents.length === 0) return subcomponents;
  
  const equalPercentage = Math.round(100 / subcomponents.length);
  const remainder = 100 % subcomponents.length;
  
  return subcomponents.map((sub, index) => ({
    ...sub,
    frequencyPercentage: equalPercentage + (index < remainder ? 1 : 0)
  }));
};

// Export research design data
export const exportResearchDesign = (activityId: string, year: number, steps: ResearchStep[]) => {
  const data = {
    activityId,
    year,
    steps,
    exportDate: new Date().toISOString(),
    validation: {
      timePercentages: validateTimePercentages(steps),
      frequencyPercentages: steps.map(step => ({
        stepId: step.id,
        stepName: step.name,
        ...validateFrequencyPercentages(step.subcomponents)
      }))
    }
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `research-design-${activityId}-${year}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Import research design data
export const importResearchDesign = (file: File): Promise<{ activityId: string; year: number; steps: ResearchStep[] }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.activityId && data.year && data.steps) {
          resolve(data);
        } else {
          reject(new Error('Invalid research design file format'));
        }
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}; 