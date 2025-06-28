import { QRABuilderService } from './qrabuilderService';

// =====================================================
// MIGRATION SERVICE FOR QRABUILDER
// =====================================================

export interface MigrationResult {
  success: boolean;
  migrated: {
    qraData: number;
    employeeConfigs: number;
    contractorConfigs: number;
    supplyConfigs: number;
    researchSelections: number;
  };
  errors: string[];
  warnings: string[];
}

export class QRABuilderMigrationService {
  /**
   * Migrate all QRABuilder data from localStorage to Supabase
   */
  static async migrateAllData(
    businessId: string,
    year: number
  ): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: true,
      migrated: {
        qraData: 0,
        employeeConfigs: 0,
        contractorConfigs: 0,
        supplyConfigs: 0,
        researchSelections: 0
      },
      errors: [],
      warnings: []
    };

    try {
      console.log(`[MigrationService] Starting migration for business: ${businessId}, year: ${year}`);

      // 1. Migrate QRA Data
      const qraResult = await this.migrateQRAData(businessId, year);
      result.migrated.qraData = qraResult.migrated;
      result.errors.push(...qraResult.errors);
      result.warnings.push(...qraResult.warnings);

      // 2. Migrate Employee Configurations
      const employeeResult = await this.migrateEmployeeConfigurations(businessId, year);
      result.migrated.employeeConfigs = employeeResult.migrated;
      result.errors.push(...employeeResult.errors);
      result.warnings.push(...employeeResult.warnings);

      // 3. Migrate Contractor Configurations
      const contractorResult = await this.migrateContractorConfigurations(businessId, year);
      result.migrated.contractorConfigs = contractorResult.migrated;
      result.errors.push(...contractorResult.errors);
      result.warnings.push(...contractorResult.warnings);

      // 4. Migrate Supply Configurations
      const supplyResult = await this.migrateSupplyConfigurations(businessId, year);
      result.migrated.supplyConfigs = supplyResult.migrated;
      result.errors.push(...supplyResult.errors);
      result.warnings.push(...supplyResult.warnings);

      // 5. Migrate Research Activity Selections
      const researchResult = await this.migrateResearchActivitySelections(businessId, year);
      result.migrated.researchSelections = researchResult.migrated;
      result.errors.push(...researchResult.errors);
      result.warnings.push(...researchResult.warnings);

      // Check if migration was successful
      result.success = result.errors.length === 0;

      console.log(`[MigrationService] Migration completed. Success: ${result.success}`);
      console.log(`[MigrationService] Migrated:`, result.migrated);
      if (result.errors.length > 0) {
        console.error(`[MigrationService] Errors:`, result.errors);
      }
      if (result.warnings.length > 0) {
        console.warn(`[MigrationService] Warnings:`, result.warnings);
      }

    } catch (error) {
      result.success = false;
      result.errors.push(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('[MigrationService] Migration failed:', error);
    }

    return result;
  }

  /**
   * Migrate QRA data from localStorage
   */
  private static async migrateQRAData(
    businessId: string,
    year: number
  ): Promise<{ migrated: number; errors: string[]; warnings: string[] }> {
    const result = { migrated: 0, errors: [] as string[], warnings: [] as string[] };

    try {
      // Get all QRA keys for this business and year
      const allKeys = Object.keys(localStorage);
      const qraKeys = allKeys.filter(key => 
        key.startsWith(`qra_${businessId}_${year}_`)
      );

      console.log(`[MigrationService] Found ${qraKeys.length} QRA keys to migrate`);

      for (const key of qraKeys) {
        try {
          // Extract activity ID from key
          const activityId = key.replace(`qra_${businessId}_${year}_`, '');
          
          // Get data from localStorage
          const storedData = localStorage.getItem(key);
          if (!storedData) {
            result.warnings.push(`No data found for key: ${key}`);
            continue;
          }

          const qraData = JSON.parse(storedData);
          
          // Validate QRA data structure
          if (!this.validateQRAData(qraData)) {
            result.errors.push(`Invalid QRA data structure for key: ${key}`);
            continue;
          }

          // Get activity name from business data or use activity ID as fallback
          const activityName = await this.getActivityName(businessId, year, activityId) || activityId;
          
          // Save to Supabase
          const success = await QRABuilderService.saveQRAData(
            businessId,
            year,
            activityId,
            activityName,
            qraData
          );
          
          if (success) {
            result.migrated++;
            console.log(`[MigrationService] Successfully migrated QRA data for activity: ${activityId}`);
          } else {
            result.errors.push(`Failed to save QRA data for activity: ${activityId}`);
          }
        } catch (error) {
          result.errors.push(`Error migrating QRA data for key: ${key} - ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    } catch (error) {
      result.errors.push(`Error during QRA data migration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Migrate employee configurations from localStorage
   */
  private static async migrateEmployeeConfigurations(
    businessId: string,
    year: number
  ): Promise<{ migrated: number; errors: string[]; warnings: string[] }> {
    const result = { migrated: 0, errors: [] as string[], warnings: [] as string[] };

    try {
      // Get all employee keys for this business and year
      const allKeys = Object.keys(localStorage);
      const employeeKeys = allKeys.filter(key => 
        key.startsWith(`employee_${businessId}_${year}_`)
      );

      console.log(`[MigrationService] Found ${employeeKeys.length} employee configuration keys to migrate`);

      for (const key of employeeKeys) {
        try {
          // Extract employee ID from key
          const employeeId = key.replace(`employee_${businessId}_${year}_`, '');
          
          // Get data from localStorage
          const storedData = localStorage.getItem(key);
          if (!storedData) {
            result.warnings.push(`No data found for key: ${key}`);
            continue;
          }

          const employeeData = JSON.parse(storedData);
          
          // Validate employee data structure
          if (!this.validateEmployeeData(employeeData)) {
            result.errors.push(`Invalid employee data structure for key: ${key}`);
            continue;
          }

          // Create configuration object
          const config = {
            employeeId: employeeId,
            employeeName: employeeData.firstName && employeeData.lastName ? 
              `${employeeData.firstName} ${employeeData.lastName}` : 
              employeeData.name || 'Unknown Employee',
            practicePercentages: employeeData.customPracticePercentages || {},
            timePercentages: employeeData.customTimePercentages || {},
            roleAssignments: employeeData.roleAssignments || {},
            appliedPercentage: employeeData.appliedPercentage || 0,
            appliedAmount: employeeData.appliedAmount || 0,
            isLocked: employeeData.isLocked || false
          };
          
          // Save to Supabase
          const success = await QRABuilderService.saveEmployeeConfiguration(
            businessId,
            year,
            config
          );
          
          if (success) {
            result.migrated++;
            console.log(`[MigrationService] Successfully migrated employee configuration for: ${employeeId}`);
          } else {
            result.errors.push(`Failed to save employee configuration for: ${employeeId}`);
          }
        } catch (error) {
          result.errors.push(`Error migrating employee configuration for key: ${key} - ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    } catch (error) {
      result.errors.push(`Error during employee configuration migration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Migrate contractor configurations from localStorage
   */
  private static async migrateContractorConfigurations(
    businessId: string,
    year: number
  ): Promise<{ migrated: number; errors: string[]; warnings: string[] }> {
    const result = { migrated: 0, errors: [] as string[], warnings: [] as string[] };

    try {
      // Get all contractor keys for this business and year
      const allKeys = Object.keys(localStorage);
      const contractorKeys = allKeys.filter(key => 
        key.startsWith(`contractor_${businessId}_${year}_`)
      );

      console.log(`[MigrationService] Found ${contractorKeys.length} contractor configuration keys to migrate`);

      for (const key of contractorKeys) {
        try {
          // Extract contractor ID from key
          const contractorId = key.replace(`contractor_${businessId}_${year}_`, '');
          
          // Get data from localStorage
          const storedData = localStorage.getItem(key);
          if (!storedData) {
            result.warnings.push(`No data found for key: ${key}`);
            continue;
          }

          const contractorData = JSON.parse(storedData);
          
          // Validate contractor data structure
          if (!this.validateContractorData(contractorData)) {
            result.errors.push(`Invalid contractor data structure for key: ${key}`);
            continue;
          }

          // Create configuration object
          const config = {
            contractorId: contractorId,
            contractorName: contractorData.contractorType === 'individual' && contractorData.firstName && contractorData.lastName ? 
              `${contractorData.firstName} ${contractorData.lastName}` : 
              contractorData.businessName || 'Unknown Contractor',
            contractorType: contractorData.contractorType || 'individual',
            practicePercentages: contractorData.customPracticePercentages || {},
            timePercentages: contractorData.customTimePercentages || {},
            roleAssignments: contractorData.roleAssignments || {},
            appliedPercentage: contractorData.appliedPercentage || 0,
            appliedAmount: contractorData.appliedAmount || 0,
            isLocked: contractorData.isLocked || false
          };
          
          // Save to Supabase
          const success = await QRABuilderService.saveContractorConfiguration(
            businessId,
            year,
            config
          );
          
          if (success) {
            result.migrated++;
            console.log(`[MigrationService] Successfully migrated contractor configuration for: ${contractorId}`);
          } else {
            result.errors.push(`Failed to save contractor configuration for: ${contractorId}`);
          }
        } catch (error) {
          result.errors.push(`Error migrating contractor configuration for key: ${key} - ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    } catch (error) {
      result.errors.push(`Error during contractor configuration migration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Migrate supply configurations from localStorage
   */
  private static async migrateSupplyConfigurations(
    businessId: string,
    year: number
  ): Promise<{ migrated: number; errors: string[]; warnings: string[] }> {
    const result = { migrated: 0, errors: [] as string[], warnings: [] as string[] };

    try {
      // Get all supply keys for this business and year
      const allKeys = Object.keys(localStorage);
      const supplyKeys = allKeys.filter(key => 
        key.startsWith(`supply_${businessId}_${year}_`)
      );

      console.log(`[MigrationService] Found ${supplyKeys.length} supply configuration keys to migrate`);

      for (const key of supplyKeys) {
        try {
          // Extract supply ID from key
          const supplyId = key.replace(`supply_${businessId}_${year}_`, '');
          
          // Get data from localStorage
          const storedData = localStorage.getItem(key);
          if (!storedData) {
            result.warnings.push(`No data found for key: ${key}`);
            continue;
          }

          const supplyData = JSON.parse(storedData);
          
          // Validate supply data structure
          if (!this.validateSupplyData(supplyData)) {
            result.errors.push(`Invalid supply data structure for key: ${key}`);
            continue;
          }

          // Create configuration object
          const config = {
            supplyId: supplyId,
            supplyName: supplyData.name || 'Unknown Supply',
            supplyCategory: supplyData.category,
            activityPercentages: supplyData.customActivityPercentages || {},
            subcomponentPercentages: supplyData.customSubcomponentPercentages || {},
            selectedSubcomponents: supplyData.selectedSubcomponents || {},
            appliedPercentage: supplyData.appliedPercentage || 0,
            appliedAmount: supplyData.appliedAmount || 0,
            isLocked: supplyData.isLocked || false
          };
          
          // Save to Supabase
          const success = await QRABuilderService.saveSupplyConfiguration(
            businessId,
            year,
            config
          );
          
          if (success) {
            result.migrated++;
            console.log(`[MigrationService] Successfully migrated supply configuration for: ${supplyId}`);
          } else {
            result.errors.push(`Failed to save supply configuration for: ${supplyId}`);
          }
        } catch (error) {
          result.errors.push(`Error migrating supply configuration for key: ${key} - ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    } catch (error) {
      result.errors.push(`Error during supply configuration migration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Migrate research activity selections from localStorage
   */
  private static async migrateResearchActivitySelections(
    businessId: string,
    year: number
  ): Promise<{ migrated: number; errors: string[]; warnings: string[] }> {
    const result = { migrated: 0, errors: [] as string[], warnings: [] as string[] };

    try {
      // Get business data to find selected activities
      const STORAGE_KEY = 'businessInfoData';
      const savedData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      const business = savedData.businesses?.find((b: any) => b.id === businessId);
      const yearData = business?.years?.[year];
      const activities = yearData?.activities || {};

      console.log(`[MigrationService] Found ${Object.keys(activities).length} activities to check for selections`);

      // Check each activity to see if it's selected
      for (const [activityId, activity] of Object.entries(activities)) {
        try {
          const activityData = activity as any;
          
          if (activityData.isSelected) {
            // Create selection object
            const selection = {
              researchActivityId: activityId,
              isSelected: true,
              customName: activityData.customName,
              customDescription: activityData.customDescription,
              practicePercent: activityData.practicePercent || 0
            };
            
            // Save to Supabase
            const success = await QRABuilderService.saveResearchActivitySelection(
              businessId,
              year,
              selection
            );
            
            if (success) {
              result.migrated++;
              console.log(`[MigrationService] Successfully migrated research activity selection for: ${activityId}`);
            } else {
              result.errors.push(`Failed to save research activity selection for: ${activityId}`);
            }
          }
        } catch (error) {
          result.errors.push(`Error migrating research activity selection for: ${activityId} - ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    } catch (error) {
      result.errors.push(`Error during research activity selection migration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  // =====================================================
  // VALIDATION FUNCTIONS
  // =====================================================

  /**
   * Validate QRA data structure
   */
  private static validateQRAData(data: any): boolean {
    return data && 
           typeof data === 'object' &&
           (data.selectedSubcomponents === undefined || typeof data.selectedSubcomponents === 'object') &&
           (data.practicePercent === undefined || typeof data.practicePercent === 'number') &&
           (data.nonRDTime === undefined || typeof data.nonRDTime === 'number') &&
           (data.totalAppliedPercent === undefined || typeof data.totalAppliedPercent === 'number');
  }

  /**
   * Validate employee data structure
   */
  private static validateEmployeeData(data: any): boolean {
    return data && 
           typeof data === 'object' &&
           (data.firstName === undefined || typeof data.firstName === 'string') &&
           (data.lastName === undefined || typeof data.lastName === 'string') &&
           (data.name === undefined || typeof data.name === 'string');
  }

  /**
   * Validate contractor data structure
   */
  private static validateContractorData(data: any): boolean {
    return data && 
           typeof data === 'object' &&
           (data.firstName === undefined || typeof data.firstName === 'string') &&
           (data.lastName === undefined || typeof data.lastName === 'string') &&
           (data.businessName === undefined || typeof data.businessName === 'string') &&
           (data.contractorType === undefined || ['individual', 'business'].includes(data.contractorType));
  }

  /**
   * Validate supply data structure
   */
  private static validateSupplyData(data: any): boolean {
    return data && 
           typeof data === 'object' &&
           (data.name === undefined || typeof data.name === 'string') &&
           (data.category === undefined || typeof data.category === 'string');
  }

  // =====================================================
  // HELPER FUNCTIONS
  // =====================================================

  /**
   * Get activity name from business data
   */
  private static async getActivityName(
    businessId: string,
    year: number,
    activityId: string
  ): Promise<string | null> {
    try {
      const STORAGE_KEY = 'businessInfoData';
      const savedData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      const business = savedData.businesses?.find((b: any) => b.id === businessId);
      const yearData = business?.years?.[year];
      const activities = yearData?.activities || {};
      
      const activity = activities[activityId];
      return activity?.name || null;
    } catch (error) {
      console.warn(`Error getting activity name for ${activityId}:`, error);
      return null;
    }
  }

  /**
   * Validate migration by comparing localStorage and Supabase data
   */
  static async validateMigration(
    businessId: string,
    year: number
  ): Promise<{
    success: boolean;
    discrepancies: string[];
    localStorageCount: number;
    supabaseCount: number;
  }> {
    const result = {
      success: true,
      discrepancies: [] as string[],
      localStorageCount: 0,
      supabaseCount: 0
    };

    try {
      // Count localStorage items
      const allKeys = Object.keys(localStorage);
      const qraKeys = allKeys.filter(key => key.startsWith(`qra_${businessId}_${year}_`));
      const employeeKeys = allKeys.filter(key => key.startsWith(`employee_${businessId}_${year}_`));
      const contractorKeys = allKeys.filter(key => key.startsWith(`contractor_${businessId}_${year}_`));
      const supplyKeys = allKeys.filter(key => key.startsWith(`supply_${businessId}_${year}_`));

      result.localStorageCount = qraKeys.length + employeeKeys.length + contractorKeys.length + supplyKeys.length;

      // Count Supabase items
      const qraData = await QRABuilderService.getAllQRAData(businessId, year);
      const configs = await QRABuilderService.getAllConfigurations(businessId, year);

      result.supabaseCount = Object.keys(qraData).length + 
                           configs.employees.length + 
                           configs.contractors.length + 
                           configs.supplies.length;

      // Check for discrepancies
      if (result.localStorageCount !== result.supabaseCount) {
        result.discrepancies.push(
          `Count mismatch: localStorage has ${result.localStorageCount} items, Supabase has ${result.supabaseCount} items`
        );
        result.success = false;
      }

      // Additional validation could be added here
      // For example, comparing specific data values

    } catch (error) {
      result.success = false;
      result.discrepancies.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Clean up localStorage after successful migration
   */
  static async cleanupLocalStorage(
    businessId: string,
    year: number
  ): Promise<{ success: boolean; cleaned: number; errors: string[] }> {
    const result = { success: true, cleaned: 0, errors: [] as string[] };

    try {
      const allKeys = Object.keys(localStorage);
      const keysToClean = allKeys.filter(key => 
        key.startsWith(`qra_${businessId}_${year}_`) ||
        key.startsWith(`employee_${businessId}_${year}_`) ||
        key.startsWith(`contractor_${businessId}_${year}_`) ||
        key.startsWith(`supply_${businessId}_${year}_`)
      );

      console.log(`[MigrationService] Cleaning up ${keysToClean.length} localStorage keys`);

      for (const key of keysToClean) {
        try {
          localStorage.removeItem(key);
          result.cleaned++;
        } catch (error) {
          result.errors.push(`Error removing key ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      result.success = result.errors.length === 0;
      console.log(`[MigrationService] Cleanup completed. Removed ${result.cleaned} keys`);

    } catch (error) {
      result.success = false;
      result.errors.push(`Cleanup error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }
} 