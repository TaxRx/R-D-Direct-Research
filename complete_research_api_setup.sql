-- =====================================================
-- COMPLETE RESEARCH API SETUP SCRIPT
-- =====================================================
-- Run this entire script in your Supabase SQL Editor
-- This will create everything needed for the Research API migration

-- Step 1: Create the normalized schema
-- =====================================================

-- Drop existing tables if they exist
DROP TABLE IF EXISTS research_api_subcomponents CASCADE;
DROP TABLE IF EXISTS research_api_steps CASCADE;
DROP TABLE IF EXISTS research_api_phases CASCADE;
DROP TABLE IF EXISTS research_api_activities CASCADE;
DROP TABLE IF EXISTS research_api_focuses CASCADE;
DROP TABLE IF EXISTS research_api_areas CASCADE;
DROP TABLE IF EXISTS research_api_categories CASCADE;
DROP TABLE IF EXISTS research_api_access_controls CASCADE;

-- Create categories table (top level)
CREATE TABLE research_api_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create areas table (second level)
CREATE TABLE research_api_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES research_api_categories(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(category_id, name)
);

-- Create focuses table (third level)
CREATE TABLE research_api_focuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    area_id UUID NOT NULL REFERENCES research_api_areas(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(area_id, name)
);

-- Create research activities table (fourth level)
CREATE TABLE research_api_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    focus_id UUID NOT NULL REFERENCES research_api_focuses(id) ON DELETE CASCADE,
    name VARCHAR(500) NOT NULL,
    general_description TEXT,
    goal TEXT,
    hypothesis TEXT,
    alternatives TEXT,
    uncertainties TEXT,
    developmental_process TEXT,
    primary_goal TEXT,
    expected_outcome_type VARCHAR(255),
    cpt_codes TEXT[], -- Array of CPT codes
    cdt_codes TEXT[], -- Array of CDT codes
    alternative_paths TEXT,
    is_limited_access BOOLEAN DEFAULT FALSE, -- For IP-restricted access
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(focus_id, name)
);

-- Create phases table (fifth level)
CREATE TABLE research_api_phases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL REFERENCES research_api_activities(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(activity_id, name)
);

-- Create steps table (sixth level)
CREATE TABLE research_api_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phase_id UUID NOT NULL REFERENCES research_api_phases(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(phase_id, name)
);

-- Create subcomponents table (seventh level)
CREATE TABLE research_api_subcomponents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    step_id UUID NOT NULL REFERENCES research_api_steps(id) ON DELETE CASCADE,
    name VARCHAR(500) NOT NULL,
    hint TEXT,
    description TEXT,
    is_limited_access BOOLEAN DEFAULT FALSE, -- For IP-restricted access
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(step_id, name)
);

-- Create access controls table for limited access items
CREATE TABLE research_api_access_controls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL, -- 'activity' or 'subcomponent'
    entity_id UUID NOT NULL, -- References research_api_activities.id or research_api_subcomponents.id
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    ip_address INET, -- For IP-based restrictions
    access_granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(entity_type, entity_id, user_id, ip_address)
);

-- Create indexes for performance
CREATE INDEX idx_research_api_areas_category ON research_api_areas(category_id);
CREATE INDEX idx_research_api_focuses_area ON research_api_focuses(area_id);
CREATE INDEX idx_research_api_activities_focus ON research_api_activities(focus_id);
CREATE INDEX idx_research_api_activities_limited_access ON research_api_activities(is_limited_access);
CREATE INDEX idx_research_api_phases_activity ON research_api_phases(activity_id);
CREATE INDEX idx_research_api_phases_order ON research_api_phases(activity_id, order_index);
CREATE INDEX idx_research_api_steps_phase ON research_api_steps(phase_id);
CREATE INDEX idx_research_api_steps_order ON research_api_steps(phase_id, order_index);
CREATE INDEX idx_research_api_subcomponents_step ON research_api_subcomponents(step_id);
CREATE INDEX idx_research_api_subcomponents_limited_access ON research_api_subcomponents(is_limited_access);
CREATE INDEX idx_research_api_access_controls_entity ON research_api_access_controls(entity_type, entity_id);
CREATE INDEX idx_research_api_access_controls_user ON research_api_access_controls(user_id);
CREATE INDEX idx_research_api_access_controls_ip ON research_api_access_controls(ip_address);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_research_api_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_research_api_categories_updated_at
    BEFORE UPDATE ON research_api_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_research_api_updated_at();

CREATE TRIGGER trigger_research_api_areas_updated_at
    BEFORE UPDATE ON research_api_areas
    FOR EACH ROW
    EXECUTE FUNCTION update_research_api_updated_at();

CREATE TRIGGER trigger_research_api_focuses_updated_at
    BEFORE UPDATE ON research_api_focuses
    FOR EACH ROW
    EXECUTE FUNCTION update_research_api_updated_at();

CREATE TRIGGER trigger_research_api_activities_updated_at
    BEFORE UPDATE ON research_api_activities
    FOR EACH ROW
    EXECUTE FUNCTION update_research_api_updated_at();

CREATE TRIGGER trigger_research_api_phases_updated_at
    BEFORE UPDATE ON research_api_phases
    FOR EACH ROW
    EXECUTE FUNCTION update_research_api_updated_at();

CREATE TRIGGER trigger_research_api_steps_updated_at
    BEFORE UPDATE ON research_api_steps
    FOR EACH ROW
    EXECUTE FUNCTION update_research_api_updated_at();

CREATE TRIGGER trigger_research_api_subcomponents_updated_at
    BEFORE UPDATE ON research_api_subcomponents
    FOR EACH ROW
    EXECUTE FUNCTION update_research_api_updated_at();

CREATE TRIGGER trigger_research_api_access_controls_updated_at
    BEFORE UPDATE ON research_api_access_controls
    FOR EACH ROW
    EXECUTE FUNCTION update_research_api_updated_at();

-- Step 2: Create import functions
-- =====================================================

-- Function to safely insert or get a category
CREATE OR REPLACE FUNCTION insert_or_get_category(p_name VARCHAR(255))
RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    -- Try to find existing category
    SELECT id INTO v_id 
    FROM research_api_categories 
    WHERE name = p_name AND is_active = true;
    
    -- If not found, create new one
    IF v_id IS NULL THEN
        INSERT INTO research_api_categories (name) 
        VALUES (p_name) 
        RETURNING id INTO v_id;
    END IF;
    
    RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Function to safely insert or get an area
CREATE OR REPLACE FUNCTION insert_or_get_area(p_category_name VARCHAR(255), p_area_name VARCHAR(255))
RETURNS UUID AS $$
DECLARE
    v_category_id UUID;
    v_area_id UUID;
BEGIN
    -- Get or create category
    v_category_id := insert_or_get_category(p_category_name);
    
    -- Try to find existing area
    SELECT id INTO v_area_id 
    FROM research_api_areas 
    WHERE category_id = v_category_id AND name = p_area_name AND is_active = true;
    
    -- If not found, create new one
    IF v_area_id IS NULL THEN
        INSERT INTO research_api_areas (category_id, name) 
        VALUES (v_category_id, p_area_name) 
        RETURNING id INTO v_area_id;
    END IF;
    
    RETURN v_area_id;
END;
$$ LANGUAGE plpgsql;

-- Function to safely insert or get a focus
CREATE OR REPLACE FUNCTION insert_or_get_focus(p_category_name VARCHAR(255), p_area_name VARCHAR(255), p_focus_name VARCHAR(255))
RETURNS UUID AS $$
DECLARE
    v_area_id UUID;
    v_focus_id UUID;
BEGIN
    -- Get or create area
    v_area_id := insert_or_get_area(p_category_name, p_area_name);
    
    -- Try to find existing focus
    SELECT id INTO v_focus_id 
    FROM research_api_focuses 
    WHERE area_id = v_area_id AND name = p_focus_name AND is_active = true;
    
    -- If not found, create new one
    IF v_focus_id IS NULL THEN
        INSERT INTO research_api_focuses (area_id, name) 
        VALUES (v_area_id, p_focus_name) 
        RETURNING id INTO v_focus_id;
    END IF;
    
    RETURN v_focus_id;
END;
$$ LANGUAGE plpgsql;

-- Function to safely insert or get a research activity
CREATE OR REPLACE FUNCTION insert_or_get_activity(
    p_category_name VARCHAR(255),
    p_area_name VARCHAR(255),
    p_focus_name VARCHAR(255),
    p_activity_name VARCHAR(500),
    p_general_description TEXT DEFAULT NULL,
    p_goal TEXT DEFAULT NULL,
    p_hypothesis TEXT DEFAULT NULL,
    p_alternatives TEXT DEFAULT NULL,
    p_uncertainties TEXT DEFAULT NULL,
    p_developmental_process TEXT DEFAULT NULL,
    p_primary_goal TEXT DEFAULT NULL,
    p_expected_outcome_type VARCHAR(255) DEFAULT NULL,
    p_cpt_codes TEXT[] DEFAULT NULL,
    p_cdt_codes TEXT[] DEFAULT NULL,
    p_alternative_paths TEXT DEFAULT NULL,
    p_is_limited_access BOOLEAN DEFAULT FALSE
)
RETURNS UUID AS $$
DECLARE
    v_focus_id UUID;
    v_activity_id UUID;
BEGIN
    -- Get or create focus
    v_focus_id := insert_or_get_focus(p_category_name, p_area_name, p_focus_name);
    
    -- Try to find existing activity
    SELECT id INTO v_activity_id 
    FROM research_api_activities 
    WHERE focus_id = v_focus_id AND name = p_activity_name AND is_active = true;
    
    -- If not found, create new one
    IF v_activity_id IS NULL THEN
        INSERT INTO research_api_activities (
            focus_id, name, general_description, goal, hypothesis, 
            alternatives, uncertainties, developmental_process, primary_goal,
            expected_outcome_type, cpt_codes, cdt_codes, alternative_paths, is_limited_access
        ) VALUES (
            v_focus_id, p_activity_name, p_general_description, p_goal, p_hypothesis,
            p_alternatives, p_uncertainties, p_developmental_process, p_primary_goal,
            p_expected_outcome_type, p_cpt_codes, p_cdt_codes, p_alternative_paths, p_is_limited_access
        ) RETURNING id INTO v_activity_id;
    ELSE
        -- Update existing activity with new data
        UPDATE research_api_activities SET
            general_description = COALESCE(p_general_description, general_description),
            goal = COALESCE(p_goal, goal),
            hypothesis = COALESCE(p_hypothesis, hypothesis),
            alternatives = COALESCE(p_alternatives, alternatives),
            uncertainties = COALESCE(p_uncertainties, uncertainties),
            developmental_process = COALESCE(p_developmental_process, developmental_process),
            primary_goal = COALESCE(p_primary_goal, primary_goal),
            expected_outcome_type = COALESCE(p_expected_outcome_type, expected_outcome_type),
            cpt_codes = COALESCE(p_cpt_codes, cpt_codes),
            cdt_codes = COALESCE(p_cdt_codes, cdt_codes),
            alternative_paths = COALESCE(p_alternative_paths, alternative_paths),
            is_limited_access = p_is_limited_access,
            updated_at = NOW()
        WHERE id = v_activity_id;
    END IF;
    
    RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql;

-- Function to safely insert or get a phase
CREATE OR REPLACE FUNCTION insert_or_get_phase(
    p_activity_id UUID,
    p_phase_name VARCHAR(255),
    p_description TEXT DEFAULT NULL,
    p_order_index INTEGER DEFAULT 0
)
RETURNS UUID AS $$
DECLARE
    v_phase_id UUID;
BEGIN
    -- Try to find existing phase
    SELECT id INTO v_phase_id 
    FROM research_api_phases 
    WHERE activity_id = p_activity_id AND name = p_phase_name AND is_active = true;
    
    -- If not found, create new one
    IF v_phase_id IS NULL THEN
        INSERT INTO research_api_phases (activity_id, name, description, order_index) 
        VALUES (p_activity_id, p_phase_name, p_description, p_order_index) 
        RETURNING id INTO v_phase_id;
    ELSE
        -- Update existing phase
        UPDATE research_api_phases SET
            description = COALESCE(p_description, description),
            order_index = p_order_index,
            updated_at = NOW()
        WHERE id = v_phase_id;
    END IF;
    
    RETURN v_phase_id;
END;
$$ LANGUAGE plpgsql;

-- Function to safely insert or get a step
CREATE OR REPLACE FUNCTION insert_or_get_step(
    p_phase_id UUID,
    p_step_name VARCHAR(255),
    p_description TEXT DEFAULT NULL,
    p_order_index INTEGER DEFAULT 0
)
RETURNS UUID AS $$
DECLARE
    v_step_id UUID;
BEGIN
    -- Try to find existing step
    SELECT id INTO v_step_id 
    FROM research_api_steps 
    WHERE phase_id = p_phase_id AND name = p_step_name AND is_active = true;
    
    -- If not found, create new one
    IF v_step_id IS NULL THEN
        INSERT INTO research_api_steps (phase_id, name, description, order_index) 
        VALUES (p_phase_id, p_step_name, p_description, p_order_index) 
        RETURNING id INTO v_step_id;
    ELSE
        -- Update existing step
        UPDATE research_api_steps SET
            description = COALESCE(p_description, description),
            order_index = p_order_index,
            updated_at = NOW()
        WHERE id = v_step_id;
    END IF;
    
    RETURN v_step_id;
END;
$$ LANGUAGE plpgsql;

-- Function to safely insert or get a subcomponent
CREATE OR REPLACE FUNCTION insert_or_get_subcomponent(
    p_step_id UUID,
    p_subcomponent_name VARCHAR(500),
    p_hint TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_is_limited_access BOOLEAN DEFAULT FALSE
)
RETURNS UUID AS $$
DECLARE
    v_subcomponent_id UUID;
BEGIN
    -- Try to find existing subcomponent
    SELECT id INTO v_subcomponent_id 
    FROM research_api_subcomponents 
    WHERE step_id = p_step_id AND name = p_subcomponent_name AND is_active = true;
    
    -- If not found, create new one
    IF v_subcomponent_id IS NULL THEN
        INSERT INTO research_api_subcomponents (step_id, name, hint, description, is_limited_access) 
        VALUES (p_step_id, p_subcomponent_name, p_hint, p_description, p_is_limited_access) 
        RETURNING id INTO v_subcomponent_id;
    ELSE
        -- Update existing subcomponent
        UPDATE research_api_subcomponents SET
            hint = COALESCE(p_hint, hint),
            description = COALESCE(p_description, description),
            is_limited_access = p_is_limited_access,
            updated_at = NOW()
        WHERE id = v_subcomponent_id;
    END IF;
    
    RETURN v_subcomponent_id;
END;
$$ LANGUAGE plpgsql;

-- Function to parse CPT codes from string to array
CREATE OR REPLACE FUNCTION parse_cpt_codes(p_cpt_codes TEXT)
RETURNS TEXT[] AS $$
BEGIN
    IF p_cpt_codes IS NULL OR p_cpt_codes = '' THEN
        RETURN NULL;
    END IF;
    
    -- Split by common delimiters and clean up
    RETURN string_to_array(
        regexp_replace(p_cpt_codes, '[,\s;]+', ',', 'g'),
        ','
    );
END;
$$ LANGUAGE plpgsql;

-- Function to parse CDT codes from string to array
CREATE OR REPLACE FUNCTION parse_cdt_codes(p_cdt_codes TEXT)
RETURNS TEXT[] AS $$
BEGIN
    IF p_cdt_codes IS NULL OR p_cdt_codes = '' THEN
        RETURN NULL;
    END IF;
    
    -- Split by common delimiters and clean up
    RETURN string_to_array(
        regexp_replace(p_cdt_codes, '[,\s;]+', ',', 'g'),
        ','
    );
END;
$$ LANGUAGE plpgsql;

-- Main import function for a single row
CREATE OR REPLACE FUNCTION import_research_api_row(
    p_category VARCHAR(255),
    p_area VARCHAR(255),
    p_focus VARCHAR(255),
    p_research_activity VARCHAR(500),
    p_subcomponent VARCHAR(500),
    p_phase VARCHAR(255),
    p_step VARCHAR(255),
    p_hint TEXT,
    p_general_description TEXT,
    p_goal TEXT,
    p_hypothesis TEXT,
    p_alternatives TEXT,
    p_uncertainties TEXT,
    p_developmental_process TEXT,
    p_primary_goal TEXT,
    p_expected_outcome_type VARCHAR(255),
    p_cpt_codes TEXT,
    p_cdt_codes TEXT,
    p_alternative_paths TEXT,
    p_is_limited_access BOOLEAN DEFAULT FALSE
)
RETURNS UUID AS $$
DECLARE
    v_activity_id UUID;
    v_phase_id UUID;
    v_step_id UUID;
    v_subcomponent_id UUID;
    v_parsed_cpt_codes TEXT[];
    v_parsed_cdt_codes TEXT[];
BEGIN
    -- Parse CPT and CDT codes
    v_parsed_cpt_codes := parse_cpt_codes(p_cpt_codes);
    v_parsed_cdt_codes := parse_cdt_codes(p_cdt_codes);
    
    -- Insert or get activity
    v_activity_id := insert_or_get_activity(
        p_category, p_area, p_focus, p_research_activity,
        p_general_description, p_goal, p_hypothesis, p_alternatives,
        p_uncertainties, p_developmental_process, p_primary_goal,
        p_expected_outcome_type, v_parsed_cpt_codes, v_parsed_cdt_codes,
        p_alternative_paths, p_is_limited_access
    );
    
    -- Insert or get phase (if provided)
    IF p_phase IS NOT NULL AND p_phase != '' THEN
        v_phase_id := insert_or_get_phase(v_activity_id, p_phase);
        
        -- Insert or get step (if provided)
        IF p_step IS NOT NULL AND p_step != '' THEN
            v_step_id := insert_or_get_step(v_phase_id, p_step);
            
            -- Insert or get subcomponent (if provided)
            IF p_subcomponent IS NOT NULL AND p_subcomponent != '' THEN
                v_subcomponent_id := insert_or_get_subcomponent(
                    v_step_id, p_subcomponent, p_hint, NULL, p_is_limited_access
                );
            END IF;
        END IF;
    END IF;
    
    RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create temporary import table
-- =====================================================

-- Drop temporary table if it exists
DROP TABLE IF EXISTS temp_research_api_import;

-- Create temporary import table
CREATE TABLE temp_research_api_import (
    Category TEXT,
    Area TEXT,
    Focus TEXT,
    "Research Activity" TEXT,
    Subcomponent TEXT,
    Phase TEXT,
    Step TEXT,
    Hint TEXT,
    "General Description" TEXT,
    Goal TEXT,
    Hypothesis TEXT,
    Alternatives TEXT,
    Uncertainties TEXT,
    "Developmental Process" TEXT,
    "Primary Goal" TEXT,
    "Expected Outcome Type" TEXT,
    "CPT Codes" TEXT,
    "CDT Codes" TEXT,
    "Alternative Paths" TEXT
);

-- Step 4: Create hierarchy view
-- =====================================================

-- Create view for easier querying of the full hierarchy
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

-- Step 5: Set up RLS and permissions
-- =====================================================

-- Enable RLS (Row Level Security)
ALTER TABLE research_api_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_api_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_api_focuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_api_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_api_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_api_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_api_subcomponents ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_api_access_controls ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow read access to all users for non-limited items
CREATE POLICY "Users can view non-limited categories" ON research_api_categories
    FOR SELECT USING (true);

CREATE POLICY "Users can view non-limited areas" ON research_api_areas
    FOR SELECT USING (true);

CREATE POLICY "Users can view non-limited focuses" ON research_api_focuses
    FOR SELECT USING (true);

CREATE POLICY "Users can view non-limited activities" ON research_api_activities
    FOR SELECT USING (NOT is_limited_access);

CREATE POLICY "Users can view non-limited phases" ON research_api_phases
    FOR SELECT USING (true);

CREATE POLICY "Users can view non-limited steps" ON research_api_steps
    FOR SELECT USING (true);

CREATE POLICY "Users can view non-limited subcomponents" ON research_api_subcomponents
    FOR SELECT USING (NOT is_limited_access);

-- RLS Policies - Allow read access to limited items only for authorized users
CREATE POLICY "Users can view limited activities if authorized" ON research_api_activities
    FOR SELECT USING (
        NOT is_limited_access OR 
        EXISTS (
            SELECT 1 FROM research_api_access_controls 
            WHERE entity_type = 'activity' 
            AND entity_id = id 
            AND (user_id = auth.uid() OR ip_address = inet_client_addr())
            AND (expires_at IS NULL OR expires_at > NOW())
        )
    );

CREATE POLICY "Users can view limited subcomponents if authorized" ON research_api_subcomponents
    FOR SELECT USING (
        NOT is_limited_access OR 
        EXISTS (
            SELECT 1 FROM research_api_access_controls 
            WHERE entity_type = 'subcomponent' 
            AND entity_id = id 
            AND (user_id = auth.uid() OR ip_address = inet_client_addr())
            AND (expires_at IS NULL OR expires_at > NOW())
        )
    );

-- Admin policies for full access
CREATE POLICY "Admins have full access to categories" ON research_api_categories
    FOR ALL USING (auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin'));

CREATE POLICY "Admins have full access to areas" ON research_api_areas
    FOR ALL USING (auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin'));

CREATE POLICY "Admins have full access to focuses" ON research_api_focuses
    FOR ALL USING (auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin'));

CREATE POLICY "Admins have full access to activities" ON research_api_activities
    FOR ALL USING (auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin'));

CREATE POLICY "Admins have full access to phases" ON research_api_phases
    FOR ALL USING (auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin'));

CREATE POLICY "Admins have full access to steps" ON research_api_steps
    FOR ALL USING (auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin'));

CREATE POLICY "Admins have full access to subcomponents" ON research_api_subcomponents
    FOR ALL USING (auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin'));

CREATE POLICY "Admins have full access to access controls" ON research_api_access_controls
    FOR ALL USING (auth.uid() IN (SELECT id FROM auth.users WHERE role = 'admin'));

-- Grant permissions
GRANT ALL ON research_api_categories TO authenticated;
GRANT ALL ON research_api_areas TO authenticated;
GRANT ALL ON research_api_focuses TO authenticated;
GRANT ALL ON research_api_activities TO authenticated;
GRANT ALL ON research_api_phases TO authenticated;
GRANT ALL ON research_api_steps TO authenticated;
GRANT ALL ON research_api_subcomponents TO authenticated;
GRANT ALL ON research_api_access_controls TO authenticated;
GRANT ALL ON temp_research_api_import TO authenticated;
GRANT SELECT ON research_api_hierarchy TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION insert_or_get_category TO authenticated;
GRANT EXECUTE ON FUNCTION insert_or_get_area TO authenticated;
GRANT EXECUTE ON FUNCTION insert_or_get_focus TO authenticated;
GRANT EXECUTE ON FUNCTION insert_or_get_activity TO authenticated;
GRANT EXECUTE ON FUNCTION insert_or_get_phase TO authenticated;
GRANT EXECUTE ON FUNCTION insert_or_get_step TO authenticated;
GRANT EXECUTE ON FUNCTION insert_or_get_subcomponent TO authenticated;
GRANT EXECUTE ON FUNCTION parse_cpt_codes TO authenticated;
GRANT EXECUTE ON FUNCTION parse_cdt_codes TO authenticated;
GRANT EXECUTE ON FUNCTION import_research_api_row TO authenticated;

-- Create function to check if user has access to limited content
CREATE OR REPLACE FUNCTION has_research_api_access(
    p_entity_type VARCHAR(50),
    p_entity_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM research_api_access_controls 
        WHERE entity_type = p_entity_type 
        AND entity_id = p_entity_id 
        AND (user_id = auth.uid() OR ip_address = inet_client_addr())
        AND (expires_at IS NULL OR expires_at > NOW())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION has_research_api_access TO authenticated;

-- Step 6: Success message
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Research API schema setup completed successfully!';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Go to Table Editor and select temp_research_api_import';
    RAISE NOTICE '2. Click "Import data" and upload your CSV file';
    RAISE NOTICE '3. Run the import script from supabase_csv_import_guide.md';
END $$; 