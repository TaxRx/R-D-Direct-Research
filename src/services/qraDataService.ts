import { supabase } from './supabase';
import { Database } from './supabase';

type Tables = Database['public']['Tables'];
type ResearchActivity = Tables['research_activities']['Row'];
type Step = Tables['steps']['Row'];
type Subcomponent = Tables['subcomponents']['Row'];

export interface BaseQRAData {
  year: number;
  researchActivityTitle: string;
  researchActivityPracticePercent: number;
  step: string;
  subcomponentTitle: string;
  subcomponentYearPercent: number;
  subcomponentFrequencyPercent: number;
  subcomponentTimePercent: number;
}

export interface EmployeeConfigurationData {
  employeeId: string;
  firstName: string;
  lastName: string;
  wage: number;
  roleId: string;
  customRoleName?: string;
  isBusinessOwner: boolean;
  customPracticePercentages: Record<string, number>;
  customTimePercentages: Record<string, Record<string, number>>;
  appliedPercentage: number;
  appliedAmount: number;
  isLocked: boolean;
  updatedAt: string;
}

export interface ContractorConfigurationData {
  contractorId: string;
  firstName?: string;
  lastName?: string;
  businessName?: string;
  contractorType: 'individual' | 'business';
  totalAmount: number;
  roleId: string;
  customRoleName?: string;
  customPracticePercentages: Record<string, number>;
  customTimePercentages: Record<string, Record<string, number>>;
  appliedPercentage: number;
  appliedAmount: number;
  isLocked: boolean;
  updatedAt: string;
}

export interface QRAModalData {
  activityName: string;
  practicePercent: number;
  selectedSubcomponents: Record<string, SubcomponentConfig>;
  totalAppliedPercent: number;
  stepFrequencies: Record<string, number>;
  stepTimeMap: Record<string, number>;
  stepTimeLocked: Record<string, boolean>;
  selectedRoles: string[];
  calculationFormula: string;
  lastUpdated: string;
  totalSubcomponents: number;
  rdSubcomponents: number;
  nonRdSubcomponents: number;
  stepSummaries: Record<string, StepSummary>;
}

interface SubcomponentConfig {
  phase: string;
  step: string;
  subcomponent: string;
  timePercent: number;
  frequencyPercent: number;
  yearPercent: number;
  startYear: number;
  selectedRoles: string[];
  appliedPercent: number;
  isNonRD?: boolean;
}

interface StepSummary {
  stepName: string;
  timePercent: number;
  subcomponentCount: number;
  totalAppliedPercent: number;
  isLocked: boolean;
}

export interface ResearchDesignData {
  activityId: string;
  subcomponentId: string;
  userNotes?: string;
  userModifications?: any;
  aiContent?: any;
  promptTemplate?: string;
  lastUpdated: string;
}

export interface QRADataExport {
  businessId: string;
  year: number;
  activities: BaseQRAData[];
  employeeConfigurations: EmployeeConfigurationData[];
  contractorConfigurations: ContractorConfigurationData[];
  qraModalData: Record<string, QRAModalData>;
  researchDesignData: ResearchDesignData[];
}

/**
 * Captures comprehensive QRA data from localStorage and normalizes it for Supabase
 */
export const captureBaseQRAData = (businessId: string, year: number): QRADataExport => {
  const qraDataKey = `qraData_${businessId}_${year}`;
  const qraData = localStorage.getItem(qraDataKey);
  
  if (!qraData) {
    return {
      businessId,
      year,
      activities: [],
      employeeConfigurations: [],
      contractorConfigurations: [],
      qraModalData: {},
      researchDesignData: []
    };
  }

  try {
    const parsedData = JSON.parse(qraData);
    const activities: BaseQRAData[] = [];

    // Extract activities from the QRA data structure
    if (parsedData.activities && Array.isArray(parsedData.activities)) {
      parsedData.activities.forEach((activity: any) => {
        if (activity.steps && Array.isArray(activity.steps)) {
          activity.steps.forEach((step: any) => {
            if (step.subcomponents && Array.isArray(step.subcomponents)) {
              step.subcomponents.forEach((subcomponent: any) => {
                activities.push({
                  year,
                  researchActivityTitle: activity.name || activity.title || '',
                  researchActivityPracticePercent: activity.practicePercent || activity.currentPracticePercent || 0,
                  step: step.name || step.title || '',
                  subcomponentTitle: subcomponent.name || subcomponent.title || '',
                  subcomponentYearPercent: subcomponent.yearPercent || subcomponent.currentYearPercent || 0,
                  subcomponentFrequencyPercent: subcomponent.frequencyPercent || subcomponent.currentFrequencyPercent || 0,
                  subcomponentTimePercent: subcomponent.timePercent || subcomponent.currentTimePercent || 0
                });
              });
            }
          });
        }
      });
    }

    // Capture Employee Configurations
    const employeeConfigurations: EmployeeConfigurationData[] = captureEmployeeConfigurations(businessId, year);

    // Capture Contractor Configurations
    const contractorConfigurations: ContractorConfigurationData[] = captureContractorConfigurations(businessId, year);

    // Capture QRA Modal Data
    const qraModalData: Record<string, QRAModalData> = captureQRAModalData(businessId, year);

    // Capture Research Design Data
    const researchDesignData: ResearchDesignData[] = captureResearchDesignData(businessId, year);

    return {
      businessId,
      year,
      activities,
      employeeConfigurations,
      contractorConfigurations,
      qraModalData,
      researchDesignData
    };
  } catch (error) {
    console.error('Error parsing QRA data:', error);
    return {
      businessId,
      year,
      activities: [],
      employeeConfigurations: [],
      contractorConfigurations: [],
      qraModalData: {},
      researchDesignData: []
    };
  }
};

/**
 * Captures employee configuration data from localStorage
 */
const captureEmployeeConfigurations = (businessId: string, year: number): EmployeeConfigurationData[] => {
  const configurations: EmployeeConfigurationData[] = [];
  
  try {
    // Get all employee keys for this business and year
    const employeeKeys = Object.keys(localStorage).filter(key => 
      key.startsWith(`employee_${businessId}_${year}_`)
    );

    employeeKeys.forEach(key => {
      const employeeData = localStorage.getItem(key);
      if (employeeData) {
        try {
          const employee = JSON.parse(employeeData);
          configurations.push({
            employeeId: employee.id,
            firstName: employee.firstName || '',
            lastName: employee.lastName || '',
            wage: employee.wage || 0,
            roleId: employee.roleId || '',
            customRoleName: employee.customRoleName,
            isBusinessOwner: employee.isBusinessOwner || false,
            customPracticePercentages: employee.customPracticePercentages || {},
            customTimePercentages: employee.customTimePercentages || {},
            appliedPercentage: employee.appliedPercentage || 0,
            appliedAmount: employee.appliedAmount || 0,
            isLocked: employee.isLocked || false,
            updatedAt: employee.updatedAt || new Date().toISOString()
          });
        } catch (error) {
          console.error(`Error parsing employee data from key ${key}:`, error);
        }
      }
    });
  } catch (error) {
    console.error('Error capturing employee configurations:', error);
  }

  return configurations;
};

/**
 * Captures contractor configuration data from localStorage
 */
const captureContractorConfigurations = (businessId: string, year: number): ContractorConfigurationData[] => {
  const configurations: ContractorConfigurationData[] = [];
  
  try {
    // Get all contractor keys for this business and year
    const contractorKeys = Object.keys(localStorage).filter(key => 
      key.startsWith(`contractor_${businessId}_${year}_`)
    );

    contractorKeys.forEach(key => {
      const contractorData = localStorage.getItem(key);
      if (contractorData) {
        try {
          const contractor = JSON.parse(contractorData);
          configurations.push({
            contractorId: contractor.id,
            firstName: contractor.firstName,
            lastName: contractor.lastName,
            businessName: contractor.businessName,
            contractorType: contractor.contractorType || 'individual',
            totalAmount: contractor.totalAmount || 0,
            roleId: contractor.roleId || '',
            customRoleName: contractor.customRoleName,
            customPracticePercentages: contractor.customPracticePercentages || {},
            customTimePercentages: contractor.customTimePercentages || {},
            appliedPercentage: contractor.appliedPercentage || 0,
            appliedAmount: contractor.appliedAmount || 0,
            isLocked: contractor.isLocked || false,
            updatedAt: contractor.updatedAt || new Date().toISOString()
          });
        } catch (error) {
          console.error(`Error parsing contractor data from key ${key}:`, error);
        }
      }
    });
  } catch (error) {
    console.error('Error capturing contractor configurations:', error);
  }

  return configurations;
};

/**
 * Captures QRA modal data from localStorage
 */
const captureQRAModalData = (businessId: string, year: number): Record<string, QRAModalData> => {
  const qraModalData: Record<string, QRAModalData> = {};
  
  try {
    // Get all QRA data keys for this business and year
    const qraKeys = Object.keys(localStorage).filter(key => 
      key.startsWith(`qra_${businessId}_${year}_`) || key.startsWith(`qra_data_${businessId}_${year}_`)
    );

    qraKeys.forEach(key => {
      const qraData = localStorage.getItem(key);
      if (qraData) {
        try {
          const data = JSON.parse(qraData);
          // Extract activity name from key or data
          const activityName = data.activityName || key.split('_').pop() || 'unknown';
          qraModalData[activityName] = {
            activityName: data.activityName || activityName,
            practicePercent: data.practicePercent || 0,
            selectedSubcomponents: data.selectedSubcomponents || {},
            totalAppliedPercent: data.totalAppliedPercent || 0,
            stepFrequencies: data.stepFrequencies || {},
            stepTimeMap: data.stepTimeMap || {},
            stepTimeLocked: data.stepTimeLocked || {},
            selectedRoles: data.selectedRoles || [],
            calculationFormula: data.calculationFormula || '',
            lastUpdated: data.lastUpdated || new Date().toISOString(),
            totalSubcomponents: data.totalSubcomponents || 0,
            rdSubcomponents: data.rdSubcomponents || 0,
            nonRdSubcomponents: data.nonRdSubcomponents || 0,
            stepSummaries: data.stepSummaries || {}
          };
        } catch (error) {
          console.error(`Error parsing QRA data from key ${key}:`, error);
        }
      }
    });
  } catch (error) {
    console.error('Error capturing QRA modal data:', error);
  }

  return qraModalData;
};

/**
 * Captures research design data from localStorage
 */
const captureResearchDesignData = (businessId: string, year: number): ResearchDesignData[] => {
  const researchDesignData: ResearchDesignData[] = [];
  
  try {
    // Get all research design keys for this business and year
    const researchKeys = Object.keys(localStorage).filter(key => 
      key.startsWith(`research_design_${businessId}_${year}_`)
    );

    researchKeys.forEach(key => {
      const researchData = localStorage.getItem(key);
      if (researchData) {
        try {
          const data = JSON.parse(researchData);
          // Extract activity and subcomponent IDs from key
          const keyParts = key.split('_');
          const activityId = keyParts[3] || '';
          const subcomponentId = keyParts[4] || '';
          
          researchDesignData.push({
            activityId,
            subcomponentId,
            userNotes: data.userNotes,
            userModifications: data.userModifications,
            aiContent: data.aiContent,
            promptTemplate: data.promptTemplate,
            lastUpdated: data.lastUpdated || new Date().toISOString()
          });
        } catch (error) {
          console.error(`Error parsing research design data from key ${key}:`, error);
        }
      }
    });
  } catch (error) {
    console.error('Error capturing research design data:', error);
  }

  return researchDesignData;
};

/**
 * Saves base QRA data to Supabase
 */
export const saveBaseQRADataToSupabase = async (qraData: QRADataExport): Promise<boolean> => {
  try {
    const { businessId, year, activities, employeeConfigurations, contractorConfigurations, qraModalData, researchDesignData } = qraData;

    // First, ensure the business and year exist
    await ensureBusinessAndYear(businessId, year);

    // Process each activity
    for (const activity of activities) {
      // Insert or update research activity
      const { data: researchActivity, error: raError } = await supabase
        .from('research_activities')
        .upsert({
          business_id: businessId,
          year: activity.year,
          title: activity.researchActivityTitle,
          practice_percent: activity.researchActivityPracticePercent
        }, {
          onConflict: 'business_id,year,title'
        })
        .select()
        .single();

      if (raError) {
        console.error('Error saving research activity:', raError);
        continue;
      }

      // Insert or update step
      const { data: step, error: stepError } = await supabase
        .from('steps')
        .upsert({
          research_activity_id: researchActivity.id,
          title: activity.step,
          order_index: 0 // You might want to track order separately
        }, {
          onConflict: 'research_activity_id,title'
        })
        .select()
        .single();

      if (stepError) {
        console.error('Error saving step:', stepError);
        continue;
      }

      // Insert or update subcomponent
      const { error: subError } = await supabase
        .from('subcomponents')
        .upsert({
          step_id: step.id,
          title: activity.subcomponentTitle,
          year_percent: activity.subcomponentYearPercent,
          frequency_percent: activity.subcomponentFrequencyPercent,
          time_percent: activity.subcomponentTimePercent
        }, {
          onConflict: 'step_id,title'
        });

      if (subError) {
        console.error('Error saving subcomponent:', subError);
      }
    }

    // Process each employee configuration
    for (const employeeConfiguration of employeeConfigurations) {
      // Insert or update employee configuration
      const { error: employeeError } = await supabase
        .from('employee_configurations')
        .upsert({
          business_id: businessId,
          year: year,
          employee_id: employeeConfiguration.employeeId,
          first_name: employeeConfiguration.firstName,
          last_name: employeeConfiguration.lastName,
          wage: employeeConfiguration.wage,
          role_id: employeeConfiguration.roleId,
          custom_role_name: employeeConfiguration.customRoleName,
          is_business_owner: employeeConfiguration.isBusinessOwner,
          custom_practice_percentages: employeeConfiguration.customPracticePercentages,
          custom_time_percentages: employeeConfiguration.customTimePercentages,
          applied_percentage: employeeConfiguration.appliedPercentage,
          applied_amount: employeeConfiguration.appliedAmount,
          is_locked: employeeConfiguration.isLocked,
          updated_at: employeeConfiguration.updatedAt
        }, {
          onConflict: 'business_id,year,employee_id'
        });

      if (employeeError) {
        console.error('Error saving employee configuration:', employeeError);
      }
    }

    // Process each contractor configuration
    for (const contractorConfiguration of contractorConfigurations) {
      // Insert or update contractor configuration
      const { error: contractorError } = await supabase
        .from('contractor_configurations')
        .upsert({
          business_id: businessId,
          year: year,
          contractor_id: contractorConfiguration.contractorId,
          first_name: contractorConfiguration.firstName,
          last_name: contractorConfiguration.lastName,
          business_name: contractorConfiguration.businessName,
          contractor_type: contractorConfiguration.contractorType,
          total_amount: contractorConfiguration.totalAmount,
          role_id: contractorConfiguration.roleId,
          custom_role_name: contractorConfiguration.customRoleName,
          custom_practice_percentages: contractorConfiguration.customPracticePercentages,
          custom_time_percentages: contractorConfiguration.customTimePercentages,
          applied_percentage: contractorConfiguration.appliedPercentage,
          applied_amount: contractorConfiguration.appliedAmount,
          is_locked: contractorConfiguration.isLocked,
          updated_at: contractorConfiguration.updatedAt
        }, {
          onConflict: 'business_id,year,contractor_id'
        });

      if (contractorError) {
        console.error('Error saving contractor configuration:', contractorError);
      }
    }

    // Process each QRA modal data
    for (const [activityName, qraModalDataItem] of Object.entries(qraModalData)) {
      // Insert or update QRA modal data
      const { error: qraModalError } = await supabase
        .from('qra_modal_data')
        .upsert({
          business_id: businessId,
          year: year,
          activity_name: activityName,
          practice_percent: qraModalDataItem.practicePercent,
          selected_subcomponents: qraModalDataItem.selectedSubcomponents,
          total_applied_percent: qraModalDataItem.totalAppliedPercent,
          step_frequencies: qraModalDataItem.stepFrequencies,
          step_time_map: qraModalDataItem.stepTimeMap,
          step_time_locked: qraModalDataItem.stepTimeLocked,
          selected_roles: qraModalDataItem.selectedRoles,
          calculation_formula: qraModalDataItem.calculationFormula,
          last_updated: qraModalDataItem.lastUpdated,
          total_subcomponents: qraModalDataItem.totalSubcomponents,
          rd_subcomponents: qraModalDataItem.rdSubcomponents,
          non_rd_subcomponents: qraModalDataItem.nonRdSubcomponents,
          step_summaries: qraModalDataItem.stepSummaries
        }, {
          onConflict: 'business_id,year,activity_name'
        });

      if (qraModalError) {
        console.error(`Error saving QRA modal data for activity ${activityName}:`, qraModalError);
      }
    }

    // Process each research design data
    for (const researchDesignItem of researchDesignData) {
      // Insert or update research design data
      const { error: researchDesignError } = await supabase
        .from('research_design_data')
        .upsert({
          business_id: businessId,
          year: year,
          activity_id: researchDesignItem.activityId,
          subcomponent_id: researchDesignItem.subcomponentId,
          user_notes: researchDesignItem.userNotes,
          user_modifications: researchDesignItem.userModifications,
          ai_content: researchDesignItem.aiContent,
          prompt_template: researchDesignItem.promptTemplate,
          last_updated: researchDesignItem.lastUpdated
        }, {
          onConflict: 'business_id,year,activity_id,subcomponent_id'
        });

      if (researchDesignError) {
        console.error(`Error saving research design data for activity ${researchDesignItem.activityId} and subcomponent ${researchDesignItem.subcomponentId}:`, researchDesignError);
      }
    }

    return true;
  } catch (error) {
    console.error('Error saving QRA data to Supabase:', error);
    return false;
  }
};

/**
 * Retrieves base QRA data from Supabase
 */
export const getBaseQRADataFromSupabase = async (businessId: string, year: number): Promise<BaseQRAData[]> => {
  try {
    const { data, error } = await supabase
      .from('research_activities')
      .select(`
        id,
        title,
        practice_percent,
        steps (
          id,
          title,
          subcomponents (
            title,
            year_percent,
            frequency_percent,
            time_percent
          )
        )
      `)
      .eq('business_id', businessId)
      .eq('year', year);

    if (error) {
      console.error('Error fetching QRA data:', error);
      return [];
    }

    const activities: BaseQRAData[] = [];

    data?.forEach(activity => {
      activity.steps?.forEach((step: any) => {
        step.subcomponents?.forEach((subcomponent: any) => {
          activities.push({
            year,
            researchActivityTitle: activity.title,
            researchActivityPracticePercent: activity.practice_percent,
            step: step.title,
            subcomponentTitle: subcomponent.title,
            subcomponentYearPercent: subcomponent.year_percent,
            subcomponentFrequencyPercent: subcomponent.frequency_percent,
            subcomponentTimePercent: subcomponent.time_percent
          });
        });
      });
    });

    return activities;
  } catch (error) {
    console.error('Error retrieving QRA data from Supabase:', error);
    return [];
  }
};

/**
 * Ensures business and year records exist in Supabase
 */
const ensureBusinessAndYear = async (businessId: string, year: number): Promise<void> => {
  // Check if business exists (you might want to create a default business record)
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('id', businessId)
    .single();

  if (!business) {
    // Create a default business record
    await supabase
      .from('businesses')
      .insert({
        id: businessId,
        name: 'Default Business',
        user_id: '00000000-0000-0000-0000-000000000000', // Default user ID
        business_type: 'corporation'
      });
  }

  // Check if year exists
  const { data: yearRecord } = await supabase
    .from('years')
    .select('id')
    .eq('business_id', businessId)
    .eq('year', year)
    .single();

  if (!yearRecord) {
    // Create year record
    await supabase
      .from('years')
      .insert({
        business_id: businessId,
        year
      });
  }
};

/**
 * Exports comprehensive QRA data as CSV
 */
export const exportBaseQRADataAsCSV = (qraData: QRADataExport): string => {
  const csvLines: string[] = [];
  
  // 1. Base QRA Data
  csvLines.push('=== BASE QRA DATA ===');
  const baseHeaders = [
    'Year',
    'Research Activity Title',
    'Research Activity Practice Percent',
    'Step',
    'Subcomponent Title',
    'Subcomponent Year %',
    'Subcomponent Frequency %',
    'Subcomponent Time %'
  ];
  csvLines.push(baseHeaders.join(','));
  
  qraData.activities.forEach(activity => {
    csvLines.push([
      activity.year,
      `"${activity.researchActivityTitle}"`,
      activity.researchActivityPracticePercent,
      `"${activity.step}"`,
      `"${activity.subcomponentTitle}"`,
      activity.subcomponentYearPercent,
      activity.subcomponentFrequencyPercent,
      activity.subcomponentTimePercent
    ].join(','));
  });
  
  // 2. Employee Configurations
  if (qraData.employeeConfigurations.length > 0) {
    csvLines.push('');
    csvLines.push('=== EMPLOYEE CONFIGURATIONS ===');
    const employeeHeaders = [
      'Employee ID',
      'First Name',
      'Last Name',
      'Wage',
      'Role ID',
      'Custom Role Name',
      'Is Business Owner',
      'Applied Percentage',
      'Applied Amount',
      'Is Locked',
      'Updated At'
    ];
    csvLines.push(employeeHeaders.join(','));
    
    qraData.employeeConfigurations.forEach(employee => {
      csvLines.push([
        employee.employeeId,
        `"${employee.firstName}"`,
        `"${employee.lastName}"`,
        employee.wage,
        employee.roleId,
        `"${employee.customRoleName || ''}"`,
        employee.isBusinessOwner,
        employee.appliedPercentage,
        employee.appliedAmount,
        employee.isLocked,
        employee.updatedAt
      ].join(','));
    });
  }
  
  // 3. Contractor Configurations
  if (qraData.contractorConfigurations.length > 0) {
    csvLines.push('');
    csvLines.push('=== CONTRACTOR CONFIGURATIONS ===');
    const contractorHeaders = [
      'Contractor ID',
      'First Name',
      'Last Name',
      'Business Name',
      'Contractor Type',
      'Total Amount',
      'Role ID',
      'Custom Role Name',
      'Applied Percentage',
      'Applied Amount',
      'Is Locked',
      'Updated At'
    ];
    csvLines.push(contractorHeaders.join(','));
    
    qraData.contractorConfigurations.forEach(contractor => {
      csvLines.push([
        contractor.contractorId,
        `"${contractor.firstName || ''}"`,
        `"${contractor.lastName || ''}"`,
        `"${contractor.businessName || ''}"`,
        contractor.contractorType,
        contractor.totalAmount,
        contractor.roleId,
        `"${contractor.customRoleName || ''}"`,
        contractor.appliedPercentage,
        contractor.appliedAmount,
        contractor.isLocked,
        contractor.updatedAt
      ].join(','));
    });
  }
  
  // 4. QRA Modal Data
  if (Object.keys(qraData.qraModalData).length > 0) {
    csvLines.push('');
    csvLines.push('=== QRA MODAL DATA ===');
    const qraModalHeaders = [
      'Activity Name',
      'Practice Percent',
      'Total Applied Percent',
      'Total Subcomponents',
      'R&D Subcomponents',
      'Non-R&D Subcomponents',
      'Selected Roles',
      'Calculation Formula',
      'Last Updated'
    ];
    csvLines.push(qraModalHeaders.join(','));
    
    Object.entries(qraData.qraModalData).forEach(([activityName, data]) => {
      csvLines.push([
        `"${activityName}"`,
        data.practicePercent,
        data.totalAppliedPercent,
        data.totalSubcomponents,
        data.rdSubcomponents,
        data.nonRdSubcomponents,
        `"${data.selectedRoles.join('; ')}"`,
        `"${data.calculationFormula}"`,
        data.lastUpdated
      ].join(','));
    });
  }
  
  // 5. Research Design Data
  if (qraData.researchDesignData.length > 0) {
    csvLines.push('');
    csvLines.push('=== RESEARCH DESIGN DATA ===');
    const researchDesignHeaders = [
      'Activity ID',
      'Subcomponent ID',
      'User Notes',
      'Has User Modifications',
      'Has AI Content',
      'Has Prompt Template',
      'Last Updated'
    ];
    csvLines.push(researchDesignHeaders.join(','));
    
    qraData.researchDesignData.forEach(item => {
      csvLines.push([
        item.activityId,
        item.subcomponentId,
        `"${item.userNotes || ''}"`,
        !!item.userModifications,
        !!item.aiContent,
        !!item.promptTemplate,
        item.lastUpdated
      ].join(','));
    });
  }
  
  return csvLines.join('\n');
};

/**
 * Syncs QRA data from localStorage to Supabase
 */
export const syncQRADataToSupabase = async (businessId: string, year: number): Promise<boolean> => {
  try {
    const qraData = captureBaseQRAData(businessId, year);
    return await saveBaseQRADataToSupabase(qraData);
  } catch (error) {
    console.error('Error syncing QRA data:', error);
    return false;
  }
};

/**
 * Save QRA data to Supabase for a specific activity
 */
export const saveQRADataToSupabase = async (
  businessId: string, 
  year: number, 
  activityId: string, 
  qraData: any
): Promise<boolean> => {
  try {
    console.log(`[QRA Data Service] Saving QRA data for business: ${businessId}, year: ${year}, activity: ${activityId}`);
    
    // First, ensure the activity exists in qra_activities table
    const { data: existingActivity, error: activityError } = await supabase
      .from('qra_activities')
      .select('id')
      .eq('business_id', businessId)
      .eq('year', year)
      .eq('activity_id', activityId)
      .single();

    if (activityError && activityError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking existing QRA activity:', activityError);
      return false;
    }

    let qraActivityId: string;

    if (!existingActivity) {
      // Create new QRA activity record
      const { data: newActivity, error: insertError } = await supabase
        .from('qra_activities')
        .insert({
          business_id: businessId,
          year: year,
          activity_id: activityId,
          practice_percent: qraData.practicePercent || 0,
          non_rd_time: qraData.nonRDTime || 0,
          total_applied_percent: qraData.totalAppliedPercent || 0,
          is_locked: qraData.isLocked || false,
          last_updated: new Date().toISOString()
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('Error creating QRA activity:', insertError);
        return false;
      }
      qraActivityId = newActivity.id;
    } else {
      qraActivityId = existingActivity.id;
      
      // Update existing QRA activity
      const { error: updateError } = await supabase
        .from('qra_activities')
        .update({
          practice_percent: qraData.practicePercent || 0,
          non_rd_time: qraData.nonRDTime || 0,
          total_applied_percent: qraData.totalAppliedPercent || 0,
          is_locked: qraData.isLocked || false,
          last_updated: new Date().toISOString()
        })
        .eq('id', qraActivityId);

      if (updateError) {
        console.error('Error updating QRA activity:', updateError);
        return false;
      }
    }

    // Clear existing steps and subcomponents for this activity
    const { error: deleteStepsError } = await supabase
      .from('qra_steps')
      .delete()
      .eq('qra_activity_id', qraActivityId);

    if (deleteStepsError) {
      console.error('Error deleting existing QRA steps:', deleteStepsError);
      return false;
    }

    // Save steps and subcomponents
    if (qraData.selectedSubcomponents) {
      const stepData: any[] = [];
      const subcomponentData: any[] = [];

      Object.entries(qraData.selectedSubcomponents).forEach(([subId, subData]: [string, any]) => {
        if (subData && subData.step) {
          // Create step record
          const stepRecord = {
            qra_activity_id: qraActivityId,
            step_name: subData.step,
            phase_name: subData.phase || 'Unknown',
            time_percent: subData.timePercent || 0,
            is_locked: subData.isLocked || false,
            order_index: stepData.length + 1
          };
          stepData.push(stepRecord);

          // Create subcomponent record
          const subcomponentRecord = {
            qra_activity_id: qraActivityId,
            step_name: subData.step,
            subcomponent_id: subId,
            subcomponent_title: subData.subcomponent?.title || subData.title || '',
            time_percent: subData.timePercent || 0,
            frequency_percent: subData.frequencyPercent || 0,
            year_percent: subData.yearPercent || 0,
            selected_roles: subData.selectedRoles || [],
            is_non_rd: subData.isNonRD || false,
            order_index: subcomponentData.length + 1
          };
          subcomponentData.push(subcomponentRecord);
        }
      });

      // Insert steps
      if (stepData.length > 0) {
        const { error: stepsError } = await supabase
          .from('qra_steps')
          .insert(stepData);

        if (stepsError) {
          console.error('Error inserting QRA steps:', stepsError);
          return false;
        }
      }

      // Insert subcomponents
      if (subcomponentData.length > 0) {
        const { error: subcomponentsError } = await supabase
          .from('qra_subcomponents')
          .insert(subcomponentData);

        if (subcomponentsError) {
          console.error('Error inserting QRA subcomponents:', subcomponentsError);
          return false;
        }
      }
    }

    console.log(`[QRA Data Service] Successfully saved QRA data for activity: ${activityId}`);
    return true;
  } catch (error) {
    console.error('Error saving QRA data to Supabase:', error);
    return false;
  }
};

/**
 * Load QRA data from Supabase for a specific activity
 */
export const loadQRADataFromSupabase = async (
  businessId: string, 
  year: number, 
  activityId: string
): Promise<any | null> => {
  try {
    console.log(`[QRA Data Service] Loading QRA data for business: ${businessId}, year: ${year}, activity: ${activityId}`);
    
    // Get QRA activity data
    const { data: activityData, error: activityError } = await supabase
      .from('qra_activities')
      .select('*')
      .eq('business_id', businessId)
      .eq('year', year)
      .eq('activity_id', activityId)
      .single();

    if (activityError) {
      if (activityError.code === 'PGRST116') { // No rows returned
        console.log(`[QRA Data Service] No QRA data found for activity: ${activityId}`);
        return null;
      }
      console.error('Error loading QRA activity:', activityError);
      return null;
    }

    // Get QRA steps
    const { data: stepsData, error: stepsError } = await supabase
      .from('qra_steps')
      .select('*')
      .eq('qra_activity_id', activityData.id)
      .order('order_index');

    if (stepsError) {
      console.error('Error loading QRA steps:', stepsError);
      return null;
    }

    // Get QRA subcomponents
    const { data: subcomponentsData, error: subcomponentsError } = await supabase
      .from('qra_subcomponents')
      .select('*')
      .eq('qra_activity_id', activityData.id)
      .order('order_index');

    if (subcomponentsError) {
      console.error('Error loading QRA subcomponents:', subcomponentsError);
      return null;
    }

    // Reconstruct the QRA data structure
    const selectedSubcomponents: Record<string, any> = {};
    
    subcomponentsData?.forEach(sub => {
      const subId = sub.subcomponent_id;
      selectedSubcomponents[subId] = {
        step: sub.step_name,
        phase: sub.phase_name || 'Unknown',
        subcomponent: {
          id: sub.subcomponent_id,
          title: sub.subcomponent_title
        },
        timePercent: sub.time_percent,
        frequencyPercent: sub.frequency_percent,
        yearPercent: sub.year_percent,
        selectedRoles: sub.selected_roles || [],
        isNonRD: sub.is_non_rd
      };
    });

    const qraData = {
      selectedSubcomponents,
      practicePercent: activityData.practice_percent,
      nonRDTime: activityData.non_rd_time,
      totalAppliedPercent: activityData.total_applied_percent,
      isLocked: activityData.is_locked,
      lastUpdated: activityData.last_updated
    };

    console.log(`[QRA Data Service] Successfully loaded QRA data for activity: ${activityId}`);
    return qraData;
  } catch (error) {
    console.error('Error loading QRA data from Supabase:', error);
    return null;
  }
};

/**
 * Get all QRA data for a business and year
 */
export const getAllQRADataForBusiness = async (
  businessId: string, 
  year: number
): Promise<Record<string, any>> => {
  try {
    console.log(`[QRA Data Service] Loading all QRA data for business: ${businessId}, year: ${year}`);
    
    // Get all QRA activities for this business and year
    const { data: activitiesData, error: activitiesError } = await supabase
      .from('qra_activities')
      .select('*')
      .eq('business_id', businessId)
      .eq('year', year);

    if (activitiesError) {
      console.error('Error loading QRA activities:', activitiesError);
      return {};
    }

    const result: Record<string, any> = {};

    // Load QRA data for each activity
    for (const activity of activitiesData || []) {
      const qraData = await loadQRADataFromSupabase(businessId, year, activity.activity_id);
      if (qraData) {
        result[activity.activity_id] = qraData;
      }
    }

    console.log(`[QRA Data Service] Successfully loaded QRA data for ${Object.keys(result).length} activities`);
    return result;
  } catch (error) {
    console.error('Error loading all QRA data:', error);
    return {};
  }
};

/**
 * Delete QRA data for a specific activity
 */
export const deleteQRADataFromSupabase = async (
  businessId: string, 
  year: number, 
  activityId: string
): Promise<boolean> => {
  try {
    console.log(`[QRA Data Service] Deleting QRA data for business: ${businessId}, year: ${year}, activity: ${activityId}`);
    
    // Get the QRA activity ID
    const { data: activityData, error: activityError } = await supabase
      .from('qra_activities')
      .select('id')
      .eq('business_id', businessId)
      .eq('year', year)
      .eq('activity_id', activityId)
      .single();

    if (activityError) {
      if (activityError.code === 'PGRST116') { // No rows returned
        console.log(`[QRA Data Service] No QRA data found to delete for activity: ${activityId}`);
        return true; // Nothing to delete
      }
      console.error('Error finding QRA activity to delete:', activityError);
      return false;
    }

    // Delete subcomponents first (due to foreign key constraints)
    const { error: subcomponentsError } = await supabase
      .from('qra_subcomponents')
      .delete()
      .eq('qra_activity_id', activityData.id);

    if (subcomponentsError) {
      console.error('Error deleting QRA subcomponents:', subcomponentsError);
      return false;
    }

    // Delete steps
    const { error: stepsError } = await supabase
      .from('qra_steps')
      .delete()
      .eq('qra_activity_id', activityData.id);

    if (stepsError) {
      console.error('Error deleting QRA steps:', stepsError);
      return false;
    }

    // Delete the activity
    const { error: activityDeleteError } = await supabase
      .from('qra_activities')
      .delete()
      .eq('id', activityData.id);

    if (activityDeleteError) {
      console.error('Error deleting QRA activity:', activityDeleteError);
      return false;
    }

    console.log(`[QRA Data Service] Successfully deleted QRA data for activity: ${activityId}`);
    return true;
  } catch (error) {
    console.error('Error deleting QRA data from Supabase:', error);
    return false;
  }
};

/**
 * Migrate QRA data from localStorage to Supabase
 */
export const migrateQRADataToSupabase = async (
  businessId: string, 
  year: number
): Promise<boolean> => {
  try {
    console.log(`[QRA Data Service] Starting QRA data migration for business: ${businessId}, year: ${year}`);
    
    // Get all localStorage keys for this business and year
    const allKeys = Object.keys(localStorage);
    const qraKeys = allKeys.filter(key => 
      key.startsWith(`qra_${businessId}_${year}_`)
    );

    console.log(`[QRA Data Service] Found ${qraKeys.length} QRA keys to migrate`);

    let successCount = 0;
    let errorCount = 0;

    for (const key of qraKeys) {
      try {
        // Extract activity ID from key
        const activityId = key.replace(`qra_${businessId}_${year}_`, '');
        
        // Get data from localStorage
        const storedData = localStorage.getItem(key);
        if (!storedData) continue;

        const qraData = JSON.parse(storedData);
        
        // Save to Supabase
        const success = await saveQRADataToSupabase(businessId, year, activityId, qraData);
        
        if (success) {
          successCount++;
          console.log(`[QRA Data Service] Successfully migrated QRA data for activity: ${activityId}`);
        } else {
          errorCount++;
          console.error(`[QRA Data Service] Failed to migrate QRA data for activity: ${activityId}`);
        }
      } catch (error) {
        errorCount++;
        console.error(`[QRA Data Service] Error migrating QRA data for key: ${key}`, error);
      }
    }

    console.log(`[QRA Data Service] Migration completed. Success: ${successCount}, Errors: ${errorCount}`);
    return errorCount === 0;
  } catch (error) {
    console.error('Error during QRA data migration:', error);
    return false;
  }
}; 