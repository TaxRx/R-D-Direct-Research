-- Complete Supabase Database Schema for R&D Credit Manager
-- This schema includes all tables, indexes, views, and functions needed for the app
-- Run this in your Supabase SQL Editor after clearing all existing tables

-- ============================================================================
-- CUSTOM TYPES
-- ============================================================================

-- Create custom types
CREATE TYPE contractor_type AS ENUM ('individual', 'business');
CREATE TYPE entity_category AS ENUM ('employee', 'contractor', 'supply');
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Users table (for clients and admin users)
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    role TEXT NOT NULL DEFAULT 'client',
    business_ids TEXT[] DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Businesses table
CREATE TABLE businesses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    dba_name TEXT,
    ein TEXT,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    business_type TEXT NOT NULL DEFAULT 'corporation',
    entity_state TEXT,
    start_year INTEGER DEFAULT EXTRACT(YEAR FROM NOW()),
    owners JSONB DEFAULT '[]',
    financial_history JSONB DEFAULT '[]',
    tab_approvals JSONB DEFAULT '{"basicInfo": {"isApproved": false, "approvedAt": "", "approvedBy": ""}, "ownership": {"isApproved": false, "approvedAt": "", "approvedBy": ""}, "financial": {"isApproved": false, "approvedAt": "", "approvedBy": ""}}',
    is_controlled_group BOOLEAN DEFAULT FALSE,
    is_control_group_leader BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Years table
CREATE TABLE years (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    gross_receipts DECIMAL(15,2),
    total_qre DECIMAL(15,2),
    base_period_qre DECIMAL(15,2),
    base_period_gross_receipts DECIMAL(15,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id, year)
);

-- Research activities table
CREATE TABLE research_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    practice_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id, year, title)
);

-- Steps table
CREATE TABLE steps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    research_activity_id UUID REFERENCES research_activities(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(research_activity_id, title)
);

-- Subcomponents table
CREATE TABLE subcomponents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    step_id UUID REFERENCES steps(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    year_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
    frequency_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
    time_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(step_id, title)
);

-- Roles table
CREATE TABLE roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT,
    participates_in_rd BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id, name)
);

-- Employees table
CREATE TABLE employees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
    wage DECIMAL(12,2) NOT NULL DEFAULT 0,
    hours_worked INTEGER,
    is_owner BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id, year, first_name, last_name)
);

-- Contractors table
CREATE TABLE contractors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    contractor_type contractor_type NOT NULL DEFAULT 'individual',
    first_name TEXT,
    last_name TEXT,
    business_name TEXT,
    role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id, year, contractor_type, first_name, last_name, business_name)
);

-- Supplies table
CREATE TABLE supplies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general',
    total_value DECIMAL(12,2) NOT NULL DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id, year, name)
);

-- Main QRE allocations table (the normalized structure)
CREATE TABLE qre_allocations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    research_activity_id UUID REFERENCES research_activities(id) ON DELETE CASCADE,
    step_id UUID REFERENCES steps(id) ON DELETE CASCADE,
    subcomponent_id UUID REFERENCES subcomponents(id) ON DELETE CASCADE,
    category entity_category NOT NULL,
    entity_id UUID NOT NULL, -- References employee_id, contractor_id, or supply_id
    applied_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id, year, research_activity_id, step_id, subcomponent_id, category, entity_id)
);

-- QRA Activities table (normalized)
CREATE TABLE IF NOT EXISTS qra_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    activity_id UUID NOT NULL REFERENCES research_activities(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_approved BOOLEAN DEFAULT FALSE,
    approval_date TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id, year, activity_id)
);

-- QRA Steps table (normalized)
CREATE TABLE IF NOT EXISTS qra_steps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    activity_id UUID NOT NULL REFERENCES qra_activities(id) ON DELETE CASCADE,
    step_name TEXT NOT NULL,
    step_description TEXT,
    step_order INTEGER NOT NULL,
    step_frequency TEXT,
    step_duration_hours DECIMAL(10,2),
    step_cost DECIMAL(15,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id, year, activity_id, step_order)
);

-- QRA Subcomponents table (normalized)
CREATE TABLE IF NOT EXISTS qra_subcomponents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    activity_id UUID NOT NULL REFERENCES qra_activities(id) ON DELETE CASCADE,
    step_id UUID REFERENCES qra_steps(id) ON DELETE CASCADE,
    subcomponent_name TEXT NOT NULL,
    subcomponent_description TEXT,
    subcomponent_order INTEGER NOT NULL,
    time_allocation_percentage DECIMAL(5,2),
    cost_allocation_percentage DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id, year, activity_id, step_id, subcomponent_order)
);

-- ============================================================================
-- APPROVAL AND TRACKING TABLES
-- ============================================================================

-- Tab approvals table
CREATE TABLE tab_approvals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    tab_id TEXT NOT NULL, -- 'activities', 'roles', 'expenses', etc.
    is_approved BOOLEAN NOT NULL DEFAULT FALSE,
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by TEXT,
    ip_address TEXT,
    approval_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id, year, tab_id)
);

-- Approval history table
CREATE TABLE approval_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    tab_id TEXT NOT NULL,
    action TEXT NOT NULL, -- 'approved', 'rejected', 'modified'
    action_by TEXT,
    ip_address TEXT,
    action_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- TEMPLATE AND AI CONTENT TABLES
-- ============================================================================

-- Templates table
CREATE TABLE templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    donor_year INTEGER NOT NULL,
    template_data JSONB NOT NULL, -- Contains activities, roles, QRA data
    is_public BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id, name)
);

-- AI Report content table
CREATE TABLE ai_report_content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    research_activity_id UUID REFERENCES research_activities(id) ON DELETE CASCADE,
    subcomponent_id UUID REFERENCES subcomponents(id) ON DELETE SET NULL,
    content_type TEXT NOT NULL, -- 'activity_summary', 'subcomponent_summary'
    content JSONB NOT NULL,
    prompt_used TEXT,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prompt templates table
CREATE TABLE prompt_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    template TEXT NOT NULL,
    category TEXT NOT NULL, -- 'research_activity', 'subcomponent'
    is_default BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User prompts table
CREATE TABLE user_prompts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    research_activity_id UUID REFERENCES research_activities(id) ON DELETE CASCADE,
    subcomponent_id UUID REFERENCES subcomponents(id) ON DELETE SET NULL,
    prompt TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Create indexes for better performance
CREATE INDEX idx_businesses_user_id ON businesses(user_id);
CREATE INDEX idx_years_business_id ON years(business_id);
CREATE INDEX idx_research_activities_business_year ON research_activities(business_id, year);
CREATE INDEX idx_steps_research_activity_id ON steps(research_activity_id);
CREATE INDEX idx_subcomponents_step_id ON subcomponents(step_id);
CREATE INDEX idx_roles_business_id ON roles(business_id);
CREATE INDEX idx_employees_business_year ON employees(business_id, year);
CREATE INDEX idx_employees_role_id ON employees(role_id);
CREATE INDEX idx_contractors_business_year ON contractors(business_id, year);
CREATE INDEX idx_contractors_role_id ON contractors(role_id);
CREATE INDEX idx_supplies_business_year ON supplies(business_id, year);
CREATE INDEX idx_qre_allocations_business_year ON qre_allocations(business_id, year);
CREATE INDEX idx_qre_allocations_entity ON qre_allocations(category, entity_id);
CREATE INDEX idx_qre_allocations_research_activity ON qre_allocations(research_activity_id);
CREATE INDEX idx_qre_allocations_step ON qre_allocations(step_id);
CREATE INDEX idx_qre_allocations_subcomponent ON qre_allocations(subcomponent_id);
CREATE INDEX idx_tab_approvals_business_year ON tab_approvals(business_id, year);
CREATE INDEX idx_approval_history_business_year ON approval_history(business_id, year);
CREATE INDEX idx_templates_business ON templates(business_id);
CREATE INDEX idx_ai_report_content_business_year ON ai_report_content(business_id, year);
CREATE INDEX idx_ai_report_content_research_activity ON ai_report_content(research_activity_id);
CREATE INDEX idx_prompt_templates_category ON prompt_templates(category);
CREATE INDEX idx_user_prompts_business_year ON user_prompts(business_id, year);
CREATE INDEX idx_user_prompts_research_activity ON user_prompts(research_activity_id);

-- Indexes for QRA tables
CREATE INDEX IF NOT EXISTS idx_qra_activities_business_year ON qra_activities(business_id, year);
CREATE INDEX IF NOT EXISTS idx_qra_activities_activity_id ON qra_activities(activity_id);
CREATE INDEX IF NOT EXISTS idx_qra_steps_business_year ON qra_steps(business_id, year);
CREATE INDEX IF NOT EXISTS idx_qra_steps_activity_id ON qra_steps(activity_id);
CREATE INDEX IF NOT EXISTS idx_qra_subcomponents_business_year ON qra_subcomponents(business_id, year);
CREATE INDEX IF NOT EXISTS idx_qra_subcomponents_activity_id ON qra_subcomponents(activity_id);
CREATE INDEX IF NOT EXISTS idx_qra_subcomponents_step_id ON qra_subcomponents(step_id);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Create or replace the update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables with updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON businesses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_years_updated_at BEFORE UPDATE ON years FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_research_activities_updated_at BEFORE UPDATE ON research_activities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_steps_updated_at BEFORE UPDATE ON steps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subcomponents_updated_at BEFORE UPDATE ON subcomponents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contractors_updated_at BEFORE UPDATE ON contractors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_supplies_updated_at BEFORE UPDATE ON supplies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_qre_allocations_updated_at BEFORE UPDATE ON qre_allocations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tab_approvals_updated_at BEFORE UPDATE ON tab_approvals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_report_content_updated_at BEFORE UPDATE ON ai_report_content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_prompt_templates_updated_at BEFORE UPDATE ON prompt_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Triggers for updated_at timestamps
CREATE TRIGGER update_qra_activities_updated_at BEFORE UPDATE ON qra_activities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_qra_steps_updated_at BEFORE UPDATE ON qra_steps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_qra_subcomponents_updated_at BEFORE UPDATE ON qra_subcomponents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS FOR DATA ACCESS
-- ============================================================================

-- Normalized QRE data view
CREATE OR REPLACE VIEW normalized_qre_data AS
SELECT 
    qa.id,
    qa.business_id,
    b.name as business_name,
    u.name as client_name,
    qa.year,
    ra.title as research_activity,
    s.title as step,
    sc.title as subcomponent,
    qa.category,
    qa.entity_id,
    qa.applied_percent,
    CASE 
        WHEN qa.category = 'employee' THEN COALESCE(e.first_name || ' ' || e.last_name, 'Unknown Employee')
        WHEN qa.category = 'contractor' THEN 
            CASE 
                WHEN c.contractor_type = 'individual' THEN COALESCE(c.first_name || ' ' || c.last_name, 'Unknown Contractor')
                ELSE COALESCE(c.business_name, 'Unknown Business')
            END
        WHEN qa.category = 'supply' THEN COALESCE(s2.name, 'Unknown Supply')
    END as entity_name,
    CASE 
        WHEN qa.category = 'employee' THEN COALESCE(e.wage, 0)
        WHEN qa.category = 'contractor' THEN COALESCE(c.total_amount, 0)
        WHEN qa.category = 'supply' THEN COALESCE(s2.total_value, 0)
    END as entity_value,
    qa.created_at,
    qa.updated_at
FROM qre_allocations qa
JOIN businesses b ON qa.business_id = b.id
JOIN users u ON b.user_id = u.id
JOIN research_activities ra ON qa.research_activity_id = ra.id
JOIN steps s ON qa.step_id = s.id
JOIN subcomponents sc ON qa.subcomponent_id = sc.id
LEFT JOIN employees e ON qa.category = 'employee' AND qa.entity_id = e.id
LEFT JOIN contractors c ON qa.category = 'contractor' AND qa.entity_id = c.id
LEFT JOIN supplies s2 ON qa.category = 'supply' AND qa.entity_id = s2.id;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE years ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcomponents ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplies ENABLE ROW LEVEL SECURITY;
ALTER TABLE qre_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tab_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_report_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_prompts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for QRA tables
ALTER TABLE qra_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE qra_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE qra_subcomponents ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Users can be accessed by themselves or by admins
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (
    auth.uid()::text = id::text OR 
    auth.uid()::text IN (SELECT id::text FROM users WHERE role = 'admin')
);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (
    auth.uid()::text = id::text OR 
    auth.uid()::text IN (SELECT id::text FROM users WHERE role = 'admin')
);
CREATE POLICY "Users can insert own data" ON users FOR INSERT WITH CHECK (
    auth.uid()::text = id::text OR 
    auth.uid()::text IN (SELECT id::text FROM users WHERE role = 'admin')
);
CREATE POLICY "Admins can delete users" ON users FOR DELETE USING (
    auth.uid()::text IN (SELECT id::text FROM users WHERE role = 'admin')
);

-- Businesses can be accessed by their owners
CREATE POLICY "Businesses can view own data" ON businesses FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = businesses.user_id AND users.id::text = auth.uid()::text)
);
CREATE POLICY "Businesses can update own data" ON businesses FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = businesses.user_id AND users.id::text = auth.uid()::text)
);
CREATE POLICY "Businesses can insert own data" ON businesses FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = businesses.user_id AND users.id::text = auth.uid()::text)
);

-- Years can be accessed by business owners
CREATE POLICY "Years can view own data" ON years FOR SELECT USING (
    EXISTS (SELECT 1 FROM businesses b JOIN users u ON b.user_id = u.id 
            WHERE b.id = years.business_id AND u.id::text = auth.uid()::text)
);
CREATE POLICY "Years can update own data" ON years FOR UPDATE USING (
    EXISTS (SELECT 1 FROM businesses b JOIN users u ON b.user_id = u.id 
            WHERE b.id = years.business_id AND u.id::text = auth.uid()::text)
);
CREATE POLICY "Years can insert own data" ON years FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM businesses b JOIN users u ON b.user_id = u.id 
            WHERE b.id = years.business_id AND u.id::text = auth.uid()::text)
);

-- Research activities can be accessed by business owners
CREATE POLICY "Research activities can view own data" ON research_activities FOR SELECT USING (
    EXISTS (SELECT 1 FROM businesses b JOIN users u ON b.user_id = u.id 
            WHERE b.id = research_activities.business_id AND u.id::text = auth.uid()::text)
);
CREATE POLICY "Research activities can update own data" ON research_activities FOR UPDATE USING (
    EXISTS (SELECT 1 FROM businesses b JOIN users u ON b.user_id = u.id 
            WHERE b.id = research_activities.business_id AND u.id::text = auth.uid()::text)
);
CREATE POLICY "Research activities can insert own data" ON research_activities FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM businesses b JOIN users u ON b.user_id = u.id 
            WHERE b.id = research_activities.business_id AND u.id::text = auth.uid()::text)
);

-- Steps can be accessed by business owners
CREATE POLICY "Steps can view own data" ON steps FOR SELECT USING (
    EXISTS (SELECT 1 FROM research_activities ra JOIN businesses b ON ra.business_id = b.id JOIN users u ON b.user_id = u.id 
            WHERE ra.id = steps.research_activity_id AND u.id::text = auth.uid()::text)
);
CREATE POLICY "Steps can update own data" ON steps FOR UPDATE USING (
    EXISTS (SELECT 1 FROM research_activities ra JOIN businesses b ON ra.business_id = b.id JOIN users u ON b.user_id = u.id 
            WHERE ra.id = steps.research_activity_id AND u.id::text = auth.uid()::text)
);
CREATE POLICY "Steps can insert own data" ON steps FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM research_activities ra JOIN businesses b ON ra.business_id = b.id JOIN users u ON b.user_id = u.id 
            WHERE ra.id = steps.research_activity_id AND u.id::text = auth.uid()::text)
);

-- Subcomponents can be accessed by business owners
CREATE POLICY "Subcomponents can view own data" ON subcomponents FOR SELECT USING (
    EXISTS (SELECT 1 FROM steps s JOIN research_activities ra ON s.research_activity_id = ra.id 
            JOIN businesses b ON ra.business_id = b.id JOIN users u ON b.user_id = u.id 
            WHERE s.id = subcomponents.step_id AND u.id::text = auth.uid()::text)
);
CREATE POLICY "Subcomponents can update own data" ON subcomponents FOR UPDATE USING (
    EXISTS (SELECT 1 FROM steps s JOIN research_activities ra ON s.research_activity_id = ra.id 
            JOIN businesses b ON ra.business_id = b.id JOIN users u ON b.user_id = u.id 
            WHERE s.id = subcomponents.step_id AND u.id::text = auth.uid()::text)
);
CREATE POLICY "Subcomponents can insert own data" ON subcomponents FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM steps s JOIN research_activities ra ON s.research_activity_id = ra.id 
            JOIN businesses b ON ra.business_id = b.id JOIN users u ON b.user_id = u.id 
            WHERE s.id = subcomponents.step_id AND u.id::text = auth.uid()::text)
);

-- Roles can be accessed by business owners
CREATE POLICY "Roles can view own data" ON roles FOR SELECT USING (
    EXISTS (SELECT 1 FROM businesses b JOIN users u ON b.user_id = u.id 
            WHERE b.id = roles.business_id AND u.id::text = auth.uid()::text)
);
CREATE POLICY "Roles can update own data" ON roles FOR UPDATE USING (
    EXISTS (SELECT 1 FROM businesses b JOIN users u ON b.user_id = u.id 
            WHERE b.id = roles.business_id AND u.id::text = auth.uid()::text)
);
CREATE POLICY "Roles can insert own data" ON roles FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM businesses b JOIN users u ON b.user_id = u.id 
            WHERE b.id = roles.business_id AND u.id::text = auth.uid()::text)
);

-- Employees can be accessed by business owners
CREATE POLICY "Employees can view own data" ON employees FOR SELECT USING (
    EXISTS (SELECT 1 FROM businesses b JOIN users u ON b.user_id = u.id 
            WHERE b.id = employees.business_id AND u.id::text = auth.uid()::text)
);
CREATE POLICY "Employees can update own data" ON employees FOR UPDATE USING (
    EXISTS (SELECT 1 FROM businesses b JOIN users u ON b.user_id = u.id 
            WHERE b.id = employees.business_id AND u.id::text = auth.uid()::text)
);
CREATE POLICY "Employees can insert own data" ON employees FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM businesses b JOIN users u ON b.user_id = u.id 
            WHERE b.id = employees.business_id AND u.id::text = auth.uid()::text)
);

-- Contractors can be accessed by business owners
CREATE POLICY "Contractors can view own data" ON contractors FOR SELECT USING (
    EXISTS (SELECT 1 FROM businesses b JOIN users u ON b.user_id = u.id 
            WHERE b.id = contractors.business_id AND u.id::text = auth.uid()::text)
);
CREATE POLICY "Contractors can update own data" ON contractors FOR UPDATE USING (
    EXISTS (SELECT 1 FROM businesses b JOIN users u ON b.user_id = u.id 
            WHERE b.id = contractors.business_id AND u.id::text = auth.uid()::text)
);
CREATE POLICY "Contractors can insert own data" ON contractors FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM businesses b JOIN users u ON b.user_id = u.id 
            WHERE b.id = contractors.business_id AND u.id::text = auth.uid()::text)
);

-- Supplies can be accessed by business owners
CREATE POLICY "Supplies can view own data" ON supplies FOR SELECT USING (
    EXISTS (SELECT 1 FROM businesses b JOIN users u ON b.user_id = u.id 
            WHERE b.id = supplies.business_id AND u.id::text = auth.uid()::text)
);
CREATE POLICY "Supplies can update own data" ON supplies FOR UPDATE USING (
    EXISTS (SELECT 1 FROM businesses b JOIN users u ON b.user_id = u.id 
            WHERE b.id = supplies.business_id AND u.id::text = auth.uid()::text)
);
CREATE POLICY "Supplies can insert own data" ON supplies FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM businesses b JOIN users u ON b.user_id = u.id 
            WHERE b.id = supplies.business_id AND u.id::text = auth.uid()::text)
);

-- QRE allocations can be accessed by business owners
CREATE POLICY "QRE allocations can view own data" ON qre_allocations FOR SELECT USING (
    EXISTS (SELECT 1 FROM businesses b JOIN users u ON b.user_id = u.id 
            WHERE b.id = qre_allocations.business_id AND u.id::text = auth.uid()::text)
);
CREATE POLICY "QRE allocations can update own data" ON qre_allocations FOR UPDATE USING (
    EXISTS (SELECT 1 FROM businesses b JOIN users u ON b.user_id = u.id 
            WHERE b.id = qre_allocations.business_id AND u.id::text = auth.uid()::text)
);
CREATE POLICY "QRE allocations can insert own data" ON qre_allocations FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM businesses b JOIN users u ON b.user_id = u.id 
            WHERE b.id = qre_allocations.business_id AND u.id::text = auth.uid()::text)
);

-- Tab approvals can be accessed by business owners
CREATE POLICY "Tab approvals can view own data" ON tab_approvals FOR SELECT USING (
    EXISTS (SELECT 1 FROM businesses b JOIN users u ON b.user_id = u.id 
            WHERE b.id = tab_approvals.business_id AND u.id::text = auth.uid()::text)
);
CREATE POLICY "Tab approvals can update own data" ON tab_approvals FOR UPDATE USING (
    EXISTS (SELECT 1 FROM businesses b JOIN users u ON b.user_id = u.id 
            WHERE b.id = tab_approvals.business_id AND u.id::text = auth.uid()::text)
);
CREATE POLICY "Tab approvals can insert own data" ON tab_approvals FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM businesses b JOIN users u ON b.user_id = u.id 
            WHERE b.id = tab_approvals.business_id AND u.id::text = auth.uid()::text)
);

-- Approval history can be accessed by business owners
CREATE POLICY "Approval history can view own data" ON approval_history FOR SELECT USING (
    EXISTS (SELECT 1 FROM businesses b JOIN users u ON b.user_id = u.id 
            WHERE b.id = approval_history.business_id AND u.id::text = auth.uid()::text)
);
CREATE POLICY "Approval history can insert own data" ON approval_history FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM businesses b JOIN users u ON b.user_id = u.id 
            WHERE b.id = approval_history.business_id AND u.id::text = auth.uid()::text)
);

-- Templates can be accessed by business owners
CREATE POLICY "Templates can view own data" ON templates FOR SELECT USING (
    EXISTS (SELECT 1 FROM businesses b JOIN users u ON b.user_id = u.id 
            WHERE b.id = templates.business_id AND u.id::text = auth.uid()::text)
);
CREATE POLICY "Templates can update own data" ON templates FOR UPDATE USING (
    EXISTS (SELECT 1 FROM businesses b JOIN users u ON b.user_id = u.id 
            WHERE b.id = templates.business_id AND u.id::text = auth.uid()::text)
);
CREATE POLICY "Templates can insert own data" ON templates FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM businesses b JOIN users u ON b.user_id = u.id 
            WHERE b.id = templates.business_id AND u.id::text = auth.uid()::text)
);

-- AI report content can be accessed by business owners
CREATE POLICY "AI report content can view own data" ON ai_report_content FOR SELECT USING (
    EXISTS (SELECT 1 FROM businesses b JOIN users u ON b.user_id = u.id 
            WHERE b.id = ai_report_content.business_id AND u.id::text = auth.uid()::text)
);
CREATE POLICY "AI report content can update own data" ON ai_report_content FOR UPDATE USING (
    EXISTS (SELECT 1 FROM businesses b JOIN users u ON b.user_id = u.id 
            WHERE b.id = ai_report_content.business_id AND u.id::text = auth.uid()::text)
);
CREATE POLICY "AI report content can insert own data" ON ai_report_content FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM businesses b JOIN users u ON b.user_id = u.id 
            WHERE b.id = ai_report_content.business_id AND u.id::text = auth.uid()::text)
);

-- Prompt templates can be viewed by all authenticated users (they're shared)
CREATE POLICY "Prompt templates can view all" ON prompt_templates FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Prompt templates can update own" ON prompt_templates FOR UPDATE USING (
    created_by::text = auth.uid()::text OR auth.uid()::text IN (
        SELECT id::text FROM users WHERE role = 'admin'
    )
);
CREATE POLICY "Prompt templates can insert own" ON prompt_templates FOR INSERT WITH CHECK (
    created_by::text = auth.uid()::text OR auth.uid()::text IN (
        SELECT id::text FROM users WHERE role = 'admin'
    )
);

-- User prompts can be accessed by business owners
CREATE POLICY "User prompts can view own data" ON user_prompts FOR SELECT USING (
    EXISTS (SELECT 1 FROM businesses b JOIN users u ON b.user_id = u.id 
            WHERE b.id = user_prompts.business_id AND u.id::text = auth.uid()::text)
);
CREATE POLICY "User prompts can insert own data" ON user_prompts FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM businesses b JOIN users u ON b.user_id = u.id 
            WHERE b.id = user_prompts.business_id AND u.id::text = auth.uid()::text)
);

-- QRA Activities policies
CREATE POLICY "Users can view QRA activities for their businesses" ON qra_activities
    FOR SELECT USING (
        business_id IN (
            SELECT id FROM businesses 
            WHERE owner_id = auth.uid() OR id IN (
                SELECT business_id FROM business_users WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert QRA activities for their businesses" ON qra_activities
    FOR INSERT WITH CHECK (
        business_id IN (
            SELECT id FROM businesses 
            WHERE owner_id = auth.uid() OR id IN (
                SELECT business_id FROM business_users WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update QRA activities for their businesses" ON qra_activities
    FOR UPDATE USING (
        business_id IN (
            SELECT id FROM businesses 
            WHERE owner_id = auth.uid() OR id IN (
                SELECT business_id FROM business_users WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can delete QRA activities for their businesses" ON qra_activities
    FOR DELETE USING (
        business_id IN (
            SELECT id FROM businesses 
            WHERE owner_id = auth.uid() OR id IN (
                SELECT business_id FROM business_users WHERE user_id = auth.uid()
            )
        )
    );

-- QRA Steps policies
CREATE POLICY "Users can view QRA steps for their businesses" ON qra_steps
    FOR SELECT USING (
        business_id IN (
            SELECT id FROM businesses 
            WHERE owner_id = auth.uid() OR id IN (
                SELECT business_id FROM business_users WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert QRA steps for their businesses" ON qra_steps
    FOR INSERT WITH CHECK (
        business_id IN (
            SELECT id FROM businesses 
            WHERE owner_id = auth.uid() OR id IN (
                SELECT business_id FROM business_users WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update QRA steps for their businesses" ON qra_steps
    FOR UPDATE USING (
        business_id IN (
            SELECT id FROM businesses 
            WHERE owner_id = auth.uid() OR id IN (
                SELECT business_id FROM business_users WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can delete QRA steps for their businesses" ON qra_steps
    FOR DELETE USING (
        business_id IN (
            SELECT id FROM businesses 
            WHERE owner_id = auth.uid() OR id IN (
                SELECT business_id FROM business_users WHERE user_id = auth.uid()
            )
        )
    );

-- QRA Subcomponents policies
CREATE POLICY "Users can view QRA subcomponents for their businesses" ON qra_subcomponents
    FOR SELECT USING (
        business_id IN (
            SELECT id FROM businesses 
            WHERE owner_id = auth.uid() OR id IN (
                SELECT business_id FROM business_users WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert QRA subcomponents for their businesses" ON qra_subcomponents
    FOR INSERT WITH CHECK (
        business_id IN (
            SELECT id FROM businesses 
            WHERE owner_id = auth.uid() OR id IN (
                SELECT business_id FROM business_users WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update QRA subcomponents for their businesses" ON qra_subcomponents
    FOR UPDATE USING (
        business_id IN (
            SELECT id FROM businesses 
            WHERE owner_id = auth.uid() OR id IN (
                SELECT business_id FROM business_users WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can delete QRA subcomponents for their businesses" ON qra_subcomponents
    FOR DELETE USING (
        business_id IN (
            SELECT id FROM businesses 
            WHERE owner_id = auth.uid() OR id IN (
                SELECT business_id FROM business_users WHERE user_id = auth.uid()
            )
        )
    );

-- ============================================================================
-- PERMISSIONS
-- ============================================================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Set up future permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated;

-- ============================================================================
-- DEFAULT DATA
-- ============================================================================

-- Insert default admin user
INSERT INTO users (email, name, role, is_active) 
VALUES ('admin@example.com', 'System Administrator', 'admin', true)
ON CONFLICT (email) DO NOTHING;

-- Insert default prompt templates
INSERT INTO prompt_templates (name, description, template, category, is_default) VALUES
(
    'Research Activity Default',
    'Default template for generating research activity summaries',
    'Please provide a comprehensive summary of the research activity "{activity_name}" for the year {year}. Include the technical objectives, methodology, challenges encountered, and outcomes achieved. Focus on the innovative aspects and how this activity contributes to the overall research and development goals.',
    'research_activity',
    true
),
(
    'Subcomponent Default',
    'Default template for generating subcomponent summaries',
    'Please provide a detailed description of the subcomponent "{subcomponent_name}" within the research activity "{activity_name}". Explain the specific technical work performed, its role in the overall research process, and any significant findings or developments.',
    'subcomponent',
    true
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$ 
BEGIN
    RAISE NOTICE 'Complete Supabase schema created successfully!';
    RAISE NOTICE 'All tables, indexes, views, and functions are ready for use.';
    RAISE NOTICE 'Default admin user and prompt templates have been created.';
    RAISE NOTICE 'Row Level Security (RLS) policies have been configured.';
    RAISE NOTICE 'Comprehensive indexing has been applied for optimal performance.';
END $$; 