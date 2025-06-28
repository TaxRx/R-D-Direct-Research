import { supabase } from './supabase';
import { InsertDto } from './supabase';
import { ExpensesService } from './expensesService';
import { QRADataExportService } from './qraDataExportService';
import { activitiesDataService } from './activitiesDataService';
import { SupabaseClientService } from './supabaseClientService';
import { SupabaseBusinessService } from './supabaseBusinessService';

export interface MigrationResult {
  success: boolean;
  message: string;
  details?: {
    businessesCreated: number;
    yearsCreated: number;
    activitiesCreated: number;
    stepsCreated: number;
    subcomponentsCreated: number;
    rolesCreated: number;
    employeesCreated: number;
    contractorsCreated: number;
    suppliesCreated: number;
    allocationsCreated: number;
  };
  errors?: string[];
}

export class SupabaseMigrationService {
  /**
   * Debug method to check localStorage contents
   */
  static debugLocalStorage(): void {
    console.log('=== LOCALSTORAGE DEBUG ===');
    const allKeys = Object.keys(localStorage);
    console.log('All localStorage keys:', allKeys);
    
    const businessKeys = allKeys.filter(key => 
      key.includes('business') || 
      key.includes('Business') || 
      key.includes('qra') ||
      key.includes('expenses')
    );
    
    console.log('Relevant keys:', businessKeys);
    
    for (const key of businessKeys) {
      try {
        const data = localStorage.getItem(key);
        console.log(`${key}:`, data ? JSON.parse(data) : null);
      } catch (e) {
        console.log(`${key}:`, localStorage.getItem(key));
      }
    }
    console.log('=== END DEBUG ===');
  }

  /**
   * Migrate all localStorage data to Supabase
   */
  static async migrateAllData(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      console.log('Starting comprehensive data migration to Supabase...');
      
      const results = {
        clients: { migrated: 0, errors: 0 },
        businesses: { migrated: 0, errors: 0 },
        qraData: { migrated: 0, errors: 0 },
        employees: { migrated: 0, errors: 0 },
        contractors: { migrated: 0, errors: 0 },
        supplies: { migrated: 0, errors: 0 }
      };

      // 1. Migrate clients from localStorage
      const clientResult = await this.migrateClients();
      results.clients = clientResult;

      // 2. Migrate businesses from localStorage
      const businessResult = await this.migrateBusinesses();
      results.businesses = businessResult;

      // 3. Migrate QRA data
      const qraResult = await this.migrateQRAData();
      results.qraData = qraResult;

      // 4. Migrate employees, contractors, and supplies
      const employeeResult = await this.migrateEmployees();
      results.employees = employeeResult;

      const contractorResult = await this.migrateContractors();
      results.contractors = contractorResult;

      const supplyResult = await this.migrateSupplies();
      results.supplies = supplyResult;

      const totalMigrated = Object.values(results).reduce((sum, r) => sum + r.migrated, 0);
      const totalErrors = Object.values(results).reduce((sum, r) => sum + r.errors, 0);

      return {
        success: totalErrors === 0,
        message: `Migration completed: ${totalMigrated} records migrated, ${totalErrors} errors`,
        details: results
      };

    } catch (error) {
      console.error('Migration failed:', error);
      return {
        success: false,
        message: `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error instanceof Error ? error.toString() : String(error) }
      };
    }
  }

  // Migrate clients from localStorage
  private static async migrateClients(): Promise<{ migrated: number; errors: number }> {
    try {
      const clientsData = localStorage.getItem('adminClientsData');
      if (!clientsData) {
        return { migrated: 0, errors: 0 };
      }

      const clients = JSON.parse(clientsData);
      let migrated = 0;
      let errors = 0;

      for (const client of clients) {
        try {
          const newClient = await SupabaseClientService.createClient({
            name: client.name,
            email: client.email,
            role: client.role,
            notes: client.notes,
            businessIds: []
          });

          if (newClient) {
            migrated++;
            console.log(`Migrated client: ${client.name}`);
          } else {
            errors++;
            console.error(`Failed to migrate client: ${client.name}`);
          }
        } catch (error) {
          errors++;
          console.error(`Error migrating client ${client.name}:`, error);
        }
      }

      return { migrated, errors };
    } catch (error) {
      console.error('Error migrating clients:', error);
      return { migrated: 0, errors: 1 };
    }
  }

  // Migrate businesses from localStorage
  private static async migrateBusinesses(): Promise<{ migrated: number; errors: number }> {
    try {
      const businessesData = localStorage.getItem('businessesData');
      if (!businessesData) {
        return { migrated: 0, errors: 0 };
      }

      const businesses = JSON.parse(businessesData);
      let migrated = 0;
      let errors = 0;

      // Get the first available client to assign businesses to
      const clients = await SupabaseClientService.getClients();
      const defaultClientId = clients.length > 0 ? clients[0].id : null;

      for (const business of businesses) {
        try {
          if (!defaultClientId) {
            console.warn('No client available to assign business to');
            break;
          }

          const newBusiness = await SupabaseBusinessService.createBusiness({
            businessName: business.businessName,
            entityState: business.entityState,
            startYear: business.startYear,
            financialHistory: business.financialHistory
          }, defaultClientId);

          if (newBusiness) {
            migrated++;
            console.log(`Migrated business: ${business.businessName}`);
          } else {
            errors++;
            console.error(`Failed to migrate business: ${business.businessName}`);
          }
        } catch (error) {
          errors++;
          console.error(`Error migrating business ${business.businessName}:`, error);
        }
      }

      return { migrated, errors };
    } catch (error) {
      console.error('Error migrating businesses:', error);
      return { migrated: 0, errors: 1 };
    }
  }

  // Migrate QRA data from localStorage
  private static async migrateQRAData(): Promise<{ migrated: number; errors: number }> {
    try {
      let migrated = 0;
      let errors = 0;

      // Get all businesses from Supabase
      const businesses = await SupabaseBusinessService.getBusinesses();

      for (const business of businesses) {
        try {
          // Get QRA data for this business from localStorage
          const qraDataKey = `qraData_${business.id}`;
          const qraData = localStorage.getItem(qraDataKey);

          if (qraData) {
            const qraDataParsed = JSON.parse(qraData);
            
            // Migrate research activities
            for (const year in qraDataParsed) {
              const yearData = qraDataParsed[year];
              
              if (yearData.activities) {
                for (const activity of yearData.activities) {
                  try {
                    // Insert research activity
                    const { data: activityData, error: activityError } = await supabase
                      .from('research_activities')
                      .insert({
                        business_id: business.id,
                        year: parseInt(year),
                        title: activity.name,
                        practice_percent: activity.practicePercent || 0
                      })
                      .select()
                      .single();

                    if (activityError) throw activityError;

                    // Insert steps
                    if (activity.steps) {
                      for (let i = 0; i < activity.steps.length; i++) {
                        const step = activity.steps[i];
                        
                        const { data: stepData, error: stepError } = await supabase
                          .from('steps')
                          .insert({
                            research_activity_id: activityData.id,
                            title: step.name,
                            order_index: i
                          })
                          .select()
                          .single();

                        if (stepError) throw stepError;

                        // Insert subcomponents
                        if (step.subcomponents) {
                          for (const subcomponent of step.subcomponents) {
                            const { error: subcomponentError } = await supabase
                              .from('subcomponents')
                              .insert({
                                step_id: stepData.id,
                                title: subcomponent.name,
                                year_percent: subcomponent.yearPercent || 0,
                                frequency_percent: subcomponent.frequencyPercent || 0,
                                time_percent: subcomponent.timePercent || 0
                              });

                            if (subcomponentError) throw subcomponentError;
                          }
                        }
                      }
                    }

                    migrated++;
                  } catch (error) {
                    errors++;
                    console.error(`Error migrating activity ${activity.name}:`, error);
                  }
                }
              }
            }
          }
        } catch (error) {
          errors++;
          console.error(`Error migrating QRA data for business ${business.businessName}:`, error);
        }
      }

      return { migrated, errors };
    } catch (error) {
      console.error('Error migrating QRA data:', error);
      return { migrated: 0, errors: 1 };
    }
  }

  // Migrate employees from localStorage
  private static async migrateEmployees(): Promise<{ migrated: number; errors: number }> {
    try {
      let migrated = 0;
      let errors = 0;

      // Get all businesses from Supabase
      const businesses = await SupabaseBusinessService.getBusinesses();

      for (const business of businesses) {
        try {
          // Get employees for this business from localStorage
          const employeesData = localStorage.getItem(`employees_${business.id}`);
          
          if (employeesData) {
            const employees = JSON.parse(employeesData);
            
            for (const year in employees) {
              const yearEmployees = employees[year];
              
              for (const employee of yearEmployees) {
                try {
                  // Find or create role
                  let roleId = null;
                  if (employee.role) {
                    const { data: roleData, error: roleError } = await supabase
                      .from('roles')
                      .select('id')
                      .eq('business_id', business.id)
                      .eq('name', employee.role)
                      .single();

                    if (roleError && roleError.code !== 'PGRST116') {
                      // Role doesn't exist, create it
                      const { data: newRole, error: createRoleError } = await supabase
                        .from('roles')
                        .insert({
                          business_id: business.id,
                          name: employee.role
                        })
                        .select()
                        .single();

                      if (createRoleError) throw createRoleError;
                      roleId = newRole.id;
                    } else if (roleData) {
                      roleId = roleData.id;
                    }
                  }

                  // Insert employee
                  const { error: employeeError } = await supabase
                    .from('employees')
                    .insert({
                      business_id: business.id,
                      year: parseInt(year),
                      first_name: employee.firstName,
                      last_name: employee.lastName,
                      role_id: roleId,
                      wage: employee.wage || 0,
                      is_owner: employee.isOwner || false,
                      is_active: employee.isActive !== false
                    });

                  if (employeeError) throw employeeError;
                  migrated++;
                } catch (error) {
                  errors++;
                  console.error(`Error migrating employee ${employee.firstName} ${employee.lastName}:`, error);
                }
              }
            }
          }
        } catch (error) {
          errors++;
          console.error(`Error migrating employees for business ${business.businessName}:`, error);
        }
      }

      return { migrated, errors };
    } catch (error) {
      console.error('Error migrating employees:', error);
      return { migrated: 0, errors: 1 };
    }
  }

  // Migrate contractors from localStorage
  private static async migrateContractors(): Promise<{ migrated: number; errors: number }> {
    try {
      let migrated = 0;
      let errors = 0;

      // Get all businesses from Supabase
      const businesses = await SupabaseBusinessService.getBusinesses();

      for (const business of businesses) {
        try {
          // Get contractors for this business from localStorage
          const contractorsData = localStorage.getItem(`contractors_${business.id}`);
          
          if (contractorsData) {
            const contractors = JSON.parse(contractorsData);
            
            for (const year in contractors) {
              const yearContractors = contractors[year];
              
              for (const contractor of yearContractors) {
                try {
                  // Find or create role
                  let roleId = null;
                  if (contractor.role) {
                    const { data: roleData, error: roleError } = await supabase
                      .from('roles')
                      .select('id')
                      .eq('business_id', business.id)
                      .eq('name', contractor.role)
                      .single();

                    if (roleError && roleError.code !== 'PGRST116') {
                      // Role doesn't exist, create it
                      const { data: newRole, error: createRoleError } = await supabase
                        .from('roles')
                        .insert({
                          business_id: business.id,
                          name: contractor.role
                        })
                        .select()
                        .single();

                      if (createRoleError) throw createRoleError;
                      roleId = newRole.id;
                    } else if (roleData) {
                      roleId = roleData.id;
                    }
                  }

                  // Insert contractor
                  const { error: contractorError } = await supabase
                    .from('contractors')
                    .insert({
                      business_id: business.id,
                      year: parseInt(year),
                      contractor_type: contractor.contractorType || 'individual',
                      first_name: contractor.firstName,
                      last_name: contractor.lastName,
                      business_name: contractor.businessName,
                      role_id: roleId,
                      total_amount: contractor.totalAmount || 0,
                      is_active: contractor.isActive !== false
                    });

                  if (contractorError) throw contractorError;
                  migrated++;
                } catch (error) {
                  errors++;
                  console.error(`Error migrating contractor ${contractor.firstName} ${contractor.lastName}:`, error);
                }
              }
            }
          }
        } catch (error) {
          errors++;
          console.error(`Error migrating contractors for business ${business.businessName}:`, error);
        }
      }

      return { migrated, errors };
    } catch (error) {
      console.error('Error migrating contractors:', error);
      return { migrated: 0, errors: 1 };
    }
  }

  // Migrate supplies from localStorage
  private static async migrateSupplies(): Promise<{ migrated: number; errors: number }> {
    try {
      let migrated = 0;
      let errors = 0;

      // Get all businesses from Supabase
      const businesses = await SupabaseBusinessService.getBusinesses();

      for (const business of businesses) {
        try {
          // Get supplies for this business from localStorage
          const suppliesData = localStorage.getItem(`supplies_${business.id}`);
          
          if (suppliesData) {
            const supplies = JSON.parse(suppliesData);
            
            for (const year in supplies) {
              const yearSupplies = supplies[year];
              
              for (const supply of yearSupplies) {
                try {
                  // Insert supply
                  const { error: supplyError } = await supabase
                    .from('supplies')
                    .insert({
                      business_id: business.id,
                      year: parseInt(year),
                      name: supply.name,
                      category: supply.category || 'general',
                      total_value: supply.totalValue || 0
                    });

                  if (supplyError) throw supplyError;
                  migrated++;
                } catch (error) {
                  errors++;
                  console.error(`Error migrating supply ${supply.name}:`, error);
                }
              }
            }
          }
        } catch (error) {
          errors++;
          console.error(`Error migrating supplies for business ${business.businessName}:`, error);
        }
      }

      return { migrated, errors };
    } catch (error) {
      console.error('Error migrating supplies:', error);
      return { migrated: 0, errors: 1 };
    }
  }

  /**
   * Check migration status
   */
  static async checkMigrationStatus(): Promise<{
    hasLocalData: boolean;
    hasSupabaseData: boolean;
    localDataCount: number;
    supabaseDataCount: number;
  }> {
    try {
      // Check localStorage data
      const localDataKeys = Object.keys(localStorage).filter(key => 
        key.includes('Data') || key.includes('businesses') || key.includes('employees') || 
        key.includes('contractors') || key.includes('supplies') || key.includes('qraData')
      );
      
      const hasLocalData = localDataKeys.length > 0;
      const localDataCount = localDataKeys.length;

      // Check Supabase data
      const [
        { count: clientsCount },
        { count: businessesCount },
        { count: employeesCount },
        { count: contractorsCount },
        { count: suppliesCount }
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('businesses').select('*', { count: 'exact', head: true }),
        supabase.from('employees').select('*', { count: 'exact', head: true }),
        supabase.from('contractors').select('*', { count: 'exact', head: true }),
        supabase.from('supplies').select('*', { count: 'exact', head: true })
      ]);

      const hasSupabaseData = (clientsCount || 0) + (businessesCount || 0) + (employeesCount || 0) + (contractorsCount || 0) + (suppliesCount || 0) > 0;
      const supabaseDataCount = (clientsCount || 0) + (businessesCount || 0) + (employeesCount || 0) + (contractorsCount || 0) + (suppliesCount || 0);

      return {
        hasLocalData,
        hasSupabaseData,
        localDataCount,
        supabaseDataCount
      };
    } catch (error) {
      console.error('Error checking migration status:', error);
      return {
        hasLocalData: false,
        hasSupabaseData: false,
        localDataCount: 0,
        supabaseDataCount: 0
      };
    }
  }

  /**
   * Clear localStorage data after successful migration
   */
  static clearLocalStorageData(): void {
    try {
      const keysToRemove = Object.keys(localStorage).filter(key => 
        key.includes('Data') || key.includes('businesses') || key.includes('employees') || 
        key.includes('contractors') || key.includes('supplies') || key.includes('qraData')
      );
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log(`Cleared ${keysToRemove.length} localStorage items`);
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
} 