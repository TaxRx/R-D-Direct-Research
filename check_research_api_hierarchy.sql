-- =====================================================
-- CHECK AND CREATE RESEARCH API HIERARCHY VIEW
-- =====================================================

-- Check if the view exists
SELECT 
  schemaname,
  viewname,
  definition
FROM pg_views 
WHERE viewname = 'research_api_hierarchy';

-- Check if tables exist and have data
SELECT 
  'research_api_categories' as table_name,
  COUNT(*) as row_count
FROM research_api_categories
UNION ALL
SELECT 
  'research_api_areas' as table_name,
  COUNT(*) as row_count
FROM research_api_areas
UNION ALL
SELECT 
  'research_api_focuses' as table_name,
  COUNT(*) as row_count
FROM research_api_focuses
UNION ALL
SELECT 
  'research_api_activities' as table_name,
  COUNT(*) as row_count
FROM research_api_activities
UNION ALL
SELECT 
  'research_api_phases' as table_name,
  COUNT(*) as row_count
FROM research_api_phases
UNION ALL
SELECT 
  'research_api_steps' as table_name,
  COUNT(*) as row_count
FROM research_api_steps
UNION ALL
SELECT 
  'research_api_subcomponents' as table_name,
  COUNT(*) as row_count
FROM research_api_subcomponents;

-- Create the hierarchy view if it doesn't exist
CREATE OR REPLACE VIEW research_api_hierarchy AS
SELECT 
    c.id as category_id,
    c.name as category_name,
    a.id as area_id,
    a.name as area_name,
    f.id as focus_id,
    f.name as focus_name,
    ra.id as activity_id,
    ra.name as activity_name,
    ra.general_description as activity_description,
    ra.goal as activity_goal,
    ra.hypothesis as activity_hypothesis,
    ra.alternatives as activity_alternatives,
    ra.uncertainties as activity_uncertainties,
    ra.developmental_process as activity_developmental_process,
    ra.primary_goal as activity_primary_goal,
    ra.expected_outcome_type as activity_expected_outcome_type,
    ra.cpt_codes as activity_cpt_codes,
    ra.cdt_codes as activity_cdt_codes,
    ra.alternative_paths as activity_alternative_paths,
    ra.is_limited_access as activity_is_limited_access,
    p.id as phase_id,
    p.name as phase_name,
    p.description as phase_description,
    p.order_index as phase_order,
    s.id as step_id,
    s.name as step_name,
    s.description as step_description,
    s.order_index as step_order,
    sc.id as subcomponent_id,
    sc.name as subcomponent_name,
    sc.hint as subcomponent_hint,
    sc.description as subcomponent_description,
    sc.is_limited_access as subcomponent_is_limited_access
FROM research_api_categories c
LEFT JOIN research_api_areas a ON c.id = a.category_id
LEFT JOIN research_api_focuses f ON a.id = f.area_id
LEFT JOIN research_api_activities ra ON f.id = ra.focus_id
LEFT JOIN research_api_phases p ON ra.id = p.activity_id
LEFT JOIN research_api_steps s ON p.id = s.phase_id
LEFT JOIN research_api_subcomponents sc ON s.id = sc.step_id
WHERE c.is_active = true
  AND (a.id IS NULL OR a.is_active = true)
  AND (f.id IS NULL OR f.is_active = true)
  AND (ra.id IS NULL OR ra.is_active = true)
  AND (p.id IS NULL OR p.is_active = true)
  AND (s.id IS NULL OR s.is_active = true)
  AND (sc.id IS NULL OR sc.is_active = true)
ORDER BY c.name, a.name, f.name, ra.name, p.order_index, s.order_index;

-- Grant permissions on view
GRANT SELECT ON research_api_hierarchy TO authenticated;
GRANT SELECT ON research_api_hierarchy TO public;

-- Test the view
SELECT 
  category_name,
  area_name,
  focus_name,
  activity_name,
  phase_name,
  step_name,
  subcomponent_name
FROM research_api_hierarchy
LIMIT 10; 