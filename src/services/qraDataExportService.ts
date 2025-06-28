import { supabase } from './supabase';
import { SubcomponentSelectionData, SubcomponentConfig } from '../types/QRABuilderInterfaces';

// Core data interfaces for normalized export
export interface QRAExportData {
  // Business and year context
  businessId: string;
  businessName: string;
  year: number;
  exportTimestamp: string;
  
  // Normalized Research API Structure
  categories: CategoryExport[];
  areas: AreaExport[];
  focuses: FocusExport[];
  activities: ActivityExport[];
  phases: PhaseExport[];
  steps: StepExport[];
  subcomponents: SubcomponentExport[];
  
  // QRA Configuration Data (from businesses table)
  qraConfigurations: QRAConfigurationExport[];
  
  // Summary statistics
  summary: QRAExportSummary;
}

export interface CategoryExport {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AreaExport {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FocusExport {
  id: string;
  areaId: string;
  areaName: string;
  categoryId: string;
  categoryName: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityExport {
  id: string;
  focusId: string;
  focusName: string;
  areaId: string;
  areaName: string;
  categoryId: string;
  categoryName: string;
  name: string;
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
  isLimitedAccess: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PhaseExport {
  id: string;
  activityId: string;
  activityName: string;
  name: string;
  description?: string;
  orderIndex: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StepExport {
  id: string;
  phaseId: string;
  phaseName: string;
  activityId: string;
  activityName: string;
  name: string;
  description?: string;
  orderIndex: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubcomponentExport {
  id: string;
  stepId: string;
  stepName: string;
  phaseId: string;
  phaseName: string;
  activityId: string;
  activityName: string;
  name: string;
  hint?: string;
  description?: string;
  isLimitedAccess: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QRAConfigurationExport {
  businessId: string;
  year: number;
  activityId: string;
  activityName: string;
  practicePercent: number;
  nonRDTime: number;
  active: boolean;
  selectedRoles: string[];
  qraData?: SubcomponentSelectionData;
  qraCompleted: boolean;
  totalAppliedPercent: number;
  subcomponentCount: number;
  stepCount: number;
}

export interface QRAExportSummary {
  totalCategories: number;
  totalAreas: number;
  totalFocuses: number;
  totalActivities: number;
  totalPhases: number;
  totalSteps: number;
  totalSubcomponents: number;
  totalQRAConfigurations: number;
  activitiesWithQRA: number;
  activitiesWithoutQRA: number;
  totalPracticePercent: number;
  totalAppliedPercent: number;
  totalNonRDTime: number;
}

// Service class for QRA data export
export class QRADataExportService {
  
  /**
   * Generate comprehensive QRA export data for a business and year using normalized structure
   */
  static async generateExportData(
    businessId: string,
    businessName: string,
    year: number
  ): Promise<QRAExportData> {
    
    // Fetch normalized research API data
    const { data: hierarchyData, error: hierarchyError } = await supabase
      .from('research_api_hierarchy')
      .select('*')
      .order('category_name, area_name, focus_name, activity_name, phase_order, step_order');
    
    if (hierarchyError) {
      console.error('Error fetching research API hierarchy:', hierarchyError);
      throw new Error(`Failed to fetch research API data: ${hierarchyError.message}`);
    }
    
    // Fetch QRA configurations from businesses table
    const { data: businessData, error: businessError } = await supabase
      .from('businesses')
      .select('qra_data, research_activity_selections')
      .eq('id', businessId)
      .single();
    
    if (businessError) {
      console.error('Error fetching business QRA data:', businessError);
      throw new Error(`Failed to fetch business QRA data: ${businessError.message}`);
    }
    
    // Process hierarchy data into normalized structure
    const categories = this.processCategories(hierarchyData);
    const areas = this.processAreas(hierarchyData);
    const focuses = this.processFocuses(hierarchyData);
    const activities = this.processActivities(hierarchyData);
    const phases = this.processPhases(hierarchyData);
    const steps = this.processSteps(hierarchyData);
    const subcomponents = this.processSubcomponents(hierarchyData);
    
    // Process QRA configurations
    const qraConfigurations = this.processQRAConfigurations(
      businessId,
      year,
      businessData,
      activities
    );
    
    // Calculate summary statistics
    const summary = this.calculateSummary(
      categories,
      areas,
      focuses,
      activities,
      phases,
      steps,
      subcomponents,
      qraConfigurations
    );
    
    return {
      businessId,
      businessName,
      year,
      exportTimestamp: new Date().toISOString(),
      categories,
      areas,
      focuses,
      activities,
      phases,
      steps,
      subcomponents,
      qraConfigurations,
      summary
    };
  }
  
  /**
   * Process categories from hierarchy data
   */
  private static processCategories(hierarchyData: any[]): CategoryExport[] {
    const categoryMap = new Map<string, CategoryExport>();
    
    hierarchyData.forEach(row => {
      if (row.category_id && !categoryMap.has(row.category_id)) {
        categoryMap.set(row.category_id, {
          id: row.category_id,
          name: row.category_name,
          description: undefined, // Not in hierarchy view
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    });
    
    return Array.from(categoryMap.values());
  }
  
  /**
   * Process areas from hierarchy data
   */
  private static processAreas(hierarchyData: any[]): AreaExport[] {
    const areaMap = new Map<string, AreaExport>();
    
    hierarchyData.forEach(row => {
      if (row.area_id && !areaMap.has(row.area_id)) {
        areaMap.set(row.area_id, {
          id: row.area_id,
          categoryId: row.category_id,
          categoryName: row.category_name,
          name: row.area_name,
          description: undefined, // Not in hierarchy view
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    });
    
    return Array.from(areaMap.values());
  }
  
  /**
   * Process focuses from hierarchy data
   */
  private static processFocuses(hierarchyData: any[]): FocusExport[] {
    const focusMap = new Map<string, FocusExport>();
    
    hierarchyData.forEach(row => {
      if (row.focus_id && !focusMap.has(row.focus_id)) {
        focusMap.set(row.focus_id, {
          id: row.focus_id,
          areaId: row.area_id,
          areaName: row.area_name,
          categoryId: row.category_id,
          categoryName: row.category_name,
          name: row.focus_name,
          description: undefined, // Not in hierarchy view
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    });
    
    return Array.from(focusMap.values());
  }
  
  /**
   * Process activities from hierarchy data
   */
  private static processActivities(hierarchyData: any[]): ActivityExport[] {
    const activityMap = new Map<string, ActivityExport>();
    
    hierarchyData.forEach(row => {
      if (row.activity_id && !activityMap.has(row.activity_id)) {
        activityMap.set(row.activity_id, {
          id: row.activity_id,
          focusId: row.focus_id,
          focusName: row.focus_name,
          areaId: row.area_id,
          areaName: row.area_name,
          categoryId: row.category_id,
          categoryName: row.category_name,
          name: row.activity_name,
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
          isLimitedAccess: row.activity_is_limited_access || false,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    });
    
    return Array.from(activityMap.values());
  }
  
  /**
   * Process phases from hierarchy data
   */
  private static processPhases(hierarchyData: any[]): PhaseExport[] {
    const phaseMap = new Map<string, PhaseExport>();
    
    hierarchyData.forEach(row => {
      if (row.phase_id && !phaseMap.has(row.phase_id)) {
        phaseMap.set(row.phase_id, {
          id: row.phase_id,
          activityId: row.activity_id,
          activityName: row.activity_name,
          name: row.phase_name,
          description: row.phase_description,
          orderIndex: row.phase_order || 0,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    });
    
    return Array.from(phaseMap.values());
  }
  
  /**
   * Process steps from hierarchy data
   */
  private static processSteps(hierarchyData: any[]): StepExport[] {
    const stepMap = new Map<string, StepExport>();
    
    hierarchyData.forEach(row => {
      if (row.step_id && !stepMap.has(row.step_id)) {
        stepMap.set(row.step_id, {
          id: row.step_id,
          phaseId: row.phase_id,
          phaseName: row.phase_name,
          activityId: row.activity_id,
          activityName: row.activity_name,
          name: row.step_name,
          description: row.step_description,
          orderIndex: row.step_order || 0,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    });
    
    return Array.from(stepMap.values());
  }
  
  /**
   * Process subcomponents from hierarchy data
   */
  private static processSubcomponents(hierarchyData: any[]): SubcomponentExport[] {
    const subcomponentMap = new Map<string, SubcomponentExport>();
    
    hierarchyData.forEach(row => {
      if (row.subcomponent_id && !subcomponentMap.has(row.subcomponent_id)) {
        subcomponentMap.set(row.subcomponent_id, {
          id: row.subcomponent_id,
          stepId: row.step_id,
          stepName: row.step_name,
          phaseId: row.phase_id,
          phaseName: row.phase_name,
          activityId: row.activity_id,
          activityName: row.activity_name,
          name: row.subcomponent_name,
          hint: row.subcomponent_hint,
          description: row.subcomponent_description,
          isLimitedAccess: row.subcomponent_is_limited_access || false,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    });
    
    return Array.from(subcomponentMap.values());
  }
  
  /**
   * Process QRA configurations from business data
   */
  private static processQRAConfigurations(
    businessId: string,
    year: number,
    businessData: any,
    activities: ActivityExport[]
  ): QRAConfigurationExport[] {
    const configurations: QRAConfigurationExport[] = [];
    
    // Get QRA data and activity selections from business
    const qraData = businessData?.qra_data || {};
    const activitySelections = businessData?.research_activity_selections || {};
    
    activities.forEach(activity => {
      const activityQraData = qraData[activity.id];
      const activitySelection = activitySelections[activity.id];
      
      const isQRACompleted = activityQraData && Object.keys(activityQraData.selectedSubcomponents || {}).length > 0;
      
      configurations.push({
        businessId,
        year,
        activityId: activity.id,
        activityName: activity.name,
        practicePercent: activitySelection?.practicePercent || 0,
        nonRDTime: activitySelection?.nonRDTime || 0,
        active: activitySelection?.active !== undefined ? activitySelection.active : true,
        selectedRoles: activitySelection?.selectedRoles || [],
        qraData: activityQraData,
        qraCompleted: isQRACompleted,
        totalAppliedPercent: activityQraData?.totalAppliedPercent || 0,
        subcomponentCount: activityQraData ? Object.keys(activityQraData.selectedSubcomponents || {}).length : 0,
        stepCount: activityQraData ? Object.keys(activityQraData.stepTimeMap || {}).length : 0
      });
    });
    
    return configurations;
  }
  
  /**
   * Calculate summary statistics for the export
   */
  private static calculateSummary(
    categories: CategoryExport[],
    areas: AreaExport[],
    focuses: FocusExport[],
    activities: ActivityExport[],
    phases: PhaseExport[],
    steps: StepExport[],
    subcomponents: SubcomponentExport[],
    qraConfigurations: QRAConfigurationExport[]
  ): QRAExportSummary {
    const totalPracticePercent = qraConfigurations.reduce((sum, config) => sum + config.practicePercent, 0);
    const totalAppliedPercent = qraConfigurations.reduce((sum, config) => sum + config.totalAppliedPercent, 0);
    const totalNonRDTime = qraConfigurations.reduce((sum, config) => sum + config.nonRDTime, 0);
    const activitiesWithQRA = qraConfigurations.filter(config => config.qraCompleted).length;
    const activitiesWithoutQRA = qraConfigurations.filter(config => !config.qraCompleted).length;
    
    return {
      totalCategories: categories.length,
      totalAreas: areas.length,
      totalFocuses: focuses.length,
      totalActivities: activities.length,
      totalPhases: phases.length,
      totalSteps: steps.length,
      totalSubcomponents: subcomponents.length,
      totalQRAConfigurations: qraConfigurations.length,
      activitiesWithQRA,
      activitiesWithoutQRA,
      totalPracticePercent,
      totalAppliedPercent,
      totalNonRDTime
    };
  }
  
  /**
   * Export data as JSON
   */
  static exportAsJSON(data: QRAExportData): string {
    return JSON.stringify(data, null, 2);
  }
  
  /**
   * Export data as normalized CSV that matches the Supabase schema
   */
  static exportAsCSV(data: QRAExportData): string {
    const csvRows: string[] = [];
    
    // Add metadata header
    csvRows.push('Table,ID,Field,Value,DataType,ParentID,ParentType');
    
    // Categories
    data.categories.forEach(category => {
      csvRows.push(`research_api_categories,${category.id},name,"${category.name}",string,,`);
      if (category.description) {
        csvRows.push(`research_api_categories,${category.id},description,"${category.description}",text,,`);
      }
      csvRows.push(`research_api_categories,${category.id},is_active,${category.isActive},boolean,,`);
      csvRows.push(`research_api_categories,${category.id},created_at,"${category.createdAt}",timestamp,,`);
      csvRows.push(`research_api_categories,${category.id},updated_at,"${category.updatedAt}",timestamp,,`);
    });
    
    // Areas
    data.areas.forEach(area => {
      csvRows.push(`research_api_areas,${area.id},category_id,${area.categoryId},uuid,${area.categoryId},category`);
      csvRows.push(`research_api_areas,${area.id},name,"${area.name}",string,${area.categoryId},category`);
      if (area.description) {
        csvRows.push(`research_api_areas,${area.id},description,"${area.description}",text,${area.categoryId},category`);
      }
      csvRows.push(`research_api_areas,${area.id},is_active,${area.isActive},boolean,${area.categoryId},category`);
      csvRows.push(`research_api_areas,${area.id},created_at,"${area.createdAt}",timestamp,${area.categoryId},category`);
      csvRows.push(`research_api_areas,${area.id},updated_at,"${area.updatedAt}",timestamp,${area.categoryId},category`);
    });
    
    // Focuses
    data.focuses.forEach(focus => {
      csvRows.push(`research_api_focuses,${focus.id},area_id,${focus.areaId},uuid,${focus.areaId},area`);
      csvRows.push(`research_api_focuses,${focus.id},name,"${focus.name}",string,${focus.areaId},area`);
      if (focus.description) {
        csvRows.push(`research_api_focuses,${focus.id},description,"${focus.description}",text,${focus.areaId},area`);
      }
      csvRows.push(`research_api_focuses,${focus.id},is_active,${focus.isActive},boolean,${focus.areaId},area`);
      csvRows.push(`research_api_focuses,${focus.id},created_at,"${focus.createdAt}",timestamp,${focus.areaId},area`);
      csvRows.push(`research_api_focuses,${focus.id},updated_at,"${focus.updatedAt}",timestamp,${focus.areaId},area`);
    });
    
    // Activities
    data.activities.forEach(activity => {
      csvRows.push(`research_api_activities,${activity.id},focus_id,${activity.focusId},uuid,${activity.focusId},focus`);
      csvRows.push(`research_api_activities,${activity.id},name,"${activity.name}",string,${activity.focusId},focus`);
      if (activity.generalDescription) {
        csvRows.push(`research_api_activities,${activity.id},general_description,"${activity.generalDescription}",text,${activity.focusId},focus`);
      }
      if (activity.goal) {
        csvRows.push(`research_api_activities,${activity.id},goal,"${activity.goal}",text,${activity.focusId},focus`);
      }
      if (activity.hypothesis) {
        csvRows.push(`research_api_activities,${activity.id},hypothesis,"${activity.hypothesis}",text,${activity.focusId},focus`);
      }
      if (activity.alternatives) {
        csvRows.push(`research_api_activities,${activity.id},alternatives,"${activity.alternatives}",text,${activity.focusId},focus`);
      }
      if (activity.uncertainties) {
        csvRows.push(`research_api_activities,${activity.id},uncertainties,"${activity.uncertainties}",text,${activity.focusId},focus`);
      }
      if (activity.developmentalProcess) {
        csvRows.push(`research_api_activities,${activity.id},developmental_process,"${activity.developmentalProcess}",text,${activity.focusId},focus`);
      }
      if (activity.primaryGoal) {
        csvRows.push(`research_api_activities,${activity.id},primary_goal,"${activity.primaryGoal}",text,${activity.focusId},focus`);
      }
      if (activity.expectedOutcomeType) {
        csvRows.push(`research_api_activities,${activity.id},expected_outcome_type,"${activity.expectedOutcomeType}",string,${activity.focusId},focus`);
      }
      if (activity.cptCodes && activity.cptCodes.length > 0) {
        csvRows.push(`research_api_activities,${activity.id},cpt_codes,"{${activity.cptCodes.join(',')}}",text[],${activity.focusId},focus`);
      }
      if (activity.cdtCodes && activity.cdtCodes.length > 0) {
        csvRows.push(`research_api_activities,${activity.id},cdt_codes,"{${activity.cdtCodes.join(',')}}",text[],${activity.focusId},focus`);
      }
      if (activity.alternativePaths) {
        csvRows.push(`research_api_activities,${activity.id},alternative_paths,"${activity.alternativePaths}",text,${activity.focusId},focus`);
      }
      csvRows.push(`research_api_activities,${activity.id},is_limited_access,${activity.isLimitedAccess},boolean,${activity.focusId},focus`);
      csvRows.push(`research_api_activities,${activity.id},is_active,${activity.isActive},boolean,${activity.focusId},focus`);
      csvRows.push(`research_api_activities,${activity.id},created_at,"${activity.createdAt}",timestamp,${activity.focusId},focus`);
      csvRows.push(`research_api_activities,${activity.id},updated_at,"${activity.updatedAt}",timestamp,${activity.focusId},focus`);
    });
    
    // Phases
    data.phases.forEach(phase => {
      csvRows.push(`research_api_phases,${phase.id},activity_id,${phase.activityId},uuid,${phase.activityId},activity`);
      csvRows.push(`research_api_phases,${phase.id},name,"${phase.name}",string,${phase.activityId},activity`);
      if (phase.description) {
        csvRows.push(`research_api_phases,${phase.id},description,"${phase.description}",text,${phase.activityId},activity`);
      }
      csvRows.push(`research_api_phases,${phase.id},order_index,${phase.orderIndex},integer,${phase.activityId},activity`);
      csvRows.push(`research_api_phases,${phase.id},is_active,${phase.isActive},boolean,${phase.activityId},activity`);
      csvRows.push(`research_api_phases,${phase.id},created_at,"${phase.createdAt}",timestamp,${phase.activityId},activity`);
      csvRows.push(`research_api_phases,${phase.id},updated_at,"${phase.updatedAt}",timestamp,${phase.activityId},activity`);
    });
    
    // Steps
    data.steps.forEach(step => {
      csvRows.push(`research_api_steps,${step.id},phase_id,${step.phaseId},uuid,${step.phaseId},phase`);
      csvRows.push(`research_api_steps,${step.id},name,"${step.name}",string,${step.phaseId},phase`);
      if (step.description) {
        csvRows.push(`research_api_steps,${step.id},description,"${step.description}",text,${step.phaseId},phase`);
      }
      csvRows.push(`research_api_steps,${step.id},order_index,${step.orderIndex},integer,${step.phaseId},phase`);
      csvRows.push(`research_api_steps,${step.id},is_active,${step.isActive},boolean,${step.phaseId},phase`);
      csvRows.push(`research_api_steps,${step.id},created_at,"${step.createdAt}",timestamp,${step.phaseId},phase`);
      csvRows.push(`research_api_steps,${step.id},updated_at,"${step.updatedAt}",timestamp,${step.phaseId},phase`);
    });
    
    // Subcomponents
    data.subcomponents.forEach(subcomponent => {
      csvRows.push(`research_api_subcomponents,${subcomponent.id},step_id,${subcomponent.stepId},uuid,${subcomponent.stepId},step`);
      csvRows.push(`research_api_subcomponents,${subcomponent.id},name,"${subcomponent.name}",string,${subcomponent.stepId},step`);
      if (subcomponent.hint) {
        csvRows.push(`research_api_subcomponents,${subcomponent.id},hint,"${subcomponent.hint}",text,${subcomponent.stepId},step`);
      }
      if (subcomponent.description) {
        csvRows.push(`research_api_subcomponents,${subcomponent.id},description,"${subcomponent.description}",text,${subcomponent.stepId},step`);
      }
      csvRows.push(`research_api_subcomponents,${subcomponent.id},is_limited_access,${subcomponent.isLimitedAccess},boolean,${subcomponent.stepId},step`);
      csvRows.push(`research_api_subcomponents,${subcomponent.id},is_active,${subcomponent.isActive},boolean,${subcomponent.stepId},step`);
      csvRows.push(`research_api_subcomponents,${subcomponent.id},created_at,"${subcomponent.createdAt}",timestamp,${subcomponent.stepId},step`);
      csvRows.push(`research_api_subcomponents,${subcomponent.id},updated_at,"${subcomponent.updatedAt}",timestamp,${subcomponent.stepId},step`);
    });
    
    // QRA Configurations
    data.qraConfigurations.forEach(config => {
      csvRows.push(`qra_configurations,${config.businessId}_${config.year}_${config.activityId},business_id,${config.businessId},uuid,,`);
      csvRows.push(`qra_configurations,${config.businessId}_${config.year}_${config.activityId},year,${config.year},integer,,`);
      csvRows.push(`qra_configurations,${config.businessId}_${config.year}_${config.activityId},activity_id,${config.activityId},uuid,,`);
      csvRows.push(`qra_configurations,${config.businessId}_${config.year}_${config.activityId},activity_name,"${config.activityName}",string,,`);
      csvRows.push(`qra_configurations,${config.businessId}_${config.year}_${config.activityId},practice_percent,${config.practicePercent},number,,`);
      csvRows.push(`qra_configurations,${config.businessId}_${config.year}_${config.activityId},non_rd_time,${config.nonRDTime},number,,`);
      csvRows.push(`qra_configurations,${config.businessId}_${config.year}_${config.activityId},active,${config.active},boolean,,`);
      csvRows.push(`qra_configurations,${config.businessId}_${config.year}_${config.activityId},selected_roles,"${config.selectedRoles.join('|')}",string,,`);
      csvRows.push(`qra_configurations,${config.businessId}_${config.year}_${config.activityId},qra_completed,${config.qraCompleted},boolean,,`);
      csvRows.push(`qra_configurations,${config.businessId}_${config.year}_${config.activityId},total_applied_percent,${config.totalAppliedPercent},number,,`);
      csvRows.push(`qra_configurations,${config.businessId}_${config.year}_${config.activityId},subcomponent_count,${config.subcomponentCount},number,,`);
      csvRows.push(`qra_configurations,${config.businessId}_${config.year}_${config.activityId},step_count,${config.stepCount},number,,`);
    });
    
    return csvRows.join('\n');
  }
  
  /**
   * Export data as SQL INSERT statements for Supabase
   */
  static exportAsSQL(data: QRAExportData): string {
    const sqlStatements: string[] = [];
    
    // Categories
    data.categories.forEach(category => {
      const values = [
        `'${category.id}'`,
        `'${category.name.replace(/'/g, "''")}'`,
        category.description ? `'${category.description.replace(/'/g, "''")}'` : 'NULL',
        category.isActive,
        `'${category.createdAt}'`,
        `'${category.updatedAt}'`
      ];
      
      sqlStatements.push(
        `INSERT INTO research_api_categories (id, name, description, is_active, created_at, updated_at) VALUES (${values.join(', ')});`
      );
    });
    
    // Areas
    data.areas.forEach(area => {
      const values = [
        `'${area.id}'`,
        `'${area.categoryId}'`,
        `'${area.name.replace(/'/g, "''")}'`,
        area.description ? `'${area.description.replace(/'/g, "''")}'` : 'NULL',
        area.isActive,
        `'${area.createdAt}'`,
        `'${area.updatedAt}'`
      ];
      
      sqlStatements.push(
        `INSERT INTO research_api_areas (id, category_id, name, description, is_active, created_at, updated_at) VALUES (${values.join(', ')});`
      );
    });
    
    // Focuses
    data.focuses.forEach(focus => {
      const values = [
        `'${focus.id}'`,
        `'${focus.areaId}'`,
        `'${focus.name.replace(/'/g, "''")}'`,
        focus.description ? `'${focus.description.replace(/'/g, "''")}'` : 'NULL',
        focus.isActive,
        `'${focus.createdAt}'`,
        `'${focus.updatedAt}'`
      ];
      
      sqlStatements.push(
        `INSERT INTO research_api_focuses (id, area_id, name, description, is_active, created_at, updated_at) VALUES (${values.join(', ')});`
      );
    });
    
    // Activities
    data.activities.forEach(activity => {
      const values = [
        `'${activity.id}'`,
        `'${activity.focusId}'`,
        `'${activity.name.replace(/'/g, "''")}'`,
        activity.generalDescription ? `'${activity.generalDescription.replace(/'/g, "''")}'` : 'NULL',
        activity.goal ? `'${activity.goal.replace(/'/g, "''")}'` : 'NULL',
        activity.hypothesis ? `'${activity.hypothesis.replace(/'/g, "''")}'` : 'NULL',
        activity.alternatives ? `'${activity.alternatives.replace(/'/g, "''")}'` : 'NULL',
        activity.uncertainties ? `'${activity.uncertainties.replace(/'/g, "''")}'` : 'NULL',
        activity.developmentalProcess ? `'${activity.developmentalProcess.replace(/'/g, "''")}'` : 'NULL',
        activity.primaryGoal ? `'${activity.primaryGoal.replace(/'/g, "''")}'` : 'NULL',
        activity.expectedOutcomeType ? `'${activity.expectedOutcomeType.replace(/'/g, "''")}'` : 'NULL',
        activity.cptCodes && activity.cptCodes.length > 0 ? `ARRAY[${activity.cptCodes.map(code => `'${code.replace(/'/g, "''")}'`).join(', ')}]` : 'NULL',
        activity.cdtCodes && activity.cdtCodes.length > 0 ? `ARRAY[${activity.cdtCodes.map(code => `'${code.replace(/'/g, "''")}'`).join(', ')}]` : 'NULL',
        activity.alternativePaths ? `'${activity.alternativePaths.replace(/'/g, "''")}'` : 'NULL',
        activity.isLimitedAccess,
        activity.isActive,
        `'${activity.createdAt}'`,
        `'${activity.updatedAt}'`
      ];
      
      sqlStatements.push(
        `INSERT INTO research_api_activities (id, focus_id, name, general_description, goal, hypothesis, alternatives, uncertainties, developmental_process, primary_goal, expected_outcome_type, cpt_codes, cdt_codes, alternative_paths, is_limited_access, is_active, created_at, updated_at) VALUES (${values.join(', ')});`
      );
    });
    
    // Phases
    data.phases.forEach(phase => {
      const values = [
        `'${phase.id}'`,
        `'${phase.activityId}'`,
        `'${phase.name.replace(/'/g, "''")}'`,
        phase.description ? `'${phase.description.replace(/'/g, "''")}'` : 'NULL',
        phase.orderIndex,
        phase.isActive,
        `'${phase.createdAt}'`,
        `'${phase.updatedAt}'`
      ];
      
      sqlStatements.push(
        `INSERT INTO research_api_phases (id, activity_id, name, description, order_index, is_active, created_at, updated_at) VALUES (${values.join(', ')});`
      );
    });
    
    // Steps
    data.steps.forEach(step => {
      const values = [
        `'${step.id}'`,
        `'${step.phaseId}'`,
        `'${step.name.replace(/'/g, "''")}'`,
        step.description ? `'${step.description.replace(/'/g, "''")}'` : 'NULL',
        step.orderIndex,
        step.isActive,
        `'${step.createdAt}'`,
        `'${step.updatedAt}'`
      ];
      
      sqlStatements.push(
        `INSERT INTO research_api_steps (id, phase_id, name, description, order_index, is_active, created_at, updated_at) VALUES (${values.join(', ')});`
      );
    });
    
    // Subcomponents
    data.subcomponents.forEach(subcomponent => {
      const values = [
        `'${subcomponent.id}'`,
        `'${subcomponent.stepId}'`,
        `'${subcomponent.name.replace(/'/g, "''")}'`,
        subcomponent.hint ? `'${subcomponent.hint.replace(/'/g, "''")}'` : 'NULL',
        subcomponent.description ? `'${subcomponent.description.replace(/'/g, "''")}'` : 'NULL',
        subcomponent.isLimitedAccess,
        subcomponent.isActive,
        `'${subcomponent.createdAt}'`,
        `'${subcomponent.updatedAt}'`
      ];
      
      sqlStatements.push(
        `INSERT INTO research_api_subcomponents (id, step_id, name, hint, description, is_limited_access, is_active, created_at, updated_at) VALUES (${values.join(', ')});`
      );
    });
    
    return sqlStatements.join('\n');
  }
  
  /**
   * Download export data as file
   */
  static downloadExport(data: QRAExportData, format: 'json' | 'csv' | 'sql', filename?: string): void {
    let content: string;
    let mimeType: string;
    let extension: string;
    
    switch (format) {
      case 'json':
        content = this.exportAsJSON(data);
        mimeType = 'application/json';
        extension = 'json';
        break;
      case 'csv':
        content = this.exportAsCSV(data);
        mimeType = 'text/csv';
        extension = 'csv';
        break;
      case 'sql':
        content = this.exportAsSQL(data);
        mimeType = 'text/plain';
        extension = 'sql';
        break;
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `qra_normalized_export_${data.businessId}_${data.year}_${new Date().toISOString().split('T')[0]}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Export a normalized, row-based CSV with only selected activities, steps, and subcomponents.
   * Columns: Year, Research Activity Title, Research Activity Practice Percent, Step, Subcomponent Title, Subcomponent Year %, Subcomponent Frequency %, Subcomponent Time %, Role(s)
   */
  static exportNormalizedCSV(
    year: number,
    activities: any[],
    qraDataMap: Record<string, any>
  ): string {
    const rows: string[] = [];
    // Header
    rows.push([
      'Year',
      'Research Activity Title',
      'Research Activity Practice Percent',
      'Step',
      'Subcomponent Title',
      'Subcomponent Year %',
      'Subcomponent Frequency %',
      'Subcomponent Time %',
      'Role(s)'
    ].join(','));

    // Process each activity that has QRA data
    Object.entries(qraDataMap).forEach(([activityId, qra]) => {
      if (!qra || !qra.selectedSubcomponents) return;
      
      const activity = activities.find(a => a.id === activityId || a.name === activityId);
      if (!activity) return;

      const practicePercent = qra.practicePercent ?? 0;
      Object.entries(qra.selectedSubcomponents).forEach(([subId, subSel]) => {
        const sub = subSel as SubcomponentConfig;
        // Find the subcomponent in the activity hierarchy if possible
        let stepName = sub.step || '';
        let subcomponentTitle = sub.subcomponent || '';
        let yearPercent = sub.yearPercent ?? '';
        let frequencyPercent = sub.frequencyPercent ?? '';
        let timePercent = sub.timePercent ?? '';
        let roles = Array.isArray(sub.selectedRoles)
          ? sub.selectedRoles.join(', ')
          : (sub.selectedRoles || '');
        // Fallback: try to get step/subcomponent names from activity if missing
        if ((!stepName || !subcomponentTitle) && activity.steps) {
          for (const step of activity.steps) {
            if (step.subcomponents) {
              for (const subcomponent of step.subcomponents) {
                if (subcomponent.id === subId || subcomponent.title === subcomponentTitle) {
                  stepName = step.name || stepName;
                  subcomponentTitle = subcomponent.title || subcomponentTitle;
                  break;
                }
              }
            }
          }
        }
        
        // Handle subcomponent title if it's an object
        if (typeof subcomponentTitle === 'object' && subcomponentTitle.title) {
          subcomponentTitle = subcomponentTitle.title;
        }

        rows.push([
          year,
          activity.name || activity.title || '',
          practicePercent,
          stepName,
          subcomponentTitle,
          yearPercent,
          frequencyPercent,
          timePercent,
          roles
        ].join(','));
      });
    });

    return rows.join('\n');
  }

  /**
   * Export a normalized, row-based JSON with only selected activities, steps, and subcomponents.
   */
  static exportNormalizedJSON(
    year: number,
    activities: any[],
    qraDataMap: Record<string, any>
  ): string {
    const rows: any[] = [];

    // Process each activity that has QRA data
    Object.entries(qraDataMap).forEach(([activityId, qra]) => {
      if (!qra || !qra.selectedSubcomponents) return;
      
      const activity = activities.find(a => a.id === activityId || a.name === activityId);
      if (!activity) return;

      const practicePercent = qra.practicePercent ?? 0;
      Object.entries(qra.selectedSubcomponents).forEach(([subId, subSel]) => {
        const sub = subSel as SubcomponentConfig;
        let stepName = sub.step || '';
        let subcomponentTitle = sub.subcomponent || '';
        let yearPercent = sub.yearPercent ?? '';
        let frequencyPercent = sub.frequencyPercent ?? '';
        let timePercent = sub.timePercent ?? '';
        let roles = Array.isArray(sub.selectedRoles)
          ? sub.selectedRoles.join(', ')
          : (sub.selectedRoles || '');
        if ((!stepName || !subcomponentTitle) && activity.steps) {
          for (const step of activity.steps) {
            if (step.subcomponents) {
              for (const subcomponent of step.subcomponents) {
                if (subcomponent.id === subId || subcomponent.title === subcomponentTitle) {
                  stepName = step.name || stepName;
                  subcomponentTitle = subcomponent.title || subcomponentTitle;
                  break;
                }
              }
            }
          }
        }
        
        // Handle subcomponent title if it's an object
        if (typeof subcomponentTitle === 'object' && subcomponentTitle.title) {
          subcomponentTitle = subcomponentTitle.title;
        }

        rows.push({
          year,
          researchActivityTitle: activity.name || activity.title || '',
          researchActivityPracticePercent: practicePercent,
          step: stepName,
          subcomponentTitle,
          subcomponentYearPercent: yearPercent,
          subcomponentFrequencyPercent: frequencyPercent,
          subcomponentTimePercent: timePercent,
          roles
        });
      });
    });

    return JSON.stringify(rows, null, 2);
  }
} 