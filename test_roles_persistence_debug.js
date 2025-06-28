const { createClient } = require('@supabase/supabase-js');

// Replace with your actual Supabase URL and anon key
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugRolesPersistence() {
  console.log('🔍 Debugging Roles Persistence Issues...\n');

  try {
    // 1. Check if business_roles table exists and has data
    console.log('1. Checking business_roles table...');
    const { data: rolesData, error: rolesError } = await supabase
      .from('business_roles')
      .select('*');

    if (rolesError) {
      console.log('❌ Error fetching roles:', rolesError);
    } else {
      console.log('✅ Roles in database:', JSON.stringify(rolesData, null, 2));
    }

    // 2. Check businesses table for business_id
    console.log('\n2. Checking businesses table...');
    const { data: businessesData, error: businessesError } = await supabase
      .from('businesses')
      .select('id, name, user_id');

    if (businessesError) {
      console.log('❌ Error fetching businesses:', businessesError);
    } else {
      console.log('✅ Businesses in database:', JSON.stringify(businessesData, null, 2));
    }

    // 3. Test inserting a new role
    if (businessesData && businessesData.length > 0) {
      const testBusinessId = businessesData[0].id;
      const testYear = 2024;
      
      console.log(`\n3. Testing role insertion for business ${testBusinessId}, year ${testYear}...`);
      
      const testRole = {
        business_id: testBusinessId,
        year: testYear,
        role_id: 'test-role-' + Date.now(),
        name: 'Test Role',
        color: '#ff0000',
        children: [],
        participatesInRD: true,
        parent_id: null
      };

      const { data: insertData, error: insertError } = await supabase
        .from('business_roles')
        .insert(testRole)
        .select();

      if (insertError) {
        console.log('❌ Error inserting test role:', insertError);
      } else {
        console.log('✅ Successfully inserted test role:', JSON.stringify(insertData, null, 2));
        
        // 4. Test fetching the inserted role
        console.log('\n4. Testing role retrieval...');
        const { data: fetchData, error: fetchError } = await supabase
          .from('business_roles')
          .select('*')
          .eq('business_id', testBusinessId)
          .eq('year', testYear);

        if (fetchError) {
          console.log('❌ Error fetching inserted role:', fetchError);
        } else {
          console.log('✅ Retrieved roles:', JSON.stringify(fetchData, null, 2));
        }

        // 5. Clean up test data
        console.log('\n5. Cleaning up test data...');
        const { error: deleteError } = await supabase
          .from('business_roles')
          .delete()
          .eq('role_id', testRole.role_id);

        if (deleteError) {
          console.log('❌ Error deleting test role:', deleteError);
        } else {
          console.log('✅ Successfully cleaned up test data');
        }
      }
    }

    // 6. Check RLS policies
    console.log('\n6. Checking RLS policies...');
    const { data: policiesData, error: policiesError } = await supabase
      .rpc('get_policies', { table_name: 'business_roles' });

    if (policiesError) {
      console.log('❌ Error fetching policies (this is normal if function doesn\'t exist):', policiesError.message);
      console.log('💡 You can check RLS policies manually in Supabase dashboard');
    } else {
      console.log('✅ RLS policies:', JSON.stringify(policiesData, null, 2));
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the debug function
debugRolesPersistence(); 