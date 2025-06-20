export interface ActivityData {
  id: string;
  name: string;
  practicePercent: number;
  nonRDTime: number;
  active: boolean;
  selectedRoles: string[];
  category?: string;
  area?: string;
  focus?: string;
}

export interface QRASliderData {
  [activityId: string]: {
    value: number;
    locked: boolean;
  };
}

export interface ActivitiesTabData {
  activities: ActivityData[];
  qraSliderState: QRASliderData;
  nonRDTime: number;
  filter: {
    categories: string[];
    areas: string[];
    focuses: string[];
  };
  filterSectionLocked?: boolean;
  availableSectionLocked?: boolean;
  filterSectionExpanded?: boolean;
  availableSectionExpanded?: boolean;
}

class ActivitiesDataService {
  private readonly STORAGE_PREFIX = 'activities_data';

  // Get activities data for a specific business and year
  getActivitiesData(businessId: string, year: number): ActivitiesTabData | null {
    try {
      const key = `${this.STORAGE_PREFIX}_${businessId}_${year}`;
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  // Save activities data for a specific business and year
  saveActivitiesData(businessId: string, year: number, data: ActivitiesTabData): void {
    try {
      const key = `${this.STORAGE_PREFIX}_${businessId}_${year}`;
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save activities data:', error);
    }
  }

  // Get all years that have data for a business
  getDataYears(businessId: string): number[] {
    const years: number[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(`${this.STORAGE_PREFIX}_${businessId}_`)) {
        const year = parseInt(key.split('_').pop() || '0');
        if (year > 0) years.push(year);
      }
    }
    return years.sort((a, b) => a - b);
  }

  // Clear all data for a business
  clearBusinessData(businessId: string): void {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(`${this.STORAGE_PREFIX}_${businessId}_`)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  // Copy data from one year to another for the same business
  copyYearData(businessId: string, fromYear: number, toYear: number): boolean {
    try {
      const sourceData = this.getActivitiesData(businessId, fromYear);
      if (sourceData) {
        this.saveActivitiesData(businessId, toYear, sourceData);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // Export all data for potential migration to Supabase
  exportAllData(): Record<string, ActivitiesTabData> {
    const allData: Record<string, ActivitiesTabData> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.STORAGE_PREFIX)) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            allData[key] = JSON.parse(data);
          }
        } catch {
          // Skip invalid data
        }
      }
    }
    return allData;
  }
}

export const activitiesDataService = new ActivitiesDataService(); 