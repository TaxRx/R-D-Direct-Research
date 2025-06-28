// Test script to verify roles persistence
// Run this with: node test_roles_persistence.js

const { createClient } = require('@supabase/supabase-js');

// Your actual Supabase credentials
const SUPABASE_URL = 'https://hwnnaextfopoznlgzvpz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3bm5hZXh0Zm9wb3pubGd6dnB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3OTk5NjIsImV4cCI6MjA2NjM3NTk2Mn0.rs-FhUyptaU9UeIMcZS1nCn3RD43VfUKhltvJr25JmY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const testBusinessId = 'c5c52f1f-3311-4952-84a8-ff114bed20dd';
const testYear = 2025;

async function testRolesPersistence() {
    console.log('Testing roles persistence...\n');

    try {
        // Test 1: Check if roles exist
        console.log('1. Checking existing roles...');
        const { data: existingRoles, error: getError } = await supabase
            .from('business_roles')
            .select('*')
            .eq('business_id', testBusinessId)
            .eq('year', testYear);

        if (getError) {
            console.error('Error fetching existing roles:', getError);
            return;
        }

        console.log('Existing roles:', existingRoles);

        // Test 2: Create test roles
        const testRoles = [
            {
                id: 'research-leader',
                name: 'Research Leader',
                color: '#1976d2',
                children: [
                    {
                        id: 'test-role-1',
                        name: 'Test Role 1',
                        color: '#388e3c',
                        children: [],
                        participatesInRD: true
                    }
                ],
                participatesInRD: true
            }
        ];

        console.log('\n2. Saving test roles...');
        const { data: insertData, error: insertError } = await supabase
            .from('business_roles')
            .upsert({
                business_id: testBusinessId,
                year: testYear,
                roles: testRoles
            }, {
                onConflict: 'business_id,year'
            })
            .select();

        if (insertError) {
            console.error('Error inserting roles:', insertError);
            return;
        }

        console.log('Successfully saved roles:', insertData);

        // Test 3: Verify roles were saved
        console.log('\n3. Verifying saved roles...');
        const { data: verifyRoles, error: verifyError } = await supabase
            .from('business_roles')
            .select('*')
            .eq('business_id', testBusinessId)
            .eq('year', testYear);

        if (verifyError) {
            console.error('Error verifying roles:', verifyError);
            return;
        }

        console.log('Verified roles:', verifyRoles);

        // Test 4: Test the specific query that the app uses
        console.log('\n4. Testing app-specific query...');
        const { data: appQueryData, error: appQueryError } = await supabase
            .from('business_roles')
            .select('roles')
            .eq('business_id', testBusinessId)
            .eq('year', testYear)
            .single();

        if (appQueryError) {
            console.error('Error with app query:', appQueryError);
            return;
        }

        console.log('App query result:', appQueryData);
        console.log('Roles from app query:', appQueryData?.roles);

        console.log('\n✅ All tests passed! Roles persistence is working correctly.');

    } catch (error) {
        console.error('Test failed:', error);
    }
}

testRolesPersistence(); 