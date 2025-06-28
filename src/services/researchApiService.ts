import { supabase } from './supabase';

export interface ResearchApiRow {
  Category: string;
  Area: string;
  Focus: string;
  'Research Activity': string;
  Subcomponent: string;
  Phase: string;
  Step: string;
  Hint: string;
  'General Description': string;
  Goal: string;
  Hypothesis: string;
  Uncertainties: string;
  Alternatives: string;
  'Developmental Process': string;
  'Time %?': string;
  Roles: string;
  'Decision Category': string;
  'Expected Outcome Type': string;
  'CPT Codes': string;
  'CDT Codes': string;
  'Product/Technology Options': string;
}

export interface ResearchApiData {
  generalDescription: string;
  goal: string;
  hypothesis: string;
  uncertainties: string;
  alternatives: string;
  developmentalProcess: string;
  hint: string;
  phase: string;
  step: string;
  roles: string;
  decisionCategory: string;
  expectedOutcomeType: string;
  cptCodes: string;
  cdtCodes: string;
  productTechnologyOptions: string;
}

export interface SubcomponentResearchData {
  subcomponentId: string;
  subcomponentName: string;
  researchData: ResearchApiData;
  userNotes?: string;
  userModifications?: Partial<ResearchApiData>;
}

export interface ResearchApiCategory {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ResearchApiArea {
  id: string;
  category_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ResearchApiFocus {
  id: string;
  area_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ResearchApiActivity {
  id: string;
  focus_id: string;
  name: string;
  general_description?: string;
  goal?: string;
  hypothesis?: string;
  alternatives?: string;
  uncertainties?: string;
  developmental_process?: string;
  primary_goal?: string;
  expected_outcome_type?: string;
  cpt_codes?: string[];
  cdt_codes?: string[];
  alternative_paths?: string;
  is_limited_access: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ResearchApiPhase {
  id: string;
  activity_id: string;
  name: string;
  description?: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ResearchApiStep {
  id: string;
  phase_id: string;
  name: string;
  description?: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ResearchApiSubcomponent {
  id: string;
  step_id: string;
  name: string;
  hint?: string;
  description?: string;
  is_limited_access: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ResearchApiHierarchyRow {
  category_id: string;
  category_name: string;
  area_id: string;
  area_name: string;
  focus_id: string;
  focus_name: string;
  activity_id: string;
  activity_name: string;
  activity_description?: string;
  activity_goal?: string;
  activity_hypothesis?: string;
  activity_alternatives?: string;
  activity_uncertainties?: string;
  activity_developmental_process?: string;
  activity_primary_goal?: string;
  activity_expected_outcome_type?: string;
  activity_cpt_codes?: string[];
  activity_cdt_codes?: string[];
  activity_alternative_paths?: string;
  activity_is_limited_access: boolean;
  phase_id?: string;
  phase_name?: string;
  phase_description?: string;
  phase_order?: number;
  step_id?: string;
  step_name?: string;
  step_description?: string;
  step_order?: number;
  subcomponent_id?: string;
  subcomponent_name?: string;
  subcomponent_hint?: string;
  subcomponent_description?: string;
  subcomponent_is_limited_access?: boolean;
}

export interface ResearchApiAccessControl {
  id: string;
  entity_type: 'activity' | 'subcomponent';
  entity_id: string;
  user_id?: string;
  ip_address?: string;
  access_granted_at: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

// Legacy interface for backward compatibility
export interface ResearchActivity {
  id: string;
  category: string;
  area: string;
  focus: string;
  researchActivity: string;
  subcomponent?: string;
  phase?: string;
  step?: string;
  hint?: string;
  generalDescription?: string;
  goal?: string;
  hypothesis?: string;
  alternatives?: string;
  uncertainties?: string;
  developmentalProcess?: string;
  primaryGoal?: string;
  expectedOutcomeType?: string;
  cptCodes?: string[];
  cdtCodes?: string[];
  alternativePaths?: string;
  isLimitedAccess?: boolean;
}

class ResearchApiService {
  private cache: {
    categories?: ResearchApiCategory[];
    areas?: ResearchApiArea[];
    focuses?: ResearchApiFocus[];
    activities?: ResearchApiActivity[];
    phases?: ResearchApiPhase[];
    steps?: ResearchApiStep[];
    subcomponents?: ResearchApiSubcomponent[];
    hierarchy?: ResearchApiHierarchyRow[];
  } = {};

  private cacheExpiry = 5 * 60 * 1000; // 5 minutes
  private lastCacheTime = 0;

  /**
   * Get all categories
   */
  async getCategories(): Promise<ResearchApiCategory[]> {
    if (this.cache.categories && Date.now() - this.lastCacheTime < this.cacheExpiry) {
      return this.cache.categories;
    }

    const { data, error } = await supabase
      .from('research_api_categories')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }

    this.cache.categories = data || [];
    this.lastCacheTime = Date.now();
    return this.cache.categories;
  }

  /**
   * Get areas by category
   */
  async getAreasByCategory(categoryId: string): Promise<ResearchApiArea[]> {
    const { data, error } = await supabase
      .from('research_api_areas')
      .select('*')
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching areas:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get focuses by area
   */
  async getFocusesByArea(areaId: string): Promise<ResearchApiFocus[]> {
    const { data, error } = await supabase
      .from('research_api_focuses')
      .select('*')
      .eq('area_id', areaId)
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching focuses:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get activities by focus
   */
  async getActivitiesByFocus(focusId: string): Promise<ResearchApiActivity[]> {
    const { data, error } = await supabase
      .from('research_api_activities')
      .select('*')
      .eq('focus_id', focusId)
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching activities:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get phases by activity
   */
  async getPhasesByActivity(activityId: string): Promise<ResearchApiPhase[]> {
    const { data, error } = await supabase
      .from('research_api_phases')
      .select('*')
      .eq('activity_id', activityId)
      .eq('is_active', true)
      .order('order_index');

    if (error) {
      console.error('Error fetching phases:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get steps by phase
   */
  async getStepsByPhase(phaseId: string): Promise<ResearchApiStep[]> {
    const { data, error } = await supabase
      .from('research_api_steps')
      .select('*')
      .eq('phase_id', phaseId)
      .eq('is_active', true)
      .order('order_index');

    if (error) {
      console.error('Error fetching steps:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get subcomponents by step
   */
  async getSubcomponentsByStep(stepId: string): Promise<ResearchApiSubcomponent[]> {
    const { data, error } = await supabase
      .from('research_api_subcomponents')
      .select('*')
      .eq('step_id', stepId)
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching subcomponents:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get the full hierarchy view
   */
  async getHierarchy(): Promise<ResearchApiHierarchyRow[]> {
    if (this.cache.hierarchy && Date.now() - this.lastCacheTime < this.cacheExpiry) {
      return this.cache.hierarchy;
    }

    const { data, error } = await supabase
      .from('research_api_hierarchy')
      .select('*');

    if (error) {
      console.error('Error fetching hierarchy:', error);
      throw error;
    }

    this.cache.hierarchy = data || [];
    this.lastCacheTime = Date.now();
    return this.cache.hierarchy;
  }

  /**
   * Search activities by name or description
   */
  async searchActivities(query: string): Promise<ResearchApiActivity[]> {
    const { data, error } = await supabase
      .from('research_api_activities')
      .select('*')
      .eq('is_active', true)
      .or(`name.ilike.%${query}%,general_description.ilike.%${query}%`)
      .order('name');

    if (error) {
      console.error('Error searching activities:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get activities by category
   */
  async getActivitiesByCategory(categoryName: string): Promise<ResearchApiActivity[]> {
    const { data, error } = await supabase
      .from('research_api_hierarchy')
      .select('*')
      .eq('category_name', categoryName)
      .not('activity_id', 'is', null);

    if (error) {
      console.error('Error fetching activities by category:', error);
      throw error;
    }

    // Convert hierarchy rows to activities
    const activities: ResearchApiActivity[] = data?.map(row => ({
      id: row.activity_id,
      focus_id: row.focus_id,
      name: row.activity_name,
      general_description: row.activity_description,
      goal: row.activity_goal,
      hypothesis: row.activity_hypothesis,
      alternatives: row.activity_alternatives,
      uncertainties: row.activity_uncertainties,
      developmental_process: row.activity_developmental_process,
      primary_goal: row.activity_primary_goal,
      expected_outcome_type: row.activity_expected_outcome_type,
      cpt_codes: row.activity_cpt_codes,
      cdt_codes: row.activity_cdt_codes,
      alternative_paths: row.activity_alternative_paths,
      is_limited_access: row.activity_is_limited_access,
      is_active: true,
      created_at: '',
      updated_at: ''
    })) || [];

    return activities;
  }

  /**
   * Get subcomponents by activity
   */
  async getSubcomponentsByActivity(activityName: string): Promise<ResearchApiSubcomponent[]> {
    const { data, error } = await supabase
      .from('research_api_hierarchy')
      .select('*')
      .eq('activity_name', activityName)
      .not('subcomponent_id', 'is', null);

    if (error) {
      console.error('Error fetching subcomponents by activity:', error);
      throw error;
    }

    // Convert hierarchy rows to subcomponents
    const subcomponents: ResearchApiSubcomponent[] = data?.map(row => ({
      id: row.subcomponent_id!,
      step_id: row.step_id!,
      name: row.subcomponent_name!,
      hint: row.subcomponent_hint,
      description: row.subcomponent_description,
      is_limited_access: row.subcomponent_is_limited_access || false,
      is_active: true,
      created_at: '',
      updated_at: ''
    })) || [];

    return subcomponents;
  }

  /**
   * Check if user has access to limited content
   */
  async hasAccess(entityType: 'activity' | 'subcomponent', entityId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('has_research_api_access', {
      p_entity_type: entityType,
      p_entity_id: entityId
    });

    if (error) {
      console.error('Error checking access:', error);
      return false;
    }

    return data || false;
  }

  /**
   * Grant access to limited content
   */
  async grantAccess(
    entityType: 'activity' | 'subcomponent',
    entityId: string,
    userId?: string,
    ipAddress?: string,
    expiresAt?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('research_api_access_controls')
      .upsert({
        entity_type: entityType,
        entity_id: entityId,
        user_id: userId,
        ip_address: ipAddress,
        expires_at: expiresAt
      });

    if (error) {
      console.error('Error granting access:', error);
      throw error;
    }
  }

  /**
   * Convert hierarchy data to legacy format for backward compatibility
   */
  convertToLegacyFormat(hierarchyRow: ResearchApiHierarchyRow): ResearchActivity {
    return {
      id: hierarchyRow.activity_id,
      category: hierarchyRow.category_name,
      area: hierarchyRow.area_name,
      focus: hierarchyRow.focus_name,
      researchActivity: hierarchyRow.activity_name,
      subcomponent: hierarchyRow.subcomponent_name,
      phase: hierarchyRow.phase_name,
      step: hierarchyRow.step_name,
      hint: hierarchyRow.subcomponent_hint,
      generalDescription: hierarchyRow.activity_description,
      goal: hierarchyRow.activity_goal,
      hypothesis: hierarchyRow.activity_hypothesis,
      alternatives: hierarchyRow.activity_alternatives,
      uncertainties: hierarchyRow.activity_uncertainties,
      developmentalProcess: hierarchyRow.activity_developmental_process,
      primaryGoal: hierarchyRow.activity_primary_goal,
      expectedOutcomeType: hierarchyRow.activity_expected_outcome_type,
      cptCodes: hierarchyRow.activity_cpt_codes,
      cdtCodes: hierarchyRow.activity_cdt_codes,
      alternativePaths: hierarchyRow.activity_alternative_paths,
      isLimitedAccess: hierarchyRow.activity_is_limited_access
    };
  }

  /**
   * Get all activities in legacy format
   */
  async getAllActivitiesLegacy(): Promise<ResearchActivity[]> {
    const hierarchy = await this.getHierarchy();
    
    // Group by activity to avoid duplicates
    const activityMap = new Map<string, ResearchActivity>();
    
    hierarchy.forEach(row => {
      if (row.activity_id && !activityMap.has(row.activity_id)) {
        activityMap.set(row.activity_id, this.convertToLegacyFormat(row));
      }
    });
    
    return Array.from(activityMap.values());
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache = {};
    this.lastCacheTime = 0;
  }
}

export const researchApiService = new ResearchApiService();

// Supabase-based functions to replace CSV functionality
export const loadResearchApiData = async (): Promise<ResearchApiRow[]> => {
  try {
    // Load from Supabase instead of CSV
    const { data, error } = await supabase
      .from('research_api_activities')
      .select(`
        id,
        name,
        general_description,
        goal,
        hypothesis,
        alternatives,
        uncertainties,
        developmental_process,
        primary_goal,
        expected_outcome_type,
        cpt_codes,
        cdt_codes,
        alternative_paths,
        is_limited_access,
        is_active,
        created_at,
        updated_at,
        focus_id,
        research_api_focuses!inner(
          id,
          name,
          description,
          area_id,
          research_api_areas!inner(
            id,
            name,
            description,
            category_id,
            research_api_categories!inner(
              id,
              name,
              description
            )
          )
        )
      `)
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error loading research API data from Supabase:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Transform to legacy format
    return data.map(activity => {
      const focus = Array.isArray(activity.research_api_focuses)
        ? activity.research_api_focuses[0]
        : activity.research_api_focuses;
      let area = focus && Array.isArray(focus.research_api_areas)
        ? focus.research_api_areas[0]
        : focus?.research_api_areas;
      let areaObj = Array.isArray(area) ? area[0] : area;
      let categoryObj;
      if (areaObj && !Array.isArray(areaObj) && areaObj.research_api_categories) {
        categoryObj = Array.isArray(areaObj.research_api_categories)
          ? areaObj.research_api_categories[0]
          : areaObj.research_api_categories;
      } else {
        categoryObj = undefined;
      }

      return {
        Category: categoryObj?.name || 'Unknown',
        Area: areaObj?.name || 'Unknown',
        Focus: focus?.name || 'Unknown',
        'Research Activity': activity.name,
        Subcomponent: activity.name, // Use activity name as subcomponent for compatibility
        Phase: 'Unknown',
        Step: 'Unknown',
        Hint: activity.general_description || '',
        'General Description': activity.general_description || '',
        Goal: activity.goal || '',
        Hypothesis: activity.hypothesis || '',
        Uncertainties: activity.uncertainties || '',
        Alternatives: activity.alternatives || '',
        'Developmental Process': activity.developmental_process || '',
        'Time %?': '100',
        Roles: '',
        'Decision Category': '',
        'Expected Outcome Type': activity.expected_outcome_type || '',
        'CPT Codes': Array.isArray(activity.cpt_codes) ? activity.cpt_codes.join(', ') : activity.cpt_codes || '',
        'CDT Codes': Array.isArray(activity.cdt_codes) ? activity.cdt_codes.join(', ') : activity.cdt_codes || '',
        'Product/Technology Options': activity.alternative_paths || ''
      };
    });
  } catch (error) {
    console.error('Error loading research API data:', error);
    return [];
  }
};

export const findResearchDataForSubcomponent = (
  subcomponentName: string,
  researchActivityName: string,
  researchApiData: ResearchApiRow[]
): ResearchApiData | null => {
  // Try to find exact match first
  let match = researchApiData.find(row => 
    row.Subcomponent?.toLowerCase().trim() === subcomponentName.toLowerCase().trim() &&
    row['Research Activity']?.toLowerCase().trim() === researchActivityName.toLowerCase().trim()
  );

  // If no exact match, try partial match on subcomponent name
  if (!match) {
    match = researchApiData.find(row => 
      row.Subcomponent?.toLowerCase().includes(subcomponentName.toLowerCase()) &&
      row['Research Activity']?.toLowerCase().includes(researchActivityName.toLowerCase())
    );
  }

  // If still no match, try just subcomponent name
  if (!match) {
    match = researchApiData.find(row => 
      row.Subcomponent?.toLowerCase().includes(subcomponentName.toLowerCase())
    );
  }

  if (!match) {
    console.log('No Research API data found for subcomponent:', subcomponentName, 'in activity:', researchActivityName);
    return null;
  }

  return {
    generalDescription: match['General Description'] || '',
    goal: match['Goal'] || '',
    hypothesis: match['Hypothesis'] || '',
    uncertainties: match['Uncertainties'] || '',
    alternatives: match['Alternatives'] || '',
    developmentalProcess: match['Developmental Process'] || '',
    hint: match['Hint'] || '',
    phase: match['Phase'] || '',
    step: match['Step'] || '',
    roles: match['Roles'] || '',
    decisionCategory: match['Decision Category'] || '',
    expectedOutcomeType: match['Expected Outcome Type'] || '',
    cptCodes: match['CPT Codes'] || '',
    cdtCodes: match['CDT Codes'] || '',
    productTechnologyOptions: match['Product/Technology Options'] || '',
  };
};

// Save user modifications to localStorage
export const saveSubcomponentResearchData = (
  businessId: string,
  year: number,
  activityId: string,
  subcomponentId: string,
  data: {
    userNotes?: string;
    userModifications?: Partial<ResearchApiData>;
  }
): void => {
  const key = `research_design_${businessId}_${year}_${activityId}_${subcomponentId}`;
  localStorage.setItem(key, JSON.stringify(data));
  console.log('Saved research design data for subcomponent:', subcomponentId);
};

// Load user modifications from localStorage
export const loadSubcomponentResearchData = (
  businessId: string,
  year: number,
  activityId: string,
  subcomponentId: string
): {
  userNotes?: string;
  userModifications?: Partial<ResearchApiData>;
} | null => {
  const key = `research_design_${businessId}_${year}_${activityId}_${subcomponentId}`;
  const data = localStorage.getItem(key);
  if (data) {
    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('Error parsing saved research design data:', error);
      return null;
    }
  }
  return null;
}; 