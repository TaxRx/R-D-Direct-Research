const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hwnnaextfopoznlgzvpz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3bm5hZXh0Zm9wb3pubGd6dnB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3OTk5NjIsImV4cCI6MjA2NjM3NTk2Mn0.rs-FhUyptaU9UeIMcZS1nCn3RD43VfUKhltvJr25JmY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function cleanupSupabaseData() {
  console.log('=== Cleaning up Supabase QRA data ===\n');

  try {
    // 1. Clear all QRA normalized table data
    console.log('1. Clearing qra_subcomponents...');
    const { error: subcomponentsError } = await supabase
      .from('qra_subcomponents')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    if (subcomponentsError) console.error('Error clearing subcomponents:', subcomponentsError);

    console.log('2. Clearing qra_steps...');
    const { error: stepsError } = await supabase
      .from('qra_steps')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    if (stepsError) console.error('Error clearing steps:', stepsError);

    console.log('3. Clearing qra_activities...');
    const { error: activitiesError } = await supabase
      .from('qra_activities')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    if (activitiesError) console.error('Error clearing activities:', activitiesError);

    // 2. Clear research activity selections
    console.log('4. Clearing research activity selections...');
    const { error: selectionsError } = await supabase
      .from('businesses')
      .update({ research_activity_selections: null })
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (selectionsError) console.error('Error clearing selections:', selectionsError);

    // 3. Clear malformed QRA data
    console.log('5. Clearing malformed QRA data...');
    const { error: qraDataError } = await supabase
      .from('businesses')
      .update({ qra_data: null })
      .or('qra_data.is.null,qra_data.eq.{}');
    if (qraDataError) console.error('Error clearing QRA data:', qraDataError);

    // 4. Verify cleanup
    console.log('\n6. Verifying cleanup...');
    
    const { data: activitiesCount } = await supabase
      .from('qra_activities')
      .select('id', { count: 'exact' });
    
    const { data: stepsCount } = await supabase
      .from('qra_steps')
      .select('id', { count: 'exact' });
    
    const { data: subcomponentsCount } = await supabase
      .from('qra_subcomponents')
      .select('id', { count: 'exact' });

    console.log(`QRA Activities remaining: ${activitiesCount?.length || 0}`);
    console.log(`QRA Steps remaining: ${stepsCount?.length || 0}`);
    console.log(`QRA Subcomponents remaining: ${subcomponentsCount?.length || 0}`);

    // 5. Show businesses status
    console.log('\n7. Business QRA data status:');
    const { data: businesses } = await supabase
      .from('businesses')
      .select('id, name, qra_data');
    
    businesses?.forEach(business => {
      const status = !business.qra_data ? 'No QRA data' : 
                    business.qra_data === '{}' ? 'Empty QRA data' : 
                    'Has QRA data';
      console.log(`- ${business.name}: ${status}`);
    });

    console.log('\n=== Cleanup completed successfully ===');
    console.log('Your app should now work with JSONB storage only.');
    console.log('You can export normalized CSV when needed using the existing export functionality.');

  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

cleanupSupabaseData(); 