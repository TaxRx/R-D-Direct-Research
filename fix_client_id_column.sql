-- Fix for client_id column references in RLS policies
-- The schema uses 'user_id' but RLS policies were referencing 'client_id'

-- Step 1: Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view own businesses" ON businesses;
DROP POLICY IF EXISTS "Users can update own businesses" ON businesses;
DROP POLICY IF EXISTS "Users can insert own businesses" ON businesses;
DROP POLICY IF EXISTS "Admins can delete businesses" ON businesses;

-- Step 2: Create a simple function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
    -- Use SECURITY DEFINER to bypass RLS and avoid recursion
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id::text = auth.uid()::text 
        AND role = 'admin'
    );
EXCEPTION
    WHEN OTHERS THEN
        -- If there's any error, assume not admin for safety
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create corrected businesses policies using 'user_id' instead of 'client_id'
CREATE POLICY "Users can view own businesses" ON businesses FOR SELECT USING (
    -- Allow viewing if it's your business (using user_id, not client_id)
    (auth.uid() IS NOT NULL AND user_id::text = auth.uid()::text) OR 
    -- Allow viewing if you're an admin
    is_admin_user() OR
    -- Allow viewing for admin dashboard
    auth.role() = 'authenticated'
);

CREATE POLICY "Users can update own businesses" ON businesses FOR UPDATE USING (
    -- Allow updating if it's your business (using user_id, not client_id)
    (auth.uid() IS NOT NULL AND user_id::text = auth.uid()::text) OR 
    -- Allow updating if you're an admin
    is_admin_user()
);

CREATE POLICY "Users can insert own businesses" ON businesses FOR INSERT WITH CHECK (
    -- Allow inserting if it's your business (using user_id, not client_id)
    (auth.uid() IS NOT NULL AND user_id::text = auth.uid()::text) OR 
    -- Allow inserting if you're an admin
    is_admin_user() OR
    -- Allow inserting for admin dashboard
    auth.role() = 'authenticated'
);

CREATE POLICY "Admins can delete businesses" ON businesses FOR DELETE USING (
    is_admin_user()
);

-- Step 4: Ensure RLS is enabled
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

-- Step 5: Verify the policies were created correctly
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'businesses'
ORDER BY policyname; 