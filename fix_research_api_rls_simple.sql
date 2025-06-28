-- =====================================================
-- SIMPLE RLS FIX FOR RESEARCH API TABLES
-- =====================================================
-- This script simplifies RLS policies to allow public read access

-- First, disable RLS temporarily to clear all policies
ALTER TABLE research_api_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE research_api_areas DISABLE ROW LEVEL SECURITY;
ALTER TABLE research_api_focuses DISABLE ROW LEVEL SECURITY;
ALTER TABLE research_api_activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE research_api_steps DISABLE ROW LEVEL SECURITY;
ALTER TABLE research_api_subcomponents DISABLE ROW LEVEL SECURITY;
ALTER TABLE research_api_phases DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Admins have full access to categories" ON research_api_categories;
DROP POLICY IF EXISTS "Allow public read access to research_api_categories" ON research_api_categories;
DROP POLICY IF EXISTS "Users can view non-limited categories" ON research_api_categories;

DROP POLICY IF EXISTS "Admins have full access to areas" ON research_api_areas;
DROP POLICY IF EXISTS "Allow public read access to research_api_areas" ON research_api_areas;
DROP POLICY IF EXISTS "Users can view non-limited areas" ON research_api_areas;

DROP POLICY IF EXISTS "Admins have full access to focuses" ON research_api_focuses;
DROP POLICY IF EXISTS "Allow public read access to research_api_focuses" ON research_api_focuses;
DROP POLICY IF EXISTS "Users can view non-limited focuses" ON research_api_focuses;

DROP POLICY IF EXISTS "Admins have full access to activities" ON research_api_activities;
DROP POLICY IF EXISTS "Allow public read access to research_api_activities" ON research_api_activities;
DROP POLICY IF EXISTS "Users can view limited activities if authorized" ON research_api_activities;
DROP POLICY IF EXISTS "Users can view non-limited activities" ON research_api_activities;

DROP POLICY IF EXISTS "Admins have full access to steps" ON research_api_steps;
DROP POLICY IF EXISTS "Users can view non-limited steps" ON research_api_steps;

DROP POLICY IF EXISTS "Admins have full access to subcomponents" ON research_api_subcomponents;
DROP POLICY IF EXISTS "Users can view limited subcomponents if authorized" ON research_api_subcomponents;
DROP POLICY IF EXISTS "Users can view non-limited subcomponents" ON research_api_subcomponents;

DROP POLICY IF EXISTS "Admins have full access to phases" ON research_api_phases;
DROP POLICY IF EXISTS "Users can view non-limited phases" ON research_api_phases;

-- Re-enable RLS
ALTER TABLE research_api_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_api_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_api_focuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_api_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_api_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_api_subcomponents ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_api_phases ENABLE ROW LEVEL SECURITY;

-- Create simple public read policies
CREATE POLICY "Public read access to categories" 
ON research_api_categories FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Public read access to areas" 
ON research_api_areas FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Public read access to focuses" 
ON research_api_focuses FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Public read access to activities" 
ON research_api_activities FOR SELECT 
TO public 
USING (is_active = true);

CREATE POLICY "Public read access to steps" 
ON research_api_steps FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Public read access to subcomponents" 
ON research_api_subcomponents FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Public read access to phases" 
ON research_api_phases FOR SELECT 
TO public 
USING (true);

-- Verify the policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename LIKE 'research_api_%'
ORDER BY tablename, policyname; 