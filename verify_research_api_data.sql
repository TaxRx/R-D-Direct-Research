-- =====================================================
-- RESEARCH API DATA VERIFICATION SCRIPT
-- =====================================================
-- This script will verify that the research API data is properly loaded
-- and show the hierarchical structure

-- Check the hierarchical structure
WITH activity_hierarchy AS (
  SELECT 
    c.name as category_name,
    a.name as area_name,
    f.name as focus_name,
    act.name as activity_name,
    act.id as activity_id,
    act.is_active,
    act.is_limited_access
  FROM research_api_activities act
  JOIN research_api_focuses f ON act.focus_id = f.id
  JOIN research_api_areas a ON f.area_id = a.id
  JOIN research_api_categories c ON a.category_id = c.id
  WHERE act.is_active = true
  ORDER BY c.name, a.name, f.name, act.name
)
SELECT 
  category_name,
  area_name,
  focus_name,
  activity_name,
  activity_id,
  CASE WHEN is_limited_access THEN 'Limited' ELSE 'Full' END as access_level
FROM activity_hierarchy;

-- Count activities by category
SELECT 
  c.name as category,
  COUNT(act.id) as activity_count
FROM research_api_categories c
LEFT JOIN research_api_areas a ON c.id = a.category_id
LEFT JOIN research_api_focuses f ON a.id = f.area_id
LEFT JOIN research_api_activities act ON f.id = act.focus_id AND act.is_active = true
GROUP BY c.id, c.name
ORDER BY c.name;

-- Count activities by area
SELECT 
  c.name as category,
  a.name as area,
  COUNT(act.id) as activity_count
FROM research_api_categories c
JOIN research_api_areas a ON c.id = a.category_id
LEFT JOIN research_api_focuses f ON a.id = f.area_id
LEFT JOIN research_api_activities act ON f.id = act.focus_id AND act.is_active = true
GROUP BY c.id, c.name, a.id, a.name
ORDER BY c.name, a.name;

-- Count activities by focus
SELECT 
  c.name as category,
  a.name as area,
  f.name as focus,
  COUNT(act.id) as activity_count
FROM research_api_categories c
JOIN research_api_areas a ON c.id = a.category_id
JOIN research_api_focuses f ON a.id = f.area_id
LEFT JOIN research_api_activities act ON f.id = act.focus_id AND act.is_active = true
GROUP BY c.id, c.name, a.id, a.name, f.id, f.name
ORDER BY c.name, a.name, f.name;

-- Check for specific activities mentioned in the error
SELECT 
  c.name as category,
  a.name as area,
  f.name as focus,
  act.name as activity_name,
  act.id as activity_id
FROM research_api_activities act
JOIN research_api_focuses f ON act.focus_id = f.id
JOIN research_api_areas a ON f.area_id = a.id
JOIN research_api_categories c ON a.category_id = c.id
WHERE act.name IN (
  'Diagnostic Pathway for Treatment Determination',
  'Clear Aligners',
  'Fixed Appliance'
)
AND act.is_active = true;

-- Check for any activities with similar names
SELECT 
  c.name as category,
  a.name as area,
  f.name as focus,
  act.name as activity_name,
  act.id as activity_id
FROM research_api_activities act
JOIN research_api_focuses f ON act.focus_id = f.id
JOIN research_api_areas a ON f.area_id = a.id
JOIN research_api_categories c ON a.category_id = c.id
WHERE act.name ILIKE '%Diagnostic%' 
   OR act.name ILIKE '%Clear%'
   OR act.name ILIKE '%Fixed%'
   OR act.name ILIKE '%Appliance%'
   OR act.name ILIKE '%Treatment%'
   OR act.name ILIKE '%Determination%'
AND act.is_active = true
ORDER BY act.name; 