-- =====================================================
-- QRABUILDER COMPLETE DATABASE SCHEMA
-- =====================================================
-- This schema migrates QRABuilder from localStorage to fully normalized Supabase tables

-- Drop existing tables if they exist (in correct order due to dependencies)
DROP TABLE IF EXISTS research_activity_assignments CASCADE;
DROP TABLE IF EXISTS research_activity_selections CASCADE;
DROP TABLE IF EXISTS supply_configurations CASCADE;
DROP TABLE IF EXISTS contractor_configurations CASCADE;
DROP TABLE IF EXISTS employee_configurations CASCADE;
DROP TABLE IF EXISTS qra_subcomponents CASCADE;
DROP TABLE IF EXISTS qra_steps CASCADE;
DROP TABLE IF EXISTS qra_activities CASCADE;
DROP TABLE IF EXISTS qra_modal_data CASCADE;

-- =====================================================
-- QRA DATA TABLES (Qualified Research Activities)
-- =====================================================

-- QRA Activities table (main QRA configuration)
CREATE TABLE qra_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    activity_id TEXT NOT NULL, -- References activity from business data
    activity_name TEXT NOT NULL,
    practice_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
    non_rd_time DECIMAL(5,2) NOT NULL DEFAULT 0,
    total_applied_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
    selected_roles TEXT[] DEFAULT '{}',
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id, year, activity_id)
);

-- QRA Steps table (steps within QRA activities)
CREATE TABLE qra_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    qra_activity_id UUID REFERENCES qra_activities(id) ON DELETE CASCADE,
    step_name TEXT NOT NULL,
    phase_name TEXT,
    time_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(qra_activity_id, step_name)
);

-- QRA Subcomponents table (subcomponents within QRA steps)
CREATE TABLE qra_subcomponents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    qra_activity_id UUID REFERENCES qra_activities(id) ON DELETE CASCADE,
    step_name TEXT NOT NULL,
    subcomponent_id TEXT NOT NULL,
    subcomponent_title TEXT NOT NULL,
    time_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
    frequency_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
    year_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
    selected_roles TEXT[] DEFAULT '{}',
    is_non_rd BOOLEAN NOT NULL DEFAULT FALSE,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(qra_activity_id, step_name, subcomponent_id)
);

-- QRA Modal Data table (modal state and calculations)
CREATE TABLE qra_modal_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    activity_name TEXT NOT NULL,
    practice_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
    selected_subcomponents JSONB NOT NULL DEFAULT '{}',
    total_applied_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
    step_frequencies JSONB NOT NULL DEFAULT '{}',
    step_time_map JSONB NOT NULL DEFAULT '{}',
    step_time_locked JSONB NOT NULL DEFAULT '{}',
    selected_roles TEXT[] DEFAULT '{}',
    calculation_formula TEXT,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_subcomponents INTEGER NOT NULL DEFAULT 0,
    rd_subcomponents INTEGER NOT NULL DEFAULT 0,
    non_rd_subcomponents INTEGER NOT NULL DEFAULT 0,
    step_summaries JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id, year, activity_name)
);

-- =====================================================
-- CONFIGURATION TABLES (Employee, Contractor, Supply)
-- =====================================================

-- Employee configurations
CREATE TABLE employee_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    employee_id TEXT NOT NULL, -- References employee from business data
    employee_name TEXT NOT NULL,
    practice_percentages JSONB NOT NULL DEFAULT '{}', -- {activityName: percentage}
    time_percentages JSONB NOT NULL DEFAULT '{}', -- {activityName: {subcomponentId: percentage}}
    role_assignments JSONB NOT NULL DEFAULT '{}', -- {activityName: roleId}
    applied_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
    applied_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id, year, employee_id)
);

-- Contractor configurations
CREATE TABLE contractor_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    contractor_id TEXT NOT NULL, -- References contractor from business data
    contractor_name TEXT NOT NULL,
    contractor_type VARCHAR(20) NOT NULL DEFAULT 'individual', -- 'individual' or 'business'
    practice_percentages JSONB NOT NULL DEFAULT '{}', -- {activityName: percentage}
    time_percentages JSONB NOT NULL DEFAULT '{}', -- {activityName: {subcomponentId: percentage}}
    role_assignments JSONB NOT NULL DEFAULT '{}', -- {activityName: roleId}
    applied_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
    applied_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id, year, contractor_id)
);

-- Supply configurations
CREATE TABLE supply_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    supply_id TEXT NOT NULL, -- References supply from business data
    supply_name TEXT NOT NULL,
    supply_category VARCHAR(50),
    activity_percentages JSONB NOT NULL DEFAULT '{}', -- {activityName: percentage}
    subcomponent_percentages JSONB NOT NULL DEFAULT '{}', -- {activityName: {subcomponentId: percentage}}
    selected_subcomponents JSONB NOT NULL DEFAULT '{}', -- {activityName: [subcomponentIds]}
    applied_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
    applied_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id, year, supply_id)
);

-- =====================================================
-- RESEARCH ACTIVITY SELECTIONS (from Research API)
-- =====================================================

-- Research activity selections (user selections from Research API)
CREATE TABLE research_activity_selections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    research_activity_id UUID REFERENCES research_api_activities(id),
    is_selected BOOLEAN NOT NULL DEFAULT FALSE,
    custom_name TEXT,
    custom_description TEXT,
    practice_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id, year, research_activity_id)
);

-- Research activity assignments to employees/contractors
CREATE TABLE research_activity_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    research_activity_id UUID REFERENCES research_api_activities(id),
    assignee_type VARCHAR(20) NOT NULL CHECK (assignee_type IN ('employee', 'contractor')),
    assignee_id TEXT NOT NULL, -- References employee_id or contractor_id
    time_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
    role_id TEXT, -- References role from business data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id, year, research_activity_id, assignee_type, assignee_id)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- QRA data indexes
CREATE INDEX idx_qra_activities_business_year ON qra_activities(business_id, year);
CREATE INDEX idx_qra_activities_activity_id ON qra_activities(activity_id);
CREATE INDEX idx_qra_steps_activity ON qra_steps(qra_activity_id);
CREATE INDEX idx_qra_steps_order ON qra_steps(qra_activity_id, order_index);
CREATE INDEX idx_qra_subcomponents_activity ON qra_subcomponents(qra_activity_id);
CREATE INDEX idx_qra_subcomponents_step ON qra_subcomponents(qra_activity_id, step_name);
CREATE INDEX idx_qra_subcomponents_order ON qra_subcomponents(qra_activity_id, order_index);
CREATE INDEX idx_qra_modal_data_business_year ON qra_modal_data(business_id, year);
CREATE INDEX idx_qra_modal_data_activity ON qra_modal_data(business_id, year, activity_name);

-- Configuration indexes
CREATE INDEX idx_employee_configs_business_year ON employee_configurations(business_id, year);
CREATE INDEX idx_employee_configs_employee ON employee_configurations(employee_id);
CREATE INDEX idx_contractor_configs_business_year ON contractor_configurations(business_id, year);
CREATE INDEX idx_contractor_configs_contractor ON contractor_configurations(contractor_id);
CREATE INDEX idx_supply_configs_business_year ON supply_configurations(business_id, year);
CREATE INDEX idx_supply_configs_supply ON supply_configurations(supply_id);

-- Research activity indexes
CREATE INDEX idx_research_selections_business_year ON research_activity_selections(business_id, year);
CREATE INDEX idx_research_selections_activity ON research_activity_selections(research_activity_id);
CREATE INDEX idx_research_assignments_business_year ON research_activity_assignments(business_id, year);
CREATE INDEX idx_research_assignments_activity ON research_activity_assignments(research_activity_id);
CREATE INDEX idx_research_assignments_assignee ON research_activity_assignments(assignee_type, assignee_id);

-- =====================================================
-- UPDATED_AT TRIGGERS
-- =====================================================

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_qrabuilder_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables
CREATE TRIGGER trigger_qra_activities_updated_at
    BEFORE UPDATE ON qra_activities
    FOR EACH ROW
    EXECUTE FUNCTION update_qrabuilder_updated_at();

CREATE TRIGGER trigger_qra_steps_updated_at
    BEFORE UPDATE ON qra_steps
    FOR EACH ROW
    EXECUTE FUNCTION update_qrabuilder_updated_at();

CREATE TRIGGER trigger_qra_subcomponents_updated_at
    BEFORE UPDATE ON qra_subcomponents
    FOR EACH ROW
    EXECUTE FUNCTION update_qrabuilder_updated_at();

CREATE TRIGGER trigger_qra_modal_data_updated_at
    BEFORE UPDATE ON qra_modal_data
    FOR EACH ROW
    EXECUTE FUNCTION update_qrabuilder_updated_at();

CREATE TRIGGER trigger_employee_configurations_updated_at
    BEFORE UPDATE ON employee_configurations
    FOR EACH ROW
    EXECUTE FUNCTION update_qrabuilder_updated_at();

CREATE TRIGGER trigger_contractor_configurations_updated_at
    BEFORE UPDATE ON contractor_configurations
    FOR EACH ROW
    EXECUTE FUNCTION update_qrabuilder_updated_at();

CREATE TRIGGER trigger_supply_configurations_updated_at
    BEFORE UPDATE ON supply_configurations
    FOR EACH ROW
    EXECUTE FUNCTION update_qrabuilder_updated_at();

CREATE TRIGGER trigger_research_activity_selections_updated_at
    BEFORE UPDATE ON research_activity_selections
    FOR EACH ROW
    EXECUTE FUNCTION update_qrabuilder_updated_at();

CREATE TRIGGER trigger_research_activity_assignments_updated_at
    BEFORE UPDATE ON research_activity_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_qrabuilder_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE qra_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE qra_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE qra_subcomponents ENABLE ROW LEVEL SECURITY;
ALTER TABLE qra_modal_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE supply_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_activity_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_activity_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can only access their own business data
CREATE POLICY "Users can access their own QRA activities" ON qra_activities
    FOR ALL USING (
        business_id IN (
            SELECT id FROM businesses 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can access their own QRA steps" ON qra_steps
    FOR ALL USING (
        qra_activity_id IN (
            SELECT id FROM qra_activities 
            WHERE business_id IN (
                SELECT id FROM businesses 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can access their own QRA subcomponents" ON qra_subcomponents
    FOR ALL USING (
        qra_activity_id IN (
            SELECT id FROM qra_activities 
            WHERE business_id IN (
                SELECT id FROM businesses 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can access their own QRA modal data" ON qra_modal_data
    FOR ALL USING (
        business_id IN (
            SELECT id FROM businesses 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can access their own employee configurations" ON employee_configurations
    FOR ALL USING (
        business_id IN (
            SELECT id FROM businesses 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can access their own contractor configurations" ON contractor_configurations
    FOR ALL USING (
        business_id IN (
            SELECT id FROM businesses 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can access their own supply configurations" ON supply_configurations
    FOR ALL USING (
        business_id IN (
            SELECT id FROM businesses 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can access their own research activity selections" ON research_activity_selections
    FOR ALL USING (
        business_id IN (
            SELECT id FROM businesses 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can access their own research activity assignments" ON research_activity_assignments
    FOR ALL USING (
        business_id IN (
            SELECT id FROM businesses 
            WHERE user_id = auth.uid()
        )
    );

-- =====================================================
-- PERMISSIONS
-- =====================================================

-- Grant permissions to authenticated users
GRANT ALL ON qra_activities TO authenticated;
GRANT ALL ON qra_steps TO authenticated;
GRANT ALL ON qra_subcomponents TO authenticated;
GRANT ALL ON qra_modal_data TO authenticated;
GRANT ALL ON employee_configurations TO authenticated;
GRANT ALL ON contractor_configurations TO authenticated;
GRANT ALL ON supply_configurations TO authenticated;
GRANT ALL ON research_activity_selections TO authenticated;
GRANT ALL ON research_activity_assignments TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get all QRA data for a business and year
CREATE OR REPLACE FUNCTION get_qra_data_for_business(
    p_business_id UUID,
    p_year INTEGER
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'activities', (
            SELECT json_agg(
                json_build_object(
                    'id', qa.id,
                    'activity_id', qa.activity_id,
                    'activity_name', qa.activity_name,
                    'practice_percent', qa.practice_percent,
                    'non_rd_time', qa.non_rd_time,
                    'total_applied_percent', qa.total_applied_percent,
                    'selected_roles', qa.selected_roles,
                    'is_locked', qa.is_locked,
                    'steps', (
                        SELECT json_agg(
                            json_build_object(
                                'id', qs.id,
                                'step_name', qs.step_name,
                                'phase_name', qs.phase_name,
                                'time_percent', qs.time_percent,
                                'is_locked', qs.is_locked,
                                'subcomponents', (
                                    SELECT json_agg(
                                        json_build_object(
                                            'id', qsc.id,
                                            'subcomponent_id', qsc.subcomponent_id,
                                            'subcomponent_title', qsc.subcomponent_title,
                                            'time_percent', qsc.time_percent,
                                            'frequency_percent', qsc.frequency_percent,
                                            'year_percent', qsc.year_percent,
                                            'selected_roles', qsc.selected_roles,
                                            'is_non_rd', qsc.is_non_rd
                                        )
                                    )
                                    FROM qra_subcomponents qsc
                                    WHERE qsc.qra_activity_id = qa.id
                                    AND qsc.step_name = qs.step_name
                                    ORDER BY qsc.order_index
                                )
                            )
                        )
                        FROM qra_steps qs
                        WHERE qs.qra_activity_id = qa.id
                        ORDER BY qs.order_index
                    )
                )
            )
            FROM qra_activities qa
            WHERE qa.business_id = p_business_id
            AND qa.year = p_year
        ),
        'modal_data', (
            SELECT json_object_agg(activity_name, json_build_object(
                'practice_percent', practice_percent,
                'selected_subcomponents', selected_subcomponents,
                'total_applied_percent', total_applied_percent,
                'step_frequencies', step_frequencies,
                'step_time_map', step_time_map,
                'step_time_locked', step_time_locked,
                'selected_roles', selected_roles,
                'calculation_formula', calculation_formula,
                'total_subcomponents', total_subcomponents,
                'rd_subcomponents', rd_subcomponents,
                'non_rd_subcomponents', non_rd_subcomponents,
                'step_summaries', step_summaries
            ))
            FROM qra_modal_data
            WHERE business_id = p_business_id
            AND year = p_year
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all configurations for a business and year
CREATE OR REPLACE FUNCTION get_configurations_for_business(
    p_business_id UUID,
    p_year INTEGER
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'employees', (
            SELECT json_agg(
                json_build_object(
                    'id', ec.id,
                    'employee_id', ec.employee_id,
                    'employee_name', ec.employee_name,
                    'practice_percentages', ec.practice_percentages,
                    'time_percentages', ec.time_percentages,
                    'role_assignments', ec.role_assignments,
                    'applied_percentage', ec.applied_percentage,
                    'applied_amount', ec.applied_amount,
                    'is_locked', ec.is_locked
                )
            )
            FROM employee_configurations ec
            WHERE ec.business_id = p_business_id
            AND ec.year = p_year
        ),
        'contractors', (
            SELECT json_agg(
                json_build_object(
                    'id', cc.id,
                    'contractor_id', cc.contractor_id,
                    'contractor_name', cc.contractor_name,
                    'contractor_type', cc.contractor_type,
                    'practice_percentages', cc.practice_percentages,
                    'time_percentages', cc.time_percentages,
                    'role_assignments', cc.role_assignments,
                    'applied_percentage', cc.applied_percentage,
                    'applied_amount', cc.applied_amount,
                    'is_locked', cc.is_locked
                )
            )
            FROM contractor_configurations cc
            WHERE cc.business_id = p_business_id
            AND cc.year = p_year
        ),
        'supplies', (
            SELECT json_agg(
                json_build_object(
                    'id', sc.id,
                    'supply_id', sc.supply_id,
                    'supply_name', sc.supply_name,
                    'supply_category', sc.supply_category,
                    'activity_percentages', sc.activity_percentages,
                    'subcomponent_percentages', sc.subcomponent_percentages,
                    'selected_subcomponents', sc.selected_subcomponents,
                    'applied_percentage', sc.applied_percentage,
                    'applied_amount', sc.applied_amount,
                    'is_locked', sc.is_locked
                )
            )
            FROM supply_configurations sc
            WHERE sc.business_id = p_business_id
            AND sc.year = p_year
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_qra_data_for_business TO authenticated;
GRANT EXECUTE ON FUNCTION get_configurations_for_business TO authenticated;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'QRABuilder complete schema created successfully!';
    RAISE NOTICE 'Tables created:';
    RAISE NOTICE '- qra_activities, qra_steps, qra_subcomponents, qra_modal_data';
    RAISE NOTICE '- employee_configurations, contractor_configurations, supply_configurations';
    RAISE NOTICE '- research_activity_selections, research_activity_assignments';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Create the service layer (TypeScript services)';
    RAISE NOTICE '2. Update QRABuilder components to use new services';
    RAISE NOTICE '3. Migrate existing localStorage data';
    RAISE NOTICE '4. Test all functionality';
END $$; 