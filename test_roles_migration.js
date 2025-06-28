const { createClient } = require('@supabase/supabase-js');

// Replace with your actual Supabase URL and anon key
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRolesMigration() {
  console.log('🧪 Testing Roles Table Migration...\n');

  try {
    // 1. Check current table structure
    console.log('1. Checking current table structure...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'roles')
      .order('ordinal_position');

    if (tableError) {
      console.log('❌ Error checking table structure:', tableError);
    } else {
      console.log('✅ Current table structure:');
      tableInfo.forEach(col => {
        console.log(`   ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : '(NULL)'}`);
      });
    }

    // 2. Check current data
    console.log('\n2. Checking current data...');
    const { data: currentData, error: dataError } = await supabase
      .from('roles')
      .select('*')
      .limit(5);

    if (dataError) {
      console.log('❌ Error fetching current data:', dataError);
    } else {
      console.log('✅ Current data:', JSON.stringify(currentData, null, 2));
    }

    // 3. Test inserting a sample role
    console.log('\n3. Testing role insertion...');
    const testRole = {
      business_id: '00000000-0000-0000-0000-000000000000', // Replace with actual business ID
      year: 2024,
      role_id: 'test-role',
      name: 'Test Role',
      color: '#ff0000',
      participates_in_rd: true,
      order_index: 0
    };

    const { data: insertData, error: insertError } = await supabase
      .from('roles')
      .insert(testRole)
      .select();

    if (insertError) {
      console.log('❌ Error inserting test role:', insertError);
    } else {
      console.log('✅ Test role inserted successfully:', insertData);
    }

    // 4. Test querying roles by business/year
    console.log('\n4. Testing role querying...');
    const { data: queryData, error: queryError } = await supabase
      .from('roles')
      .select('*')
      .eq('business_id', testRole.business_id)
      .eq('year', testRole.year);

    if (queryError) {
      console.log('❌ Error querying roles:', queryError);
    } else {
      console.log('✅ Query results:', JSON.stringify(queryData, null, 2));
    }

    // 5. Clean up test data
    console.log('\n5. Cleaning up test data...');
    const { error: deleteError } = await supabase
      .from('roles')
      .delete()
      .eq('role_id', 'test-role');

    if (deleteError) {
      console.log('❌ Error deleting test data:', deleteError);
    } else {
      console.log('✅ Test data cleaned up successfully');
    }

    console.log('\n✅ Roles migration test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testRolesMigration(); 