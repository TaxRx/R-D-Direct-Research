-- =====================================================
-- FORCE DELETE ALL ACTIVITIES DATA
-- =====================================================
-- This script will force delete all activities-related data
-- Run this as a superuser or with appropriate permissions

-- First, disable RLS on all tables
ALTER TABLE qra_subcomponents DISABLE ROW LEVEL SECURITY;
ALTER TABLE qra_steps DISABLE ROW LEVEL SECURITY;
ALTER TABLE qra_activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE employee_configurations DISABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_configurations DISABLE ROW LEVEL SECURITY;
ALTER TABLE supply_configurations DISABLE ROW LEVEL SECURITY;
ALTER TABLE research_activity_selections DISABLE ROW LEVEL SECURITY;

-- Delete all data in the correct order (respecting foreign key constraints)
DELETE FROM qra_subcomponents;
DELETE FROM qra_steps;
DELETE FROM qra_activities;
DELETE FROM employee_configurations;
DELETE FROM contractor_configurations;
DELETE FROM supply_configurations;
DELETE FROM research_activity_selections;

-- Re-enable RLS
ALTER TABLE qra_subcomponents ENABLE ROW LEVEL SECURITY;
ALTER TABLE qra_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE qra_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE supply_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_activity_selections ENABLE ROW LEVEL SECURITY;

-- Verify deletion
SELECT 'QRA Activities' as table_name, COUNT(*) as record_count FROM qra_activities
UNION ALL
SELECT 'QRA Steps' as table_name, COUNT(*) as record_count FROM qra_steps
UNION ALL
SELECT 'QRA Subcomponents' as table_name, COUNT(*) as record_count FROM qra_subcomponents
UNION ALL
SELECT 'Employee Configurations' as table_name, COUNT(*) as record_count FROM employee_configurations
UNION ALL
SELECT 'Contractor Configurations' as table_name, COUNT(*) as record_count FROM contractor_configurations
UNION ALL
SELECT 'Supply Configurations' as table_name, COUNT(*) as record_count FROM supply_configurations
UNION ALL
SELECT 'Research Activity Selections' as table_name, COUNT(*) as record_count FROM research_activity_selections;

-- Verify research API data is still intact
SELECT 'Research API Categories' as table_name, COUNT(*) as record_count FROM research_api_categories
UNION ALL
SELECT 'Research API Areas' as table_name, COUNT(*) as record_count FROM research_api_areas
UNION ALL
SELECT 'Research API Focuses' as table_name, COUNT(*) as record_count FROM research_api_focuses
UNION ALL
SELECT 'Research API Activities' as table_name, COUNT(*) as record_count FROM research_api_activities; 