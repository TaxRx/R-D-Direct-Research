-- =====================================================
-- FIX ROLES TABLE STRUCTURE - ADD MISSING COLUMNS
-- =====================================================

-- First, let's see what data we currently have
SELECT * FROM roles LIMIT 5;

-- Add missing columns to support normalized roles structure
ALTER TABLE roles 
ADD COLUMN IF NOT EXISTS year INTEGER,
ADD COLUMN IF NOT EXISTS role_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS parent_role_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- Add constraints and indexes
ALTER TABLE roles 
ADD CONSTRAINT roles_business_year_role_unique 
UNIQUE (business_id, year, role_id);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_roles_business_year 
ON roles (business_id, year);

CREATE INDEX IF NOT EXISTS idx_roles_parent 
ON roles (parent_role_id);

-- Set default values for existing data
UPDATE roles 
SET 
  year = 2024,
  role_id = LOWER(REPLACE(name, ' ', '-')),
  participates_in_rd = COALESCE(participates_in_rd, true),
  color = COALESCE(color, '#1976d2'),
  order_index = 0
WHERE year IS NULL;

-- Make required columns NOT NULL after setting defaults
ALTER TABLE roles 
ALTER COLUMN year SET NOT NULL,
ALTER COLUMN role_id SET NOT NULL,
ALTER COLUMN participates_in_rd SET NOT NULL,
ALTER COLUMN color SET NOT NULL;

-- Add a unique constraint on role_id to support foreign key reference
ALTER TABLE roles 
ADD CONSTRAINT roles_role_id_unique 
UNIQUE (role_id);

-- Add foreign key constraint for parent_role_id
ALTER TABLE roles 
ADD CONSTRAINT fk_roles_parent 
FOREIGN KEY (parent_role_id) REFERENCES roles(role_id) 
ON DELETE SET NULL;

-- Verify the structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'roles' 
ORDER BY ordinal_position;

-- Show sample data
SELECT * FROM roles LIMIT 10; 