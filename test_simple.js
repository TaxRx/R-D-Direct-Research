// Simple test script for business_roles API
// Run this with: node test_simple.js

const { createClient } = require('@supabase/supabase-js');

// Your actual Supabase credentials
const SUPABASE_URL = 'https://hwnnaextfopoznlgzvpz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3bm5hZXh0Zm9wb3pubGd6dnB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3OTk5NjIsImV4cCI6MjA2NjM3NTk2Mn0.rs-FhUyptaU9UeIMcZS1nCn3RD43VfUKhltvJr25JmY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const testBusinessId = 'c5c52f1f-3311-4952-84a8-ff114bed20dd';
const testYear = 2025;

async function testAPI() {
    console.log('Testing business_roles API...\n');

    try {
        // Test 1: GET request to check if data exists
        console.log('1. Testing GET request...');
        const { data: getData, error: getError } = await supabase
            .from('business_roles')
            .select('roles')
            .eq('business_id', testBusinessId)
            .eq('year', testYear)
            .single();

        if (getError) {
            console.log('GET Error:', getError);
        } else {
            console.log('GET Success:', getData);
        }

        // Test 2: POST request to create/update data
        console.log('\n2. Testing POST request...');
        const testRoles = [
            {
                id: "1",
                name: "Research Leader",
                color: "#1976d2",
                participatesInRd: true,
                children: []
            },
            {
                id: "2", 
                name: "Software Engineer",
                color: "#388e3c",
                participatesInRd: true,
                children: []
            }
        ];

        const { data: postData, error: postError } = await supabase
            .from('business_roles')
            .upsert({
                business_id: testBusinessId,
                year: testYear,
                roles: testRoles
            })
            .select();

        if (postError) {
            console.log('POST Error:', postError);
        } else {
            console.log('POST Success:', postData);
        }

        // Test 3: Verify the data was saved
        console.log('\n3. Verifying saved data...');
        const { data: verifyData, error: verifyError } = await supabase
            .from('business_roles')
            .select('*')
            .eq('business_id', testBusinessId)
            .eq('year', testYear);

        if (verifyError) {
            console.log('Verify Error:', verifyError);
        } else {
            console.log('Verify Success:', verifyData);
        }

    } catch (error) {
        console.error('Test failed:', error);
    }
}

// Run the test
testAPI(); 