// Verification script for new contact fields
// Run this after applying the migration to verify the fields are working

const { createClient } = require('@supabase/supabase-js');

// Use the same credentials as in src/services/supabase.ts
const supabaseUrl = 'https://hwnnaextfopoznlgzvpz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3bm5hZXh0Zm9wb3pubGd6dnB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3OTk5NjIsImV4cCI6MjA2NjM3NTk2Mn0.rs-FhUyptaU9UeIMcZS1nCn3RD43VfUKhltvJr25JmY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyContactFields() {
  console.log('🔍 Verifying new contact fields in Supabase...\n');

  try {
    // 1. Check if the new columns exist
    console.log('1. Checking if new columns exist...');
    const { data: columns, error: columnsError } = await supabase
      .from('businesses')
      .select('mailing_street_address, mailing_city, mailing_state, mailing_zip, website, phone_number')
      .limit(1);

    if (columnsError) {
      console.log('❌ Error checking columns:', columnsError.message);
      return;
    }

    console.log('✅ New contact fields are accessible in the database\n');

    // 2. Get an existing business to use its user_id
    console.log('2. Getting existing business for testing...');
    const { data: existingBusinesses, error: existingError } = await supabase
      .from('businesses')
      .select('user_id')
      .limit(1);

    if (existingError || !existingBusinesses || existingBusinesses.length === 0) {
      console.log('❌ No existing businesses found for testing');
      return;
    }

    const testUserId = existingBusinesses[0].user_id;

    // 3. Test inserting data with new fields
    console.log('3. Testing data insertion with new contact fields...');
    const testBusiness = {
      name: 'Test Business - Contact Fields',
      user_id: testUserId,
      business_type: 'corporation',
      mailing_street_address: '123 Test Street',
      mailing_city: 'Test City',
      mailing_state: 'CA',
      mailing_zip: '90210',
      website: 'https://testbusiness.com',
      phone_number: '(555) 123-4567'
    };

    const { data: insertData, error: insertError } = await supabase
      .from('businesses')
      .insert(testBusiness)
      .select();

    if (insertError) {
      console.log('❌ Error inserting test data:', insertError.message);
      return;
    }

    console.log('✅ Successfully inserted test business with contact fields');
    console.log('   Inserted business ID:', insertData[0].id);

    // 4. Test retrieving the data
    console.log('\n4. Testing data retrieval...');
    const { data: retrievedData, error: retrieveError } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', insertData[0].id)
      .single();

    if (retrieveError) {
      console.log('❌ Error retrieving test data:', retrieveError.message);
      return;
    }

    console.log('✅ Successfully retrieved business with contact fields:');
    console.log('   Street Address:', retrievedData.mailing_street_address);
    console.log('   City:', retrievedData.mailing_city);
    console.log('   State:', retrievedData.mailing_state);
    console.log('   ZIP:', retrievedData.mailing_zip);
    console.log('   Website:', retrievedData.website);
    console.log('   Phone:', retrievedData.phone_number);

    // 5. Test updating the data
    console.log('\n5. Testing data update...');
    const updateData = {
      mailing_street_address: '456 Updated Street',
      mailing_city: 'Updated City',
      mailing_state: 'NY',
      mailing_zip: '10001',
      website: 'https://updatedbusiness.com',
      phone_number: '(555) 987-6543'
    };

    const { data: updatedData, error: updateError } = await supabase
      .from('businesses')
      .update(updateData)
      .eq('id', insertData[0].id)
      .select()
      .single();

    if (updateError) {
      console.log('❌ Error updating test data:', updateError.message);
      return;
    }

    console.log('✅ Successfully updated contact fields:');
    console.log('   Updated Street Address:', updatedData.mailing_street_address);
    console.log('   Updated City:', updatedData.mailing_city);
    console.log('   Updated State:', updatedData.mailing_state);
    console.log('   Updated ZIP:', updatedData.mailing_zip);
    console.log('   Updated Website:', updatedData.website);
    console.log('   Updated Phone:', updatedData.phone_number);

    // 6. Clean up test data
    console.log('\n6. Cleaning up test data...');
    const { error: deleteError } = await supabase
      .from('businesses')
      .delete()
      .eq('id', insertData[0].id);

    if (deleteError) {
      console.log('⚠️  Warning: Could not delete test data:', deleteError.message);
    } else {
      console.log('✅ Test data cleaned up successfully');
    }

    console.log('\n🎉 All contact field tests passed!');
    console.log('\nThe new contact fields are working correctly:');
    console.log('   - mailing_street_address');
    console.log('   - mailing_city');
    console.log('   - mailing_state');
    console.log('   - mailing_zip');
    console.log('   - website');
    console.log('   - phone_number');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

verifyContactFields(); 