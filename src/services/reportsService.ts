import { QRAActivityData, QRAReportData, QRAStatistics, QRAExportData } from '../types/ReportQRA';

// QRA Report Data Functions

export function getQRAReportData(businessId: string, year: number): QRAReportData {
  try {
    console.log(`🔍 Looking for QRA data for business ${businessId}, year ${year}`);
    
    // QRA data is stored as individual keys for each activity: qra_${businessId}_${year}_${activityId}
    // We need to find all keys that match this pattern and aggregate them
    const activities: QRAActivityData[] = [];
    
    // Get all localStorage keys
    const allKeys = Object.keys(localStorage);
    console.log(`📋 Total localStorage keys: ${allKeys.length}`);
    
    const qraKeys = allKeys.filter(key => key.startsWith(`qra_${businessId}_${year}_`));
    
    console.log(`🎯 Found ${qraKeys.length} QRA keys for business ${businessId}, year ${year}:`, qraKeys);
    
    if (qraKeys.length === 0) {
      console.log(`❌ No QRA data found for business ${businessId}, year ${year}`);
      return {
        businessId,
        year,
        activities: [],
        totalActivities: 0,
        totalSubcomponents: 0,
        totalAppliedPercent: 0,
        lastUpdated: new Date().toISOString()
      };
    }

    // Process each QRA key to extract activity data
    qraKeys.forEach((key, index) => {
      try {
        console.log(`📝 Processing QRA key ${index + 1}/${qraKeys.length}: ${key}`);
        const qraData = localStorage.getItem(key);
        if (qraData) {
          const activityData = JSON.parse(qraData);
          console.log(`✅ Parsed QRA data for key ${key}:`, activityData);
          
          // Extract activity ID from the key
          const activityId = key.replace(`qra_${businessId}_${year}_`, '');
          console.log(`🆔 Extracted activity ID: ${activityId}`);
          
          // Parse the actual QRA data structure
          const activityName = activityData.activityName || activityData.name || 'Unnamed Activity';
          const totalAppliedPercent = activityData.totalAppliedPercent || 0;
          const practicePercent = activityData.practicePercent || 0;
          const selectedRoles = activityData.selectedRoles || [];
          const selectedSubcomponents = activityData.selectedSubcomponents || {};
          const stepTimeMap = activityData.stepTimeMap || {};
          const stepFrequencies = activityData.stepFrequencies || {};
          const stepSummaries = activityData.stepSummaries || {};
          const stepTimeLocked = activityData.stepTimeLocked || {};
          
          console.log(`📊 Activity: ${activityName}, Applied: ${totalAppliedPercent}%, Practice: ${practicePercent}%`);
          console.log(`👥 Selected roles:`, selectedRoles);
          console.log(`🔧 Subcomponents:`, Object.keys(selectedSubcomponents).length);
          console.log(`⏱️ Steps:`, Object.keys(stepTimeMap));
          
          // Calculate subcomponent count from selectedSubcomponents
          const subcomponentCount = Object.keys(selectedSubcomponents).length;
          
          // Convert step data to the expected format
          const steps = Object.keys(stepTimeMap).map((stepName, index) => {
            // Safely extract description from stepSummaries
            let description = '';
            const stepSummary = stepSummaries[stepName];
            if (typeof stepSummary === 'string') {
              description = stepSummary;
            } else if (stepSummary && typeof stepSummary === 'object') {
              // If it's a StepSummary object, extract relevant information
              description = stepSummary.description || stepSummary.stepName || stepName;
            } else {
              description = stepName;
            }

            // Get subcomponents for this specific step
            const stepSubcomponents: any[] = [];
            Object.entries(selectedSubcomponents).forEach(([key, subData]: [string, any]) => {
              const [phase, step, subId] = key.split('__');
              if (step === stepName) {
                let name = key;
                let subDescription = '';
                
                if (subData?.sub) {
                  if (typeof subData.sub === 'string') {
                    name = subData.sub;
                  } else if (typeof subData.sub === 'object' && subData.sub.title) {
                    name = subData.sub.title;
                  }
                  
                  if (typeof subData.sub === 'object' && subData.sub.hint) {
                    subDescription = subData.sub.hint;
                  }
                }
                
                stepSubcomponents.push({
                  id: subId || key,
                  name: name,
                  description: subDescription,
                  phase: subData.phase || phase,
                  step: subData.step || step,
                  timePercent: subData.timePercent || 0,
                  frequencyPercent: subData.frequencyPercent || 0
                });
              }
            });

            return {
              id: `step_${index}`,
              name: stepName,
              description: description,
              order: index,
              subcomponents: stepSubcomponents, // Now properly populated
              timePercent: stepTimeMap[stepName] || 0,
              isLocked: stepTimeLocked[stepName] || false
            };
          });
          
          // Extract all subcomponents for the activity (for backward compatibility)
          const subcomponents = Object.entries(selectedSubcomponents).map(([key, subData]: [string, any]) => {
            const [phase, step, subId] = key.split('__');
            
            // Safely extract subcomponent name
            let name = key;
            if (subData?.sub) {
              if (typeof subData.sub === 'string') {
                name = subData.sub;
              } else if (typeof subData.sub === 'object' && subData.sub.title) {
                name = subData.sub.title;
              }
            }
            
            // Safely extract description
            let description = '';
            if (subData?.sub) {
              if (typeof subData.sub === 'object' && subData.sub.hint) {
                description = subData.sub.hint;
              }
            }
            
            return {
              id: subId || key,
              name: name,
              description: description,
              phase: subData.phase || phase,
              step: subData.step || step,
              timePercent: subData.timePercent || 0,
              frequencyPercent: subData.frequencyPercent || 0
            };
          });

          const activity: QRAActivityData = {
            id: activityId,
            name: activityName,
            category: 'Research & Development',
            area: 'Clinical Research',
            focus: 'Innovation',
            practicePercent: practicePercent,
            appliedPercent: totalAppliedPercent,
            nonRDTime: 0, // Calculate if needed
            selectedRoles,
            selectedSubcomponents,
            subcomponentCount,
            steps,
            active: true,
            lastUpdated: activityData.lastUpdated || new Date().toISOString()
          };
          
          activities.push(activity);
          console.log(`✅ Added activity: ${activityName} (ID: ${activityId})`);
        } else {
          console.log(`❌ No data found for key: ${key}`);
        }
      } catch (error) {
        console.error(`❌ Error processing QRA data for key ${key}:`, error);
      }
    });

    console.log(`📈 Processed ${activities.length} activities:`, activities);

    // Calculate totals
    const totalActivities = activities.length;
    const totalSubcomponents = activities.reduce((sum, activity) => sum + activity.subcomponentCount, 0);
    const totalAppliedPercent = activities.reduce((sum, activity) => sum + activity.appliedPercent, 0);

    const result = {
      businessId,
      year,
      activities,
      totalActivities,
      totalSubcomponents,
      totalAppliedPercent,
      lastUpdated: new Date().toISOString()
    };

    console.log(`🎉 Final QRA report data:`, result);
    return result;
  } catch (error) {
    console.error('❌ Error getting QRA report data:', error);
    return {
      businessId,
      year,
      activities: [],
      totalActivities: 0,
      totalSubcomponents: 0,
      totalAppliedPercent: 0,
      lastUpdated: new Date().toISOString()
    };
  }
}

export function getQRAStatistics(businessId: string, year: number): QRAStatistics {
  try {
    const reportData = getQRAReportData(businessId, year);
    
    const rdActivities = reportData.activities.filter(activity => activity.appliedPercent > 0).length;
    const nonRdActivities = reportData.activities.filter(activity => activity.appliedPercent === 0).length;
    
    const averageAppliedPercent = reportData.activities.length > 0 
      ? reportData.activities.reduce((sum, activity) => sum + activity.appliedPercent, 0) / reportData.activities.length
      : 0;
    
    const totalPracticePercent = reportData.activities.reduce((sum, activity) => sum + activity.practicePercent, 0);
    
    // Get top activities by applied percentage
    const topActivities = reportData.activities
      .sort((a, b) => b.appliedPercent - a.appliedPercent)
      .slice(0, 5)
      .map(activity => ({
        id: activity.id,
        name: activity.name,
        appliedPercent: activity.appliedPercent,
        subcomponentCount: activity.subcomponentCount
      }));

    return {
      totalActivities: reportData.totalActivities,
      totalSubcomponents: reportData.totalSubcomponents,
      totalAppliedPercent: reportData.totalAppliedPercent,
      rdActivities,
      nonRdActivities,
      averageAppliedPercent,
      totalPracticePercent,
      topActivities
    };
  } catch (error) {
    console.error('Error getting QRA statistics:', error);
    return {
      totalActivities: 0,
      totalSubcomponents: 0,
      totalAppliedPercent: 0,
      rdActivities: 0,
      nonRdActivities: 0,
      averageAppliedPercent: 0,
      totalPracticePercent: 0,
      topActivities: []
    };
  }
}

export function exportQRAReportData(businessId: string, year: number): string {
  try {
    const reportData = getQRAReportData(businessId, year);
    const statistics = getQRAStatistics(businessId, year);
    
    const exportData: QRAExportData = {
      reportData,
      statistics,
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };
    
    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    console.error('Error exporting QRA data:', error);
    throw new Error('Failed to export QRA data');
  }
}

// Helper function to get activity details
export function getActivityQRADetails(businessId: string, year: number, activityId: string) {
  try {
    const reportData = getQRAReportData(businessId, year);
    return reportData.activities.find(activity => activity.id === activityId);
  } catch (error) {
    console.error('Error getting activity QRA details:', error);
    return null;
  }
}