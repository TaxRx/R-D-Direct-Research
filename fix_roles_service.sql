-- Check current table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'business_roles' 
ORDER BY ordinal_position;

-- Check current data
SELECT * FROM business_roles LIMIT 5;

-- Check if we need to restructure the table
-- The current data suggests the table stores individual roles, not a JSON array
-- Let's see what the actual structure should be based on the data you showed:

-- Your data showed: [{"id": "research-leader", "name": "Research Leader", "color": "#1976d2", "children": [], "participatesInRD": true}]

-- This suggests the table should have columns like:
-- - id (primary key)
-- - business_id (foreign key)
-- - year (integer)
-- - role_id (string, like "research-leader")
-- - name (string, like "Research Leader")
-- - color (string, like "#1976d2")
-- - children (jsonb array)
-- - participatesInRD (boolean)
-- - parent_id (string, nullable, for hierarchical structure)
-- - created_at (timestamp)
-- - updated_at (timestamp)

-- Let's check if this matches our current structure 