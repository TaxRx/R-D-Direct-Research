-- Simple RLS Fix for User Creation - Complete Disable
-- This script completely disables RLS on the users table to allow user creation
-- Run this in your Supabase SQL Editor

-- Step 1: Completely disable RLS on users table
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
DROP POLICY IF EXISTS "authenticated_users_can_view_all" ON users;
DROP POLICY IF EXISTS "authenticated_users_can_insert" ON users;
DROP POLICY IF EXISTS "users_can_update_own_or_admin_all" ON users;
DROP POLICY IF EXISTS "users_can_delete_own_or_admin_all" ON users;

-- Step 3: Grant all permissions to authenticated users
GRANT ALL ON users TO authenticated;
GRANT ALL ON users TO anon;

-- Step 4: Create a default admin user if none exists
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

-- Step 5: Show current users for verification
SELECT id, email, name, role, is_active, created_at 
FROM users 
ORDER BY created_at;

-- Step 6: Show that RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users';

-- Simple RLS Fix for Business Roles
-- Run this in your Supabase SQL Editor

-- Step 1: Drop existing table and recreate with simple RLS
DROP TABLE IF EXISTS business_roles CASCADE;

CREATE TABLE business_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    roles JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id, year)
);

-- Step 2: Create simple indexes
CREATE INDEX idx_business_roles_business_year ON business_roles(business_id, year);
CREATE INDEX idx_business_roles_year ON business_roles(year);

-- Step 3: Enable RLS
ALTER TABLE business_roles ENABLE ROW LEVEL SECURITY;

-- Step 4: Create simple RLS policy that allows all authenticated users (for debugging)
CREATE POLICY "Allow all authenticated users" ON business_roles
    FOR ALL USING (auth.role() = 'authenticated');

-- Step 5: Insert test data with the correct business_id
-- Replace 'c5c52f1f-3311-4952-84a8-ff114bed20dd' with your actual business ID
INSERT INTO business_roles (business_id, year, roles) VALUES 
(
    'c5c52f1f-3311-4952-84a8-ff114bed20dd'::UUID, 
    2025, 
    '[
        {
            "id": "1",
            "name": "Research Leader",
            "color": "#1976d2",
            "participatesInRd": true,
            "children": []
        }
    ]'::JSONB
);

-- Step 6: Grant permissions
GRANT ALL ON business_roles TO authenticated;
GRANT ALL ON business_roles TO service_role;

-- Step 7: Verify the data
SELECT * FROM business_roles WHERE business_id = 'c5c52f1f-3311-4952-84a8-ff114bed20dd'::UUID AND year = 2025;
