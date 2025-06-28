-- =====================================================
-- DISABLE RLS ON ROLES TABLE FOR DEVELOPMENT
-- =====================================================
-- Run this in your Supabase SQL Editor

-- Step 1: Disable RLS on roles table
ALTER TABLE roles DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing policies
DROP POLICY IF EXISTS "Users can view roles for their businesses" ON roles;
DROP POLICY IF EXISTS "Users can insert roles for their businesses" ON roles;
DROP POLICY IF EXISTS "Users can update roles for their businesses" ON roles;
DROP POLICY IF EXISTS "Users can delete roles for their businesses" ON roles;
DROP POLICY IF EXISTS "Roles can view own data" ON roles;
DROP POLICY IF EXISTS "Roles can update own data" ON roles;
DROP POLICY IF EXISTS "Roles can insert own data" ON roles;
DROP POLICY IF EXISTS "Allow all authenticated users" ON roles;

-- Step 3: Grant all permissions to authenticated users
GRANT ALL ON roles TO authenticated;
GRANT ALL ON roles TO service_role;

-- Step 4: Verify RLS is disabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'roles';

-- Step 5: Test insert to verify it works
INSERT INTO roles (business_id, year, role_id, name, color, participates_in_rd, parent_role_id, order_index)
VALUES (
    'c5c52f1f-3311-4952-84a8-ff114bed20dd'::UUID,
    2025,
    'test-role-disabled-rls',
    'Test Role (RLS Disabled)',
    '#ff5722',
    true,
    NULL,
    1
);

-- Step 6: Clean up test data
DELETE FROM roles WHERE role_id = 'test-role-disabled-rls';

SELECT 'RLS disabled on roles table - development mode enabled' as status; 