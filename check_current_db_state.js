const { createClient } = require('@supabase/supabase-js');

// Use the same credentials as in src/services/supabase.ts
const supabaseUrl = 'https://hwnnaextfopoznlgzvpz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3bm5hZXh0Zm9wb3pubGd6dnB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3OTk5NjIsImV4cCI6MjA2NjM3NTk2Mn0.rs-FhUyptaU9UeIMcZS1nCn3RD43VfUKhltvJr25JmY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDatabaseState() {
  console.log('=== Checking Current Database State ===\n');

  try {
    // Check if businesses table exists and has qra_data column
    console.log('1. Checking businesses table...');
    const { data: businesses, error: businessesError } = await supabase
      .from('businesses')
      .select('id, name, qra_data')
      .limit(3);

    if (businessesError) {
      console.error('Error accessing businesses table:', businessesError);
    } else {
      console.log(`Found ${businesses?.length || 0} businesses`);
      if (businesses && businesses.length > 0) {
        console.log('Sample business qra_data:', businesses[0].qra_data ? 'exists' : 'null');
      }
    }

    // Check if qra_activities table exists
    console.log('\n2. Checking qra_activities table...');
    const { data: qraActivities, error: qraError } = await supabase
      .from('qra_activities')
      .select('*')
      .limit(3);

    if (qraError) {
      console.error('Error accessing qra_activities table:', qraError);
    } else {
      console.log(`Found ${qraActivities?.length || 0} QRA activities`);
      if (qraActivities && qraActivities.length > 0) {
        console.log('Sample QRA activity:', qraActivities[0]);
      }
    }

    // Check if qra_steps table exists
    console.log('\n3. Checking qra_steps table...');
    const { data: qraSteps, error: stepsError } = await supabase
      .from('qra_steps')
      .select('*')
      .limit(3);

    if (stepsError) {
      console.error('Error accessing qra_steps table:', stepsError);
    } else {
      console.log(`Found ${qraSteps?.length || 0} QRA steps`);
    }

    // Check if qra_subcomponents table exists
    console.log('\n4. Checking qra_subcomponents table...');
    const { data: qraSubcomponents, error: subcomponentsError } = await supabase
      .from('qra_subcomponents')
      .select('*')
      .limit(3);

    if (subcomponentsError) {
      console.error('Error accessing qra_subcomponents table:', subcomponentsError);
    } else {
      console.log(`Found ${qraSubcomponents?.length || 0} QRA subcomponents`);
    }

    // Check research_api_activities table
    console.log('\n5. Checking research_api_activities table...');
    const { data: researchActivities, error: researchError } = await supabase
      .from('research_api_activities')
      .select('id, name')
      .limit(3);

    if (researchError) {
      console.error('Error accessing research_api_activities table:', researchError);
    } else {
      console.log(`Found ${researchActivities?.length || 0} research activities`);
    }

    console.log('\n=== Database State Summary ===');
    console.log('Businesses table:', businessesError ? 'ERROR' : 'OK');
    console.log('QRA Activities table:', qraError ? 'ERROR' : 'OK');
    console.log('QRA Steps table:', stepsError ? 'ERROR' : 'OK');
    console.log('QRA Subcomponents table:', subcomponentsError ? 'ERROR' : 'OK');
    console.log('Research Activities table:', researchError ? 'ERROR' : 'OK');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkDatabaseState(); 