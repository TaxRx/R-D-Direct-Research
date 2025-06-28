-- Comprehensive Supabase Debugging and Setup Script
-- This script fixes all known issues and sets up a working environment
-- Run this in your Supabase SQL Editor

-- ============================================================================
-- STEP 1: CLEANUP AND PREPARATION
-- ============================================================================

-- Drop existing business_roles table if it exists
DROP TABLE IF EXISTS business_roles CASCADE;

-- ============================================================================
-- STEP 2: CREATE BUSINESS_ROLES TABLE WITH PROPER STRUCTURE
-- ============================================================================

CREATE TABLE business_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID NOT NULL,
    year INTEGER NOT NULL,
    roles JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id, year)
);

-- ============================================================================
-- STEP 3: ADD FOREIGN KEY CONSTRAINT (SAFELY)
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'businesses') THEN
        ALTER TABLE business_roles 
        ADD CONSTRAINT fk_business_roles_business_id 
        FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;
    END IF;
END $$;

-- ============================================================================
-- STEP 4: ADD INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_business_roles_business_year ON business_roles(business_id, year);
CREATE INDEX idx_business_roles_year ON business_roles(year);

-- ============================================================================
-- STEP 5: ADD UPDATED_AT TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_business_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_business_roles_updated_at
    BEFORE UPDATE ON business_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_business_roles_updated_at();

-- ============================================================================
-- STEP 6: ENABLE RLS
-- ============================================================================

ALTER TABLE business_roles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 7: CREATE TEMPORARY PERMISSIVE RLS POLICIES FOR DEBUGGING
-- ============================================================================

-- TEMPORARY: Allow all authenticated users to read business_roles
-- This will be replaced with proper security later
CREATE POLICY "temp_read_business_roles" ON business_roles
    FOR SELECT
    TO authenticated
    USING (true);

-- TEMPORARY: Allow all authenticated users to insert business_roles
CREATE POLICY "temp_insert_business_roles" ON business_roles
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- TEMPORARY: Allow all authenticated users to update business_roles
CREATE POLICY "temp_update_business_roles" ON business_roles
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- TEMPORARY: Allow all authenticated users to delete business_roles
CREATE POLICY "temp_delete_business_roles" ON business_roles
    FOR DELETE
    TO authenticated
    USING (true);

-- ============================================================================
-- STEP 8: GRANT PERMISSIONS
-- ============================================================================

GRANT ALL ON business_roles TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- ============================================================================
-- STEP 9: INSERT TEST DATA (OPTIONAL)
-- ============================================================================

-- Only insert test data if businesses table exists and has data
DO $$
DECLARE
    test_business_id UUID;
BEGIN
    -- Check if businesses table exists and has data
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'businesses') THEN
        SELECT id INTO test_business_id FROM businesses LIMIT 1;
        
        IF test_business_id IS NOT NULL THEN
            -- Insert test business_roles data
            INSERT INTO business_roles (business_id, year, roles) VALUES (
                test_business_id,
                2024,
                '[
                    {
                        "id": "1",
                        "name": "Software Engineer",
                        "color": "#1976d2",
                        "participatesInRd": true,
                        "children": []
                    },
                    {
                        "id": "2", 
                        "name": "Research Scientist",
                        "color": "#388e3c",
                        "participatesInRd": true,
                        "children": []
                    }
                ]'::jsonb
            ) ON CONFLICT (business_id, year) DO NOTHING;
        END IF;
    END IF;
END $$;

-- ============================================================================
-- STEP 10: VERIFICATION QUERIES
-- ============================================================================

-- Check if table was created successfully
SELECT 'business_roles table created successfully' as status;

-- Check table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'business_roles'
ORDER BY ordinal_position;

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'business_roles';

-- Check if test data was inserted
SELECT COUNT(*) as total_records FROM business_roles;

-- Show any existing data
SELECT business_id, year, roles FROM business_roles LIMIT 5; 