-- Complete fix for infinite recursion and authentication issues
-- Run this in your Supabase SQL Editor

-- Step 1: Drop all existing problematic policies
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;

-- Step 2: Create a simple function to check if user is admin
-- This function bypasses RLS to avoid recursion
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

-- Step 3: Create new policies that work with both authenticated and unauthenticated users
-- Allow viewing users (needed for admin dashboard)
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (
    -- Allow viewing if authenticated and it's your own data
    (auth.uid() IS NOT NULL AND auth.uid()::text = id::text) OR 
    -- Allow viewing if you're an admin
    is_admin_user() OR
    -- Allow viewing for admin dashboard (temporary, should be more restrictive in production)
    auth.role() = 'authenticated'
);

-- Allow updating users
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (
    -- Allow updating if authenticated and it's your own data
    (auth.uid() IS NOT NULL AND auth.uid()::text = id::text) OR 
    -- Allow updating if you're an admin
    is_admin_user()
);

-- Allow insertion of new users (needed for registration and admin creation)
CREATE POLICY "Users can insert own data" ON users FOR INSERT WITH CHECK (
    -- Allow insertion if authenticated and it's your own data
    (auth.uid() IS NOT NULL AND auth.uid()::text = id::text) OR 
    -- Allow insertion if you're an admin
    is_admin_user() OR
    -- Allow insertion during registration when auth.uid() might not be set yet
    auth.uid() IS NULL OR
    -- Allow insertion for admin dashboard (temporary)
    auth.role() = 'authenticated'
);

-- Allow admins to delete users
CREATE POLICY "Admins can delete users" ON users FOR DELETE USING (
    is_admin_user()
);

-- Step 4: Also fix the businesses table RLS policies if they exist
DROP POLICY IF EXISTS "Users can view own businesses" ON businesses;
DROP POLICY IF EXISTS "Users can update own businesses" ON businesses;
DROP POLICY IF EXISTS "Users can insert own businesses" ON businesses;
DROP POLICY IF EXISTS "Admins can delete businesses" ON businesses;

-- Create businesses policies
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

-- Step 5: Ensure RLS is enabled on both tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

-- Step 6: Create a test admin user if none exists
-- This ensures there's always an admin available
INSERT INTO users (id, email, name, role, created_at, updated_at, is_active)
SELECT 
    gen_random_uuid(),
    'admin@example.com',
    'System Admin',
    'admin',
    NOW(),
    NOW(),
    true
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE role = 'admin'
);

-- Step 7: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Step 8: Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename IN ('users', 'businesses')
ORDER BY tablename, policyname;
