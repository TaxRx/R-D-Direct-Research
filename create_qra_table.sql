-- Create normalized QRA (Qualified Research Activities) table
-- This table stores QRA configuration data in a normalized structure
-- Run this in your Supabase SQL Editor

-- QRA Activities table (stores the main QRA configuration)
CREATE TABLE IF NOT EXISTS qra_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    activity_name TEXT NOT NULL,
    practice_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
    total_applied_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
    selected_roles TEXT[] DEFAULT '{}',
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id, year, activity_name)
);

-- QRA Steps table (stores steps within QRA activities)
CREATE TABLE IF NOT EXISTS qra_steps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    qra_activity_id UUID REFERENCES qra_activities(id) ON DELETE CASCADE,
    step_name TEXT NOT NULL,
    time_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
    frequency_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
    is_time_locked BOOLEAN NOT NULL DEFAULT FALSE,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(qra_activity_id, step_name)
);

-- QRA Subcomponents table (stores subcomponents within QRA steps)
CREATE TABLE IF NOT EXISTS qra_subcomponents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    qra_step_id UUID REFERENCES qra_steps(id) ON DELETE CASCADE,
    subcomponent_name TEXT NOT NULL,
    year_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
    frequency_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
    time_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
    start_month INTEGER,
    start_year INTEGER,
    selected_roles TEXT[] DEFAULT '{}',
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(qra_step_id, subcomponent_name)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_qra_activities_business_year ON qra_activities(business_id, year);
CREATE INDEX IF NOT EXISTS idx_qra_activities_activity_name ON qra_activities(activity_name);
CREATE INDEX IF NOT EXISTS idx_qra_steps_qra_activity_id ON qra_steps(qra_activity_id);
CREATE INDEX IF NOT EXISTS idx_qra_subcomponents_qra_step_id ON qra_subcomponents(qra_step_id);

-- Create triggers for updated_at columns
CREATE TRIGGER update_qra_activities_updated_at BEFORE UPDATE ON qra_activities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_qra_steps_updated_at BEFORE UPDATE ON qra_steps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_qra_subcomponents_updated_at BEFORE UPDATE ON qra_subcomponents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE qra_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE qra_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE qra_subcomponents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for qra_activities
CREATE POLICY "QRA activities can view own data" ON qra_activities FOR SELECT USING (
    EXISTS (SELECT 1 FROM businesses b JOIN users u ON b.user_id = u.id 
            WHERE b.id = qra_activities.business_id AND u.id::text = auth.uid()::text)
);
CREATE POLICY "QRA activities can update own data" ON qra_activities FOR UPDATE USING (
    EXISTS (SELECT 1 FROM businesses b JOIN users u ON b.user_id = u.id 
            WHERE b.id = qra_activities.business_id AND u.id::text = auth.uid()::text)
);
CREATE POLICY "QRA activities can insert own data" ON qra_activities FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM businesses b JOIN users u ON b.user_id = u.id 
            WHERE b.id = qra_activities.business_id AND u.id::text = auth.uid()::text)
);
CREATE POLICY "QRA activities can delete own data" ON qra_activities FOR DELETE USING (
    EXISTS (SELECT 1 FROM businesses b JOIN users u ON b.user_id = u.id 
            WHERE b.id = qra_activities.business_id AND u.id::text = auth.uid()::text)
);

-- Create RLS policies for qra_steps
CREATE POLICY "QRA steps can view own data" ON qra_steps FOR SELECT USING (
    EXISTS (SELECT 1 FROM qra_activities qa JOIN businesses b ON qa.business_id = b.id JOIN users u ON b.user_id = u.id 
            WHERE qa.id = qra_steps.qra_activity_id AND u.id::text = auth.uid()::text)
);
CREATE POLICY "QRA steps can update own data" ON qra_steps FOR UPDATE USING (
    EXISTS (SELECT 1 FROM qra_activities qa JOIN businesses b ON qa.business_id = b.id JOIN users u ON b.user_id = u.id 
            WHERE qa.id = qra_steps.qra_activity_id AND u.id::text = auth.uid()::text)
);
CREATE POLICY "QRA steps can insert own data" ON qra_steps FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM qra_activities qa JOIN businesses b ON qa.business_id = b.id JOIN users u ON b.user_id = u.id 
            WHERE qa.id = qra_steps.qra_activity_id AND u.id::text = auth.uid()::text)
);
CREATE POLICY "QRA steps can delete own data" ON qra_steps FOR DELETE USING (
    EXISTS (SELECT 1 FROM qra_activities qa JOIN businesses b ON qa.business_id = b.id JOIN users u ON b.user_id = u.id 
            WHERE qa.id = qra_steps.qra_activity_id AND u.id::text = auth.uid()::text)
);

-- Create RLS policies for qra_subcomponents
CREATE POLICY "QRA subcomponents can view own data" ON qra_subcomponents FOR SELECT USING (
    EXISTS (SELECT 1 FROM qra_steps qs JOIN qra_activities qa ON qs.qra_activity_id = qa.id JOIN businesses b ON qa.business_id = b.id JOIN users u ON b.user_id = u.id 
            WHERE qs.id = qra_subcomponents.qra_step_id AND u.id::text = auth.uid()::text)
);
CREATE POLICY "QRA subcomponents can update own data" ON qra_subcomponents FOR UPDATE USING (
    EXISTS (SELECT 1 FROM qra_steps qs JOIN qra_activities qa ON qs.qra_activity_id = qa.id JOIN businesses b ON qa.business_id = b.id JOIN users u ON b.user_id = u.id 
            WHERE qs.id = qra_subcomponents.qra_step_id AND u.id::text = auth.uid()::text)
);
CREATE POLICY "QRA subcomponents can insert own data" ON qra_subcomponents FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM qra_steps qs JOIN qra_activities qa ON qs.qra_activity_id = qa.id JOIN businesses b ON qa.business_id = b.id JOIN users u ON b.user_id = u.id 
            WHERE qs.id = qra_subcomponents.qra_step_id AND u.id::text = auth.uid()::text)
);
CREATE POLICY "QRA subcomponents can delete own data" ON qra_subcomponents FOR DELETE USING (
    EXISTS (SELECT 1 FROM qra_steps qs JOIN qra_activities qa ON qs.qra_activity_id = qa.id JOIN businesses b ON qa.business_id = b.id JOIN users u ON b.user_id = u.id 
            WHERE qs.id = qra_subcomponents.qra_step_id AND u.id::text = auth.uid()::text)
);

-- Grant permissions
GRANT ALL ON qra_activities TO anon, authenticated;
GRANT ALL ON qra_steps TO anon, authenticated;
GRANT ALL ON qra_subcomponents TO anon, authenticated;

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE 'QRA tables created successfully!';
    RAISE NOTICE 'Tables: qra_activities, qra_steps, qra_subcomponents';
    RAISE NOTICE 'Indexes and RLS policies have been configured.';
END $$; 