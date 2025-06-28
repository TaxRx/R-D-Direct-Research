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

-- Indexes for QRA tables
CREATE INDEX IF NOT EXISTS idx_qra_activities_business_year ON qra_activities(business_id, year);
CREATE INDEX IF NOT EXISTS idx_qra_activities_activity_id ON qra_activities(activity_id);
CREATE INDEX IF NOT EXISTS idx_qra_steps_business_year ON qra_steps(business_id, year);
CREATE INDEX IF NOT EXISTS idx_qra_steps_activity_id ON qra_steps(activity_id);
CREATE INDEX IF NOT EXISTS idx_qra_subcomponents_business_year ON qra_subcomponents(business_id, year);
CREATE INDEX IF NOT EXISTS idx_qra_subcomponents_activity_id ON qra_subcomponents(activity_id);
CREATE INDEX IF NOT EXISTS idx_qra_subcomponents_step_id ON qra_subcomponents(step_id);

-- RLS Policies for QRA tables
ALTER TABLE qra_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE qra_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE qra_subcomponents ENABLE ROW LEVEL SECURITY;

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

-- Function for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at timestamps
CREATE TRIGGER update_qra_activities_updated_at BEFORE UPDATE ON qra_activities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_qra_steps_updated_at BEFORE UPDATE ON qra_steps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_qra_subcomponents_updated_at BEFORE UPDATE ON qra_subcomponents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 