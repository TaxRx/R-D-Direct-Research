// Shared Business and RoleNode types for the R&D app

export interface RoleNode {
  id: string;
  name: string;
  color?: string;
  children: RoleNode[];
  participatesInRD: boolean;
  parentId?: string;
}

export interface Role extends RoleNode {
  appliedPercentage: number; // Percentage of time spent on R&D activities
}

export interface Owner {
  id: string;
  name: string;
  ownershipPercentage: number;
  isResearchLeader: boolean;
}

export interface FinancialYear {
  year: number;
  grossReceipts: number;
  qre: number;
}

export interface TabApproval {
  isApproved: boolean;
  approvedAt: string;
  approvedBy: string;
}

export interface Business {
  // Basic business information
  id: string;
  businessName: string;
  dbaName: string;
  ein: string;
  entityType: string;
  entityState: string;
  startYear: number | null;
  owners: Owner[];
  financialHistory: FinancialYear[];
  tabApprovals: {
    basicInfo: TabApproval;
    ownership: TabApproval;
    financial: TabApproval;
  };
  isControlledGroup?: boolean;
  isControlGroupLeader?: boolean;

  // QRA-specific data
  rolesByYear: {
    [year: number]: RoleNode[];
  };
  approvalByYear?: {
    [year: number]: {
      approvalIp?: string;
      approvalTime?: string;
      approvedTabs?: boolean[];
      tabReadOnly?: boolean[];
    };
  };
  qrasByYear?: {
    [year: number]: string[];
  };
  qraSliderByYear?: {
    [year: number]: {
      [activity: string]: {
        value: number;
        locked: boolean;
      };
    };
  };
  nonRDByYear?: {
    [year: number]: number;
  };
  selectedRolesByActivityByYear?: {
    [year: number]: {
      [activity: string]: string[];
    };
  };
  years: {
    [year: number]: {
      activities: {
        [activity: string]: any;
      };
    };
  };
} 