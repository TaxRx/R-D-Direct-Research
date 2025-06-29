import { supabase } from './supabase';

// Fetch all research activities with full hierarchical data from normalized tables
export async function getAllActivities(): Promise<Record<string, any>[]> {
  if (!supabase) {
    console.error('Supabase client not initialized');
    throw new Error('Supabase client not initialized. Please check your environment variables.');
  }

  try {
    console.log('[ResearchActivitiesService] Loading activities from Supabase...');
    
    // First, try to load from the hierarchy view
    let { data, error } = await supabase
      .from('research_api_hierarchy')
      .select('*')
      .order('category_name, area_name, focus_name, activity_name, phase_order, step_order');

    // If hierarchy view fails or returns no data, fall back to basic activity query
    if (error || !data || data.length === 0) {
      console.log('[ResearchActivitiesService] Hierarchy view not available or empty, falling back to basic activity query...');
      
      const { data: basicData, error: basicError } = await supabase
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

      if (basicError) {
        console.error('Error fetching basic activities from Supabase:', basicError);
        throw basicError;
      }

      if (!basicData || basicData.length === 0) {
        console.warn('[ResearchActivitiesService] No activities found in Supabase');
        return [];
      }

      // Transform basic data to match expected format
      const transformedData = basicData.map(activity => {
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
          id: activity.id,
          category: categoryObj?.name || 'Unknown',
          area: areaObj?.name || 'Unknown',
          focus: focus?.name || 'Unknown',
          researchActivity: activity.name,
          'Research Activity': activity.name,
          'Category': categoryObj?.name || 'Unknown',
          'Area': areaObj?.name || 'Unknown',
          'Focus': focus?.name || 'Unknown',
          generalDescription: activity.general_description,
          goal: activity.goal,
          hypothesis: activity.hypothesis,
          alternatives: activity.alternatives,
          uncertainties: activity.uncertainties,
          developmentalProcess: activity.developmental_process,
          primaryGoal: activity.primary_goal,
          expectedOutcomeType: activity.expected_outcome_type,
          cptCodes: activity.cpt_codes,
          cdtCodes: activity.cdt_codes,
          alternativePaths: activity.alternative_paths,
          isLimitedAccess: activity.is_limited_access,
          isActive: activity.is_active,
          createdAt: activity.created_at,
          updatedAt: activity.updated_at,
          // Add placeholder values for missing hierarchy data
          step: 'General',
          subcomponent: 'Research Activity',
          'Subcomponent': 'Research Activity',
          phase: 'Development',
          Phase: 'Development',
          hint: 'Research activity for QRA calculations'
        };
      });

      console.log(`[ResearchActivitiesService] Successfully loaded ${transformedData.length} basic activities from Supabase`);
      return transformedData;
    }

    // Transform the hierarchy data to create individual rows for each subcomponent
    const transformedData: Record<string, any>[] = [];
    
    data.forEach(row => {
      // Create a base activity object
      const baseActivity = {
        id: row.activity_id,
        category: row.category_name || 'Unknown',
        area: row.area_name || 'Unknown',
        focus: row.focus_name || 'Unknown',
        researchActivity: row.activity_name,
        'Research Activity': row.activity_name,
        'Category': row.category_name || 'Unknown',
        'Area': row.area_name || 'Unknown',
        'Focus': row.focus_name || 'Unknown',
        generalDescription: row.activity_description,
        goal: row.activity_goal,
        hypothesis: row.activity_hypothesis,
        alternatives: row.activity_alternatives,
        uncertainties: row.activity_uncertainties,
        developmentalProcess: row.activity_developmental_process,
        primaryGoal: row.activity_primary_goal,
        expectedOutcomeType: row.activity_expected_outcome_type,
        cptCodes: row.activity_cpt_codes,
        cdtCodes: row.activity_cdt_codes,
        alternativePaths: row.activity_alternative_paths,
        isLimitedAccess: row.activity_is_limited_access,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // If we have phase, step, and subcomponent data, create individual rows
      if (row.phase_name && row.step_name && row.subcomponent_name) {
        transformedData.push({
          ...baseActivity,
          id: `${row.activity_id}-${row.phase_id}-${row.step_id}-${row.subcomponent_id}`,
          step: row.step_name,
          subcomponent: row.subcomponent_name,
          'Subcomponent': row.subcomponent_name,
          phase: row.phase_name,
          Phase: row.phase_name,
          hint: row.subcomponent_hint,
          stepId: row.step_id,
          phaseId: row.phase_id,
          subcomponentId: row.subcomponent_id
        });
      } else if (row.phase_name && row.step_name) {
        // If we have phase and step but no subcomponent
        transformedData.push({
          ...baseActivity,
          id: `${row.activity_id}-${row.phase_id}-${row.step_id}`,
          step: row.step_name,
          phase: row.phase_name,
          Phase: row.phase_name,
          stepId: row.step_id,
          phaseId: row.phase_id
        });
      } else if (row.phase_name) {
        // If we have phase but no step
        transformedData.push({
          ...baseActivity,
          id: `${row.activity_id}-${row.phase_id}`,
          phase: row.phase_name,
          Phase: row.phase_name,
          phaseId: row.phase_id
        });
  } else {
        // Just the activity level
        transformedData.push(baseActivity);
      }
    });

    console.log(`[ResearchActivitiesService] Successfully loaded ${transformedData.length} activity rows from Supabase hierarchy`);
    return transformedData;
  } catch (error) {
    console.error('[ResearchActivitiesService] Error loading from Supabase:', error);
    throw new Error(`Failed to load activities from Supabase: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Helper function to get activities by category
export async function getActivitiesByCategory(categoryName: string): Promise<Record<string, any>[]> {
  const allActivities = await getAllActivities();
  return allActivities.filter(activity => 
    activity.category === categoryName || activity.Category === categoryName
  );
}

// Helper function to get activities by area
export async function getActivitiesByArea(categoryName: string, areaName: string): Promise<Record<string, any>[]> {
  const allActivities = await getAllActivities();
  return allActivities.filter(activity => 
    (activity.category === categoryName || activity.Category === categoryName) &&
    (activity.area === areaName || activity.Area === areaName)
  );
}

// Helper function to get activities by focus
export async function getActivitiesByFocus(categoryName: string, areaName: string, focusName: string): Promise<Record<string, any>[]> {
  const allActivities = await getAllActivities();
  return allActivities.filter(activity => 
    (activity.category === categoryName || activity.Category === categoryName) &&
    (activity.area === areaName || activity.Area === areaName) &&
    (activity.focus === focusName || activity.Focus === focusName)
  );
}

// Helper function to clear localStorage data related to activities and QRA
export function clearActivitiesLocalStorage(): void {
  try {
    console.log('[ResearchActivitiesService] Clearing localStorage data...');
    
    // Get all keys
    const allKeys = Object.keys(localStorage);
    console.log('[ResearchActivitiesService] All localStorage keys:', allKeys);
    
    // Clear all QRA-related keys with more comprehensive filtering
    const qraKeys = allKeys.filter(key => 
      key.startsWith('qra_') || 
      key.includes('activity') || 
      key.includes('QRA') ||
      key.includes('businessInfoData') ||
      key.includes('activitiesTabApproval') ||
      key.includes('activities_data') ||
      key.includes('activities-approval') ||
      key.includes('qraSelections') ||
      key.includes('research-design') ||
      key.includes('rd-app-data') ||
      key.includes('rd_expenses_data') ||
      key.includes('rd_templates') ||
      key.includes('rd_templates') ||
      key.includes('ai_report') ||
      key.includes('ai_subcomponent') ||
      key.includes('approval_activities') ||
      key.includes('approval_roles') ||
      key.includes('rolesTabApproval') ||
      key.includes('expensesTabApproval') ||
      key.includes('qraTabApproval') ||
      key.includes('roles-') ||
      key.includes('business-storage') ||
      key.includes('adminClientsData') ||
      key.includes('adminUsersData') ||
      key.includes('adminStateData') ||
      key.includes('prompt_templates') ||
      key.includes('templates') ||
      key.includes('unified_template')
    );
    
    console.log('[ResearchActivitiesService] QRA-related keys to be cleared:', qraKeys);
    
    // Clear each QRA-related key
    qraKeys.forEach(key => {
      localStorage.removeItem(key);
      console.log(`[ResearchActivitiesService] Cleared: ${key}`);
    });
    
    // Clear business info data specifically
    localStorage.removeItem('businessInfoData');
    console.log('[ResearchActivitiesService] Cleared: businessInfoData');
    
    // Verify remaining keys
    const remainingKeys = Object.keys(localStorage);
    console.log('[ResearchActivitiesService] Remaining localStorage keys:', remainingKeys);
    
    console.log('[ResearchActivitiesService] localStorage cleanup complete!');
  } catch (error) {
    console.error('[ResearchActivitiesService] Error clearing localStorage:', error);
  }
}

// Helper function to clear ALL localStorage data (aggressive cleanup)
export function clearAllLocalStorage(): void {
  try {
    console.log('[ResearchActivitiesService] Clearing ALL localStorage data...');
    
    // Get all keys
    const allKeys = Object.keys(localStorage);
    console.log('[ResearchActivitiesService] All localStorage keys:', allKeys);
    
    // Keep only essential browser/system keys
    const essentialKeys = [
      'loglevel',
      'calendly-store',
      'calendly-internal-store'
    ];
    
    // Clear everything except essential keys
    const keysToClear = allKeys.filter(key => !essentialKeys.includes(key));
    
    console.log('[ResearchActivitiesService] Keys to be cleared:', keysToClear);
    console.log('[ResearchActivitiesService] Essential keys to keep:', essentialKeys);
    
    // Clear each key
    keysToClear.forEach(key => {
      localStorage.removeItem(key);
      console.log(`[ResearchActivitiesService] Cleared: ${key}`);
    });
    
    // Verify remaining keys
    const remainingKeys = Object.keys(localStorage);
    console.log('[ResearchActivitiesService] Remaining localStorage keys:', remainingKeys);
    
    console.log('[ResearchActivitiesService] ALL localStorage cleanup complete!');
  } catch (error) {
    console.error('[ResearchActivitiesService] Error clearing all localStorage:', error);
  }
} 