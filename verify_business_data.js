const { createClient } = require('@supabase/supabase-js');

// Supabase connection details
const supabaseUrl = 'https://hwnnaextfopoznlgzvpz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3bm5hZXh0Zm9wb3pubGd6dnB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3OTk5NjIsImV4cCI6MjA2NjM3NTk2Mn0.rs-FhUyptaU9UeIMcZS1nCn3RD43VfUKhltvJr25JmY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyBusinessData() {
  try {
    console.log('🔍 Verifying Business Data in Supabase...\n');
    
    // Get all businesses
    const { data: businesses, error } = await supabase
      .from('businesses')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching businesses:', error);
      return;
    }
    
    if (!businesses || businesses.length === 0) {
      console.log('⚠️  No businesses found in database');
      return;
    }
    
    console.log(`✅ Found ${businesses.length} business(es) in database\n`);
    
    // Check each business
    businesses.forEach((business, index) => {
      console.log(`📋 Business ${index + 1}: ${business.name || 'Unnamed'}`);
      console.log(`   ID: ${business.id}`);
      console.log(`   DBA Name: ${business.dba_name || 'Not set'}`);
      console.log(`   EIN: ${business.ein || 'Not set'}`);
      console.log(`   Entity Type: ${business.business_type || 'Not set'}`);
      console.log(`   Entity State: ${business.entity_state || 'Not set'}`);
      console.log(`   Start Year: ${business.start_year || 'Not set'}`);
      console.log(`   Controlled Group: ${business.is_controlled_group ? 'Yes' : 'No'}`);
      console.log(`   Control Group Leader: ${business.is_control_group_leader ? 'Yes' : 'No'}`);
      
      // Check owners
      if (business.owners && business.owners.length > 0) {
        console.log(`   Owners: ${business.owners.length} owner(s) defined`);
        business.owners.forEach((owner, i) => {
          console.log(`     Owner ${i + 1}: ${owner.name || 'Unnamed'} (${owner.percentage || 0}%)`);
        });
      } else {
        console.log(`   Owners: No owners defined`);
      }
      
      // Check tab approvals
      if (business.tab_approvals) {
        console.log(`   Tab Approvals:`);
        Object.entries(business.tab_approvals).forEach(([tab, approval]) => {
          const status = approval.isApproved ? '✅ Approved' : '❌ Not Approved';
          console.log(`     ${tab}: ${status}`);
          if (approval.isApproved) {
            console.log(`       Approved by: ${approval.approvedBy || 'Unknown'}`);
            console.log(`       Approved at: ${approval.approvedAt || 'Unknown'}`);
          }
        });
      } else {
        console.log(`   Tab Approvals: No approval data`);
      }
      
      console.log(`   Created: ${business.created_at}`);
      console.log(`   Updated: ${business.updated_at}`);
      console.log('');
    });
    
    // Check if all required columns exist
    console.log('🔧 Checking database schema...');
    const sampleBusiness = businesses[0];
    const requiredColumns = [
      'dba_name', 'ein', 'owners', 'tab_approvals', 
      'is_controlled_group', 'is_control_group_leader'
    ];
    
    const missingColumns = requiredColumns.filter(col => 
      !(col in sampleBusiness)
    );
    
    if (missingColumns.length > 0) {
      console.log(`❌ Missing columns: ${missingColumns.join(', ')}`);
      console.log('   You may need to run the database migration again');
    } else {
      console.log('✅ All required columns are present');
    }
    
  } catch (error) {
    console.error('❌ Error during verification:', error);
  }
}

// Run the verification
verifyBusinessData(); 