// Simple verification script for business_roles table
// Replace YOUR_SUPABASE_URL and YOUR_ANON_KEY with your actual values

const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // Replace with your Supabase URL
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY'; // Replace with your anon key

async function testBusinessRolesAPI() {
  console.log('Testing business_roles table API...\n');

  // Test 1: Check if table exists and is accessible
  console.log('1. Testing table accessibility...');
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/business_roles?select=*&limit=1`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      console.log('✅ Table is accessible');
    } else {
      console.log(`❌ Table access failed: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.log('Error details:', errorText);
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }

  // Test 2: Test inserting a sample record
  console.log('\n2. Testing record insertion...');
  try {
    const testData = {
      business_id: '00000000-0000-0000-0000-000000000001', // Test UUID
      year: 2024,
      roles: [
        {
          id: 'role1',
          name: 'Software Engineer',
          parentId: null,
          children: []
        }
      ]
    };

    const response = await fetch(`${SUPABASE_URL}/rest/v1/business_roles`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(testData)
    });

    if (response.ok) {
      console.log('✅ Record inserted successfully');
    } else {
      console.log(`❌ Insert failed: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.log('Error details:', errorText);
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }

  // Test 3: Test retrieving records
  console.log('\n3. Testing record retrieval...');
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/business_roles?select=*&order=created_at.desc&limit=5`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Retrieved ${data.length} records`);
      if (data.length > 0) {
        console.log('Sample record:', JSON.stringify(data[0], null, 2));
      }
    } else {
      console.log(`❌ Retrieval failed: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.log('Error details:', errorText);
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }

  console.log('\n✅ Verification complete!');
}

// Instructions for running the test
console.log('To run this verification script:');
console.log('1. Replace YOUR_SUPABASE_URL with your actual Supabase URL');
console.log('2. Replace YOUR_ANON_KEY with your actual anon key');
console.log('3. Run: node test_business_roles_verification.js');
console.log('\nYour Supabase URL and anon key can be found in your Supabase dashboard under Settings > API\n');

// Uncomment the line below to run the test
// testBusinessRolesAPI(); 