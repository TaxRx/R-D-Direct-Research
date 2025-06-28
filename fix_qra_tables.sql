-- Fix QRA tables structure
DROP TABLE IF EXISTS qra_subcomponents CASCADE;
DROP TABLE IF EXISTS qra_steps CASCADE;
DROP TABLE IF EXISTS qra_activities CASCADE;

CREATE TABLE qra_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    activity_id TEXT NOT NULL,
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

-- Enable RLS with simple policies
ALTER TABLE qra_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE qra_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE qra_subcomponents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to QRA activities" ON qra_activities FOR ALL USING (true);
CREATE POLICY "Allow all access to QRA steps" ON qra_steps FOR ALL USING (true);
CREATE POLICY "Allow all access to QRA subcomponents" ON qra_subcomponents FOR ALL USING (true);

GRANT ALL ON qra_activities TO anon, authenticated;
GRANT ALL ON qra_steps TO anon, authenticated;
GRANT ALL ON qra_subcomponents TO anon, authenticated; 