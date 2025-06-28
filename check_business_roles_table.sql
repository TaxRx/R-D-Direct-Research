-- Check if business_roles table exists and is properly configured
-- Run this in your Supabase SQL Editor

-- Check if table exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'business_roles') 
        THEN 'Table business_roles exists' 
        ELSE 'Table business_roles does not exist' 
    END as table_status;

-- Check table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'business_roles'
ORDER BY ordinal_position;

-- Check RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'business_roles';

-- Check RLS policies
SELECT 
    policyname,
    permissive,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'business_roles';

-- Check if there are any existing records
SELECT COUNT(*) as record_count FROM business_roles;

-- Check sample data if any exists
SELECT * FROM business_roles LIMIT 5; 