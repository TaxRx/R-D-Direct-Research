// Comprehensive Business Roles Debug Test Script
// This script tests all business_roles API endpoints to verify they work correctly

const { createClient } = require('@supabase/supabase-js');

// Replace with your actual Supabase URL and anon key
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test data
const testBusinessId = '00000000-0000-0000-0000-000000000001'; // Replace with actual business ID
const testYear = 2024;
const testRoles = [
  {
    id: "1",
    name: "Software Engineer",
    color: "#1976d2",
    participatesInRd: true,
    children: []
  },
  {
    id: "2",
    name: "Research Scientist", 
    color: "#388e3c",
    participatesInRd: true,
    children: []
  }
];

async function testBusinessRolesAPI() {
  console.log('🚀 Starting Business Roles API Tests...\n');

  try {
    // Test 1: Check if table exists
    console.log('📋 Test 1: Checking if business_roles table exists...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('business_roles')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.log('❌ Table check failed:', tableError.message);
      return;
    }
    console.log('✅ Table exists and is accessible\n');

    // Test 2: Test GET request (should return empty array if no data)
    console.log('📤 Test 2: Testing GET request...');
    const { data: getData, error: getError } = await supabase
      .from('business_roles')
      .select('*')
      .eq('business_id', testBusinessId)
      .eq('year', testYear);

    if (getError) {
      console.log('❌ GET request failed:', getError.message);
    } else {
      console.log('✅ GET request successful');
      console.log('   Data:', getData);
    }
    console.log('');

    // Test 3: Test POST request (insert new record)
    console.log('📝 Test 3: Testing POST request (insert)...');
    const { data: postData, error: postError } = await supabase
      .from('business_roles')
      .insert({
        business_id: testBusinessId,
        year: testYear,
        roles: testRoles
      })
      .select();

    if (postError) {
      console.log('❌ POST request failed:', postError.message);
      console.log('   Error details:', postError);
    } else {
      console.log('✅ POST request successful');
      console.log('   Inserted data:', postData);
    }
    console.log('');

    // Test 4: Test GET request again (should return the inserted data)
    console.log('📤 Test 4: Testing GET request after insert...');
    const { data: getData2, error: getError2 } = await supabase
      .from('business_roles')
      .select('*')
      .eq('business_id', testBusinessId)
      .eq('year', testYear);

    if (getError2) {
      console.log('❌ GET request failed:', getError2.message);
    } else {
      console.log('✅ GET request successful');
      console.log('   Retrieved data:', getData2);
    }
    console.log('');

    // Test 5: Test PUT request (update existing record)
    console.log('🔄 Test 5: Testing PUT request (update)...');
    const updatedRoles = [
      ...testRoles,
      {
        id: "3",
        name: "Data Scientist",
        color: "#ff9800",
        participatesInRd: true,
        children: []
      }
    ];

    const { data: putData, error: putError } = await supabase
      .from('business_roles')
      .update({
        roles: updatedRoles,
        updated_at: new Date().toISOString()
      })
      .eq('business_id', testBusinessId)
      .eq('year', testYear)
      .select();

    if (putError) {
      console.log('❌ PUT request failed:', putError.message);
    } else {
      console.log('✅ PUT request successful');
      console.log('   Updated data:', putData);
    }
    console.log('');

    // Test 6: Test GET request one more time (should return updated data)
    console.log('📤 Test 6: Testing GET request after update...');
    const { data: getData3, error: getError3 } = await supabase
      .from('business_roles')
      .select('*')
      .eq('business_id', testBusinessId)
      .eq('year', testYear);

    if (getError3) {
      console.log('❌ GET request failed:', getError3.message);
    } else {
      console.log('✅ GET request successful');
      console.log('   Final data:', getData3);
    }
    console.log('');

    // Test 7: Test DELETE request
    console.log('🗑️ Test 7: Testing DELETE request...');
    const { data: deleteData, error: deleteError } = await supabase
      .from('business_roles')
      .delete()
      .eq('business_id', testBusinessId)
      .eq('year', testYear)
      .select();

    if (deleteError) {
      console.log('❌ DELETE request failed:', deleteError.message);
    } else {
      console.log('✅ DELETE request successful');
      console.log('   Deleted data:', deleteData);
    }
    console.log('');

    // Test 8: Verify deletion
    console.log('🔍 Test 8: Verifying deletion...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('business_roles')
      .select('*')
      .eq('business_id', testBusinessId)
      .eq('year', testYear);

    if (verifyError) {
      console.log('❌ Verification failed:', verifyError.message);
    } else {
      console.log('✅ Verification successful');
      console.log('   Remaining data:', verifyData);
      if (verifyData.length === 0) {
        console.log('   ✅ Data was successfully deleted');
      }
    }
    console.log('');

    console.log('🎉 All tests completed!');

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Test authentication
async function testAuthentication() {
  console.log('🔐 Testing Authentication...\n');
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.log('❌ Authentication failed:', error.message);
      console.log('   You may need to sign in or check your credentials');
    } else {
      console.log('✅ Authentication successful');
      console.log('   User ID:', user?.id);
      console.log('   Email:', user?.email);
    }
    console.log('');
  } catch (error) {
    console.error('💥 Authentication test error:', error);
  }
}

// Main execution
async function main() {
  console.log('🔧 Business Roles API Debug Test Suite\n');
  console.log('Make sure to:');
  console.log('1. Replace SUPABASE_URL and SUPABASE_ANON_KEY with your actual values');
  console.log('2. Replace testBusinessId with an actual business ID from your database');
  console.log('3. Run the debug_supabase_setup.sql script in Supabase SQL Editor first\n');

  await testAuthentication();
  await testBusinessRolesAPI();
}

// Run the tests
main().catch(console.error); 