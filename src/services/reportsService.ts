import { QRAActivityData, QRAReportData, QRAStatistics, QRAExportData } from '../types/ReportQRA';
import { QRABuilderService } from './qrabuilderService';

// QRA Report Data Functions

export async function getQRAReportData(businessId: string, year: number): Promise<QRAReportData> {
  try {
    console.log(`🔍 Looking for QRA data for business ${businessId}, year ${year}`);
    
    // Use QRABuilderService to get current QRA data from Supabase
    const activities: QRAActivityData[] = [];
    
    // Get business data to access activities
    const STORAGE_KEY = 'businessInfoData';
    const savedData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const business = savedData.businesses?.find((b: any) => b.id === businessId);
    const yearData = business?.years?.[year];
    const businessActivities = yearData?.activities || {};
    
    if (!business || !yearData) {
      console.log(`❌ No business data found for business ${businessId}, year ${year}`);
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

    console.log(`📋 Found ${Object.keys(businessActivities).length} activities in business data`);

    // Get all QRA data from Supabase
    const qraDataMap = await QRABuilderService.getAllQRAData(businessId, year);
    console.log(`🎯 Found QRA data for ${Object.keys(qraDataMap).length} activities:`, Object.keys(qraDataMap));
    
    // Process each activity
    Object.entries(businessActivities).forEach(([activityId, activityData]: [string, any]) => {
      try {
        console.log(`📝 Processing activity: ${activityData.name} (ID: ${activityId})`);
        
        // Get QRA data for this activity
        const qraData = qraDataMap[activityId];
        
        if (qraData) {
          console.log(`✅ Found QRA data for activity: ${activityData.name}`);
          
          // Extract QRA data
          const totalAppliedPercent = qraData.totalAppliedPercent || 0;
          const practicePercent = qraData.practicePercent || 0;
          const selectedRoles = qraData.selectedRoles || [];
          const selectedSubcomponents = qraData.selectedSubcomponents || {};
          
          console.log(`📊 Activity: ${activityData.name}, Applied: ${totalAppliedPercent}%, Practice: ${practicePercent}%`);
          console.log(`👥 Selected roles:`, selectedRoles);
          console.log(`🔧 Subcomponents:`, Object.keys(selectedSubcomponents).length);
          
          // Calculate subcomponent count from selectedSubcomponents
          const subcomponentCount = Object.keys(selectedSubcomponents).length;
          
          // Convert subcomponents to steps format for backward compatibility
          const steps = Object.entries(selectedSubcomponents).map(([key, subData]: [string, any], index) => {
            const [phase, step, subId] = key.split('__');
            
            return {
              id: `step_${index}`,
              name: step || 'Unknown Step',
              description: subData?.sub?.hint || '',
              order: index,
              subcomponents: [{
                id: subId || key,
                name: subData?.sub?.title || key,
                description: subData?.sub?.hint || '',
                usageWeight: subData.timePercent || 0
              }],
              timePercent: subData.timePercent || 0,
              isLocked: false
            };
          });

          const activity: QRAActivityData = {
            id: activityId,
            name: activityData.name, // Use the actual activity name from business data
            category: activityData.category || 'Research & Development',
            area: activityData.area || 'Clinical Research',
            focus: activityData.focus || 'Innovation',
            practicePercent: practicePercent,
            appliedPercent: totalAppliedPercent,
            nonRDTime: qraData.nonRDTime || 0,
            selectedRoles,
            selectedSubcomponents,
            subcomponentCount,
            steps,
            active: activityData.active !== false,
            lastUpdated: qraData.lastUpdated || new Date().toISOString()
          };
          
          activities.push(activity);
          console.log(`✅ Added activity: ${activityData.name} (ID: ${activityId})`);
        } else {
          console.log(`⚠️ No QRA data found for activity: ${activityData.name} (ID: ${activityId})`);
          
          // Add activity with default values if no QRA data exists
          const activity: QRAActivityData = {
            id: activityId,
            name: activityData.name,
            category: activityData.category || 'Research & Development',
            area: activityData.area || 'Clinical Research',
            focus: activityData.focus || 'Innovation',
            practicePercent: activityData.practicePercent || 0,
            appliedPercent: 0,
            nonRDTime: activityData.nonRDTime || 0,
            selectedRoles: activityData.selectedRoles || [],
            selectedSubcomponents: {},
            subcomponentCount: 0,
            steps: [],
            active: activityData.active !== false,
            lastUpdated: new Date().toISOString()
          };
          
          activities.push(activity);
          console.log(`✅ Added activity with default values: ${activityData.name} (ID: ${activityId})`);
        }
      } catch (error) {
        console.error(`❌ Error processing activity ${activityId}:`, error);
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

export async function getQRAStatistics(businessId: string, year: number): Promise<QRAStatistics> {
  try {
    const reportData = await getQRAReportData(businessId, year);
    
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

export async function exportQRAReportData(businessId: string, year: number): Promise<string> {
  try {
    const reportData = await getQRAReportData(businessId, year);
    const statistics = await getQRAStatistics(businessId, year);
    
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
export async function getActivityQRADetails(businessId: string, year: number, activityId: string) {
  try {
    const reportData = await getQRAReportData(businessId, year);
    return reportData.activities.find(activity => activity.id === activityId);
  } catch (error) {
    console.error('Error getting activity QRA details:', error);
    return null;
  }
}