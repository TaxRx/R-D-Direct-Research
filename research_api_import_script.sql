-- =====================================================
-- RESEARCH API DATA IMPORT SCRIPT
-- =====================================================
-- This script provides functions to import CSV data into the normalized schema

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

-- Example import function for a single row
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

-- Grant execute permissions
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

-- Example usage:
-- SELECT import_research_api_row(
--     'Category Name',
--     'Area Name', 
--     'Focus Name',
--     'Research Activity Name',
--     'Subcomponent Name',
--     'Phase Name',
--     'Step Name',
--     'Hint text',
--     'General description',
--     'Goal text',
--     'Hypothesis text',
--     'Alternatives text',
--     'Uncertainties text',
--     'Developmental process text',
--     'Primary goal text',
--     'Expected outcome type',
--     'CPT1,CPT2,CPT3',
--     'CDT1,CDT2',
--     'Alternative paths text',
--     false
-- ); 