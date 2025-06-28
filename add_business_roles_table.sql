-- Migration to add business_roles table for storing hierarchical roles data
-- Run this in your Supabase SQL Editor

-- Create business_roles table for storing hierarchical roles data
CREATE TABLE IF NOT EXISTS business_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    roles JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id, year)
);

-- Add index for efficient querying
CREATE INDEX IF NOT EXISTS idx_business_roles_business_year ON business_roles(business_id, year);

-- Add trigger for updated_at
CREATE TRIGGER update_business_roles_updated_at 
    BEFORE UPDATE ON business_roles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE business_roles ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see their own business roles
CREATE POLICY "Users can view their own business roles" ON business_roles
    FOR SELECT USING (
        business_id IN (
            SELECT id FROM businesses 
            WHERE user_id = auth.uid()
        )
    );

-- Policy to allow users to insert their own business roles
CREATE POLICY "Users can insert their own business roles" ON business_roles
    FOR INSERT WITH CHECK (
        business_id IN (
            SELECT id FROM businesses 
            WHERE user_id = auth.uid()
        )
    );

-- Policy to allow users to update their own business roles
CREATE POLICY "Users can update their own business roles" ON business_roles
    FOR UPDATE USING (
        business_id IN (
            SELECT id FROM businesses 
            WHERE user_id = auth.uid()
        )
    );

-- Policy to allow users to delete their own business roles
CREATE POLICY "Users can delete their own business roles" ON business_roles
    FOR DELETE USING (
        business_id IN (
            SELECT id FROM businesses 
            WHERE user_id = auth.uid()
        )
    ); 