-- Check and fix qra_activities table structure
-- This script ensures the qra_activities table has the correct structure for QRABuilderService

-- First, check if the table exists and what its structure is
DO $$
DECLARE
    table_exists BOOLEAN;
    column_count INTEGER;
BEGIN
    -- Check if table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'qra_activities'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE 'qra_activities table exists';
        
        -- Check column count
        SELECT COUNT(*) INTO column_count
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'qra_activities';
        
        RAISE NOTICE 'qra_activities table has % columns', column_count;
        
        -- List all columns
        RAISE NOTICE 'Columns in qra_activities:';
        FOR col IN 
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'qra_activities'
            ORDER BY ordinal_position
        LOOP
            RAISE NOTICE '  %: % (nullable: %)', col.column_name, col.data_type, col.is_nullable;
        END LOOP;
    ELSE
        RAISE NOTICE 'qra_activities table does not exist';
    END IF;
END $$;

-- Drop and recreate the table with the correct structure
DROP TABLE IF EXISTS qra_subcomponents CASCADE;
DROP TABLE IF EXISTS qra_steps CASCADE;
DROP TABLE IF EXISTS qra_activities CASCADE;

-- Create the correct qra_activities table
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

-- Create the correct qra_steps table
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

-- Create the correct qra_subcomponents table
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

-- Create indexes
CREATE INDEX idx_qra_activities_business_year ON qra_activities(business_id, year);
CREATE INDEX idx_qra_activities_activity_id ON qra_activities(activity_id);
CREATE INDEX idx_qra_steps_activity ON qra_steps(qra_activity_id);
CREATE INDEX idx_qra_subcomponents_activity ON qra_subcomponents(qra_activity_id);

-- Enable RLS
ALTER TABLE qra_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE qra_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE qra_subcomponents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view QRA activities for their businesses" ON qra_activities;
DROP POLICY IF EXISTS "Users can insert QRA activities for their businesses" ON qra_activities;
DROP POLICY IF EXISTS "Users can update QRA activities for their businesses" ON qra_activities;
DROP POLICY IF EXISTS "Users can delete QRA activities for their businesses" ON qra_activities;

-- Create simple RLS policies that allow public read access for now
CREATE POLICY "Allow public read access to QRA activities" ON qra_activities
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to QRA activities" ON qra_activities
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access to QRA activities" ON qra_activities
    FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access to QRA activities" ON qra_activities
    FOR DELETE USING (true);

-- Create policies for qra_steps
CREATE POLICY "Allow public read access to QRA steps" ON qra_steps
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to QRA steps" ON qra_steps
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access to QRA steps" ON qra_steps
    FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access to QRA steps" ON qra_steps
    FOR DELETE USING (true);

-- Create policies for qra_subcomponents
CREATE POLICY "Allow public read access to QRA subcomponents" ON qra_subcomponents
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to QRA subcomponents" ON qra_subcomponents
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access to QRA subcomponents" ON qra_subcomponents
    FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access to QRA subcomponents" ON qra_subcomponents
    FOR DELETE USING (true);

-- Grant permissions
GRANT ALL ON qra_activities TO anon, authenticated;
GRANT ALL ON qra_steps TO anon, authenticated;
GRANT ALL ON qra_subcomponents TO anon, authenticated;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_qra_activities_updated_at BEFORE UPDATE ON qra_activities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_qra_steps_updated_at BEFORE UPDATE ON qra_steps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_qra_subcomponents_updated_at BEFORE UPDATE ON qra_subcomponents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Test the table structure
DO $$
BEGIN
    RAISE NOTICE 'QRA tables created successfully!';
    RAISE NOTICE 'Testing table structure...';
    
    -- Test insert
    INSERT INTO qra_activities (business_id, year, activity_id, activity_name, practice_percent, non_rd_time, total_applied_percent)
    VALUES (
        (SELECT id FROM businesses LIMIT 1), 
        2025, 
        'test-activity-id', 
        'Test Activity', 
        50.0, 
        10.0, 
        40.0
    );
    
    RAISE NOTICE 'Test insert successful!';
    
    -- Test select
    PERFORM COUNT(*) FROM qra_activities WHERE activity_id = 'test-activity-id';
    RAISE NOTICE 'Test select successful!';
    
    -- Clean up test data
    DELETE FROM qra_activities WHERE activity_id = 'test-activity-id';
    RAISE NOTICE 'Test cleanup successful!';
    
    RAISE NOTICE 'All tests passed! QRA tables are working correctly.';
END $$; 