# 🗄️ Complete Supabase Database Schema

## Overview

This document describes the complete Supabase database schema for the R&D Credit Manager application. The schema includes all tables, indexes, views, and functions needed for the app to function properly with Supabase, replacing all localStorage functionality.

## 📋 Schema File

**File:** `complete_supabase_schema.sql`

This is the **only** SQL file you need to run in your Supabase SQL Editor. It includes everything needed for the application.

## 🏗️ Database Structure

### Custom Types
- `contractor_type`: ENUM ('individual', 'business')
- `entity_category`: ENUM ('employee', 'contractor', 'supply')
- `approval_status`: ENUM ('pending', 'approved', 'rejected')

### Core Tables

#### 1. **users**
- **Purpose**: Store client and admin user information
- **Key Fields**: `id`, `email`, `name`, `role`, `business_ids[]`, `is_active`
- **Relationships**: One-to-many with businesses

#### 2. **businesses**
- **Purpose**: Store business entity information
- **Key Fields**: `id`, `name`, `user_id`, `business_type`, `financial_history`
- **Relationships**: Belongs to user, has many years, activities, employees, etc.

#### 3. **years**
- **Purpose**: Store business year data for QRE calculations
- **Key Fields**: `business_id`, `year`, `gross_receipts`, `total_qre`
- **Relationships**: Belongs to business

#### 4. **research_activities**
- **Purpose**: Store research activities per business/year
- **Key Fields**: `business_id`, `year`, `title`, `practice_percent`, `is_approved`
- **Relationships**: Belongs to business, has many steps

#### 5. **steps**
- **Purpose**: Store steps within research activities
- **Key Fields**: `research_activity_id`, `title`, `order_index`
- **Relationships**: Belongs to research activity, has many subcomponents

#### 6. **subcomponents**
- **Purpose**: Store subcomponents within steps
- **Key Fields**: `step_id`, `title`, `year_percent`, `frequency_percent`, `time_percent`
- **Relationships**: Belongs to step

#### 7. **roles**
- **Purpose**: Store employee/contractor roles
- **Key Fields**: `business_id`, `name`, `color`, `participates_in_rd`
- **Relationships**: Belongs to business, referenced by employees/contractors

#### 8. **employees**
- **Purpose**: Store employee data
- **Key Fields**: `business_id`, `year`, `first_name`, `last_name`, `role_id`, `wage`
- **Relationships**: Belongs to business, references role

#### 9. **contractors**
- **Purpose**: Store contractor data
- **Key Fields**: `business_id`, `year`, `contractor_type`, `first_name`, `last_name`, `business_name`, `total_amount`
- **Relationships**: Belongs to business, references role

#### 10. **supplies**
- **Purpose**: Store supply data
- **Key Fields**: `business_id`, `year`, `name`, `category`, `total_value`
- **Relationships**: Belongs to business

#### 11. **qre_allocations**
- **Purpose**: Main normalized table for QRE allocations
- **Key Fields**: `business_id`, `year`, `research_activity_id`, `step_id`, `subcomponent_id`, `category`, `entity_id`, `applied_percent`
- **Relationships**: Links all entities to research activities

### Approval & Tracking Tables

#### 12. **tab_approvals**
- **Purpose**: Track approval status for different tabs
- **Key Fields**: `business_id`, `year`, `tab_id`, `is_approved`, `approved_at`, `approved_by`
- **Usage**: Replaces localStorage approval tracking

#### 13. **approval_history**
- **Purpose**: Track approval history and changes
- **Key Fields**: `business_id`, `year`, `tab_id`, `action`, `action_by`, `action_data`
- **Usage**: Audit trail for approvals

### Template & AI Content Tables

#### 14. **templates**
- **Purpose**: Store reusable templates for activities, roles, and QRA data
- **Key Fields**: `business_id`, `name`, `donor_year`, `template_data`
- **Usage**: Replaces localStorage template storage

#### 15. **ai_report_content**
- **Purpose**: Store AI-generated content for reports
- **Key Fields**: `business_id`, `year`, `research_activity_id`, `subcomponent_id`, `content_type`, `content`
- **Usage**: Replaces localStorage AI content storage

#### 16. **prompt_templates**
- **Purpose**: Store AI prompt templates
- **Key Fields**: `name`, `description`, `template`, `category`, `is_default`
- **Usage**: Replaces localStorage prompt template storage

#### 17. **user_prompts**
- **Purpose**: Store user-specific prompts
- **Key Fields**: `business_id`, `year`, `research_activity_id`, `subcomponent_id`, `prompt`
- **Usage**: Replaces localStorage user prompt storage

## 🔍 Views

### **normalized_qre_data**
- **Purpose**: Provides a unified view of all QRE data with entity names and values
- **Usage**: Used for reporting and data export
- **Joins**: All QRE allocation data with business, user, activity, step, subcomponent, and entity information

## 📊 Indexes

The schema includes comprehensive indexes for optimal performance:
- Business relationships (`business_id`, `user_id`)
- Year-based queries (`year` combinations)
- Entity lookups (`category`, `entity_id`)
- Approval tracking (`tab_id` combinations)

## 🔄 Triggers

### **update_updated_at_column()**
- **Purpose**: Automatically updates `updated_at` timestamp on record changes
- **Applied to**: All tables with `updated_at` columns

## 🔐 Row Level Security (RLS)

All tables have RLS enabled with basic policies:
- Users can only access their own data
- Businesses can only be accessed by their owners
- Admin users have broader access

## 🚀 Getting Started

### 1. Clear Existing Data
First, clear all existing tables in your Supabase project:
```sql
-- Run this in Supabase SQL Editor to clear everything
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- Drop all tables
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
    
    -- Drop all custom types
    DROP TYPE IF EXISTS contractor_type CASCADE;
    DROP TYPE IF EXISTS entity_category CASCADE;
    DROP TYPE IF EXISTS approval_status CASCADE;
    
    RAISE NOTICE 'All tables and types dropped successfully';
END $$;
```

### 2. Run Complete Schema
Run the `complete_supabase_schema.sql` file in your Supabase SQL Editor.

### 3. Verify Installation
Check that all tables were created:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

## 📈 Migration from localStorage

The schema includes all necessary tables to replace localStorage functionality:

| localStorage Key | Supabase Table | Purpose |
|------------------|----------------|---------|
| `businessInfoData` | `businesses`, `years` | Business and year data |
| `activities-*` | `research_activities`, `steps`, `subcomponents` | Research activities |
| `roles-*` | `roles` | Employee/contractor roles |
| `employees-*` | `employees` | Employee data |
| `contractors-*` | `contractors` | Contractor data |
| `supplies-*` | `supplies` | Supply data |
| `*TabApproval-*` | `tab_approvals` | Approval tracking |
| `unified_template_*` | `templates` | Template storage |
| `ai_report_*` | `ai_report_content` | AI content |
| `user_prompts_*` | `user_prompts` | User prompts |

## 🔧 Default Data

The schema automatically creates:
- Default admin user (`admin@example.com`)
- Default prompt templates for research activities and subcomponents

## 📝 Notes

- All tables include `created_at` and `updated_at` timestamps
- UUID primary keys are used throughout for consistency
- Foreign key relationships ensure data integrity
- RLS policies provide security at the database level
- The normalized QRE allocations table provides a clean data structure

## 🆘 Troubleshooting

If you encounter issues:

1. **Check for existing objects**: The schema uses `CREATE` statements, so existing objects may cause conflicts
2. **Verify permissions**: Ensure your Supabase user has sufficient permissions
3. **Check RLS policies**: Adjust policies based on your authentication setup
4. **Review foreign keys**: Ensure referenced data exists before inserting related records

## 📞 Support

This schema is designed to be comprehensive and self-contained. If you need modifications or have questions, refer to the application code for specific usage patterns. 