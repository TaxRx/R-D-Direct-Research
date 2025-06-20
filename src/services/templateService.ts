import { activitiesDataService, ActivitiesTabData } from './activitiesDataService';
import { RoleNode } from '../types/Business';

export interface UnifiedTemplateData {
  templateName: string;
  donorYear: number;
  businessId: string;
  timestamp: number;
  
  // Activities data
  activities: any[];
  qraSliderState: Record<string, { value: number; locked: boolean }>;
  nonRDTime: number;
  filter: {
    categories: string[];
    areas: string[];
    focuses: string[];
  };
  
  // Roles data
  roles: RoleNode[];
  
  // QRA subcomponents data (filtered by year)
  qraData: Record<string, any>;
  
  // Approval states (will be cleared when template is applied)
  activitiesApprovalState: boolean;
  rolesApprovalState: boolean;
}

export class UnifiedTemplateService {
  private static getStorageKey(templateName: string): string {
    return `unified_template_${templateName}`;
  }

  static saveTemplate(
    businessId: string,
    donorYear: number,
    templateName: string,
    getCurrentActivitiesData: () => any,
    getCurrentRolesData: () => RoleNode[],
    getCurrentQRAData: () => Record<string, any>
  ): void {
    try {
      const activitiesData = getCurrentActivitiesData();
      const rolesData = getCurrentRolesData();
      const qraData = getCurrentQRAData();

      const template: UnifiedTemplateData = {
        templateName,
        donorYear,
        businessId,
        timestamp: Date.now(),
        
        // Activities data
        activities: activitiesData.activities || [],
        qraSliderState: activitiesData.qraSliderState || {},
        nonRDTime: activitiesData.nonRDTime || 0,
        filter: activitiesData.filter || { categories: [], areas: [], focuses: [] },
        
        // Roles data
        roles: rolesData || [],
        
        // QRA data
        qraData: qraData || {},
        
        // Approval states
        activitiesApprovalState: activitiesData.approvalState || false,
        rolesApprovalState: false // Will be determined when saving
      };

      localStorage.setItem(this.getStorageKey(templateName), JSON.stringify(template));
    } catch (error) {
      console.error('Error saving unified template:', error);
      throw new Error('Failed to save template');
    }
  }

  static getTemplates(): UnifiedTemplateData[] {
    try {
      const templates: UnifiedTemplateData[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('unified_template_')) {
          try {
            const templateData = localStorage.getItem(key);
            if (templateData) {
              const template = JSON.parse(templateData);
              templates.push(template);
            }
          } catch (error) {
            console.warn(`Failed to parse template from key ${key}:`, error);
          }
        }
      }
      
      return templates.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Error loading templates:', error);
      return [];
    }
  }

  static async applyTemplate(
    templateName: string,
    targetBusinessId: string,
    targetYear: number,
    updateActivities: (data: any) => void,
    updateRoles: (roles: RoleNode[]) => void,
    updateQRAData: (data: Record<string, any>) => void
  ): Promise<void> {
    try {
      const templateData = localStorage.getItem(this.getStorageKey(templateName));
      if (!templateData) {
        throw new Error('Template not found');
      }

      const template: UnifiedTemplateData = JSON.parse(templateData);

      // Filter QRA subcomponents based on target year
      // Include subcomponents where year <= targetYear (so 2023 subcomponent applies to 2023, 2024, etc., but not 2022)
      const filteredQRAData = this.filterQRADataByYear(template.qraData, targetYear);

      // Apply activities data to both activitiesDataService and business state
      const activitiesData: ActivitiesTabData = {
        activities: template.activities,
        qraSliderState: template.qraSliderState,
        nonRDTime: template.nonRDTime,
        filter: template.filter
      };

      // Save to activities data service
      await activitiesDataService.saveActivitiesData(targetBusinessId, targetYear, activitiesData);
      
      // Update the business state as well by converting activities to the expected format
      const businessActivitiesData: Record<string, any> = {};
      template.activities.forEach(activity => {
        businessActivitiesData[activity.id] = {
          name: activity.name,
          practicePercent: activity.practicePercent || 0,
          nonRDTime: activity.nonRDTime || 0,
          active: activity.active !== undefined ? activity.active : true,
          selectedRoles: activity.selectedRoles || [],
          category: activity.category,
          area: activity.area,
          focus: activity.focus
        };
      });

      // Update business state in localStorage
      const STORAGE_KEY = 'businessInfoData';
      const savedData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      if (savedData.businesses) {
        const updatedBusinesses = savedData.businesses.map((business: any) => {
          if (business.id === targetBusinessId) {
            return {
              ...business,
              years: {
                ...business.years,
                [targetYear]: {
                  ...business.years?.[targetYear],
                  activities: businessActivitiesData,
                  qraData: filteredQRAData
                }
              },
              qraSliderByYear: {
                ...business.qraSliderByYear,
                [targetYear]: template.qraSliderState
              },
              nonRDByYear: {
                ...business.nonRDByYear,
                [targetYear]: template.nonRDTime
              }
            };
          }
          return business;
        });
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          ...savedData,
          businesses: updatedBusinesses
        }));
      }

      // Update React state
      updateActivities(activitiesData);

      // Apply roles data
      const rolesKey = `roles-${targetYear}`;
      localStorage.setItem(rolesKey, JSON.stringify(template.roles));
      updateRoles(template.roles);

      // Apply filtered QRA data
      updateQRAData(filteredQRAData);

      // Clear any existing approvals since we're applying new data
      localStorage.removeItem(`activitiesTabApproval-${targetYear}`);
      localStorage.removeItem(`rolesTabApproval-${targetYear}`);

    } catch (error) {
      console.error('Error applying template:', error);
      throw new Error('Failed to apply template');
    }
  }

  private static filterQRADataByYear(qraData: Record<string, any>, targetYear: number): Record<string, any> {
    const filtered: Record<string, any> = {};

    for (const [activityKey, activityData] of Object.entries(qraData)) {
      if (activityData && typeof activityData === 'object') {
        const filteredActivity: any = { ...activityData };

        // Filter subcomponents if they exist
        // Include subcomponents where subcomponent.year <= targetYear
        // This means a 2023 subcomponent can be applied to 2023, 2024, etc., but not to 2022
        if (activityData.subcomponents && Array.isArray(activityData.subcomponents)) {
          filteredActivity.subcomponents = activityData.subcomponents.filter((sub: any) => {
            // If subcomponent has a year property, only include if year <= targetYear
            if (sub.year && typeof sub.year === 'number') {
              return sub.year <= targetYear;
            }
            // If no year property, include it (assume it's valid for all years)
            return true;
          });
        }

        // Filter any nested year-specific data
        if (activityData.yearData && typeof activityData.yearData === 'object') {
          filteredActivity.yearData = {};
          for (const [year, yearData] of Object.entries(activityData.yearData)) {
            const yearNum = parseInt(year);
            if (yearNum <= targetYear) {
              filteredActivity.yearData[year] = yearData;
            }
          }
        }

        filtered[activityKey] = filteredActivity;
      } else {
        // If it's not an object, just copy it as-is
        filtered[activityKey] = activityData;
      }
    }

    return filtered;
  }

  static deleteTemplate(templateName: string): void {
    try {
      localStorage.removeItem(this.getStorageKey(templateName));
    } catch (error) {
      console.error('Error deleting template:', error);
      throw new Error('Failed to delete template');
    }
  }

  static getTemplate(templateName: string): UnifiedTemplateData | null {
    try {
      const templateData = localStorage.getItem(this.getStorageKey(templateName));
      if (!templateData) {
        return null;
      }
      return JSON.parse(templateData);
    } catch (error) {
      console.error('Error loading template:', error);
      return null;
    }
  }
}