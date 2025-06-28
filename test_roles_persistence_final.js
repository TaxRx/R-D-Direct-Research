const { createClient } = require('@supabase/supabase-js');

// Use the same credentials as in src/services/supabase.ts
const supabaseUrl = 'https://hwnnaextfopoznlgzvpz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3bm5hZXh0Zm9wb3pubGd6dnB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3OTk5NjIsImV4cCI6MjA2NjM3NTk2Mn0.rs-FhUyptaU9UeIMcZS1nCn3RD43VfUKhltvJr25JmY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRolesPersistence() {
  try {
    console.log('Testing roles persistence...\n');

    const businessId = 'c5c52f1f-3311-4952-84a8-ff114bed20dd';
    const year = 2025;

    // Step 1: Check current roles
    console.log('1. Checking current roles...');
    const { data: currentRoles, error: loadError } = await supabase
      .from('roles')
      .select('*')
      .eq('business_id', businessId)
      .eq('year', year);

    if (loadError) {
      console.error('Error loading roles:', loadError);
      return;
    }

    console.log(`Found ${currentRoles.length} roles for business ${businessId}, year ${year}:`);
    currentRoles.forEach(role => {
      console.log(`  - ${role.name} (${role.role_id})`);
    });

    // Step 2: Create a test role
    console.log('\n2. Creating a test role...');
    const testRole = {
      business_id: businessId,
      year: year,
      role_id: `test-role-${Date.now()}`,
      name: 'Test Role',
      color: '#ff5722',
      participates_in_rd: true,
      parent_role_id: null,
      order_index: 1
    };

    const { data: insertedRole, error: insertError } = await supabase
      .from('roles')
      .insert(testRole)
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting test role:', insertError);
      return;
    }

    console.log('Successfully created test role:', insertedRole.name);

    // Step 3: Verify the role was saved
    console.log('\n3. Verifying role was saved...');
    const { data: savedRoles, error: verifyError } = await supabase
      .from('roles')
      .select('*')
      .eq('business_id', businessId)
      .eq('year', year);

    if (verifyError) {
      console.error('Error verifying roles:', verifyError);
      return;
    }

    console.log(`Found ${savedRoles.length} roles after insert:`);
    savedRoles.forEach(role => {
      console.log(`  - ${role.name} (${role.role_id})`);
    });

    // Step 4: Clean up test role
    console.log('\n4. Cleaning up test role...');
    const { error: deleteError } = await supabase
      .from('roles')
      .delete()
      .eq('role_id', testRole.role_id);

    if (deleteError) {
      console.error('Error deleting test role:', deleteError);
    } else {
      console.log('Successfully cleaned up test role');
    }

    // Step 5: Final verification
    console.log('\n5. Final verification...');
    const { data: finalRoles, error: finalError } = await supabase
      .from('roles')
      .select('*')
      .eq('business_id', businessId)
      .eq('year', year);

    if (finalError) {
      console.error('Error in final verification:', finalError);
      return;
    }

    console.log(`Final role count: ${finalRoles.length}`);
    console.log('✅ Roles persistence test completed successfully!');

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testRolesPersistence(); 