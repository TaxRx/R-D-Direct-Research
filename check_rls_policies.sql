-- =====================================================
-- RLS POLICY CHECK AND CLEANUP SCRIPT
-- =====================================================
-- This script will check RLS policies and temporarily disable them for cleanup

-- Check current RLS status on all tables
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'qra_activities',
    'qra_steps', 
    'qra_subcomponents',
    'employee_configurations',
    'contractor_configurations',
    'supply_configurations',
    'research_activity_selections',
    'research_api_categories',
    'research_api_areas',
    'research_api_focuses',
    'research_api_activities',
    'research_api_phases',
    'research_api_steps',
    'research_api_subcomponents'
  )
ORDER BY tablename;

-- Check existing policies
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
WHERE schemaname = 'public'
  AND tablename IN (
    'qra_activities',
    'qra_steps', 
    'qra_subcomponents',
    'employee_configurations',
    'contractor_configurations',
    'supply_configurations',
    'research_activity_selections'
  )
ORDER BY tablename, policyname;

-- Temporarily disable RLS for cleanup (run this if you need to delete data)
-- ALTER TABLE qra_subcomponents DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE qra_steps DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE qra_activities DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE employee_configurations DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE contractor_configurations DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE supply_configurations DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE research_activity_selections DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS after cleanup (run this after cleanup is complete)
-- ALTER TABLE qra_subcomponents ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE qra_steps ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE qra_activities ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE employee_configurations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE contractor_configurations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE supply_configurations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE research_activity_selections ENABLE ROW LEVEL SECURITY;

-- Check if you have the right permissions
SELECT 
  current_user as current_user,
  session_user as session_user,
  current_database() as current_database;

-- Check if you're a superuser or have the right role
SELECT 
  rolname,
  rolsuper,
  rolinherit,
  rolcreaterole,
  rolcreatedb,
  rolcanlogin
FROM pg_roles 
WHERE rolname = current_user; 