-- Fix for existing types and objects
-- This script safely drops existing objects before recreating them

-- Step 1: Drop existing types if they exist
DROP TYPE IF EXISTS contractor_type CASCADE;
DROP TYPE IF EXISTS employee_type CASCADE;
DROP TYPE IF EXISTS supply_type CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS approval_status CASCADE;
DROP TYPE IF EXISTS template_type CASCADE;
DROP TYPE IF EXISTS ai_content_type CASCADE;
DROP TYPE IF EXISTS entity_category CASCADE;

-- Step 2: Drop existing tables if they exist
DROP TABLE IF EXISTS ai_content CASCADE;
DROP TABLE IF EXISTS approval_tracking CASCADE;
DROP TABLE IF EXISTS templates CASCADE;
DROP TABLE IF EXISTS qre_allocations CASCADE;
DROP TABLE IF EXISTS supplies CASCADE;
DROP TABLE IF EXISTS contractors CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS research_activities CASCADE;
DROP TABLE IF EXISTS research_steps CASCADE;
DROP TABLE IF EXISTS research_subcomponents CASCADE;
DROP TABLE IF EXISTS businesses CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Step 3: Drop existing functions if they exist
DROP FUNCTION IF EXISTS is_admin_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS calculate_qre_allocations() CASCADE;

-- Step 4: Drop existing views if they exist
DROP VIEW IF EXISTS business_summary_view CASCADE;
DROP VIEW IF EXISTS qre_summary_view CASCADE;

-- Step 5: Drop existing indexes if they exist
DROP INDEX IF EXISTS idx_users_email CASCADE;
DROP INDEX IF EXISTS idx_users_role CASCADE;
DROP INDEX IF EXISTS idx_businesses_user_id CASCADE;
DROP INDEX IF EXISTS idx_businesses_name CASCADE;
DROP INDEX IF EXISTS idx_employees_business_id CASCADE;
DROP INDEX IF EXISTS idx_employees_year CASCADE;
DROP INDEX IF EXISTS idx_contractors_business_id CASCADE;
DROP INDEX IF EXISTS idx_contractors_year CASCADE;
DROP INDEX IF EXISTS idx_supplies_business_id CASCADE;
DROP INDEX IF EXISTS idx_supplies_year CASCADE;
DROP INDEX IF EXISTS idx_research_activities_business_id CASCADE;
DROP INDEX IF EXISTS idx_research_activities_year CASCADE;
DROP INDEX IF EXISTS idx_research_steps_activity_id CASCADE;
DROP INDEX IF EXISTS idx_research_subcomponents_step_id CASCADE;
DROP INDEX IF EXISTS idx_qre_allocations_business_id CASCADE;
DROP INDEX IF EXISTS idx_qre_allocations_year CASCADE;
DROP INDEX IF EXISTS idx_templates_business_id CASCADE;
DROP INDEX IF EXISTS idx_approval_tracking_business_id CASCADE;
DROP INDEX IF EXISTS idx_approval_tracking_year CASCADE;
DROP INDEX IF EXISTS idx_ai_content_business_id CASCADE;

-- Now you can run the complete schema: complete_supabase_schema.sql

-- Step 6: Then run the RLS fixes
-- Run: fix_client_id_column.sql
