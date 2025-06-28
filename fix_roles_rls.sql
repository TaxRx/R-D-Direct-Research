-- Fix RLS policies for roles table
-- Run this in your Supabase SQL Editor

-- Step 1: Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view roles for their businesses" ON roles;
DROP POLICY IF EXISTS "Users can insert roles for their businesses" ON roles;
DROP POLICY IF EXISTS "Users can update roles for their businesses" ON roles;
DROP POLICY IF EXISTS "Users can delete roles for their businesses" ON roles;

-- Step 2: Create a function to check if user owns the business
CREATE OR REPLACE FUNCTION user_owns_business(business_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if the authenticated user owns this business
    RETURN EXISTS (
        SELECT 1 FROM businesses 
        WHERE id = business_uuid 
        AND user_id::text = auth.uid()::text
    );
EXCEPTION
    WHEN OTHERS THEN
        -- If there's any error, assume not owner for safety
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create corrected RLS policies
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

-- Step 4: Ensure RLS is enabled
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- Step 5: Grant permissions
GRANT ALL ON roles TO authenticated;

-- Step 6: Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'roles'
ORDER BY policyname; 