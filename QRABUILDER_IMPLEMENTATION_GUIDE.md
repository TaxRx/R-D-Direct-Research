# QRABuilder Implementation Guide: localStorage to Supabase Migration

## Overview

This guide provides step-by-step instructions for migrating the QRABuilder from localStorage-based data storage to a fully normalized Supabase database schema. The migration involves complex data structures including QRA data, employee/contractor/supply configurations, and research activity selections.

## Prerequisites

1. **Supabase Project**: Ensure your Supabase project is set up and accessible
2. **Database Access**: You need admin access to run SQL scripts
3. **Backup**: Create a backup of your current localStorage data
4. **Development Environment**: Ensure all TypeScript dependencies are installed

## Step 1: Database Schema Setup

### 1.1 Run the Complete Schema Script

Execute the `qrabuilder_complete_schema.sql` script in your Supabase SQL Editor:

```sql
-- Copy and paste the entire content of qrabuilder_complete_schema.sql
-- This creates all necessary tables, indexes, triggers, and RLS policies
```

**Expected Output:**
```
QRABuilder complete schema created successfully!
Tables created:
- qra_activities, qra_steps, qra_subcomponents, qra_modal_data
- employee_configurations, contractor_configurations, supply_configurations
- research_activity_selections, research_activity_assignments
```

### 1.2 Verify Schema Creation

Check that all tables were created successfully:

```sql
-- Verify tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%qra%' OR table_name LIKE '%config%' OR table_name LIKE '%research%';
```

## Step 2: Service Layer Implementation

### 2.1 Add the QRABuilder Service

Copy the `src/services/qrabuilderService.ts` file to your project. This service provides:

- QRA data operations (save, load, getAll)
- Employee configuration operations
- Contractor configuration operations
- Supply configuration operations
- Research activity selection operations
- Bulk operations and data validation

### 2.2 Add the Migration Service

Copy the `src/services/qrabuilderMigrationService.ts` file to your project. This service handles:

- Data migration from localStorage to Supabase
- Migration validation
- localStorage cleanup
- Error handling and reporting

### 2.3 Add the React Hook

Copy the `src/hooks/useQRABuilderSupabase.ts` file to your project. This hook provides:

- State management for all QRABuilder data
- Loading states and error handling
- Caching and optimization
- Real-time data synchronization

## Step 3: Migration Component

### 3.1 Add the Migration Panel

Copy the `src/components/QRABuilderMigrationPanel.tsx` file to your project. This component provides:

- User interface for data migration
- Progress tracking and validation
- Error reporting and warnings
- localStorage cleanup options

### 3.2 Integrate Migration Panel

Add the migration panel to your QRABuilder:

```tsx
import { QRABuilderMigrationPanel } from '../components/QRABuilderMigrationPanel';

// In your QRABuilder component
const QRABuilder = ({ businessId, year }) => {
  return (
    <div>
      {/* Migration Panel - show this first */}
      <QRABuilderMigrationPanel 
        businessId={businessId}
        year={year}
        onMigrationComplete={(result) => {
          if (result.success) {
            console.log('Migration completed successfully');
            // Optionally refresh your app state
          }
        }}
      />
      
      {/* Your existing QRABuilder content */}
    </div>
  );
};
```

## Step 4: Update Existing Components

### 4.1 Update QRABuilder Context

Replace localStorage calls in your QRABuilder context with the new Supabase hook:

```tsx
// Before (localStorage)
const getQRAData = (activityName: string) => {
  const storageKey = `qra_${businessId}_${year}_${activityName}`;
  return JSON.parse(localStorage.getItem(storageKey) || 'null');
};

// After (Supabase)
const [qraState, qraActions] = useQRABuilderSupabase(businessId, year);

const getQRAData = (activityName: string) => {
  return qraState.qraData[activityName] || null;
};
```

### 4.2 Update Configure Modals

Update your configure modals to use the new service:

```tsx
// EmployeeConfigureModal
const handleSave = async () => {
  const config = {
    employeeId: employee.id,
    employeeName: `${employee.firstName} ${employee.lastName}`,
    practicePercentages: employeePracticePercentages,
    timePercentages: employeeTimePercentages,
    roleAssignments: roleAssignments,
    appliedPercentage: calculatedAppliedPercentage,
    appliedAmount: calculatedAppliedAmount,
    isLocked: false
  };
  
  const success = await qraActions.saveEmployeeConfig(config);
  if (success) {
    onSave();
  }
};
```

### 4.3 Update Activities Tab

Update the IdentifyActivitiesTab to use Supabase:

```tsx
// Before
const handleQRAModalComplete = (data) => {
  const storageKey = `qra_${businessId}_${year}_${activityId}`;
  localStorage.setItem(storageKey, JSON.stringify(data));
};

// After
const handleQRAModalComplete = async (data) => {
  const success = await qraActions.saveQRAData(activityId, activityName, data);
  if (success) {
    console.log('QRA data saved to Supabase');
  }
};
```

## Step 5: Data Migration Process

### 5.1 Run Initial Migration

1. Navigate to your QRABuilder
2. Look for the "QRABuilder Data Migration" panel
3. Click "Start Migration"
4. Monitor the progress and results

### 5.2 Validate Migration

1. After migration completes, click "Validate Migration"
2. Review the validation results
3. Address any discrepancies if found

### 5.3 Clean Up localStorage (Optional)

1. Only after successful migration and validation
2. Click the cleanup button (trash icon)
3. Confirm the cleanup operation

## Step 6: Testing and Validation

### 6.1 Test All Functionality

Test each component to ensure it works with Supabase:

- **QRA Modal**: Create and save QRA data
- **Employee Configure Modal**: Configure employee percentages
- **Contractor Configure Modal**: Configure contractor percentages
- **Supply Configure Modal**: Configure supply allocations
- **Activities Tab**: Select and configure research activities

### 6.2 Verify Data Persistence

1. Save data in the application
2. Refresh the page
3. Verify data is still present
4. Check Supabase dashboard to confirm data is stored

### 6.3 Test Error Scenarios

1. Test with network disconnection
2. Test with invalid data
3. Test concurrent access
4. Verify error handling and user feedback

## Step 7: Performance Optimization

### 7.1 Implement Caching

The `useQRABuilderSupabase` hook includes built-in caching. Monitor performance and adjust as needed:

```tsx
// The hook automatically caches data and only refreshes when needed
const [state, actions] = useQRABuilderSupabase(businessId, year);

// Data is cached in state.qraData, state.employeeConfigs, etc.
```

### 7.2 Optimize Queries

Monitor query performance in Supabase dashboard and optimize as needed:

```sql
-- Example: Add additional indexes if needed
CREATE INDEX idx_qra_activities_business_year_activity 
ON qra_activities(business_id, year, activity_id);
```

## Step 8: Production Deployment

### 8.1 Environment Configuration

Ensure your production environment has the correct Supabase configuration:

```typescript
// src/services/supabase.ts
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
```

### 8.2 Database Backup

Before going live:
1. Create a full database backup
2. Test the migration process in staging
3. Document rollback procedures

### 8.3 Monitoring

Set up monitoring for:
- Database performance
- Error rates
- User feedback
- Data integrity

## Troubleshooting

### Common Issues

1. **RLS Policy Errors**
   ```sql
   -- Check RLS policies
   SELECT * FROM pg_policies WHERE tablename LIKE '%qra%';
   ```

2. **Permission Errors**
   ```sql
   -- Grant permissions
   GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
   ```

3. **Data Type Mismatches**
   - Check that JSONB fields contain valid JSON
   - Verify decimal fields have correct precision

4. **Migration Failures**
   - Check browser console for errors
   - Verify localStorage data structure
   - Check network connectivity

### Debug Commands

```sql
-- Check table structure
\d qra_activities
\d employee_configurations

-- Check data
SELECT COUNT(*) FROM qra_activities WHERE business_id = 'your-business-id';
SELECT COUNT(*) FROM employee_configurations WHERE business_id = 'your-business-id';

-- Check RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename LIKE '%qra%';
```

## Rollback Plan

If issues arise, you can rollback to localStorage:

1. **Temporary Rollback**: Modify components to use localStorage fallback
2. **Data Recovery**: Export data from Supabase and restore to localStorage
3. **Full Rollback**: Revert code changes and restore from backup

## Benefits After Migration

1. **Data Integrity**: Normalized schema prevents corruption
2. **Scalability**: Database handles large datasets efficiently
3. **Real-time Collaboration**: Multiple users can work simultaneously
4. **Backup & Recovery**: Database-level backup and recovery
5. **Audit Trail**: Track all changes with timestamps
6. **Performance**: Optimized queries and caching
7. **Security**: Row-level security and access controls

## Next Steps

After successful migration:

1. **Remove localStorage Dependencies**: Clean up old localStorage code
2. **Optimize Performance**: Monitor and optimize database queries
3. **Add Features**: Leverage database capabilities for new features
4. **Documentation**: Update user documentation
5. **Training**: Train users on new functionality

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review Supabase logs and error messages
3. Verify database schema and permissions
4. Test with minimal data sets
5. Contact support with specific error details

This migration will result in a robust, scalable, and maintainable QRABuilder system that fully leverages Supabase's capabilities while maintaining all existing functionality. 