# QRABuilder Migration Plan: localStorage to Supabase

## Overview

This document outlines the complete migration of QRABuilder from localStorage-based data storage to a fully normalized Supabase database schema. The migration involves complex data structures including QRA data, employee/contractor/supply configurations, and research activity selections.

## Current State Analysis

### Data Currently Stored in localStorage:

1. **QRA Data**: `qra_${businessId}_${year}_${activityId}`
   - SubcomponentSelectionData structure
   - Practice percentages, time allocations, role assignments

2. **Business Info**: `businessInfoData`
   - Business details, years, activities, roles
   - Tab approvals and configurations

3. **Employee Configurations**: `employee_${businessId}_${year}_${employeeId}`
   - Practice percentages, time allocations, role assignments

4. **Contractor Configurations**: `contractor_${businessId}_${year}_${contractorId}`
   - Practice percentages, time allocations, role assignments

5. **Supply Configurations**: `supply_${businessId}_${year}_${supplyId}`
   - Activity percentages, subcomponent selections

6. **QRA Modal Data**: `qra_data_${businessId}_${year}_${activity}`
   - Modal state and calculations

7. **Approval Data**: Various approval keys
   - Tab approvals, role approvals, etc.

## Required Database Schema

### 1. QRA Data Tables (Already Partially Implemented)

```sql
-- qra_activities (main QRA configuration)
-- qra_steps (steps within activities)
-- qra_subcomponents (subcomponents within steps)
-- qra_modal_data (modal state and calculations)
```

### 2. Employee/Contractor/Supply Configuration Tables

```sql
-- employee_configurations
-- contractor_configurations  
-- supply_configurations
```

### 3. Research Activity Selections

```sql
-- research_activity_selections (user selections from Research API)
-- research_activity_assignments (assignments to employees/contractors)
```

## Migration Strategy

### Phase 1: Complete Database Schema
1. Create missing tables for configurations
2. Add proper indexes and constraints
3. Implement RLS policies

### Phase 2: Service Layer Migration
1. Update all service functions to use Supabase
2. Implement proper error handling and fallbacks
3. Add data validation and sanitization

### Phase 3: Component Migration
1. Update QRABuilder components to use new services
2. Implement loading states and error handling
3. Maintain backward compatibility during transition

### Phase 4: Data Migration
1. Migrate existing localStorage data to Supabase
2. Validate data integrity
3. Remove localStorage dependencies

## Detailed Implementation Plan

### Step 1: Create Complete Database Schema

#### A. Configuration Tables

```sql
-- Employee configurations
CREATE TABLE employee_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    employee_id UUID NOT NULL,
    practice_percentages JSONB NOT NULL DEFAULT '{}',
    time_percentages JSONB NOT NULL DEFAULT '{}',
    role_assignments JSONB NOT NULL DEFAULT '{}',
    applied_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
    applied_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id, year, employee_id)
);

-- Contractor configurations
CREATE TABLE contractor_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    contractor_id UUID NOT NULL,
    practice_percentages JSONB NOT NULL DEFAULT '{}',
    time_percentages JSONB NOT NULL DEFAULT '{}',
    role_assignments JSONB NOT NULL DEFAULT '{}',
    applied_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
    applied_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id, year, contractor_id)
);

-- Supply configurations
CREATE TABLE supply_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    supply_id UUID NOT NULL,
    activity_percentages JSONB NOT NULL DEFAULT '{}',
    subcomponent_percentages JSONB NOT NULL DEFAULT '{}',
    selected_subcomponents JSONB NOT NULL DEFAULT '{}',
    applied_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
    applied_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id, year, supply_id)
);
```

#### B. Research Activity Selections

```sql
-- Research activity selections (from Research API)
CREATE TABLE research_activity_selections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    research_activity_id UUID REFERENCES research_api_activities(id),
    is_selected BOOLEAN NOT NULL DEFAULT FALSE,
    custom_name TEXT,
    custom_description TEXT,
    practice_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id, year, research_activity_id)
);

-- Research activity assignments to employees/contractors
CREATE TABLE research_activity_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    research_activity_id UUID REFERENCES research_api_activities(id),
    assignee_type VARCHAR(20) NOT NULL CHECK (assignee_type IN ('employee', 'contractor')),
    assignee_id UUID NOT NULL,
    time_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
    role_id UUID REFERENCES roles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id, year, research_activity_id, assignee_type, assignee_id)
);
```

### Step 2: Update Service Layer

#### A. Configuration Services

```typescript
// employeeConfigurationService.ts
export class EmployeeConfigurationService {
  static async getConfiguration(businessId: string, year: number, employeeId: string) {
    // Get from Supabase
  }
  
  static async saveConfiguration(businessId: string, year: number, employeeId: string, config: any) {
    // Save to Supabase
  }
  
  static async getAllConfigurations(businessId: string, year: number) {
    // Get all employee configurations
  }
}

// Similar services for contractors and supplies
```

#### B. Research Activity Service

```typescript
// researchActivitySelectionService.ts
export class ResearchActivitySelectionService {
  static async getSelections(businessId: string, year: number) {
    // Get selected research activities
  }
  
  static async saveSelection(businessId: string, year: number, activityId: string, selection: any) {
    // Save research activity selection
  }
  
  static async getAssignments(businessId: string, year: number) {
    // Get activity assignments to employees/contractors
  }
}
```

### Step 3: Update Components

#### A. QRABuilder Context

```typescript
// Update QRABuilderContext to use Supabase services
const QRABuilderProvider = ({ children, ...props }) => {
  // Replace localStorage calls with Supabase service calls
  const loadEmployees = useCallback(async () => {
    const employees = await EmployeeConfigurationService.getAllConfigurations(
      selectedBusinessId, 
      selectedYear
    );
    setEmployees(employees);
  }, [selectedBusinessId, selectedYear]);
  
  // Similar updates for contractors, supplies, QRA data
};
```

#### B. Configure Modals

```typescript
// Update EmployeeConfigureModal
const EmployeeConfigureModal = ({ employee, onSave, ...props }) => {
  const handleSave = async () => {
    const config = {
      practice_percentages: employeePracticePercentages,
      time_percentages: employeeTimePercentages,
      // ... other data
    };
    
    await EmployeeConfigurationService.saveConfiguration(
      selectedBusinessId,
      selectedYear,
      employee.id,
      config
    );
    
    onSave();
  };
};
```

### Step 4: Data Migration

#### A. Migration Script

```typescript
// migrateQRABuilderData.ts
export const migrateQRABuilderData = async (businessId: string, year: number) => {
  // 1. Migrate QRA data
  await migrateQRAData(businessId, year);
  
  // 2. Migrate employee configurations
  await migrateEmployeeConfigurations(businessId, year);
  
  // 3. Migrate contractor configurations
  await migrateContractorConfigurations(businessId, year);
  
  // 4. Migrate supply configurations
  await migrateSupplyConfigurations(businessId, year);
  
  // 5. Migrate research activity selections
  await migrateResearchActivitySelections(businessId, year);
};
```

#### B. Validation and Cleanup

```typescript
// validateMigration.ts
export const validateMigration = async (businessId: string, year: number) => {
  // Compare localStorage data with Supabase data
  // Report any discrepancies
  // Clean up localStorage after successful migration
};
```

## Required Variables and Data Structures

### 1. QRA Data Structure

```typescript
interface SubcomponentSelectionData {
  selectedSubcomponents: Record<string, {
    step: string;
    phase: string;
    subcomponent: { id: string; title: string };
    timePercent: number;
    frequencyPercent: number;
    yearPercent: number;
    selectedRoles: string[];
    isNonRD: boolean;
  }>;
  practicePercent: number;
  nonRDTime: number;
  totalAppliedPercent: number;
  isLocked: boolean;
  lastUpdated: string;
}
```

### 2. Employee Configuration Structure

```typescript
interface EmployeeConfiguration {
  employeeId: string;
  practicePercentages: Record<string, number>;
  timePercentages: Record<string, Record<string, number>>;
  roleAssignments: Record<string, string>;
  appliedPercentage: number;
  appliedAmount: number;
  isLocked: boolean;
}
```

### 3. Contractor Configuration Structure

```typescript
interface ContractorConfiguration {
  contractorId: string;
  practicePercentages: Record<string, number>;
  timePercentages: Record<string, Record<string, number>>;
  roleAssignments: Record<string, string>;
  appliedPercentage: number;
  appliedAmount: number;
  isLocked: boolean;
}
```

### 4. Supply Configuration Structure

```typescript
interface SupplyConfiguration {
  supplyId: string;
  activityPercentages: Record<string, number>;
  subcomponentPercentages: Record<string, Record<string, number>>;
  selectedSubcomponents: Record<string, string[]>;
  appliedPercentage: number;
  appliedAmount: number;
  isLocked: boolean;
}
```

## Implementation Checklist

### Database Schema
- [ ] Create employee_configurations table
- [ ] Create contractor_configurations table
- [ ] Create supply_configurations table
- [ ] Create research_activity_selections table
- [ ] Create research_activity_assignments table
- [ ] Add proper indexes and constraints
- [ ] Implement RLS policies

### Service Layer
- [ ] Create EmployeeConfigurationService
- [ ] Create ContractorConfigurationService
- [ ] Create SupplyConfigurationService
- [ ] Create ResearchActivitySelectionService
- [ ] Update existing QRA data service
- [ ] Add error handling and fallbacks

### Component Updates
- [ ] Update QRABuilderContext
- [ ] Update EmployeeConfigureModal
- [ ] Update ContractorConfigureModal
- [ ] Update SupplyConfigureModal
- [ ] Update IdentifyActivitiesTab
- [ ] Update RDExpensesTab
- [ ] Add loading states and error handling

### Data Migration
- [ ] Create migration scripts
- [ ] Implement data validation
- [ ] Test migration process
- [ ] Clean up localStorage after migration

### Testing
- [ ] Test all CRUD operations
- [ ] Test data integrity
- [ ] Test error scenarios
- [ ] Test performance with large datasets
- [ ] Test concurrent access

## Benefits of Migration

1. **Data Integrity**: Normalized schema prevents data corruption
2. **Scalability**: Database can handle large datasets efficiently
3. **Real-time Collaboration**: Multiple users can work simultaneously
4. **Backup & Recovery**: Database-level backup and recovery
5. **Audit Trail**: Track all changes with timestamps
6. **Performance**: Optimized queries and caching
7. **Security**: Row-level security and access controls

## Risk Mitigation

1. **Backward Compatibility**: Maintain localStorage fallback during transition
2. **Data Validation**: Comprehensive validation before and after migration
3. **Rollback Plan**: Ability to revert to localStorage if needed
4. **Incremental Migration**: Migrate data in phases to minimize risk
5. **Testing**: Thorough testing at each phase

This migration will result in a robust, scalable, and maintainable QRABuilder system that fully leverages Supabase's capabilities while maintaining all existing functionality. 