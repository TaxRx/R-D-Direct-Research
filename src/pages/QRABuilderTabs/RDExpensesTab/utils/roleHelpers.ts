import { RoleNode, Role } from '../../../../types/Business';

/**
 * Role utility functions for expense management
 * These functions handle role hierarchy flattening and name resolution
 */

// Helper function to flatten hierarchical roles (same as in IdentifyRolesTab)
export const flattenAllRoles = (nodes: RoleNode[]): RoleNode[] => {
  if (!Array.isArray(nodes)) return [];
  let result: RoleNode[] = [];
  nodes.forEach(node => {
    result.push(node);
    if (node.children && node.children.length > 0) {
      result = result.concat(flattenAllRoles(node.children));
    }
  });
  return result;
};

// Get role name with fallback to custom name
export const getRoleName = (
  roleId: string, 
  customRoleName?: string, 
  roles?: Role[], 
  NON_RD_ROLE?: { id: string; name: string },
  OTHER_ROLE?: { id: string; name: string }
): string => {
  // Handle special role constants if provided
  if (NON_RD_ROLE && roleId === NON_RD_ROLE.id) {
    return NON_RD_ROLE.name;
  }
  if (OTHER_ROLE && roleId === OTHER_ROLE.id) {
    return customRoleName || OTHER_ROLE.name;
  }
  
  // Find role in roles array
  if (roles) {
    const role = roles.find(r => r.id === roleId);
    if (role) {
      return role.name;
    }
  }
  
  // Fallback for known role IDs
  if (roleId === 'non-rd') return 'Non-R&D';
  if (roleId === 'other') return customRoleName || 'Other';
  
  return 'Unknown Role';
}; 