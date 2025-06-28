-- Add missing columns to businesses table

-- Add dba_name column
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS dba_name TEXT;

-- Add ein column  
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS ein TEXT;

-- Add owners column
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS owners JSONB DEFAULT '[]';

-- Add tab_approvals column
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS tab_approvals JSONB DEFAULT '{"basicInfo": {"isApproved": false, "approvedAt": "", "approvedBy": ""}, "ownership": {"isApproved": false, "approvedAt": "", "approvedBy": ""}, "financial": {"isApproved": false, "approvedAt": "", "approvedBy": ""}}';

-- Add is_controlled_group column
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS is_controlled_group BOOLEAN DEFAULT FALSE;

-- Add is_control_group_leader column
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS is_control_group_leader BOOLEAN DEFAULT FALSE;

-- Update existing records to have proper default values
UPDATE businesses 
SET 
    dba_name = COALESCE(dba_name, ''),
    ein = COALESCE(ein, ''),
    owners = COALESCE(owners, '[]'),
    tab_approvals = COALESCE(tab_approvals, '{"basicInfo": {"isApproved": false, "approvedAt": "", "approvedBy": ""}, "ownership": {"isApproved": false, "approvedAt": "", "approvedBy": ""}, "financial": {"isApproved": false, "approvedAt": "", "approvedBy": ""}}'),
    is_controlled_group = COALESCE(is_controlled_group, FALSE),
    is_control_group_leader = COALESCE(is_control_group_leader, FALSE)
WHERE 
    dba_name IS NULL 
    OR ein IS NULL 
    OR owners IS NULL 
    OR tab_approvals IS NULL 
    OR is_controlled_group IS NULL 
    OR is_control_group_leader IS NULL;
