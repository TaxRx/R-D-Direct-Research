-- Check current table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'business_roles' 
ORDER BY ordinal_position;

-- Check current data
SELECT * FROM business_roles LIMIT 5; 