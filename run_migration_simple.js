const { createClient } = require('@supabase/supabase-js');

// Supabase connection details from your app
const supabaseUrl = 'https://hwnnaextfopoznlgzvpz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3bm5hZXh0Zm9wb3pubGd6dnB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3OTk5NjIsImV4cCI6MjA2NjM3NTk2Mn0.rs-FhUyptaU9UeIMcZS1nCn3RD43VfUKhltvJr25JmY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runMigration() {
  try {
    console.log('🚀 Starting database migration...');
    
    // First, let's check the current table structure
    console.log('🔍 Checking current table structure...');
    
    const { data: currentBusinesses, error: checkError } = await supabase
      .from('businesses')
      .select('*')
      .limit(1);
    
    if (checkError) {
      console.error('❌ Error checking businesses table:', checkError);
      return;
    }
    
    console.log('✅ Businesses table exists and is accessible');
    
    // Now let's add the missing columns one by one
    console.log('\n📝 Adding missing columns...');
    
    // 1. Add dba_name column
    console.log('1. Adding dba_name column...');
    const { error: dbaError } = await supabase
      .from('businesses')
      .update({ dba_name: '' })
      .eq('dba_name', null);
    
    if (dbaError && !dbaError.message.includes('column "dba_name" does not exist')) {
      console.log('✅ dba_name column already exists or was added');
    } else if (dbaError) {
      console.log('ℹ️ dba_name column needs to be added via SQL');
    }
    
    // 2. Add ein column
    console.log('2. Adding ein column...');
    const { error: einError } = await supabase
      .from('businesses')
      .update({ ein: '' })
      .eq('ein', null);
    
    if (einError && !einError.message.includes('column "ein" does not exist')) {
      console.log('✅ ein column already exists or was added');
    } else if (einError) {
      console.log('ℹ️ ein column needs to be added via SQL');
    }
    
    // 3. Add owners column
    console.log('3. Adding owners column...');
    const { error: ownersError } = await supabase
      .from('businesses')
      .update({ owners: [] })
      .eq('owners', null);
    
    if (ownersError && !ownersError.message.includes('column "owners" does not exist')) {
      console.log('✅ owners column already exists or was added');
    } else if (ownersError) {
      console.log('ℹ️ owners column needs to be added via SQL');
    }
    
    // 4. Add tab_approvals column
    console.log('4. Adding tab_approvals column...');
    const defaultTabApprovals = {
      basicInfo: { isApproved: false, approvedAt: "", approvedBy: "" },
      ownership: { isApproved: false, approvedAt: "", approvedBy: "" },
      financial: { isApproved: false, approvedAt: "", approvedBy: "" }
    };
    
    const { error: approvalsError } = await supabase
      .from('businesses')
      .update({ tab_approvals: defaultTabApprovals })
      .eq('tab_approvals', null);
    
    if (approvalsError && !approvalsError.message.includes('column "tab_approvals" does not exist')) {
      console.log('✅ tab_approvals column already exists or was added');
    } else if (approvalsError) {
      console.log('ℹ️ tab_approvals column needs to be added via SQL');
    }
    
    // 5. Add is_controlled_group column
    console.log('5. Adding is_controlled_group column...');
    const { error: controlledError } = await supabase
      .from('businesses')
      .update({ is_controlled_group: false })
      .eq('is_controlled_group', null);
    
    if (controlledError && !controlledError.message.includes('column "is_controlled_group" does not exist')) {
      console.log('✅ is_controlled_group column already exists or was added');
    } else if (controlledError) {
      console.log('ℹ️ is_controlled_group column needs to be added via SQL');
    }
    
    // 6. Add is_control_group_leader column
    console.log('6. Adding is_control_group_leader column...');
    const { error: leaderError } = await supabase
      .from('businesses')
      .update({ is_control_group_leader: false })
      .eq('is_control_group_leader', null);
    
    if (leaderError && !leaderError.message.includes('column "is_control_group_leader" does not exist')) {
      console.log('✅ is_control_group_leader column already exists or was added');
    } else if (leaderError) {
      console.log('ℹ️ is_control_group_leader column needs to be added via SQL');
    }
    
    // Now let's verify by trying to select all columns
    console.log('\n🔍 Verifying migration by testing column access...');
    
    const { data: testData, error: testError } = await supabase
      .from('businesses')
      .select('id, name, dba_name, ein, owners, tab_approvals, is_controlled_group, is_control_group_leader')
      .limit(1);
    
    if (testError) {
      console.log('❌ Some columns are still missing:', testError.message);
      console.log('\n💡 You may need to run the SQL migration manually in your Supabase dashboard:');
      console.log('\nGo to your Supabase dashboard > SQL Editor and run:');
      console.log('\n' + '='.repeat(50));
      console.log(`
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
      `);
      console.log('='.repeat(50));
    } else {
      console.log('✅ All columns are accessible! Migration successful!');
      console.log('📊 Sample data structure:', testData[0]);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

runMigration();
