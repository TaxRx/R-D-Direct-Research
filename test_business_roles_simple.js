// Simple test script for business_roles table
// This script will test basic CRUD operations

const testBusinessId = 'c5c52f1f-3311-4952-84a8-ff114bed20dd'; // Use the business ID from your error logs
const testYear = 2025;

console.log('Testing business_roles table functionality...');
console.log('Business ID:', testBusinessId);
console.log('Year:', testYear);

// Test data
const testRoles = [
  {
    id: 'research-leader',
    name: 'Research Leader',
    color: '#1976d2',
    children: [
      {
        id: 'researcher-1',
        name: 'Researcher 1',
        color: '#388e3c',
        children: [],
        participatesInRD: true
      }
    ],
    participatesInRD: true
  }
];

// Function to test the API endpoints
async function testBusinessRolesAPI() {
  const baseUrl = 'https://hwnnaextfopoznlgzvpz.supabase.co/rest/v1';
  const headers = {
    'Content-Type': 'application/json',
    'apikey': 'YOUR_ANON_KEY_HERE', // You'll need to replace this with your actual anon key
    'Authorization': 'Bearer YOUR_ANON_KEY_HERE' // You'll need to replace this with your actual anon key
  };

  console.log('\n1. Testing GET request...');
  try {
    const response = await fetch(`${baseUrl}/business_roles?select=*&business_id=eq.${testBusinessId}&year=eq.${testYear}`, {
      method: 'GET',
      headers
    });
    console.log('GET Response status:', response.status);
    console.log('GET Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('GET Response data:', data);
    } else {
      const errorText = await response.text();
      console.log('GET Error response:', errorText);
    }
  } catch (error) {
    console.error('GET Error:', error);
  }

  console.log('\n2. Testing POST request...');
  try {
    const response = await fetch(`${baseUrl}/business_roles`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        business_id: testBusinessId,
        year: testYear,
        roles: testRoles
      })
    });
    console.log('POST Response status:', response.status);
    console.log('POST Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('POST Response data:', data);
    } else {
      const errorText = await response.text();
      console.log('POST Error response:', errorText);
    }
  } catch (error) {
    console.error('POST Error:', error);
  }
}

// Instructions for running the test
console.log('\n=== INSTRUCTIONS ===');
console.log('1. Replace "YOUR_ANON_KEY_HERE" with your actual Supabase anon key');
console.log('2. Run the SQL fix script first: fix_business_roles_complete.sql');
console.log('3. Then run this test script');
console.log('4. Check the console output for any errors');

// Uncomment the line below to run the test
// testBusinessRolesAPI(); 