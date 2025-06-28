# Import Research API CSV Data via Supabase Interface

This guide shows you how to import your CSV data directly through Supabase's web interface - no Node.js required!

## Method 1: Direct CSV Import (Recommended)

### Step 1: Prepare Your CSV File

1. **Open your CSV file** (`Research API.csv`) in a text editor
2. **Verify the column headers** match exactly:
   ```
   Category,Area,Focus,Research Activity,Subcomponent,Phase,Step,Hint,General Description,Goal,Hypothesis,Alternatives,Uncertainties,Developmental Process,Primary Goal,Expected Outcome Type,CPT Codes,CDT Codes,Alternative Paths
   ```

### Step 2: Create a Temporary Import Table

1. **Go to your Supabase Dashboard**
2. **Navigate to SQL Editor**
3. **Run this SQL to create a temporary import table:**

```sql
-- Create temporary import table
CREATE TABLE temp_research_api_import (
    Category TEXT,
    Area TEXT,
    Focus TEXT,
    "Research Activity" TEXT,
    Subcomponent TEXT,
    Phase TEXT,
    Step TEXT,
    Hint TEXT,
    "General Description" TEXT,
    Goal TEXT,
    Hypothesis TEXT,
    Alternatives TEXT,
    Uncertainties TEXT,
    "Developmental Process" TEXT,
    "Primary Goal" TEXT,
    "Expected Outcome Type" TEXT,
    "CPT Codes" TEXT,
    "CDT Codes" TEXT,
    "Alternative Paths" TEXT
);
```

### Step 3: Import CSV via Supabase Interface

1. **Go to Table Editor** in your Supabase dashboard
2. **Select the `temp_research_api_import` table**
3. **Click "Import data"** (usually in the top right)
4. **Choose "CSV"** as the import type
5. **Upload your `Research API.csv` file**
6. **Map the columns** (they should auto-map correctly)
7. **Click "Import"**

### Step 4: Run the Import Script

1. **Go back to SQL Editor**
2. **Run this import script:**

```sql
-- Import data from temporary table to normalized schema
DO $$
DECLARE
    row_record RECORD;
    activity_id UUID;
BEGIN
    -- Loop through each row in the temporary table
    FOR row_record IN 
        SELECT * FROM temp_research_api_import 
        WHERE "Category" IS NOT NULL 
        AND "Research Activity" IS NOT NULL
    LOOP
        -- Import each row using our function
        SELECT import_research_api_row(
            row_record."Category",
            row_record."Area",
            row_record."Focus",
            row_record."Research Activity",
            row_record."Subcomponent",
            row_record."Phase",
            row_record."Step",
            row_record."Hint",
            row_record."General Description",
            row_record."Goal",
            row_record."Hypothesis",
            row_record."Alternatives",
            row_record."Uncertainties",
            row_record."Developmental Process",
            row_record."Primary Goal",
            row_record."Expected Outcome Type",
            row_record."CPT Codes",
            row_record."CDT Codes",
            row_record."Alternative Paths",
            false -- is_limited_access
        ) INTO activity_id;
        
        -- Log progress (optional)
        RAISE NOTICE 'Imported activity: %', row_record."Research Activity";
    END LOOP;
    
    RAISE NOTICE 'Import completed successfully!';
END $$;
```

### Step 5: Verify the Import

```sql
-- Check import results
SELECT 
    'Categories' as table_name, COUNT(*) as count 
FROM research_api_categories
UNION ALL
SELECT 'Areas', COUNT(*) FROM research_api_areas
UNION ALL
SELECT 'Focuses', COUNT(*) FROM research_api_focuses
UNION ALL
SELECT 'Activities', COUNT(*) FROM research_api_activities
UNION ALL
SELECT 'Phases', COUNT(*) FROM research_api_phases
UNION ALL
SELECT 'Steps', COUNT(*) FROM research_api_steps
UNION ALL
SELECT 'Subcomponents', COUNT(*) FROM research_api_subcomponents;
```

### Step 6: Clean Up

```sql
-- Drop the temporary table
DROP TABLE temp_research_api_import;
```

## Method 2: Manual Row-by-Row Import (For Small Datasets)

If you have a small dataset, you can import manually:

1. **Open your CSV in Excel/Google Sheets**
2. **Copy a few rows**
3. **Run this for each row:**

```sql
SELECT import_research_api_row(
    'Category Name',
    'Area Name',
    'Focus Name',
    'Research Activity Name',
    'Subcomponent Name',
    'Phase Name',
    'Step Name',
    'Hint text',
    'General description',
    'Goal text',
    'Hypothesis text',
    'Alternatives text',
    'Uncertainties text',
    'Developmental process text',
    'Primary goal text',
    'Expected outcome type',
    'CPT1,CPT2,CPT3',
    'CDT1,CDT2',
    'Alternative paths text',
    false
);
```

## Method 3: Bulk Insert (Alternative)

If the above methods don't work, you can create a bulk insert script:

```sql
-- Create a function to handle bulk import
CREATE OR REPLACE FUNCTION bulk_import_research_api()
RETURNS void AS $$
BEGIN
    -- Add your data here as INSERT statements
    PERFORM import_research_api_row('Category1', 'Area1', 'Focus1', 'Activity1', ...);
    PERFORM import_research_api_row('Category2', 'Area2', 'Focus2', 'Activity2', ...);
    -- ... add more rows as needed
END;
$$ LANGUAGE plpgsql;

-- Run the bulk import
SELECT bulk_import_research_api();
```

## Troubleshooting

### Common Issues:

1. **Column mapping errors**: Make sure your CSV headers match exactly
2. **Encoding issues**: Save your CSV as UTF-8
3. **Large file errors**: Split large files into smaller chunks
4. **Permission errors**: Make sure you're using the service role key

### Debug Commands:

```sql
-- Check if import functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE 'import_research_api%';

-- Check temporary table data
SELECT COUNT(*) FROM temp_research_api_import;

-- Check for any errors in the import
SELECT * FROM temp_research_api_import 
WHERE "Category" IS NULL OR "Research Activity" IS NULL;
```

## Next Steps After Import

1. **Test the data**:
```sql
SELECT * FROM research_api_hierarchy LIMIT 10;
```

2. **Update your React components** to use the new service
3. **Remove the old localStorage code**
4. **Test the application** with the new data source

## Which Method Should You Use?

- **Method 1 (Direct CSV Import)**: Best for most cases, handles large datasets
- **Method 2 (Manual Import)**: Good for small datasets or testing
- **Method 3 (Bulk Insert)**: Use if you have specific formatting requirements

**Recommendation**: Start with Method 1 - it's the most straightforward and handles most CSV files automatically. 