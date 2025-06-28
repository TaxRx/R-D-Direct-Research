-- Complete fix for business_roles table
-- Run this in your Supabase SQL Editor

-- Step 1: Drop existing table and all related objects
DROP TABLE IF EXISTS business_roles CASCADE;

-- Step 2: Create business_roles table with proper structure
CREATE TABLE business_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID NOT NULL,
    year INTEGER NOT NULL,
    roles JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id, year)
);

-- Step 3: Add foreign key constraint (only if businesses table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'businesses') THEN
        ALTER TABLE business_roles 
        ADD CONSTRAINT fk_business_roles_business_id 
        FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Step 4: Add indexes for efficient querying
CREATE INDEX idx_business_roles_business_year ON business_roles(business_id, year);
CREATE INDEX idx_business_roles_year ON business_roles(year);

-- Step 5: Add trigger for updated_at
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

-- Step 6: Enable RLS
ALTER TABLE business_roles ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies with correct column reference
-- Policy for authenticated users to read their own business roles
CREATE POLICY "Users can read their own business roles" ON business_roles
    FOR SELECT
    TO authenticated
    USING (
        business_id IN (
            SELECT id FROM businesses 
            WHERE auth.uid()::text = user_id::text
        )
    );

-- Policy for authenticated users to insert their own business roles
CREATE POLICY "Users can insert their own business roles" ON business_roles
    FOR INSERT
    TO authenticated
    WITH CHECK (
        business_id IN (
            SELECT id FROM businesses 
            WHERE auth.uid()::text = user_id::text
        )
    );

-- Policy for authenticated users to update their own business roles
CREATE POLICY "Users can update their own business roles" ON business_roles
    FOR UPDATE
    TO authenticated
    USING (
        business_id IN (
            SELECT id FROM businesses 
            WHERE auth.uid()::text = user_id::text
        )
    )
    WITH CHECK (
        business_id IN (
            SELECT id FROM businesses 
            WHERE auth.uid()::text = user_id::text
        )
    );

-- Policy for authenticated users to delete their own business roles
CREATE POLICY "Users can delete their own business roles" ON business_roles
    FOR DELETE
    TO authenticated
    USING (
        business_id IN (
            SELECT id FROM businesses 
            WHERE auth.uid()::text = user_id::text
        )
    );

-- Step 8: Grant permissions
GRANT ALL ON business_roles TO authenticated;

-- Step 9: Verify the setup
SELECT 'Table created successfully' as status; 