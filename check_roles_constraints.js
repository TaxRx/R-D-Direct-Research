const { createClient } = require('@supabase/supabase-js');

// Use the same credentials as in src/services/supabase.ts
const supabaseUrl = 'https://hwnnaextfopoznlgzvpz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3bm5hZXh0Zm9wb3pubGd6dnB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3OTk5NjIsImV4cCI6MjA2NjM3NTk2Mn0.rs-FhUyptaU9UeIMcZS1nCn3RD43VfUKhltvJr25JmY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRolesTable() {
  try {
    console.log('Checking roles table structure...');
    
    // Try to get sample data first to understand the structure
    const { data: sampleData, error: sampleError } = await supabase
      .from('roles')
      .select('*')
      .limit(1);

    if (sampleError) {
      console.error('Error getting sample data:', sampleError);
      return;
    }

    console.log('\nSample data structure:');
    if (sampleData.length > 0) {
      console.log(JSON.stringify(sampleData[0], null, 2));
    } else {
      console.log('No data in roles table');
    }

    // Check current data
    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select('*')
      .limit(10);

    if (rolesError) {
      console.error('Error getting roles:', rolesError);
      return;
    }

    console.log('\nCurrent roles data:');
    roles.forEach(role => {
      console.log(`  ${role.name} (${role.role_id || 'no role_id'}) - Business: ${role.business_id}, Year: ${role.year || 'no year'}`);
    });

    // Try to get table constraints using a different approach
    console.log('\nTrying to get table constraints...');
    const { data: constraintData, error: constraintError } = await supabase
      .rpc('get_table_constraints', { table_name: 'roles' });

    if (constraintError) {
      console.log('Could not get constraints via RPC:', constraintError.message);
      
      // Try a direct SQL query
      const { data: sqlResult, error: sqlError } = await supabase
        .rpc('exec_sql', { 
          sql_query: `
            SELECT 
              tc.constraint_name,
              tc.constraint_type,
              kcu.column_name,
              ccu.table_name AS foreign_table_name,
              ccu.column_name AS foreign_column_name
            FROM information_schema.table_constraints tc
            LEFT JOIN information_schema.key_column_usage kcu
              ON tc.constraint_name = kcu.constraint_name
            LEFT JOIN information_schema.constraint_column_usage ccu
              ON ccu.constraint_name = tc.constraint_name
            WHERE tc.table_name = 'roles'
            AND tc.table_schema = 'public'
          `
        });

      if (sqlError) {
        console.log('Could not get constraints via SQL:', sqlError.message);
      } else {
        console.log('Constraints found:', sqlResult);
      }
    } else {
      console.log('Constraints:', constraintData);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkRolesTable(); 