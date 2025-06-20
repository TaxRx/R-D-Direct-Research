import { RoleNode } from '../types/Business';

export interface TabApproval {
  timestamp: string;
  ipAddress: string;
  data: any; // This will be typed based on the tab's data structure
}

export interface ApprovalLog {
  tabId: string;
  approvals: TabApproval[];
  isApproved: boolean;
}

export interface ExportDataset {
  timestamp: string;
  ipAddress: string;
  tabs: {
    roles: RoleNode[];
    // Add other tab data types here
  };
}

// Approval storage abstraction for future Supabase migration
export const approvalStorageService = {
  // Get approval data for a specific tab and year
  get(tabKey: string, year: number) {
    try {
      const stored = localStorage.getItem(`${tabKey}-${year}`);
      if (stored) return JSON.parse(stored);
    } catch {}
    return null;
  },
  
  // Set approval data for a specific tab and year
  set(tabKey: string, year: number, value: any) {
    localStorage.setItem(`${tabKey}-${year}`, JSON.stringify(value));
  },
  
  // Clear approval data for a specific tab and year
  clear(tabKey: string, year: number) {
    localStorage.removeItem(`${tabKey}-${year}`);
  },
  
  // Get all approval data (for migration to Supabase)
  getAllApprovals(): Record<string, any> {
    const allData: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.includes('TabApproval-')) {
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
};

// Persistent approval storage using localStorage
export const approvalsService = {
  // Get the storage key for a tab approval
  getApprovalKey: (tabId: string, year?: number) => {
    return year ? `${tabId}TabApproval-${year}` : `${tabId}TabApproval`;
  },

  // Record a tab approval
  recordApproval: (tabId: string, approval: TabApproval, year?: number) => {
    const key = approvalsService.getApprovalKey(tabId, year);
    const approvalData = {
      isApproved: true,
      approvalData: approval,
      timestamp: approval.timestamp,
      ipAddress: approval.ipAddress
    };
    
    localStorage.setItem(key, JSON.stringify(approvalData));
    return approvalData;
  },

  // Remove approval for a tab
  removeApproval: (tabId: string, year?: number) => {
    const key = approvalsService.getApprovalKey(tabId, year);
    localStorage.removeItem(key);
    return { isApproved: false, approvalData: null };
  },

  // Check if a tab is approved
  isTabApproved: (tabId: string, year?: number) => {
    const key = approvalsService.getApprovalKey(tabId, year);
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const data = JSON.parse(stored);
        return data.isApproved || false;
      }
    } catch {
      // Handle JSON parse errors
    }
    return false;
  },

  // Get approval data for a tab
  getApprovalData: (tabId: string, year?: number) => {
    const key = approvalsService.getApprovalKey(tabId, year);
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Handle JSON parse errors
    }
    return null;
  },

  // Get approval history for a tab (legacy method for compatibility)
  getApprovalHistory: (tabId: string, year?: number) => {
    const approvalData = approvalsService.getApprovalData(tabId, year);
    return approvalData?.approvalData ? [approvalData.approvalData] : [];
  },

  // Create final export dataset
  createExportDataset: async (ipAddress: string) => {
    const dataset: ExportDataset = {
      timestamp: new Date().toISOString(),
      ipAddress,
      tabs: {
        roles: [], // Populate with approved data
        // Add other tab data
      }
    };

    // Get roles approval data
    const rolesApproval = approvalsService.getApprovalData('roles');
    if (rolesApproval?.isApproved && rolesApproval.approvalData?.data) {
      dataset.tabs.roles = rolesApproval.approvalData.data;
    }

    return dataset;
  }
}; 