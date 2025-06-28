const { createClient } = require('@supabase/supabase-js');

// Use the same credentials as in src/services/supabase.ts
const supabaseUrl = 'https://hwnnaextfopoznlgzvpz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3bm5hZXh0Zm9wb3pubGd6dnB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3OTk5NjIsImV4cCI6MjA2NjM3NTk2Mn0.rs-FhUyptaU9UeIMcZS1nCn3RD43VfUKhltvJr25JmY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpsertRoles() {
  try {
    console.log('Testing upsert functionality...\n');

    const businessId = 'c5c52f1f-3311-4952-84a8-ff114bed20dd';
    const year = 2025;

    // Test data with the correct structure
    const testRoles = [
      {
        id: crypto.randomUUID(),
        business_id: businessId,
        year: year,
        role_id: 'test-role-1',
        name: 'Test Research Leader',
        color: '#1976d2',
        participates_in_rd: true,
        parent_role_id: null,
        order_index: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        business_id: businessId,
        year: year,
        role_id: 'test-role-2',
        name: 'Test Scientist',
        color: '#388e3c',
        participates_in_rd: true,
        parent_role_id: 'test-role-1',
        order_index: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    console.log('1. Testing upsert with new constraint...');
    const testInsert = await supabase
      .from('roles')
      .upsert(testRoles, {
        onConflict: ['business_id', 'year', 'role_id']
      });

    if (testInsert.error) {
      console.error('❌ Upsert failed:', testInsert.error);
      return;
    }

    console.log('✅ Upsert successful!');

    // Test updating the same roles
    console.log('\n2. Testing upsert update (same role_id, different name)...');
    const updatedRoles = testRoles.map(role => ({
      ...role,
      name: role.name + ' (Updated)',
      updated_at: new Date().toISOString()
    }));

    const testUpdate = await supabase
      .from('roles')
      .upsert(updatedRoles, {
        onConflict: ['business_id', 'year', 'role_id']
      });

    if (testUpdate.error) {
      console.error('❌ Update failed:', testUpdate.error);
      return;
    }

    console.log('✅ Update successful!');

    // Verify the data
    console.log('\n3. Verifying final data...');
    const { data: finalRoles, error: selectError } = await supabase
      .from('roles')
      .select('*')
      .eq('business_id', businessId)
      .eq('year', year)
      .in('role_id', ['test-role-1', 'test-role-2']);

    if (selectError) {
      console.error('❌ Select failed:', selectError);
      return;
    }

    console.log('Final roles:');
    finalRoles.forEach(role => {
      console.log(`  - ${role.name} (${role.role_id})`);
    });

    // Clean up test data
    console.log('\n4. Cleaning up test data...');
    const { error: deleteError } = await supabase
      .from('roles')
      .delete()
      .eq('business_id', businessId)
      .eq('year', year)
      .in('role_id', ['test-role-1', 'test-role-2']);

    if (deleteError) {
      console.error('❌ Cleanup failed:', deleteError);
      return;
    }

    console.log('✅ Cleanup successful!');
    console.log('\n🎉 All tests passed! Upsert is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testUpsertRoles(); 