# Research API Migration to Normalized Supabase Schema

This document provides step-by-step instructions for migrating your Research API data from localStorage to a fully normalized Supabase database schema.

## Overview

The migration involves:
1. Creating a normalized 7-level hierarchical schema in Supabase
2. Importing CSV data using provided functions
3. Replacing localStorage-based services with Supabase queries
4. Implementing access control for limited-access content

## Schema Structure

The normalized schema consists of 7 hierarchical levels:

```
Categories (1) → Areas (2) → Focuses (3) → Activities (4) → Phases (5) → Steps (6) → Subcomponents (7)
```

### Tables Created:
- `research_api_categories` - Top-level categories
- `research_api_areas` - Second-level areas within categories
- `research_api_focuses` - Third-level focuses within areas
- `research_api_activities` - Fourth-level research activities (main content)
- `research_api_phases` - Fifth-level phases within activities
- `research_api_steps` - Sixth-level steps within phases
- `research_api_subcomponents` - Seventh-level subcomponents within steps
- `research_api_access_controls` - Access control for limited-access items

## Step 1: Create the Database Schema

1. **Run the schema creation script:**
   ```bash
   # In your Supabase SQL editor, run:
   \i research_api_schema.sql
   ```

2. **Run the import functions script:**
   ```bash
   # In your Supabase SQL editor, run:
   \i research_api_import_script.sql
   ```

## Step 2: Import Your CSV Data

1. **Set up environment variables:**
   ```bash
   export SUPABASE_URL="your-supabase-url"
   export SUPABASE_SERVICE_KEY="your-service-key"
   ```

2. **Run the import script:**
   ```bash
   node import_research_api_data.js "./public/Research API.csv"
   ```

3. **Verify the import:**
   The script will automatically verify the import and show counts of imported data.

## Step 3: Update Your Application Code

### Replace localStorage-based services

1. **Update imports in your components:**
   ```typescript
   // Replace this:
   import { parseResearchApi } from '../utils/parseResearchApi';
   
   // With this:
   import { researchApiService } from '../services/researchApiService';
   ```

2. **Update data fetching:**
   ```typescript
   // Replace localStorage-based fetching:
   const activities = parseResearchApi(csvData);
   
   // With Supabase-based fetching:
   const activities = await researchApiService.getAllActivitiesLegacy();
   ```

3. **Update specific queries:**
   ```typescript
   // Get activities by category
   const activities = await researchApiService.getActivitiesByCategory('Your Category');
   
   // Get subcomponents by activity
   const subcomponents = await researchApiService.getSubcomponentsByActivity('Activity Name');
   
   // Search activities
   const results = await researchApiService.searchActivities('search term');
   ```

### Update Components

1. **Convert synchronous to asynchronous:**
   ```typescript
   // Before (synchronous):
   const [activities, setActivities] = useState<ResearchActivity[]>([]);
   
   useEffect(() => {
     const data = parseResearchApi(csvData);
     setActivities(data);
   }, []);
   
   // After (asynchronous):
   const [activities, setActivities] = useState<ResearchActivity[]>([]);
   const [loading, setLoading] = useState(true);
   
   useEffect(() => {
     const loadActivities = async () => {
       try {
         setLoading(true);
         const data = await researchApiService.getAllActivitiesLegacy();
         setActivities(data);
       } catch (error) {
         console.error('Error loading activities:', error);
       } finally {
         setLoading(false);
       }
     };
     
     loadActivities();
   }, []);
   ```

2. **Add loading states:**
   ```typescript
   if (loading) {
     return <CircularProgress />;
   }
   ```

## Step 4: Implement Access Control

### For Limited-Access Content

1. **Check access before displaying:**
   ```typescript
   const [hasAccess, setHasAccess] = useState(false);
   
   useEffect(() => {
     const checkAccess = async () => {
       if (activity.isLimitedAccess) {
         const access = await researchApiService.hasAccess('activity', activity.id);
         setHasAccess(access);
       } else {
         setHasAccess(true);
       }
     };
     
     checkAccess();
   }, [activity]);
   
   if (activity.isLimitedAccess && !hasAccess) {
     return <AccessDeniedMessage />;
   }
   ```

2. **Grant access (admin function):**
   ```typescript
   await researchApiService.grantAccess(
     'activity',
     activityId,
     userId,
     ipAddress,
     expiresAt
   );
   ```

## Step 5: Performance Optimization

### Caching Strategy

The service includes built-in caching:
- 5-minute cache for frequently accessed data
- Automatic cache invalidation
- Manual cache clearing when needed

```typescript
// Clear cache when data is updated
researchApiService.clearCache();
```

### Query Optimization

Use specific queries instead of fetching all data:
```typescript
// Instead of getting all activities and filtering:
const allActivities = await researchApiService.getAllActivitiesLegacy();
const filtered = allActivities.filter(a => a.category === 'Category');

// Use specific query:
const activities = await researchApiService.getActivitiesByCategory('Category');
```

## Step 6: Testing

1. **Test data loading:**
   ```typescript
   // Test basic functionality
   const categories = await researchApiService.getCategories();
   console.log('Categories loaded:', categories.length);
   
   const hierarchy = await researchApiService.getHierarchy();
   console.log('Hierarchy loaded:', hierarchy.length);
   ```

2. **Test search functionality:**
   ```typescript
   const results = await researchApiService.searchActivities('research');
   console.log('Search results:', results.length);
   ```

3. **Test access control:**
   ```typescript
   const hasAccess = await researchApiService.hasAccess('activity', 'activity-id');
   console.log('Has access:', hasAccess);
   ```

## Step 7: Migration Checklist

- [ ] Schema created in Supabase
- [ ] Import functions created
- [ ] CSV data imported successfully
- [ ] Service layer implemented
- [ ] Components updated to use new service
- [ ] Loading states added
- [ ] Error handling implemented
- [ ] Access control tested
- [ ] Performance optimized
- [ ] Old localStorage code removed

## Benefits of This Migration

1. **Data Integrity**: Normalized schema prevents data duplication and inconsistencies
2. **Scalability**: Database can handle large datasets efficiently
3. **Access Control**: Built-in support for limited-access content
4. **Performance**: Optimized queries and caching
5. **Maintainability**: Centralized data management
6. **Real-time Updates**: Changes are immediately available to all users
7. **Backup & Recovery**: Database-level backup and recovery

## Troubleshooting

### Common Issues

1. **RLS Policy Errors**: Ensure your user has proper permissions
2. **Import Errors**: Check CSV format and column names
3. **Performance Issues**: Use specific queries instead of fetching all data
4. **Cache Issues**: Clear cache when data is updated

### Debug Commands

```sql
-- Check table counts
SELECT 'categories' as table_name, COUNT(*) as count FROM research_api_categories
UNION ALL
SELECT 'areas', COUNT(*) FROM research_api_areas
UNION ALL
SELECT 'activities', COUNT(*) FROM research_api_activities
UNION ALL
SELECT 'subcomponents', COUNT(*) FROM research_api_subcomponents;

-- Check hierarchy view
SELECT COUNT(*) FROM research_api_hierarchy;

-- Check for limited access items
SELECT COUNT(*) FROM research_api_activities WHERE is_limited_access = true;
```

## Support

If you encounter issues during migration:
1. Check the Supabase logs for detailed error messages
2. Verify your environment variables are set correctly
3. Ensure your CSV file format matches the expected structure
4. Test with a small subset of data first 