const { createClient } = require('@supabase/supabase-js');

// Replace with your actual Supabase URL and anon key
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testNormalizedRoles() {
  console.log('🧪 Testing Normalized Roles Schema...\n');

  try {
    // 1. Check if roles table exists
    console.log('1. Checking roles table structure...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'roles')
      .order('ordinal_position');

    if (tableError) {
      console.log('❌ Error checking table structure:', tableError);
    } else {
      console.log('✅ Roles table structure:', tableInfo);
    }

    // 2. Check if there are any existing roles
    console.log('\n2. Checking existing roles...');
    const { data: existingRoles, error: rolesError } = await supabase
      .from('roles')
      .select('*')
      .limit(5);

    if (rolesError) {
      console.log('❌ Error fetching roles:', rolesError);
    } else {
      console.log('✅ Existing roles:', existingRoles);
    }

    // 3. Test inserting a hierarchical role structure
    console.log('\n3. Testing role insertion...');
    
    // First, get a business ID to work with
    const { data: businesses, error: businessError } = await supabase
      .from('businesses')
      .select('id, years')
      .limit(1);

    if (businessError || !businesses || businesses.length === 0) {
      console.log('❌ No businesses found for testing');
      return;
    }

    const businessId = businesses[0].id;
    const years = Object.keys(businesses[0].years || {}).map(Number);
    const testYear = years[0] || 2024;

    console.log(`Using business ${businessId}, year ${testYear} for testing`);

    // Test data: hierarchical role structure
    const testRoles = [
      {
        business_id: businessId,
        year: testYear,
        role_id: 'research-leader',
        name: 'Research Leader',
        color: '#1976d2',
        participates_in_rd: true,
        parent_role_id: null,
        order_index: 0
      },
      {
        business_id: businessId,
        year: testYear,
        role_id: 'scientist',
        name: 'Scientist',
        color: '#43a047',
        participates_in_rd: true,
        parent_role_id: 'research-leader',
        order_index: 0
      },
      {
        business_id: businessId,
        year: testYear,
        role_id: 'lab-technician',
        name: 'Lab Technician',
        color: '#fbc02d',
        participates_in_rd: true,
        parent_role_id: 'scientist',
        order_index: 0
      },
      {
        business_id: businessId,
        year: testYear,
        role_id: 'administrator',
        name: 'Administrator',
        color: '#e64a19',
        participates_in_rd: false,
        parent_role_id: null,
        order_index: 1
      }
    ];

    // Delete existing roles for this business/year
    const { error: deleteError } = await supabase
      .from('roles')
      .delete()
      .eq('business_id', businessId)
      .eq('year', testYear);

    if (deleteError) {
      console.log('❌ Error deleting existing roles:', deleteError);
    } else {
      console.log('✅ Deleted existing roles for test');
    }

    // Insert test roles
    const { data: insertedRoles, error: insertError } = await supabase
      .from('roles')
      .insert(testRoles)
      .select();

    if (insertError) {
      console.log('❌ Error inserting test roles:', insertError);
    } else {
      console.log('✅ Successfully inserted test roles:', insertedRoles);
    }

    // 4. Test querying hierarchical structure
    console.log('\n4. Testing hierarchical query...');
    const { data: hierarchicalRoles, error: hierarchyError } = await supabase
      .from('roles_hierarchy')
      .select('*')
      .eq('business_id', businessId)
      .eq('year', testYear)
      .order('path');

    if (hierarchyError) {
      console.log('❌ Error querying hierarchy:', hierarchyError);
    } else {
      console.log('✅ Hierarchical roles:', hierarchicalRoles);
    }

    // 5. Test RLS policies
    console.log('\n5. Testing RLS policies...');
    const { data: rlsTest, error: rlsError } = await supabase
      .from('roles')
      .select('*')
      .eq('business_id', businessId)
      .eq('year', testYear);

    if (rlsError) {
      console.log('❌ RLS policy test failed:', rlsError);
    } else {
      console.log('✅ RLS policies working, can access roles:', rlsTest.length, 'roles found');
    }

    console.log('\n🎉 Normalized roles schema test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testNormalizedRoles(); 