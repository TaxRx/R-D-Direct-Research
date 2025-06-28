-- Complete RLS Disable for User and Business Creation
-- This script completely disables RLS on the users and businesses tables to allow creation
-- Run this in your Supabase SQL Editor

DO $$
BEGIN
    -- Disable RLS on users table
    ALTER TABLE users DISABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS disabled on users table';
    
    -- Drop all policies on users table
    DROP POLICY IF EXISTS "Users can view their own data" ON users;
    DROP POLICY IF EXISTS "Users can insert their own data" ON users;
    DROP POLICY IF EXISTS "Users can update their own data" ON users;
    DROP POLICY IF EXISTS "Users can delete their own data" ON users;
    RAISE NOTICE 'All policies dropped from users table';
    
    -- Disable RLS on businesses table
    ALTER TABLE businesses DISABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS disabled on businesses table';
    
    -- Drop all policies on businesses table
    DROP POLICY IF EXISTS "Users can view their own businesses" ON businesses;
    DROP POLICY IF EXISTS "Users can insert their own businesses" ON businesses;
    DROP POLICY IF EXISTS "Users can update their own businesses" ON businesses;
    DROP POLICY IF EXISTS "Users can delete their own businesses" ON businesses;
    RAISE NOTICE 'All policies dropped from businesses table';
    
    -- Grant all permissions to authenticated users
    GRANT ALL ON users TO authenticated;
    GRANT ALL ON businesses TO authenticated;
    RAISE NOTICE 'All permissions granted to authenticated role';
    
    -- Grant all permissions to service_role
    GRANT ALL ON users TO service_role;
    GRANT ALL ON businesses TO service_role;
    RAISE NOTICE 'All permissions granted to service_role';
    
    -- Grant all permissions to anon role
    GRANT ALL ON users TO anon;
    GRANT ALL ON businesses TO anon;
    RAISE NOTICE 'All permissions granted to anon role';
    
    -- Verify RLS status using pg_tables with specific schema
    RAISE NOTICE 'Verifying RLS status...';
    RAISE NOTICE 'Users table RLS: %', (SELECT relrowsecurity FROM pg_class WHERE relname = 'users' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public'));
    RAISE NOTICE 'Businesses table RLS: %', (SELECT relrowsecurity FROM pg_class WHERE relname = 'businesses' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public'));
    
END $$;

-- Completely disable RLS for debugging
-- Run this in your Supabase SQL Editor

-- Step 1: Drop and recreate the table without RLS
DROP TABLE IF EXISTS business_roles CASCADE;

CREATE TABLE business_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID NOT NULL,
    year INTEGER NOT NULL,
    roles JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id, year)
);

-- Step 2: Create indexes
CREATE INDEX idx_business_roles_business_year ON business_roles(business_id, year);
CREATE INDEX idx_business_roles_year ON business_roles(year);

-- Step 3: DO NOT enable RLS (this is the key difference)
-- ALTER TABLE business_roles ENABLE ROW LEVEL SECURITY;

-- Step 4: Grant all permissions to authenticated users
GRANT ALL ON business_roles TO authenticated;
GRANT ALL ON business_roles TO anon;

-- Step 5: Insert test data with Research Leader
INSERT INTO business_roles (business_id, year, roles) VALUES (
    'c5c52f1f-3311-4952-84a8-ff114bed20dd',
    2025,
    '[
        {
            "id": "1",
            "name": "Research Leader",
            "color": "#1976d2",
            "participatesInRd": true,
            "children": []
        }
    ]'::jsonb
);

-- Step 6: Verify the data
SELECT * FROM business_roles WHERE business_id = 'c5c52f1f-3311-4952-84a8-ff114bed20dd' AND year = 2025;
