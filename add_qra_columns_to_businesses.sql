-- Add JSONB columns to businesses table for QRA data storage
-- This approach avoids complex table structures and RLS issues

-- Add QRA data column
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS qra_data JSONB DEFAULT '{}';

-- Add employee configurations column
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS employee_configs JSONB DEFAULT '{}';

-- Add contractor configurations column
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS contractor_configs JSONB DEFAULT '{}';

-- Add supply configurations column
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS supply_configs JSONB DEFAULT '{}';

-- Add research activity selections column
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS research_activity_selections JSONB DEFAULT '{}';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_businesses_qra_data ON businesses USING GIN (qra_data);
CREATE INDEX IF NOT EXISTS idx_businesses_employee_configs ON businesses USING GIN (employee_configs);
CREATE INDEX IF NOT EXISTS idx_businesses_contractor_configs ON businesses USING GIN (contractor_configs);
CREATE INDEX IF NOT EXISTS idx_businesses_supply_configs ON businesses USING GIN (supply_configs);
CREATE INDEX IF NOT EXISTS idx_businesses_research_selections ON businesses USING GIN (research_activity_selections);

-- Grant permissions (businesses table should already have proper permissions)
-- No additional RLS policies needed since we're using the existing businesses table

-- Test the columns
DO $$
BEGIN
    RAISE NOTICE 'JSONB columns added to businesses table successfully!';
    RAISE NOTICE 'Columns: qra_data, employee_configs, contractor_configs, supply_configs, research_activity_selections';
    RAISE NOTICE 'Indexes created for better performance';
    RAISE NOTICE 'No additional RLS policies needed - using existing businesses table permissions';
END $$; 