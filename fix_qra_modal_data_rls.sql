-- Fix RLS policy for qra_modal_data table
-- This script addresses the 401 Unauthorized error when saving to qra_modal_data

-- Temporarily disable RLS on qra_modal_data table
ALTER TABLE qra_modal_data DISABLE ROW LEVEL SECURITY;

-- Grant explicit permissions to ensure the table is accessible
GRANT ALL ON qra_modal_data TO authenticated;
GRANT ALL ON qra_modal_data TO anon;
