import { useState, useEffect, useCallback, useMemo } from 'react';
import { QRABuilderService } from '../services/qrabuilderService';
import { SubcomponentSelectionData, EmployeeConfiguration, ContractorConfiguration, SupplyConfiguration } from '../types/QRABuilderInterfaces';

// =====================================================
// TYPES AND INTERFACES
// =====================================================

export interface QRABuilderState {
  // QRA Data
  qraData: Record<string, SubcomponentSelectionData>;
  qraDataLoading: boolean;
  qraDataError: string | null;

  // Employee Configurations
  employeeConfigs: EmployeeConfiguration[];
  employeeConfigsLoading: boolean;
  employeeConfigsError: string | null;

  // Contractor Configurations
  contractorConfigs: ContractorConfiguration[];
  contractorConfigsLoading: boolean;
  contractorConfigsError: string | null;

  // Supply Configurations
  supplyConfigs: SupplyConfiguration[];
  supplyConfigsLoading: boolean;
  supplyConfigsError: string | null;

  // Overall state
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export interface QRABuilderActions {
  // QRA Data actions
  saveQRAData: (activityId: string, activityName: string, data: SubcomponentSelectionData) => Promise<boolean>;
  loadQRAData: (activityId: string) => Promise<SubcomponentSelectionData | null>;
  refreshQRAData: () => Promise<void>;

  // Employee configuration actions
  saveEmployeeConfig: (config: EmployeeConfiguration) => Promise<boolean>;
  loadEmployeeConfig: (employeeId: string) => Promise<EmployeeConfiguration | null>;
  refreshEmployeeConfigs: () => Promise<void>;

  // Contractor configuration actions
  saveContractorConfig: (config: ContractorConfiguration) => Promise<boolean>;
  loadContractorConfig: (contractorId: string) => Promise<ContractorConfiguration | null>;
  refreshContractorConfigs: () => Promise<void>;

  // Supply configuration actions
  saveSupplyConfig: (config: SupplyConfiguration) => Promise<boolean>;
  loadSupplyConfig: (supplyId: string) => Promise<SupplyConfiguration | null>;
  refreshSupplyConfigs: () => Promise<void>;

  // Bulk actions
  refreshAll: () => Promise<void>;
  clearError: () => void;
}

// =====================================================
// HOOK IMPLEMENTATION
// =====================================================

export const useQRABuilderSupabase = (
  businessId: string,
  year: number
): [QRABuilderState, QRABuilderActions] => {
  // =====================================================
  // STATE MANAGEMENT
  // =====================================================

  const [state, setState] = useState<QRABuilderState>({
    // QRA Data
    qraData: {},
    qraDataLoading: false,
    qraDataError: null,

    // Employee Configurations
    employeeConfigs: [],
    employeeConfigsLoading: false,
    employeeConfigsError: null,

    // Contractor Configurations
    contractorConfigs: [],
    contractorConfigsLoading: false,
    contractorConfigsError: null,

    // Supply Configurations
    supplyConfigs: [],
    supplyConfigsLoading: false,
    supplyConfigsError: null,

    // Overall state
    isLoading: false,
    error: null,
    lastUpdated: null
  });

  // =====================================================
  // LOADING STATE COMPUTATION
  // =====================================================

  const isLoading = useMemo(() => {
    return state.qraDataLoading || 
           state.employeeConfigsLoading || 
           state.contractorConfigsLoading || 
           state.supplyConfigsLoading;
  }, [
    state.qraDataLoading,
    state.employeeConfigsLoading,
    state.contractorConfigsLoading,
    state.supplyConfigsLoading
  ]);

  // =====================================================
  // QRA DATA OPERATIONS
  // =====================================================

  const saveQRAData = useCallback(async (
    activityId: string,
    activityName: string,
    data: SubcomponentSelectionData
  ): Promise<boolean> => {
    setState(prev => ({ ...prev, qraDataLoading: true, qraDataError: null }));

    try {
      const success = await QRABuilderService.saveQRAData(businessId, year, activityId, activityName, data);
      
      if (success) {
        setState(prev => ({
          ...prev,
          qraData: { ...prev.qraData, [activityId]: data },
          qraDataLoading: false,
          lastUpdated: new Date()
        }));
        return true;
      } else {
        setState(prev => ({
          ...prev,
          qraDataLoading: false,
          qraDataError: `Failed to save QRA data for activity: ${activityName}`
        }));
        return false;
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        qraDataLoading: false,
        qraDataError: `Error saving QRA data: ${error instanceof Error ? error.message : 'Unknown error'}`
      }));
      return false;
    }
  }, [businessId, year]);

  const loadQRAData = useCallback(async (activityId: string): Promise<SubcomponentSelectionData | null> => {
    try {
      const data = await QRABuilderService.loadQRAData(businessId, year, activityId);
      
      if (data) {
        setState(prev => ({
          ...prev,
          qraData: { ...prev.qraData, [activityId]: data }
        }));
      }
      
      return data;
    } catch (error) {
      console.error('Error loading QRA data:', error);
      return null;
    }
  }, [businessId, year]);

  const refreshQRAData = useCallback(async () => {
    setState(prev => ({ ...prev, qraDataLoading: true, qraDataError: null }));

    try {
      const data = await QRABuilderService.getAllQRAData(businessId, year);
      
      setState(prev => ({
        ...prev,
        qraData: data,
        qraDataLoading: false,
        lastUpdated: new Date()
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        qraDataLoading: false,
        qraDataError: `Error loading QRA data: ${error instanceof Error ? error.message : 'Unknown error'}`
      }));
    }
  }, [businessId, year]);

  // =====================================================
  // EMPLOYEE CONFIGURATION OPERATIONS
  // =====================================================

  const saveEmployeeConfig = useCallback(async (config: EmployeeConfiguration): Promise<boolean> => {
    setState(prev => ({ ...prev, employeeConfigsLoading: true, employeeConfigsError: null }));

    try {
      const success = await QRABuilderService.saveEmployeeConfiguration(businessId, year, config);
      
      if (success) {
        setState(prev => ({
          ...prev,
          employeeConfigs: prev.employeeConfigs.map(c => 
            c.employeeId === config.employeeId ? config : c
          ),
          employeeConfigsLoading: false,
          lastUpdated: new Date()
        }));
        return true;
      } else {
        setState(prev => ({
          ...prev,
          employeeConfigsLoading: false,
          employeeConfigsError: `Failed to save employee configuration for: ${config.employeeName}`
        }));
        return false;
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        employeeConfigsLoading: false,
        employeeConfigsError: `Error saving employee configuration: ${error instanceof Error ? error.message : 'Unknown error'}`
      }));
      return false;
    }
  }, [businessId, year]);

  const loadEmployeeConfig = useCallback(async (employeeId: string): Promise<EmployeeConfiguration | null> => {
    try {
      const config = await QRABuilderService.loadEmployeeConfiguration(businessId, year, employeeId);
      
      if (config) {
        setState(prev => ({
          ...prev,
          employeeConfigs: prev.employeeConfigs.map(c => 
            c.employeeId === employeeId ? config : c
          )
        }));
      }
      
      return config;
    } catch (error) {
      console.error('Error loading employee configuration:', error);
      return null;
    }
  }, [businessId, year]);

  const refreshEmployeeConfigs = useCallback(async () => {
    setState(prev => ({ ...prev, employeeConfigsLoading: true, employeeConfigsError: null }));

    try {
      const configs = await QRABuilderService.getAllEmployeeConfigurations(businessId, year);
      
      setState(prev => ({
        ...prev,
        employeeConfigs: configs,
        employeeConfigsLoading: false,
        lastUpdated: new Date()
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        employeeConfigsLoading: false,
        employeeConfigsError: `Error loading employee configurations: ${error instanceof Error ? error.message : 'Unknown error'}`
      }));
    }
  }, [businessId, year]);

  // =====================================================
  // CONTRACTOR CONFIGURATION OPERATIONS
  // =====================================================

  const saveContractorConfig = useCallback(async (config: ContractorConfiguration): Promise<boolean> => {
    setState(prev => ({ ...prev, contractorConfigsLoading: true, contractorConfigsError: null }));

    try {
      const success = await QRABuilderService.saveContractorConfiguration(businessId, year, config);
      
      if (success) {
        setState(prev => ({
          ...prev,
          contractorConfigs: prev.contractorConfigs.map(c => 
            c.contractorId === config.contractorId ? config : c
          ),
          contractorConfigsLoading: false,
          lastUpdated: new Date()
        }));
        return true;
      } else {
        setState(prev => ({
          ...prev,
          contractorConfigsLoading: false,
          contractorConfigsError: `Failed to save contractor configuration for: ${config.contractorName}`
        }));
        return false;
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        contractorConfigsLoading: false,
        contractorConfigsError: `Error saving contractor configuration: ${error instanceof Error ? error.message : 'Unknown error'}`
      }));
      return false;
    }
  }, [businessId, year]);

  const loadContractorConfig = useCallback(async (contractorId: string): Promise<ContractorConfiguration | null> => {
    try {
      const config = await QRABuilderService.loadContractorConfiguration(businessId, year, contractorId);
      
      if (config) {
        setState(prev => ({
          ...prev,
          contractorConfigs: prev.contractorConfigs.map(c => 
            c.contractorId === contractorId ? config : c
          )
        }));
      }
      
      return config;
    } catch (error) {
      console.error('Error loading contractor configuration:', error);
      return null;
    }
  }, [businessId, year]);

  const refreshContractorConfigs = useCallback(async () => {
    setState(prev => ({ ...prev, contractorConfigsLoading: true, contractorConfigsError: null }));

    try {
      const configs = await QRABuilderService.getAllContractorConfigurations(businessId, year);
      
      setState(prev => ({
        ...prev,
        contractorConfigs: configs,
        contractorConfigsLoading: false,
        lastUpdated: new Date()
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        contractorConfigsLoading: false,
        contractorConfigsError: `Error loading contractor configurations: ${error instanceof Error ? error.message : 'Unknown error'}`
      }));
    }
  }, [businessId, year]);

  // =====================================================
  // SUPPLY CONFIGURATION OPERATIONS
  // =====================================================

  const saveSupplyConfig = useCallback(async (config: SupplyConfiguration): Promise<boolean> => {
    setState(prev => ({ ...prev, supplyConfigsLoading: true, supplyConfigsError: null }));

    try {
      const success = await QRABuilderService.saveSupplyConfiguration(businessId, year, config);
      
      if (success) {
        setState(prev => ({
          ...prev,
          supplyConfigs: prev.supplyConfigs.map(c => 
            c.supplyId === config.supplyId ? config : c
          ),
          supplyConfigsLoading: false,
          lastUpdated: new Date()
        }));
        return true;
      } else {
        setState(prev => ({
          ...prev,
          supplyConfigsLoading: false,
          supplyConfigsError: `Failed to save supply configuration for: ${config.supplyName}`
        }));
        return false;
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        supplyConfigsLoading: false,
        supplyConfigsError: `Error saving supply configuration: ${error instanceof Error ? error.message : 'Unknown error'}`
      }));
      return false;
    }
  }, [businessId, year]);

  const loadSupplyConfig = useCallback(async (supplyId: string): Promise<SupplyConfiguration | null> => {
    try {
      const config = await QRABuilderService.loadSupplyConfiguration(businessId, year, supplyId);
      
      if (config) {
        setState(prev => ({
          ...prev,
          supplyConfigs: prev.supplyConfigs.map(c => 
            c.supplyId === supplyId ? config : c
          )
        }));
      }
      
      return config;
    } catch (error) {
      console.error('Error loading supply configuration:', error);
      return null;
    }
  }, [businessId, year]);

  const refreshSupplyConfigs = useCallback(async () => {
    setState(prev => ({ ...prev, supplyConfigsLoading: true, supplyConfigsError: null }));

    try {
      const configs = await QRABuilderService.getAllSupplyConfigurations(businessId, year);
      
      setState(prev => ({
        ...prev,
        supplyConfigs: configs,
        supplyConfigsLoading: false,
        lastUpdated: new Date()
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        supplyConfigsLoading: false,
        supplyConfigsError: `Error loading supply configurations: ${error instanceof Error ? error.message : 'Unknown error'}`
      }));
    }
  }, [businessId, year]);

  // =====================================================
  // BULK OPERATIONS
  // =====================================================

  const refreshAll = useCallback(async () => {
    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: null,
      qraDataLoading: true,
      employeeConfigsLoading: true,
      contractorConfigsLoading: true,
      supplyConfigsLoading: true
    }));

    try {
      // Load all data in parallel
      const [qraData, configs] = await Promise.all([
        QRABuilderService.getAllQRAData(businessId, year),
        QRABuilderService.getAllConfigurations(businessId, year)
      ]);

      setState(prev => ({
        ...prev,
        qraData,
        employeeConfigs: configs.employees,
        contractorConfigs: configs.contractors,
        supplyConfigs: configs.supplies,
        isLoading: false,
        qraDataLoading: false,
        employeeConfigsLoading: false,
        contractorConfigsLoading: false,
        supplyConfigsLoading: false,
        lastUpdated: new Date()
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        qraDataLoading: false,
        employeeConfigsLoading: false,
        contractorConfigsLoading: false,
        supplyConfigsLoading: false,
        error: `Error refreshing data: ${error instanceof Error ? error.message : 'Unknown error'}`
      }));
    }
  }, [businessId, year]);

  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
      qraDataError: null,
      employeeConfigsError: null,
      contractorConfigsError: null,
      supplyConfigsError: null
    }));
  }, []);

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    if (businessId && year) {
      refreshAll();
    }
  }, [businessId, year, refreshAll]);

  // =====================================================
  // RETURN STATE AND ACTIONS
  // =====================================================

  const currentState: QRABuilderState = {
    ...state,
    isLoading
  };

  const actions: QRABuilderActions = {
    // QRA Data actions
    saveQRAData,
    loadQRAData,
    refreshQRAData,

    // Employee configuration actions
    saveEmployeeConfig,
    loadEmployeeConfig,
    refreshEmployeeConfigs,

    // Contractor configuration actions
    saveContractorConfig,
    loadContractorConfig,
    refreshContractorConfigs,

    // Supply configuration actions
    saveSupplyConfig,
    loadSupplyConfig,
    refreshSupplyConfigs,

    // Bulk actions
    refreshAll,
    clearError
  };

  return [currentState, actions];
}; 