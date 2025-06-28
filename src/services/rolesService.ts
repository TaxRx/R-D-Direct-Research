import { supabase } from './supabase';

// Helper function to generate UUID
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export interface Role {
  id: string;
  business_id: string;
  year: number;
  role_id: string;
  name: string;
  color: string;
  participates_in_rd: boolean;
  parent_role_id?: string;
  order_index: number;
  created_at?: string;
  updated_at?: string;
}

export interface RoleTree {
  id: string;
  name: string;
  color: string;
  participatesInRD: boolean;
  children: RoleTree[];
}

export class RolesService {
  /**
   * Load all roles for a business/year and convert to hierarchical tree structure
   */
  static async loadRoles(businessId: string, year: number): Promise<RoleTree[]> {
    try {
      if (!businessId || !year) {
        console.warn('RolesService.loadRoles: Missing businessId or year');
        return [];
      }

      console.log('Loading roles for:', { businessId, year });

      const { data: roles, error } = await supabase
        .from('roles')
        .select('*')
        .eq('business_id', businessId)
        .eq('year', year)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Error loading roles:', error);
        return [];
      }

      if (!roles || roles.length === 0) {
        console.log('No roles found, creating default role');
        return this.createDefaultRole();
      }

      console.log('Loaded roles from database:', roles);
      return this.buildRoleTree(roles);
    } catch (error) {
      console.error('Error in loadRoles:', error);
      return [];
    }
  }

  /**
   * Save roles for a business/year
   */
  static async saveRoles(businessId: string, year: number, roles: RoleTree[]): Promise<boolean> {
    try {
      if (!businessId || !year || !roles) {
        console.warn('RolesService.saveRoles: Missing required parameters');
        return false;
      }

      console.log('Saving roles for:', { businessId, year, roles });

      // Convert tree structure to flat array
      const flatRoles = this.flattenRoleTree(roles, businessId, year);

      // Use upsert to avoid unique constraint errors
      if (flatRoles.length > 0) {
        const { error: upsertError } = await supabase
          .from('roles')
          .upsert(flatRoles, {
            onConflict: 'business_id,year,role_id'  // must match the unique constraint
          });

        if (upsertError) {
          console.error('Error upserting roles:', upsertError);
          return false;
        }
      }

      console.log('Roles saved successfully');
      return true;
    } catch (error) {
      console.error('Error in saveRoles:', error);
      return false;
    }
  }

  /**
   * Convert hierarchical role tree to flat array for database storage
   */
  private static flattenRoleTree(roles: RoleTree[], businessId: string, year: number, parentRoleId?: string, orderIndex: number = 0): Role[] {
    const flatRoles: Role[] = [];

    roles.forEach((role, index) => {
      // Always use a generated UUID for id, but 'research-leader' for role_id if appropriate
      const isResearchLeader = role.name === 'Research Leader' || role.id === 'research-leader';
      const dbRole: Role = {
        id: generateUUID(),
        business_id: businessId,
        year: year,
        role_id: isResearchLeader ? 'research-leader' : role.id,
        name: role.name,
        color: role.color,
        participates_in_rd: role.participatesInRD,
        parent_role_id: parentRoleId,
        order_index: orderIndex + index,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      flatRoles.push(dbRole);

      // Recursively process children
      if (role.children && role.children.length > 0) {
        const childRoles = this.flattenRoleTree(
          role.children, 
          businessId, 
          year, 
          dbRole.role_id, 
          orderIndex + index + 1
        );
        flatRoles.push(...childRoles);
      }
    });

    return flatRoles;
  }

  /**
   * Convert flat database roles to hierarchical tree structure
   */
  private static buildRoleTree(roles: Role[]): RoleTree[] {
    const roleMap = new Map<string, RoleTree>();
    const rootRoles: RoleTree[] = [];

    // First pass: create all role nodes
    roles.forEach(role => {
      const roleNode: RoleTree = {
        id: role.role_id,
        name: role.name,
        color: role.color,
        participatesInRD: role.participates_in_rd,
        children: []
      };
      roleMap.set(role.role_id, roleNode);
    });

    // Second pass: build parent-child relationships
    roles.forEach(role => {
      const roleNode = roleMap.get(role.role_id);
      if (roleNode) {
        if (role.parent_role_id) {
          const parentNode = roleMap.get(role.parent_role_id);
          if (parentNode) {
            parentNode.children.push(roleNode);
          }
        } else {
          rootRoles.push(roleNode);
        }
      }
    });

    return rootRoles;
  }

  /**
   * Create default "Research Leader" role
   */
  private static createDefaultRole(): RoleTree[] {
    return [{
      id: generateUUID(),
      name: 'Research Leader',
      color: '#1976d2',
      participatesInRD: true,
      children: []
    }];
  }

  /**
   * Get a single role by ID
   */
  static async getRole(businessId: string, year: number, roleId: string): Promise<Role | null> {
    try {
      const { data: role, error } = await supabase
        .from('roles')
        .select('*')
        .eq('business_id', businessId)
        .eq('year', year)
        .eq('role_id', roleId)
        .single();

      if (error) {
        console.error('Error getting role:', error);
        return null;
      }

      return role;
    } catch (error) {
      console.error('RolesService.getRole error:', error);
      return null;
    }
  }

  /**
   * Update a single role
   */
  static async updateRole(businessId: string, year: number, roleId: string, updates: Partial<Role>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('roles')
        .update(updates)
        .eq('business_id', businessId)
        .eq('year', year)
        .eq('role_id', roleId);

      if (error) {
        console.error('Error updating role:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('RolesService.updateRole error:', error);
      return false;
    }
  }

  /**
   * Delete a role and all its children
   */
  static async deleteRole(businessId: string, year: number, roleId: string): Promise<boolean> {
    try {
      // First, get all child roles recursively
      const childRoleIds = await this.getChildRoleIds(businessId, year, roleId);
      const allRoleIds = [roleId, ...childRoleIds];

      // Delete all roles
      const { error } = await supabase
        .from('roles')
        .delete()
        .eq('business_id', businessId)
        .eq('year', year)
        .in('role_id', allRoleIds);

      if (error) {
        console.error('Error deleting role:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('RolesService.deleteRole error:', error);
      return false;
    }
  }

  /**
   * Get all child role IDs recursively
   */
  private static async getChildRoleIds(businessId: string, year: number, parentRoleId: string): Promise<string[]> {
    const childRoleIds: string[] = [];

    const { data: children, error } = await supabase
      .from('roles')
      .select('role_id')
      .eq('business_id', businessId)
      .eq('year', year)
      .eq('parent_role_id', parentRoleId);

    if (error) {
      console.error('Error getting child roles:', error);
      return childRoleIds;
    }

    if (children) {
      children.forEach(child => {
        childRoleIds.push(child.role_id);
        // Recursively get grandchildren
        this.getChildRoleIds(businessId, year, child.role_id).then(grandchildren => {
          childRoleIds.push(...grandchildren);
        });
      });
    }

    return childRoleIds;
  }

  /**
   * Check if roles exist for a business/year
   */
  static async hasRoles(businessId: string, year: number): Promise<boolean> {
    try {
      const { count, error } = await supabase
        .from('roles')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .eq('year', year);

      if (error) {
        console.error('Error checking roles existence:', error);
        return false;
      }

      return (count || 0) > 0;
    } catch (error) {
      console.error('RolesService.hasRoles error:', error);
      return false;
    }
  }
} 