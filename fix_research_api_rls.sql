-- =====================================================
-- FIX RESEARCH API RLS POLICIES
-- =====================================================
-- This script fixes RLS policies to allow public read access to research API data

-- Enable RLS on research API tables
ALTER TABLE research_api_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_api_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_api_focuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_api_activities ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access to research_api_categories" ON research_api_categories;
DROP POLICY IF EXISTS "Allow public read access to research_api_areas" ON research_api_areas;
DROP POLICY IF EXISTS "Allow public read access to research_api_focuses" ON research_api_focuses;
DROP POLICY IF EXISTS "Allow public read access to research_api_activities" ON research_api_activities;

-- Create policies for public read access
CREATE POLICY "Allow public read access to research_api_categories" 
ON research_api_categories FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Allow public read access to research_api_areas" 
ON research_api_areas FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Allow public read access to research_api_focuses" 
ON research_api_focuses FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Allow public read access to research_api_activities" 
ON research_api_activities FOR SELECT 
TO public 
USING (is_active = true);

-- Verify the policies
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
WHERE tablename LIKE 'research_api_%'
ORDER BY tablename, policyname; 