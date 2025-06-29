const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  console.error('Please ensure REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQRASaveVerification() {
  console.log('🔍 Testing QRA Save Verification...\n');

  try {
    // Test parameters
    const businessId = 'test-business-123';
    const year = 2024;
    const activityName = 'Test Research Activity';
    const activityId = 'test-activity-456';

    // Sample QRA data with Non-R&D subcomponents
    const testQRAData = {
      selectedSubcomponents: {
        'sub-1': {
          step: 'Research',
          subcomponent: 'Literature Review',
          timePercent: 30,
          frequencyPercent: 80,
          yearPercent: 100,
          startYear: 2024,
          selectedRoles: ['Researcher', 'Analyst'],
          isNonRD: false,
          appliedPercent: 24
        },
        'sub-2': {
          step: 'Development',
          subcomponent: 'Prototype Development',
          timePercent: 50,
          frequencyPercent: 60,
          yearPercent: 100,
          startYear: 2024,
          selectedRoles: ['Developer', 'Engineer'],
          isNonRD: false,
          appliedPercent: 30
        },
        'sub-3': {
          step: 'Non-R&D Activities',
          subcomponent: 'Administrative Tasks',
          timePercent: 20,
          frequencyPercent: 100,
          yearPercent: 100,
          startYear: 2024,
          selectedRoles: [],
          isNonRD: true,
          appliedPercent: 20
        }
      },
      practicePercent: 80,
      nonRDTime: 20,
      totalAppliedPercent: 74,
      isLocked: false,
      lastUpdated: new Date().toISOString()
    };

    console.log('📊 Test QRA Data:');
    console.log(JSON.stringify(testQRAData, null, 2));
    console.log('\n');

    // 1. Test JSONB save
    console.log('1️⃣ Testing JSONB Save...');
    const jsonbResult = await testJSONBSave(businessId, year, activityId, activityName, testQRAData);
    console.log(`   JSONB Save Result: ${jsonbResult ? '✅ SUCCESS' : '❌ FAILED'}\n`);

    // 2. Test Modal Table save
    console.log('2️⃣ Testing Modal Table Save...');
    const modalTableResult = await testModalTableSave(businessId, year, activityName, testQRAData);
    console.log(`   Modal Table Save Result: ${modalTableResult ? '✅ SUCCESS' : '❌ FAILED'}\n`);

    // 3. Test reading from both sources
    console.log('3️⃣ Testing Data Retrieval...');
    const jsonbData = await testJSONBRead(businessId, year, activityId);
    const modalTableData = await testModalTableRead(businessId, year);

    console.log(`   JSONB Read Result: ${jsonbData ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`   Modal Table Read Result: ${modalTableData ? '✅ SUCCESS' : '❌ FAILED'}\n`);

    // 4. Verify Non-R&D subcomponents
    console.log('4️⃣ Verifying Non-R&D Subcomponents...');
    if (modalTableData) {
      const nonRdSubcomponents = Object.values(modalTableData[activityName]?.selectedSubcomponents || {})
        .filter(sub => sub.isNonRD);
      
      console.log(`   Found ${nonRdSubcomponents.length} Non-R&D subcomponents`);
      nonRdSubcomponents.forEach((sub, index) => {
        console.log(`   Non-R&D ${index + 1}: ${sub.subcomponent} (${sub.timePercent}%)`);
      });
    }

    // 5. Cleanup test data
    console.log('\n5️⃣ Cleaning up test data...');
    await cleanupTestData(businessId, year);
    console.log('   ✅ Cleanup completed');

    console.log('\n🎉 QRA Save Verification Test Completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

async function testJSONBSave(businessId, year, activityId, activityName, qraData) {
  try {
    // Get existing QRA data
    const { data: existingBusiness, error: fetchError } = await supabase
      .from('businesses')
      .select('qra_data')
      .eq('id', businessId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('   Error fetching business data:', fetchError);
      return false;
    }

    // Get existing QRA data or initialize empty object
    const existingQraData = existingBusiness?.qra_data || {};
    
    // Create the key for this activity
    const qraKey = `${year}_${activityId}`;
    
    // Update the QRA data
    const updatedQraData = {
      ...existingQraData,
      [qraKey]: {
        activityName,
        activityId,
        year,
        practicePercent: qraData.practicePercent || 0,
        nonRDTime: qraData.nonRDTime || 0,
        totalAppliedPercent: qraData.totalAppliedPercent || 0,
        selectedSubcomponents: qraData.selectedSubcomponents || {},
        isLocked: qraData.isLocked || false,
        lastUpdated: new Date().toISOString()
      }
    };

    // Update the business record
    const { error: updateError } = await supabase
      .from('businesses')
      .upsert({ 
        id: businessId,
        qra_data: updatedQraData,
        updated_at: new Date().toISOString()
      });

    if (updateError) {
      console.error('   Error updating business QRA data:', updateError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('   Error in JSONB save:', error);
    return false;
  }
}

async function testModalTableSave(businessId, year, activityName, qraData) {
  try {
    // Calculate additional fields for the modal table
    const totalSubcomponents = Object.keys(qraData.selectedSubcomponents || {}).length;
    const rdSubcomponents = Object.values(qraData.selectedSubcomponents || {}).filter(sub => !sub.isNonRD).length;
    const nonRdSubcomponents = totalSubcomponents - rdSubcomponents;

    // Calculate step_time_map from subcomponents
    const stepTimeMap = {};
    const stepFrequencies = {};
    const stepTimeLocked = {};
    const selectedRoles = [];
    const stepSummaries = {};

    // Process each subcomponent to build step-level data
    Object.values(qraData.selectedSubcomponents || {}).forEach(subcomponent => {
      const stepName = subcomponent.step || 'Unknown';
      const timePercent = subcomponent.timePercent || 0;
      const frequencyPercent = subcomponent.frequencyPercent || 0;
      const appliedPercent = subcomponent.appliedPercent || 0;
      const isLocked = subcomponent.isLocked || false;
      const selectedRolesForSub = subcomponent.selectedRoles || [];

      // Aggregate time percentages for each step
      if (stepTimeMap[stepName]) {
        stepTimeMap[stepName] += timePercent;
      } else {
        stepTimeMap[stepName] = timePercent;
      }

      // Aggregate frequency percentages for each step
      if (stepFrequencies[stepName]) {
        stepFrequencies[stepName] += frequencyPercent;
      } else {
        stepFrequencies[stepName] = frequencyPercent;
      }

      // Track locked status for each step
      if (!stepTimeLocked.hasOwnProperty(stepName)) {
        stepTimeLocked[stepName] = isLocked;
      } else {
        stepTimeLocked[stepName] = stepTimeLocked[stepName] || isLocked;
      }

      // Collect unique roles
      selectedRolesForSub.forEach(role => {
        if (!selectedRoles.includes(role)) {
          selectedRoles.push(role);
        }
      });

      // Build step summaries
      if (!stepSummaries[stepName]) {
        stepSummaries[stepName] = {
          stepName: stepName,
          timePercent: 0,
          subcomponentCount: 0,
          totalAppliedPercent: 0,
          isLocked: false
        };
      }
      stepSummaries[stepName].timePercent += timePercent;
      stepSummaries[stepName].subcomponentCount += 1;
      stepSummaries[stepName].totalAppliedPercent += appliedPercent;
      stepSummaries[stepName].isLocked = stepSummaries[stepName].isLocked || isLocked;
    });

    // Prepare the data for the modal table
    const modalData = {
      business_id: businessId,
      year: year,
      activity_name: activityName,
      practice_percent: qraData.practicePercent || 0,
      selected_subcomponents: qraData.selectedSubcomponents || {},
      total_applied_percent: qraData.totalAppliedPercent || 0,
      step_frequencies: stepFrequencies,
      step_time_map: stepTimeMap,
      step_time_locked: stepTimeLocked,
      selected_roles: selectedRoles,
      calculation_formula: qraData.calculationFormula || '',
      total_subcomponents: totalSubcomponents,
      rd_subcomponents: rdSubcomponents,
      non_rd_subcomponents: nonRdSubcomponents,
      step_summaries: stepSummaries,
      last_updated: new Date().toISOString()
    };

    // Use upsert to handle both insert and update cases
    const { data: upsertResult, error: upsertError } = await supabase
      .from('qra_modal_data')
      .upsert(modalData, {
        onConflict: 'business_id,year,activity_name'
      })
      .select();

    if (upsertError) {
      console.error('   Error upserting QRA modal data:', upsertError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('   Error in modal table save:', error);
    return false;
  }
}

async function testJSONBRead(businessId, year, activityId) {
  try {
    const { data: business, error } = await supabase
      .from('businesses')
      .select('qra_data')
      .eq('id', businessId)
      .single();

    if (error || !business?.qra_data) {
      return null;
    }

    const qraKey = `${year}_${activityId}`;
    return business.qra_data[qraKey] || null;
  } catch (error) {
    console.error('   Error reading JSONB data:', error);
    return null;
  }
}

async function testModalTableRead(businessId, year) {
  try {
    const { data: modalData, error } = await supabase
      .from('qra_modal_data')
      .select('*')
      .eq('business_id', businessId)
      .eq('year', year);

    if (error) {
      console.error('   Error loading QRA modal data:', error);
      return null;
    }

    if (!modalData || modalData.length === 0) {
      return null;
    }

    const result = {};
    modalData.forEach(row => {
      const activityId = row.activity_name;
      result[activityId] = {
        selectedSubcomponents: row.selected_subcomponents || {},
        practicePercent: row.practice_percent || 0,
        nonRDTime: 0,
        totalAppliedPercent: row.total_applied_percent || 0,
        isLocked: false,
        lastUpdated: row.last_updated || row.updated_at,
        stepTimeMap: row.step_time_map || {},
        stepFrequencies: row.step_frequencies || {},
        stepTimeLocked: row.step_time_locked || {},
        selectedRoles: row.selected_roles || [],
        calculationFormula: row.calculation_formula || '',
        totalSubcomponents: row.total_subcomponents || 0,
        rdSubcomponents: row.rd_subcomponents || 0,
        nonRdSubcomponents: row.non_rd_subcomponents || 0,
        stepSummaries: row.step_summaries || {}
      };
    });

    return result;
  } catch (error) {
    console.error('   Error reading modal table data:', error);
    return null;
  }
}

async function cleanupTestData(businessId, year) {
  try {
    // Clean up modal table data
    await supabase
      .from('qra_modal_data')
      .delete()
      .eq('business_id', businessId)
      .eq('year', year);

    // Clean up JSONB data
    const { data: business } = await supabase
      .from('businesses')
      .select('qra_data')
      .eq('id', businessId)
      .single();

    if (business?.qra_data) {
      const cleanedQraData = {};
      Object.entries(business.qra_data).forEach(([key, value]) => {
        if (!key.startsWith(`${year}_`)) {
          cleanedQraData[key] = value;
        }
      });

      await supabase
        .from('businesses')
        .update({ 
          qra_data: cleanedQraData,
          updated_at: new Date().toISOString()
        })
        .eq('id', businessId);
    }
  } catch (error) {
    console.error('   Error during cleanup:', error);
  }
}

// Run the test
testQRASaveVerification(); 