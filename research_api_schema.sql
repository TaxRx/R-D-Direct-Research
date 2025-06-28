-- =====================================================
-- RESEARCH API NORMALIZED SCHEMA
-- =====================================================
-- This schema stores research activity data from the Research API
-- with support for hierarchical relationships and access control

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

-- Grant permissions on view
GRANT SELECT ON research_api_hierarchy TO authenticated;

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