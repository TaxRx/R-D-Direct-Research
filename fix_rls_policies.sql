-- Fix for infinite recursion in RLS policies
-- This script fixes the RLS policies that are causing infinite recursion

-- First, drop the existing problematic policies
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;

-- Create a function to check admin status without causing recursion
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
    -- Use a direct query that doesn't trigger the policy
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id::text = auth.uid()::text 
        AND role = 'admin'
    );
EXCEPTION
    WHEN OTHERS THEN
        -- If there's any error, assume not admin
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create simplified policies that use the function
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (
    auth.uid()::text = id::text OR is_admin_user()
);

CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (
    auth.uid()::text = id::text OR is_admin_user()
);

CREATE POLICY "Users can insert own data" ON users FOR INSERT WITH CHECK (
    auth.uid()::text = id::text OR is_admin_user()
);

CREATE POLICY "Admins can delete users" ON users FOR DELETE USING (
    is_admin_user()
);

-- Alternative approach: Temporarily disable RLS for admin operations
-- This is a simpler approach that might work better
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Then create a simple policy that allows all operations for now
-- CREATE POLICY "Allow all operations" ON users FOR ALL USING (true);

-- Or create a more restrictive policy that only allows own data + admin check
-- CREATE POLICY "Users can access own data or admin" ON users FOR ALL USING (
--     auth.uid()::text = id::text OR 
--     (SELECT role FROM users WHERE id::text = auth.uid()::text LIMIT 1) = 'admin'
-- );

-- Also add admin policies for businesses table to allow admins to manage all businesses
DROP POLICY IF EXISTS "Businesses can view own data" ON businesses;
DROP POLICY IF EXISTS "Businesses can update own data" ON businesses;
DROP POLICY IF EXISTS "Businesses can insert own data" ON businesses;

CREATE POLICY "Businesses can view own data" ON businesses FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = businesses.user_id AND users.id::text = auth.uid()::text) OR
    auth.uid()::text IN (SELECT id::text FROM users WHERE role = 'admin')
);

CREATE POLICY "Businesses can update own data" ON businesses FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = businesses.user_id AND users.id::text = auth.uid()::text) OR
    auth.uid()::text IN (SELECT id::text FROM users WHERE role = 'admin')
);

CREATE POLICY "Businesses can insert own data" ON businesses FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = businesses.user_id AND users.id::text = auth.uid()::text) OR
    auth.uid()::text IN (SELECT id::text FROM users WHERE role = 'admin')
);

CREATE POLICY "Admins can delete businesses" ON businesses FOR DELETE USING (
    auth.uid()::text IN (SELECT id::text FROM users WHERE role = 'admin')
);

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'users' 
ORDER BY policyname; 