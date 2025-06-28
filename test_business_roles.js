const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testBusinessRoles() {
  console.log('Testing business_roles table...\n');

  // Test 1: Check if table exists
  console.log('1. Checking if business_roles table exists...');
  try {
    const { data, error } = await supabase
      .from('business_roles')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Table access error:', error.message);
      console.log('   Error code:', error.code);
      console.log('   Error details:', error.details);
    } else {
      console.log('✅ Table exists and is accessible');
    }
  } catch (err) {
    console.log('❌ Exception:', err.message);
  }

  // Test 2: Try to get a specific business roles
  console.log('\n2. Testing SELECT query...');
  try {
    const { data, error } = await supabase
      .from('business_roles')
      .select('roles')
      .eq('business_id', 'c5c52f1f-3311-4952-84a8-ff114bed20dd')
      .eq('year', 2025)
      .single();
    
    if (error) {
      console.log('❌ SELECT error:', error.message);
      console.log('   Error code:', error.code);
    } else {
      console.log('✅ SELECT successful');
      console.log('   Data:', data);
    }
  } catch (err) {
    console.log('❌ SELECT exception:', err.message);
  }

  // Test 3: Try to insert a test record
  console.log('\n3. Testing INSERT query...');
  try {
    const testRoles = [
      {
        id: 'test-role-1',
        name: 'Test Role',
        children: []
      }
    ];

    const { data, error } = await supabase
      .from('business_roles')
      .insert({
        business_id: 'c5c52f1f-3311-4952-84a8-ff114bed20dd',
        year: 2025,
        roles: testRoles
      })
      .select();
    
    if (error) {
      console.log('❌ INSERT error:', error.message);
      console.log('   Error code:', error.code);
      console.log('   Error details:', error.details);
    } else {
      console.log('✅ INSERT successful');
      console.log('   Inserted data:', data);
    }
  } catch (err) {
    console.log('❌ INSERT exception:', err.message);
  }

  // Test 4: Check authentication status
  console.log('\n4. Checking authentication status...');
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    console.log('✅ User is authenticated');
    console.log('   User ID:', user.id);
  } else {
    console.log('❌ User is not authenticated');
  }

  // Test 5: Check if the business exists and belongs to the user
  console.log('\n5. Checking business ownership...');
  try {
    const { data, error } = await supabase
      .from('businesses')
      .select('id, name, user_id')
      .eq('id', 'c5c52f1f-3311-4952-84a8-ff114bed20dd');
    
    if (error) {
      console.log('❌ Business query error:', error.message);
    } else if (data && data.length > 0) {
      console.log('✅ Business found');
      console.log('   Business name:', data[0].name);
      console.log('   Business user_id:', data[0].user_id);
      console.log('   Current user_id:', user?.id);
      console.log('   Ownership match:', data[0].user_id === user?.id);
    } else {
      console.log('❌ Business not found');
    }
  } catch (err) {
    console.log('❌ Business query exception:', err.message);
  }
}

testBusinessRoles().catch(console.error); 