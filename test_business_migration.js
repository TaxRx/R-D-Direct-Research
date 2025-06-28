const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testBusinessMigration() {
  try {
    console.log('🔍 Testing business migration...');
    
    // First, let's check the current table structure
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'businesses')
      .order('ordinal_position');

    if (tableError) {
      console.error('Error checking table structure:', tableError);
      return;
    }

    console.log('📋 Current businesses table columns:');
    tableInfo.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // Check if we have any existing businesses
    const { data: businesses, error: businessesError } = await supabase
      .from('businesses')
      .select('*')
      .limit(5);

    if (businessesError) {
      console.error('Error fetching businesses:', businessesError);
      return;
    }

    console.log(`\n📊 Found ${businesses.length} businesses in database`);
    
    if (businesses.length > 0) {
      console.log('📝 Sample business data:');
      const sample = businesses[0];
      console.log(JSON.stringify(sample, null, 2));
    }

    // Test creating a new business with all fields
    const testBusiness = {
      name: 'Test Business Migration',
      dba_name: 'Test DBA',
      ein: '12-3456789',
      business_type: 'corporation',
      entity_state: 'CA',
      start_year: 2023,
      owners: [
        {
          id: '1',
          name: 'John Doe',
          ownershipPercentage: 100,
          isResearchLeader: true
        }
      ],
      financial_history: [
        {
          year: 2023,
          grossReceipts: 1000000,
          qre: 500000
        }
      ],
      tab_approvals: {
        basicInfo: { isApproved: true, approvedAt: new Date().toISOString(), approvedBy: 'test' },
        ownership: { isApproved: false, approvedAt: '', approvedBy: '' },
        financial: { isApproved: false, approvedAt: '', approvedBy: '' }
      },
      is_controlled_group: false,
      is_control_group_leader: false,
      is_active: true
    };

    console.log('\n�� Testing business creation with all fields...');
    const { data: newBusiness, error: createError } = await supabase
      .from('businesses')
      .insert(testBusiness)
      .select()
      .single();

    if (createError) {
      console.error('Error creating test business:', createError);
      return;
    }

    console.log('✅ Successfully created test business:');
    console.log(JSON.stringify(newBusiness, null, 2));

    // Test updating the business
    const updateData = {
      dba_name: 'Updated DBA Name',
      ein: '98-7654321',
      owners: [
        {
          id: '1',
          name: 'Jane Smith',
          ownershipPercentage: 60,
          isResearchLeader: true
        },
        {
          id: '2',
          name: 'Bob Johnson',
          ownershipPercentage: 40,
          isResearchLeader: false
        }
      ],
      tab_approvals: {
        basicInfo: { isApproved: true, approvedAt: new Date().toISOString(), approvedBy: 'test' },
        ownership: { isApproved: true, approvedAt: new Date().toISOString(), approvedBy: 'test' },
        financial: { isApproved: false, approvedAt: '', approvedBy: '' }
      },
      is_controlled_group: true,
      is_control_group_leader: true
    };

    console.log('\n🔄 Testing business update...');
    const { data: updatedBusiness, error: updateError } = await supabase
      .from('businesses')
      .update(updateData)
      .eq('id', business.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating test business:', updateError);
      return;
    }

    console.log('✅ Successfully updated test business:');
    console.log(JSON.stringify(updatedBusiness, null, 2));

    // Clean up - delete the test business
    console.log('\n🧹 Cleaning up test business...');
    const { error: deleteError } = await supabase
      .from('businesses')
      .delete()
      .eq('id', newBusiness.id);

    if (deleteError) {
      console.error('Error deleting test business:', deleteError);
    } else {
      console.log('✅ Test business deleted successfully');
    }

    console.log('\n🎉 Business migration test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testBusinessMigration();
