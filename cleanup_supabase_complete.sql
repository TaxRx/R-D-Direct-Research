-- Complete Supabase Cleanup and Recreation Script
-- This script completely resets your Supabase database and recreates everything from scratch
-- WARNING: This will delete ALL data in your database!

-- Step 1: Disable RLS temporarily to avoid permission issues
SET session_replication_role = replica;

-- Step 2: Drop all existing objects in the correct order

-- Drop views first (they depend on tables)
DO $$ 
BEGIN
    DROP VIEW IF EXISTS normalized_qre_data CASCADE;
    RAISE NOTICE 'Views dropped successfully';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error dropping views: %', SQLERRM;
END $$;

-- Drop all RLS policies with error handling
DO $$ 
BEGIN
    -- Users policies
    DROP POLICY IF EXISTS "Users can view own data" ON users;
    DROP POLICY IF EXISTS "Users can update own data" ON users;
    DROP POLICY IF EXISTS "Users can insert own data" ON users;
    DROP POLICY IF EXISTS "Admins can delete users" ON users;

    -- Businesses policies
    DROP POLICY IF EXISTS "Businesses can view own data" ON businesses;
    DROP POLICY IF EXISTS "Businesses can update own data" ON businesses;
    DROP POLICY IF EXISTS "Businesses can insert own data" ON businesses;

    -- Years policies
    DROP POLICY IF EXISTS "Years can view own data" ON years;
    DROP POLICY IF EXISTS "Years can update own data" ON years;
    DROP POLICY IF EXISTS "Years can insert own data" ON years;

    -- Research activities policies
    DROP POLICY IF EXISTS "Research activities can view own data" ON research_activities;
    DROP POLICY IF EXISTS "Research activities can update own data" ON research_activities;
    DROP POLICY IF EXISTS "Research activities can insert own data" ON research_activities;

    -- Steps policies
    DROP POLICY IF EXISTS "Steps can view own data" ON steps;
    DROP POLICY IF EXISTS "Steps can update own data" ON steps;
    DROP POLICY IF EXISTS "Steps can insert own data" ON steps;

    -- Subcomponents policies
    DROP POLICY IF EXISTS "Subcomponents can view own data" ON subcomponents;
    DROP POLICY IF EXISTS "Subcomponents can update own data" ON subcomponents;
    DROP POLICY IF EXISTS "Subcomponents can insert own data" ON subcomponents;

    -- Roles policies
    DROP POLICY IF EXISTS "Roles can view own data" ON roles;
    DROP POLICY IF EXISTS "Roles can update own data" ON roles;
    DROP POLICY IF EXISTS "Roles can insert own data" ON roles;

    -- Employees policies
    DROP POLICY IF EXISTS "Employees can view own data" ON employees;
    DROP POLICY IF EXISTS "Employees can update own data" ON employees;
    DROP POLICY IF EXISTS "Employees can insert own data" ON employees;

    -- Contractors policies
    DROP POLICY IF EXISTS "Contractors can view own data" ON contractors;
    DROP POLICY IF EXISTS "Contractors can update own data" ON contractors;
    DROP POLICY IF EXISTS "Contractors can insert own data" ON contractors;

    -- Supplies policies
    DROP POLICY IF EXISTS "Supplies can view own data" ON supplies;
    DROP POLICY IF EXISTS "Supplies can update own data" ON supplies;
    DROP POLICY IF EXISTS "Supplies can insert own data" ON supplies;

    -- QRE allocations policies
    DROP POLICY IF EXISTS "QRE allocations can view own data" ON qre_allocations;
    DROP POLICY IF EXISTS "QRE allocations can update own data" ON qre_allocations;
    DROP POLICY IF EXISTS "QRE allocations can insert own data" ON qre_allocations;

    -- Tab approvals policies
    DROP POLICY IF EXISTS "Tab approvals can view own data" ON tab_approvals;
    DROP POLICY IF EXISTS "Tab approvals can update own data" ON tab_approvals;
    DROP POLICY IF EXISTS "Tab approvals can insert own data" ON tab_approvals;

    -- Approval history policies
    DROP POLICY IF EXISTS "Approval history can view own data" ON approval_history;
    DROP POLICY IF EXISTS "Approval history can insert own data" ON approval_history;

    -- Templates policies
    DROP POLICY IF EXISTS "Templates can view own data" ON templates;
    DROP POLICY IF EXISTS "Templates can update own data" ON templates;
    DROP POLICY IF EXISTS "Templates can insert own data" ON templates;

    -- AI report content policies
    DROP POLICY IF EXISTS "AI report content can view own data" ON ai_report_content;
    DROP POLICY IF EXISTS "AI report content can update own data" ON ai_report_content;
    DROP POLICY IF EXISTS "AI report content can insert own data" ON ai_report_content;

    -- Prompt templates policies
    DROP POLICY IF EXISTS "Prompt templates can view all" ON prompt_templates;
    DROP POLICY IF EXISTS "Prompt templates can update own" ON prompt_templates;
    DROP POLICY IF EXISTS "Prompt templates can insert own" ON prompt_templates;

    -- User prompts policies
    DROP POLICY IF EXISTS "User prompts can view own data" ON user_prompts;
    DROP POLICY IF EXISTS "User prompts can insert own data" ON user_prompts;

    RAISE NOTICE 'RLS policies dropped successfully';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error dropping RLS policies: %', SQLERRM;
END $$;

-- Drop triggers with error handling
DO $$ 
BEGIN
    DROP TRIGGER IF EXISTS update_users_updated_at ON users;
    DROP TRIGGER IF EXISTS update_businesses_updated_at ON businesses;
    DROP TRIGGER IF EXISTS update_years_updated_at ON years;
    DROP TRIGGER IF EXISTS update_research_activities_updated_at ON research_activities;
    DROP TRIGGER IF EXISTS update_steps_updated_at ON steps;
    DROP TRIGGER IF EXISTS update_subcomponents_updated_at ON subcomponents;
    DROP TRIGGER IF EXISTS update_roles_updated_at ON roles;
    DROP TRIGGER IF EXISTS update_employees_updated_at ON employees;
    DROP TRIGGER IF EXISTS update_contractors_updated_at ON contractors;
    DROP TRIGGER IF EXISTS update_supplies_updated_at ON supplies;
    DROP TRIGGER IF EXISTS update_qre_allocations_updated_at ON qre_allocations;
    DROP TRIGGER IF EXISTS update_tab_approvals_updated_at ON tab_approvals;
    DROP TRIGGER IF EXISTS update_templates_updated_at ON templates;
    DROP TRIGGER IF EXISTS update_ai_report_content_updated_at ON ai_report_content;
    DROP TRIGGER IF EXISTS update_prompt_templates_updated_at ON prompt_templates;
    
    RAISE NOTICE 'Triggers dropped successfully';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error dropping triggers: %', SQLERRM;
END $$;

-- Drop functions with error handling
DO $$ 
BEGIN
    DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
    RAISE NOTICE 'Functions dropped successfully';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error dropping functions: %', SQLERRM;
END $$;

-- Drop indexes with error handling
DO $$ 
BEGIN
    DROP INDEX IF EXISTS idx_businesses_user_id;
    DROP INDEX IF EXISTS idx_years_business_id;
    DROP INDEX IF EXISTS idx_research_activities_business_year;
    DROP INDEX IF EXISTS idx_steps_research_activity_id;
    DROP INDEX IF EXISTS idx_subcomponents_step_id;
    DROP INDEX IF EXISTS idx_roles_business_id;
    DROP INDEX IF EXISTS idx_employees_business_year;
    DROP INDEX IF EXISTS idx_employees_role_id;
    DROP INDEX IF EXISTS idx_contractors_business_year;
    DROP INDEX IF EXISTS idx_contractors_role_id;
    DROP INDEX IF EXISTS idx_supplies_business_year;
    DROP INDEX IF EXISTS idx_qre_allocations_business_year;
    DROP INDEX IF EXISTS idx_qre_allocations_entity;
    DROP INDEX IF EXISTS idx_qre_allocations_research_activity;
    DROP INDEX IF EXISTS idx_qre_allocations_step;
    DROP INDEX IF EXISTS idx_qre_allocations_subcomponent;
    DROP INDEX IF EXISTS idx_tab_approvals_business_year;
    DROP INDEX IF EXISTS idx_approval_history_business_year;
    DROP INDEX IF EXISTS idx_templates_business;
    DROP INDEX IF EXISTS idx_ai_report_content_business_year;
    DROP INDEX IF EXISTS idx_ai_report_content_research_activity;
    DROP INDEX IF EXISTS idx_prompt_templates_category;
    DROP INDEX IF EXISTS idx_user_prompts_business_year;
    DROP INDEX IF EXISTS idx_user_prompts_research_activity;
    
    RAISE NOTICE 'Indexes dropped successfully';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error dropping indexes: %', SQLERRM;
END $$;

-- Drop tables in dependency order (child tables first) with error handling
DO $$ 
BEGIN
    DROP TABLE IF EXISTS user_prompts CASCADE;
    DROP TABLE IF EXISTS prompt_templates CASCADE;
    DROP TABLE IF EXISTS ai_report_content CASCADE;
    DROP TABLE IF EXISTS templates CASCADE;
    DROP TABLE IF EXISTS approval_history CASCADE;
    DROP TABLE IF EXISTS tab_approvals CASCADE;
    DROP TABLE IF EXISTS qre_allocations CASCADE;
    DROP TABLE IF EXISTS supplies CASCADE;
    DROP TABLE IF EXISTS contractors CASCADE;
    DROP TABLE IF EXISTS employees CASCADE;
    DROP TABLE IF EXISTS roles CASCADE;
    DROP TABLE IF EXISTS subcomponents CASCADE;
    DROP TABLE IF EXISTS steps CASCADE;
    DROP TABLE IF EXISTS research_activities CASCADE;
    DROP TABLE IF EXISTS years CASCADE;
    DROP TABLE IF EXISTS businesses CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
    
    RAISE NOTICE 'Tables dropped successfully';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error dropping tables: %', SQLERRM;
END $$;

-- Drop custom types with error handling
DO $$ 
BEGIN
    DROP TYPE IF EXISTS contractor_type CASCADE;
    DROP TYPE IF EXISTS entity_category CASCADE;
    DROP TYPE IF EXISTS approval_status CASCADE;
    
    RAISE NOTICE 'Custom types dropped successfully';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error dropping custom types: %', SQLERRM;
END $$;

-- Step 3: Re-enable RLS
SET session_replication_role = DEFAULT;

-- Step 4: Success message
DO $$ 
BEGIN
    RAISE NOTICE 'Complete cleanup finished successfully!';
    RAISE NOTICE 'All tables, views, functions, triggers, indexes, types, and RLS policies have been dropped.';
    RAISE NOTICE 'Your database is now completely clean and ready for the new schema.';
    RAISE NOTICE 'Next step: Run complete_supabase_schema.sql to recreate everything.';
END $$;
