-- Verification script for business_roles table
-- Run this in your Supabase SQL Editor after running fix_business_roles_complete.sql

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

-- Check indexes
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'business_roles';

-- Test insert (this will fail if RLS is working correctly without proper authentication)
-- You can uncomment this to test, but it will likely fail due to RLS
-- INSERT INTO business_roles (business_id, year, roles) 
-- VALUES ('00000000-0000-0000-0000-000000000000', 2025, '[]'); 