-- =====================================================
-- SUPABASE DATA CLEANUP SCRIPT
-- =====================================================
-- This script will safely delete all QRA and configuration data
-- while preserving the research API data structure

-- First, let's check what data exists
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

-- Now delete the data in the correct order (respecting foreign key constraints)
-- Start with the most dependent tables first

-- Delete QRA subcomponents (depends on qra_steps)
DELETE FROM qra_subcomponents;

-- Delete QRA steps (depends on qra_activities)
DELETE FROM qra_steps;

-- Delete QRA activities
DELETE FROM qra_activities;

-- Delete configuration data
DELETE FROM employee_configurations;
DELETE FROM contractor_configurations;
DELETE FROM supply_configurations;

-- Delete research activity selections
DELETE FROM research_activity_selections;

-- Verify the cleanup
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

-- Check that research API data is still intact
SELECT 'Research API Categories' as table_name, COUNT(*) as record_count FROM research_api_categories
UNION ALL
SELECT 'Research API Areas' as table_name, COUNT(*) as record_count FROM research_api_areas
UNION ALL
SELECT 'Research API Focuses' as table_name, COUNT(*) as record_count FROM research_api_focuses
UNION ALL
SELECT 'Research API Activities' as table_name, COUNT(*) as record_count FROM research_api_activities
UNION ALL
SELECT 'Research API Phases' as table_name, COUNT(*) as record_count FROM research_api_phases
UNION ALL
SELECT 'Research API Steps' as table_name, COUNT(*) as record_count FROM research_api_steps
UNION ALL
SELECT 'Research API Subcomponents' as table_name, COUNT(*) as record_count FROM research_api_subcomponents; 