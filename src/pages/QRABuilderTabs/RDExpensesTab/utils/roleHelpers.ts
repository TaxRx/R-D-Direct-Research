import { RoleNode, Role, Business } from '../../../../types/Business';

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

// Calculate role applied percentages from activities
export const calculateRoleAppliedPercentages = (
  roles: RoleNode[],
  selectedBusinessId: string,
  selectedYear: number
): Role[] => {
  // First, flatten the hierarchical role structure to get all roles including children
  const allRoles = flattenAllRoles(roles);
  
  // Get QRA data for all activities
  const getQRAData = (activityName: string) => {
    try {
      // Find the activity ID by name first
      const STORAGE_KEY = 'businessInfoData';
      const savedData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      const business = savedData.businesses?.find((b: any) => b.id === selectedBusinessId);
      const yearData = business?.years?.[selectedYear];
      const activities = yearData?.activities || {};
      
      // Find activity ID by name
      const activityEntry = Object.entries(activities).find(([id, activity]: [string, any]) => 
        activity.name === activityName
      );
      
      if (!activityEntry) {
        console.warn(`Could not find activity with name: ${activityName}`);
        return null;
      }
      
      const activityId = activityEntry[0];
      const qraData = localStorage.getItem(`qra_${selectedBusinessId}_${selectedYear}_${activityId}`);
      return qraData ? JSON.parse(qraData) : null;
    } catch (error) {
      console.error('Error loading QRA data:', error);
      return null;
    }
  };

  // Get business data to find activities and their role assignments
  const STORAGE_KEY = 'businessInfoData';
  const savedData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  const business = savedData.businesses?.find((b: any) => b.id === selectedBusinessId);
  const activities = business?.years?.[selectedYear]?.activities || {};

  // Calculate applied percentage for each role
  return allRoles.map(role => {
    let totalAppliedPercentage = 0;
    let activityCount = 0;

    // Find all activities that this role participates in
    Object.values(activities).forEach((activity: any) => {
      if (activity.selectedRoles && activity.selectedRoles.includes(role.id)) {
        // Get the applied percentage from QRA data for this activity
        const qraData = getQRAData(activity.name);
        if (qraData && qraData.totalAppliedPercent) {
          totalAppliedPercentage += qraData.totalAppliedPercent;
          activityCount++;
        }
      }
    });

    // Average the applied percentages across all activities this role participates in
    const appliedPercentage = activityCount > 0 ? totalAppliedPercentage / activityCount : 0;

    return {
      ...role,
      appliedPercentage: Math.round(appliedPercentage * 100) / 100 // Round to 2 decimal places
    };
  });
}; 