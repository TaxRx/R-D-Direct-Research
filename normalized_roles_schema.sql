-- =====================================================
-- NORMALIZED ROLES SCHEMA - DEFINITIVE SOLUTION
-- =====================================================
-- This replaces the current denormalized business_roles table
-- with a fully normalized, relational structure

-- Drop existing denormalized table
DROP TABLE IF EXISTS business_roles CASCADE;

-- Create normalized roles table
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    role_id VARCHAR(100) NOT NULL, -- e.g., "research-leader", "scientist", etc.
    name VARCHAR(255) NOT NULL, -- e.g., "Research Leader", "Scientist", etc.
    color VARCHAR(7) NOT NULL DEFAULT '#1976d2', -- hex color
    participates_in_rd BOOLEAN NOT NULL DEFAULT true,
    parent_role_id VARCHAR(100), -- for hierarchical relationships
    order_index INTEGER NOT NULL DEFAULT 0, -- for ordering within same parent
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique role_id per business/year combination
    UNIQUE(business_id, year, role_id),
    
    -- Ensure parent_role_id exists in same business/year if not null
    CONSTRAINT fk_parent_role 
        FOREIGN KEY (business_id, year, parent_role_id) 
        REFERENCES roles(business_id, year, role_id) 
        ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_roles_business_year ON roles(business_id, year);
CREATE INDEX idx_roles_parent ON roles(business_id, year, parent_role_id);
CREATE INDEX idx_roles_order ON roles(business_id, year, parent_role_id, order_index);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_roles_updated_at
    BEFORE UPDATE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION update_roles_updated_at();

-- Enable RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies - allow access to business owners and creators
CREATE POLICY "Users can view roles for their businesses" ON roles
    FOR SELECT USING (
        auth.uid() = user_id OR 
        auth.uid() = ANY(
            SELECT unnest(owners)::uuid 
            FROM businesses 
            WHERE id = business_id
        )
    );

CREATE POLICY "Users can insert roles for their businesses" ON roles
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR 
        auth.uid() = ANY(
            SELECT unnest(owners)::uuid 
            FROM businesses 
            WHERE id = business_id
        )
    );

CREATE POLICY "Users can update roles for their businesses" ON roles
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        auth.uid() = ANY(
            SELECT unnest(owners)::uuid 
            FROM businesses 
            WHERE id = business_id
        )
    );

CREATE POLICY "Users can delete roles for their businesses" ON roles
    FOR DELETE USING (
        auth.uid() = user_id OR 
        auth.uid() = ANY(
            SELECT unnest(owners)::uuid 
            FROM businesses 
            WHERE id = business_id
        )
    );

-- Grant permissions
GRANT ALL ON roles TO authenticated;
GRANT USAGE ON SEQUENCE roles_id_seq TO authenticated;

-- Insert default "Research Leader" role for existing businesses
INSERT INTO roles (business_id, year, role_id, name, color, participates_in_rd, parent_role_id, order_index)
SELECT 
    b.id as business_id,
    y.year,
    'research-leader' as role_id,
    'Research Leader' as name,
    '#1976d2' as color,
    true as participates_in_rd,
    null as parent_role_id,
    0 as order_index
FROM businesses b
CROSS JOIN LATERAL (
    SELECT DISTINCT year 
    FROM jsonb_object_keys(b.years) as year
) y
WHERE NOT EXISTS (
    SELECT 1 FROM roles r 
    WHERE r.business_id = b.id 
    AND r.year = y.year::integer 
    AND r.role_id = 'research-leader'
);

-- Create view for easier querying of hierarchical roles
CREATE OR REPLACE VIEW roles_hierarchy AS
WITH RECURSIVE role_tree AS (
    -- Base case: root roles (no parent)
    SELECT 
        id, business_id, year, role_id, name, color, participates_in_rd, 
        parent_role_id, order_index, 0 as level, 
        ARRAY[order_index] as path
    FROM roles 
    WHERE parent_role_id IS NULL
    
    UNION ALL
    
    -- Recursive case: child roles
    SELECT 
        r.id, r.business_id, r.year, r.role_id, r.name, r.color, r.participates_in_rd,
        r.parent_role_id, r.order_index, rt.level + 1,
        rt.path || r.order_index
    FROM roles r
    INNER JOIN role_tree rt ON r.parent_role_id = rt.role_id 
        AND r.business_id = rt.business_id 
        AND r.year = rt.year
)
SELECT * FROM role_tree ORDER BY business_id, year, path;

-- Grant permissions on view
GRANT SELECT ON roles_hierarchy TO authenticated; 