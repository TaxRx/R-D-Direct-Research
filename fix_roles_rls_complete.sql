-- =====================================================
-- COMPLETE FIX FOR ROLES TABLE RLS AND DATA PERSISTENCE
-- =====================================================
-- Run this in your Supabase SQL Editor

-- Step 1: Check current table structure and data
SELECT 'Current roles table structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'roles' 
ORDER BY ordinal_position;

-- Step 2: Check current RLS status
SELECT 'Current RLS status:' as info;
SELECT schemaname, tablename, rowsecurity
FROM pg_tables 
WHERE tablename = 'roles';

-- Step 3: Check current RLS policies
SELECT 'Current RLS policies:' as info;
SELECT policyname, permissive, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'roles';

-- Step 4: Check current data
SELECT 'Current roles data:' as info;
SELECT id, business_id, year, role_id, name, color, participates_in_rd, parent_role_id, order_index
FROM roles 
ORDER BY business_id, year, order_index;

-- Step 5: Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view roles for their businesses" ON roles;
DROP POLICY IF EXISTS "Users can insert roles for their businesses" ON roles;
DROP POLICY IF EXISTS "Users can update roles for their businesses" ON roles;
DROP POLICY IF EXISTS "Users can delete roles for their businesses" ON roles;
DROP POLICY IF EXISTS "Roles can view own data" ON roles;
DROP POLICY IF EXISTS "Roles can update own data" ON roles;
DROP POLICY IF EXISTS "Roles can insert own data" ON roles;
DROP POLICY IF EXISTS "Allow all authenticated users" ON roles;

-- Step 6: Create a function to check business ownership
CREATE OR REPLACE FUNCTION user_owns_business(business_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if the authenticated user owns this business
    -- Try multiple ownership patterns
    RETURN EXISTS (
        SELECT 1 FROM businesses 
        WHERE id = business_uuid 
        AND (
            -- Pattern 1: user_id field
            (user_id IS NOT NULL AND user_id::text = auth.uid()::text) OR
            -- Pattern 2: owners array
            (owners IS NOT NULL AND auth.uid()::text = ANY(owners::text[])) OR
            -- Pattern 3: client_id field (if exists)
            (client_id IS NOT NULL AND client_id::text = auth.uid()::text)
        )
    );
EXCEPTION
    WHEN OTHERS THEN
        -- If there's any error, assume not owner for safety
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create corrected RLS policies
-- Policy for viewing roles
CREATE POLICY "Users can view roles for their businesses" ON roles
    FOR SELECT USING (
        user_owns_business(business_id)
    );

-- Policy for inserting roles
CREATE POLICY "Users can insert roles for their businesses" ON roles
    FOR INSERT WITH CHECK (
        user_owns_business(business_id)
    );

-- Policy for updating roles
CREATE POLICY "Users can update roles for their businesses" ON roles
    FOR UPDATE USING (
        user_owns_business(business_id)
    );

-- Policy for deleting roles
CREATE POLICY "Users can delete roles for their businesses" ON roles
    FOR DELETE USING (
        user_owns_business(business_id)
    );

-- Step 8: Ensure RLS is enabled
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- Step 9: Grant permissions
GRANT ALL ON roles TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Step 10: Verify the policies were created
SELECT 'New RLS policies created:' as info;
SELECT policyname, permissive, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'roles'
ORDER BY policyname;

-- Step 11: Test the ownership function
SELECT 'Testing ownership function:' as info;
SELECT 
    b.id as business_id,
    b.name as business_name,
    b.user_id,
    b.owners,
    user_owns_business(b.id) as user_owns
FROM businesses b
LIMIT 5;

-- Step 12: Show final verification
SELECT 'Final verification - roles table should now work correctly' as status; 