const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Supabase connection details from your app
const supabaseUrl = 'https://hwnnaextfopoznlgzvpz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3bm5hZXh0Zm9wb3pubGd6dnB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3OTk5NjIsImV4cCI6MjA2NjM3NTk2Mn0.rs-FhUyptaU9UeIMcZS1nCn3RD43VfUKhltvJr25JmY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runMigration() {
  try {
    console.log('🚀 Starting database migration...');
    
    // Read the migration SQL file
    const migrationSQL = fs.readFileSync('fix_businesses_table.sql', 'utf8');
    
    console.log('📋 Migration SQL:');
    console.log(migrationSQL);
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Executing ${statements.length} SQL statements...`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`\n${i + 1}. Executing: ${statement.substring(0, 50)}...`);
      
      const { data, error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        console.error(`❌ Error executing statement ${i + 1}:`, error);
        // Continue with other statements
      } else {
        console.log(`✅ Statement ${i + 1} executed successfully`);
      }
    }
    
    // Verify the migration by checking the table structure
    console.log('\n🔍 Verifying migration...');
    
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'businesses')
      .order('ordinal_position');
    
    if (tableError) {
      console.error('❌ Error checking table structure:', tableError);
    } else {
      console.log('📊 Current businesses table structure:');
      tableInfo.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'} ${col.column_default ? `default: ${col.column_default}` : ''}`);
      });
    }
    
    // Check if the new columns exist
    const expectedColumns = ['dba_name', 'ein', 'owners', 'tab_approvals', 'is_controlled_group', 'is_control_group_leader'];
    const existingColumns = tableInfo.map(col => col.column_name);
    
    console.log('\n✅ Migration verification:');
    expectedColumns.forEach(col => {
      if (existingColumns.includes(col)) {
        console.log(`  ✅ ${col} - EXISTS`);
      } else {
        console.log(`  ❌ ${col} - MISSING`);
      }
    });
    
    console.log('\n🎉 Migration completed!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
