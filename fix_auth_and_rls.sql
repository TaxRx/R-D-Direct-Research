-- Comprehensive Auth and RLS Fix
-- This script fixes authentication and RLS issues for user creation
-- Run this in your Supabase SQL Editor

-- Step 1: Disable RLS temporarily to allow initial setup
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing policies on users table
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;
DROP POLICY IF EXISTS "Users can view all data" ON users;
DROP POLICY IF EXISTS "Users can delete own data" ON users;
DROP POLICY IF EXISTS "Users can insert new users" ON users;
DROP POLICY IF EXISTS "Allow all authenticated users to view users" ON users;
DROP POLICY IF EXISTS "Allow all authenticated users to insert users" ON users;
DROP POLICY IF EXISTS "Allow users to update own data or admins to update any" ON users;
DROP POLICY IF EXISTS "Allow users to delete own data or admins to delete any" ON users;

-- Step 3: Create a function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id::text = auth.uid()::text 
        AND role = 'admin'
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create a function to handle user creation
CREATE OR REPLACE FUNCTION create_user_with_auth(
    user_email TEXT,
    user_name TEXT,
    user_role TEXT DEFAULT 'user'
)
RETURNS UUID AS $$
DECLARE
    new_user_id UUID;
BEGIN
    -- Generate a new UUID for the user
    new_user_id := gen_random_uuid();
    
    -- Insert the user record
    INSERT INTO users (id, email, name, role, created_at, updated_at, is_active)
    VALUES (new_user_id, user_email, user_name, user_role, NOW(), NOW(), true);
    
    RETURN new_user_id;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to create user: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create comprehensive RLS policies
-- Policy for viewing users (authenticated users can view all)
CREATE POLICY "authenticated_users_can_view_all" ON users 
FOR SELECT USING (auth.role() = 'authenticated');

-- Policy for inserting users (authenticated users can insert)
CREATE POLICY "authenticated_users_can_insert" ON users 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy for updating users (users can update own data, admins can update any)
CREATE POLICY "users_can_update_own_or_admin_all" ON users 
FOR UPDATE USING (
    auth.uid()::text = id::text OR is_admin_user()
);

-- Policy for deleting users (users can delete own data, admins can delete any)
CREATE POLICY "users_can_delete_own_or_admin_all" ON users 
FOR DELETE USING (
    auth.uid()::text = id::text OR is_admin_user()
);

-- Step 6: Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 7: Create a default admin user if none exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE role = 'admin') THEN
        INSERT INTO users (id, email, name, role, created_at, updated_at, is_active)
        VALUES (
            gen_random_uuid(),
            'admin@example.com',
            'System Admin',
            'admin',
            NOW(),
            NOW(),
            true
        );
    END IF;
END $$;

-- Step 8: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Step 9: Grant specific permissions on users table
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO anon, authenticated;
GRANT USAGE ON SEQUENCE users_id_seq TO anon, authenticated;

-- Step 10: Show current policies for verification
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check 
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- Step 11: Show current users for verification
SELECT id, email, name, role, is_active, created_at 
FROM users 
ORDER BY created_at;
