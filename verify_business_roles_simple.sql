-- Simple verification for business_roles table
-- Run this in your Supabase SQL Editor

-- Check if table exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'business_roles') 
        THEN '✅ Table business_roles exists' 
        ELSE '❌ Table business_roles does not exist' 
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

-- Check if we can insert a test record
DO $$
BEGIN
    INSERT INTO business_roles (business_id, year, roles) 
    VALUES (
        '00000000-0000-0000-0000-000000000001'::uuid, 
        2024, 
        '[{"id": "test", "name": "Test Role", "parentId": null, "children": []}]'::jsonb
    );
    
    RAISE NOTICE '✅ Test insert successful';
    
    -- Clean up test record
    DELETE FROM business_roles WHERE business_id = '00000000-0000-0000-0000-000000000001'::uuid AND year = 2024;
    RAISE NOTICE '✅ Test cleanup successful';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Test failed: %', SQLERRM;
END $$; 