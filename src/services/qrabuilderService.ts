import { supabase } from './supabase';
import { 
  SubcomponentSelectionData, 
  EmployeeConfiguration, 
  ContractorConfiguration, 
  SupplyConfiguration,
  ResearchActivitySelection
} from '../types/QRABuilderInterfaces';

// =====================================================
// QRABUILDER SERVICE CLASS - SIMPLIFIED VERSION
// =====================================================

export class QRABuilderService {
  // =====================================================
  // QRA DATA OPERATIONS - USING JSONB STORAGE
  // =====================================================

  /**
   * Save QRA data for a specific activity using JSONB storage
   * This approach avoids complex table structures and RLS issues
   */
  static async saveQRAData(
    businessId: string,
    year: number,
    activityId: string,
    activityName: string,
    qraData: SubcomponentSelectionData
  ): Promise<boolean> {
    try {
      console.log(`[QRABuilderService] Saving QRA data for activity: ${activityName}`);

      // Use a simple JSONB storage approach in the businesses table
      const { data: existingBusiness, error: fetchError } = await supabase
        .from('businesses')
        .select('qra_data')
        .eq('id', businessId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching business data:', fetchError);
        return false;
      }

      // Get existing QRA data or initialize empty object
      const existingQraData = existingBusiness?.qra_data || {};
      
      // Create the key for this activity
      const qraKey = `${year}_${activityId}`;
      
      // Update the QRA data
      const updatedQraData = {
        ...existingQraData,
        [qraKey]: {
          activityName,
          activityId,
          year,
          practicePercent: qraData.practicePercent || 0,
          nonRDTime: qraData.nonRDTime || 0,
          totalAppliedPercent: qraData.totalAppliedPercent || 0,
          selectedSubcomponents: qraData.selectedSubcomponents || {},
          isLocked: qraData.isLocked || false,
          lastUpdated: new Date().toISOString()
        }
      };

      // Update the business record
      const { error: updateError } = await supabase
        .from('businesses')
        .update({ 
          qra_data: updatedQraData,
          updated_at: new Date().toISOString()
        })
        .eq('id', businessId);

      if (updateError) {
        console.error('Error updating business QRA data:', updateError);
        return false;
      }

      console.log(`[QRABuilderService] Successfully saved QRA data for activity: ${activityName}`);
      return true;
    } catch (error) {
      console.error('Error saving QRA data:', error);
      return false;
    }
  }

  /**
   * Load QRA data for a specific activity from JSONB storage
   */
  static async loadQRAData(
    businessId: string,
    year: number,
    activityId: string
  ): Promise<SubcomponentSelectionData | null> {
    try {
      console.log(`[QRABuilderService] Loading QRA data for activity: ${activityId}`);

      // Get QRA data from businesses table
      const { data: business, error } = await supabase
        .from('businesses')
        .select('qra_data')
        .eq('id', businessId)
        .single();

      if (error) {
        console.error('Error loading business QRA data:', error);
        return null;
      }

      if (!business?.qra_data) {
        console.log(`[QRABuilderService] No QRA data found for business: ${businessId}`);
        return null;
      }

      // Create the key for this activity
      const qraKey = `${year}_${activityId}`;
      const activityData = business.qra_data[qraKey];

      if (!activityData) {
        console.log(`[QRABuilderService] No QRA data found for activity: ${activityId}`);
        return null;
      }

      // Convert back to SubcomponentSelectionData format
      const qraData: SubcomponentSelectionData = {
        selectedSubcomponents: activityData.selectedSubcomponents || {},
        practicePercent: activityData.practicePercent || 0,
        nonRDTime: activityData.nonRDTime || 0,
        totalAppliedPercent: activityData.totalAppliedPercent || 0,
        isLocked: activityData.isLocked || false,
        lastUpdated: activityData.lastUpdated
      };

      console.log(`[QRABuilderService] Successfully loaded QRA data for activity: ${activityId}`);
      return qraData;
    } catch (error) {
      console.error('Error loading QRA data:', error);
      return null;
    }
  }

  /**
   * Get all QRA data for a business and year
   */
  static async getAllQRAData(
    businessId: string,
    year: number
  ): Promise<Record<string, SubcomponentSelectionData>> {
    try {
      console.log(`[QRABuilderService] Loading all QRA data for business: ${businessId}, year: ${year}`);

      const { data: business, error } = await supabase
        .from('businesses')
        .select('qra_data')
        .eq('id', businessId)
        .single();

      if (error) {
        console.error('Error loading business QRA data:', error);
        return {};
      }

      if (!business?.qra_data) {
        console.log(`[QRABuilderService] No QRA data found for business: ${businessId}`);
        return {};
      }

      const result: Record<string, SubcomponentSelectionData> = {};

      // Filter QRA data for the specific year
      Object.entries(business.qra_data).forEach(([key, activityData]: [string, any]) => {
        if (activityData.year === year) {
          result[activityData.activityId] = {
            selectedSubcomponents: activityData.selectedSubcomponents || {},
            practicePercent: activityData.practicePercent || 0,
            nonRDTime: activityData.nonRDTime || 0,
            totalAppliedPercent: activityData.totalAppliedPercent || 0,
            isLocked: activityData.isLocked || false,
            lastUpdated: activityData.lastUpdated
          };
        }
      });

      console.log(`[QRABuilderService] Successfully loaded QRA data for ${Object.keys(result).length} activities`);
      return result;
    } catch (error) {
      console.error('Error loading all QRA data:', error);
      return {};
    }
  }

  // =====================================================
  // CONFIGURATION OPERATIONS - USING JSONB STORAGE
  // =====================================================

  /**
   * Save employee configuration using JSONB storage
   */
  static async saveEmployeeConfiguration(
    businessId: string,
    year: number,
    config: EmployeeConfiguration
  ): Promise<boolean> {
    try {
      const { data: existingBusiness, error: fetchError } = await supabase
        .from('businesses')
        .select('employee_configs')
        .eq('id', businessId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching business data:', fetchError);
        return false;
      }

      const existingConfigs = existingBusiness?.employee_configs || {};
      const configKey = `${year}_${config.employeeId}`;
      
      const updatedConfigs = {
        ...existingConfigs,
        [configKey]: {
          ...config,
          lastUpdated: new Date().toISOString()
        }
      };

      const { error: updateError } = await supabase
        .from('businesses')
        .update({ 
          employee_configs: updatedConfigs,
          updated_at: new Date().toISOString()
        })
        .eq('id', businessId);

      if (updateError) {
        console.error('Error updating employee configuration:', updateError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error saving employee configuration:', error);
      return false;
    }
  }

  /**
   * Load employee configuration from JSONB storage
   */
  static async loadEmployeeConfiguration(
    businessId: string,
    year: number,
    employeeId: string
  ): Promise<EmployeeConfiguration | null> {
    try {
      const { data: business, error } = await supabase
        .from('businesses')
        .select('employee_configs')
        .eq('id', businessId)
        .single();

      if (error || !business?.employee_configs) {
        return null;
      }

      const configKey = `${year}_${employeeId}`;
      const config = business.employee_configs[configKey];

      return config || null;
    } catch (error) {
      console.error('Error loading employee configuration:', error);
      return null;
    }
  }

  /**
   * Get all employee configurations for a business and year
   */
  static async getAllEmployeeConfigurations(
    businessId: string,
    year: number
  ): Promise<EmployeeConfiguration[]> {
    try {
      const { data: business, error } = await supabase
        .from('businesses')
        .select('employee_configs')
        .eq('id', businessId)
        .single();

      if (error || !business?.employee_configs) {
        return [];
      }

      const configs: EmployeeConfiguration[] = [];
      Object.entries(business.employee_configs).forEach(([key, config]: [string, any]) => {
        if (config.year === year) {
          configs.push(config);
        }
      });

      return configs;
    } catch (error) {
      console.error('Error loading employee configurations:', error);
      return [];
    }
  }

  // =====================================================
  // CONTRACTOR CONFIGURATIONS
  // =====================================================

  static async saveContractorConfiguration(
    businessId: string,
    year: number,
    config: ContractorConfiguration
  ): Promise<boolean> {
    try {
      const { data: existingBusiness, error: fetchError } = await supabase
        .from('businesses')
        .select('contractor_configs')
        .eq('id', businessId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching business data:', fetchError);
        return false;
      }

      const existingConfigs = existingBusiness?.contractor_configs || {};
      const configKey = `${year}_${config.contractorId}`;
      
      const updatedConfigs = {
        ...existingConfigs,
        [configKey]: {
          ...config,
          lastUpdated: new Date().toISOString()
        }
      };

      const { error: updateError } = await supabase
        .from('businesses')
        .update({ 
          contractor_configs: updatedConfigs,
          updated_at: new Date().toISOString()
        })
        .eq('id', businessId);

      if (updateError) {
        console.error('Error updating contractor configuration:', updateError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error saving contractor configuration:', error);
      return false;
    }
  }

  static async loadContractorConfiguration(
    businessId: string,
    year: number,
    contractorId: string
  ): Promise<ContractorConfiguration | null> {
    try {
      const { data: business, error } = await supabase
        .from('businesses')
        .select('contractor_configs')
        .eq('id', businessId)
        .single();

      if (error || !business?.contractor_configs) {
        return null;
      }

      const configKey = `${year}_${contractorId}`;
      const config = business.contractor_configs[configKey];

      return config || null;
    } catch (error) {
      console.error('Error loading contractor configuration:', error);
      return null;
    }
  }

  static async getAllContractorConfigurations(
    businessId: string,
    year: number
  ): Promise<ContractorConfiguration[]> {
    try {
      const { data: business, error } = await supabase
        .from('businesses')
        .select('contractor_configs')
        .eq('id', businessId)
        .single();

      if (error || !business?.contractor_configs) {
        return [];
      }

      const configs: ContractorConfiguration[] = [];
      Object.entries(business.contractor_configs).forEach(([key, config]: [string, any]) => {
        if (config.year === year) {
          configs.push(config);
        }
      });

      return configs;
    } catch (error) {
      console.error('Error loading contractor configurations:', error);
      return [];
    }
  }

  // =====================================================
  // SUPPLY CONFIGURATIONS
  // =====================================================

  static async saveSupplyConfiguration(
    businessId: string,
    year: number,
    config: SupplyConfiguration
  ): Promise<boolean> {
    try {
      const { data: existingBusiness, error: fetchError } = await supabase
        .from('businesses')
        .select('supply_configs')
        .eq('id', businessId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching business data:', fetchError);
        return false;
      }

      const existingConfigs = existingBusiness?.supply_configs || {};
      const configKey = `${year}_${config.supplyId}`;
      
      const updatedConfigs = {
        ...existingConfigs,
        [configKey]: {
          ...config,
          lastUpdated: new Date().toISOString()
        }
      };

      const { error: updateError } = await supabase
        .from('businesses')
        .update({ 
          supply_configs: updatedConfigs,
          updated_at: new Date().toISOString()
        })
        .eq('id', businessId);

      if (updateError) {
        console.error('Error updating supply configuration:', updateError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error saving supply configuration:', error);
      return false;
    }
  }

  static async loadSupplyConfiguration(
    businessId: string,
    year: number,
    supplyId: string
  ): Promise<SupplyConfiguration | null> {
    try {
      const { data: business, error } = await supabase
        .from('businesses')
        .select('supply_configs')
        .eq('id', businessId)
        .single();

      if (error || !business?.supply_configs) {
        return null;
      }

      const configKey = `${year}_${supplyId}`;
      const config = business.supply_configs[configKey];

      return config || null;
    } catch (error) {
      console.error('Error loading supply configuration:', error);
      return null;
    }
  }

  static async getAllSupplyConfigurations(
    businessId: string,
    year: number
  ): Promise<SupplyConfiguration[]> {
    try {
      const { data: business, error } = await supabase
        .from('businesses')
        .select('supply_configs')
        .eq('id', businessId)
        .single();

      if (error || !business?.supply_configs) {
        return [];
      }

      const configs: SupplyConfiguration[] = [];
      Object.entries(business.supply_configs).forEach(([key, config]: [string, any]) => {
        if (config.year === year) {
          configs.push(config);
        }
      });

      return configs;
    } catch (error) {
      console.error('Error loading supply configurations:', error);
      return [];
    }
  }

  // =====================================================
  // RESEARCH ACTIVITY SELECTIONS
  // =====================================================

  static async saveResearchActivitySelection(
    businessId: string,
    year: number,
    selection: ResearchActivitySelection
  ): Promise<boolean> {
    try {
      const { data: existingBusiness, error: fetchError } = await supabase
        .from('businesses')
        .select('research_activity_selections')
        .eq('id', businessId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching business data:', fetchError);
        return false;
      }

      const existingSelections = existingBusiness?.research_activity_selections || {};
      const selectionKey = `${year}_${selection.researchActivityId}`;
      
      const updatedSelections = {
        ...existingSelections,
        [selectionKey]: {
          ...selection,
          lastUpdated: new Date().toISOString()
        }
      };

      const { error: updateError } = await supabase
        .from('businesses')
        .update({ 
          research_activity_selections: updatedSelections,
          updated_at: new Date().toISOString()
        })
        .eq('id', businessId);

      if (updateError) {
        console.error('Error updating research activity selection:', updateError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error saving research activity selection:', error);
      return false;
    }
  }

  static async getResearchActivitySelections(
    businessId: string,
    year: number
  ): Promise<ResearchActivitySelection[]> {
    try {
      const { data: business, error } = await supabase
        .from('businesses')
        .select('research_activity_selections')
        .eq('id', businessId)
        .single();

      if (error || !business?.research_activity_selections) {
        return [];
      }

      const selections: ResearchActivitySelection[] = [];
      Object.entries(business.research_activity_selections).forEach(([key, selection]: [string, any]) => {
        if (selection.year === year) {
          selections.push(selection);
        }
      });

      return selections;
    } catch (error) {
      console.error('Error loading research activity selections:', error);
      return [];
    }
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  static async getAllConfigurations(
    businessId: string,
    year: number
  ): Promise<{
    employees: EmployeeConfiguration[];
    contractors: ContractorConfiguration[];
    supplies: SupplyConfiguration[];
  }> {
    const [employees, contractors, supplies] = await Promise.all([
      this.getAllEmployeeConfigurations(businessId, year),
      this.getAllContractorConfigurations(businessId, year),
      this.getAllSupplyConfigurations(businessId, year)
    ]);

    return { employees, contractors, supplies };
  }

  static async deleteAllData(
    businessId: string,
    year: number
  ): Promise<boolean> {
    try {
      // Clear all configuration data for the year
      const { data: business, error: fetchError } = await supabase
        .from('businesses')
        .select('qra_data, employee_configs, contractor_configs, supply_configs, research_activity_selections')
        .eq('id', businessId)
        .single();

      if (fetchError) {
        console.error('Error fetching business data:', fetchError);
        return false;
      }

      // Filter out data for the specified year
      const clearYearData = (data: any) => {
        if (!data) return {};
        const filtered: any = {};
        Object.entries(data).forEach(([key, value]: [string, any]) => {
          if (value.year !== year) {
            filtered[key] = value;
          }
        });
        return filtered;
      };

      const updatedData = {
        qra_data: clearYearData(business.qra_data),
        employee_configs: clearYearData(business.employee_configs),
        contractor_configs: clearYearData(business.contractor_configs),
        supply_configs: clearYearData(business.supply_configs),
        research_activity_selections: clearYearData(business.research_activity_selections),
        updated_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('businesses')
        .update(updatedData)
        .eq('id', businessId);

      if (updateError) {
        console.error('Error deleting data:', updateError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting all data:', error);
      return false;
    }
  }
} 