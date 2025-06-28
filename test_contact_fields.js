// Simple test script for new contact fields
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hwnnaextfopoznlgzvpz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3bm5hZXh0Zm9wb3pubGd6dnB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3OTk5NjIsImV4cCI6MjA2NjM3NTk2Mn0.rs-FhUyptaU9UeIMcZS1nCn3RD43VfUKhltvJr25JmY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testContactFields() {
  console.log('🔍 Testing new contact fields...\n');

  try {
    // 1. Check if columns exist
    console.log('1. Checking if new columns exist...');
    const { data, error } = await supabase
      .from('businesses')
      .select('mailing_street_address, mailing_city, mailing_state, mailing_zip, website, phone_number')
      .limit(1);

    if (error) {
      console.log('❌ Error:', error.message);
      return;
    }

    console.log('✅ New contact fields are accessible!\n');

    // 2. Check existing businesses
    console.log('2. Checking existing businesses...');
    const { data: businesses, error: businessesError } = await supabase
      .from('businesses')
      .select('id, name, mailing_street_address, mailing_city, mailing_state, mailing_zip, website, phone_number')
      .limit(5);

    if (businessesError) {
      console.log('❌ Error fetching businesses:', businessesError.message);
      return;
    }

    console.log(`✅ Found ${businesses.length} businesses`);
    businesses.forEach((business, index) => {
      console.log(`\nBusiness ${index + 1}: ${business.name}`);
      console.log(`  Street: "${business.mailing_street_address || 'Not set'}"`);
      console.log(`  City: "${business.mailing_city || 'Not set'}"`);
      console.log(`  State: "${business.mailing_state || 'Not set'}"`);
      console.log(`  ZIP: "${business.mailing_zip || 'Not set'}"`);
      console.log(`  Website: "${business.website || 'Not set'}"`);
      console.log(`  Phone: "${business.phone_number || 'Not set'}"`);
    });

    console.log('\n🎉 Contact fields test completed!');
    console.log('\nThe new fields are working correctly in the database.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testContactFields(); 