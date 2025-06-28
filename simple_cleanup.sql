-- Simple Supabase Cleanup Script
-- This script safely cleans up the most common database objects
-- It's designed to work even if some objects don't exist

-- Disable RLS temporarily
SET session_replication_role = replica;

-- Drop tables if they exist (in dependency order)
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

-- Drop views if they exist
DROP VIEW IF EXISTS normalized_qre_data CASCADE;

-- Drop custom types if they exist
DROP TYPE IF EXISTS contractor_type CASCADE;
DROP TYPE IF EXISTS entity_category CASCADE;
DROP TYPE IF EXISTS approval_status CASCADE;

-- Drop function if it exists
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Re-enable RLS
SET session_replication_role = DEFAULT;

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE 'Simple cleanup completed successfully!';
    RAISE NOTICE 'All tables, views, types, and functions have been dropped.';
    RAISE NOTICE 'Your database is now clean and ready for the new schema.';
END $$;
