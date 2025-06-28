# QRA Data Export System

## Overview

The QRA (Qualified Research Activities) Data Export System automatically generates clean, normalized data exports when QRA configurations are completed. This system is designed to prepare data for Supabase migration with one data point per cell for easy database import.

## Features

### 🎯 **Automatic Generation**
- Export data is automatically generated when QRA is configured
- Real-time monitoring of QRA completion status
- Automatic export triggers when activities are configured

### 📊 **Multiple Export Formats**
- **JSON**: Complete structured data for API integration
- **CSV**: Flattened data with one data point per cell (perfect for Supabase)
- **SQL**: Ready-to-run INSERT statements for direct database import

### 🏗️ **Supabase-Ready Structure**
- Normalized data structure with one data point per cell
- Proper foreign key relationships
- Timestamp tracking for data lineage
- Business and year context preservation

## Data Structure

### Core Tables

#### 1. Research Activities
```typescript
interface ResearchActivityExport {
  id: string;
  name: string;
  practicePercent: number;
  nonRDTime: number;
  active: boolean;
  selectedRoles: string[];
  category?: string;
  area?: string;
  focus?: string;
  qraCompleted: boolean;
  totalAppliedPercent: number;
  subcomponentCount: number;
  stepCount: number;
}
```

#### 2. Steps
```typescript
interface StepExport {
  id: string;
  activityId: string;
  activityName: string;
  stepName: string;
  timePercent: number;
  isLocked: boolean;
  subcomponentCount: number;
  totalAppliedPercent: number;
}
```

#### 3. Subcomponents
```typescript
interface SubcomponentExport {
  id: string;
  activityId: string;
  activityName: string;
  stepId: string;
  stepName: string;
  subcomponentName: string;
  phase: string;
  frequencyPercent: number;
  yearPercent: number;
  startYear: number;
  selectedRoles: string[];
  appliedPercent: number;
  isNonRD: boolean;
  category?: string;
  area?: string;
  focus?: string;
}
```

## Usage

### Basic Integration

```typescript
import { QRAExportPanel } from '../components/qra/QRAExportPanel';

// In your component
<QRAExportPanel
  businessId={selectedBusinessId}
  businessName={businessName}
  year={selectedYear}
  activities={activities}
  onExport={(data) => {
    console.log('Export completed:', data);
  }}
/>
```

### Using the Hook

```typescript
import { useQRAExport } from '../hooks/useQRAExport';

const {
  exportData,
  isExporting,
  generateExport,
  downloadExport,
  completionStats,
  isExportReady
} = useQRAExport({
  businessId,
  businessName,
  year,
  activities,
  autoExport: true, // Automatically export when QRA is completed
  onExportComplete: (data) => {
    console.log('Auto-export completed:', data);
  }
});
```

### Direct Service Usage

```typescript
import { QRADataExportService } from '../services/qraDataExportService';

// Generate export data
const qraDataMap = QRADataExportService.getQRADataMap(businessId, year, activities);
const exportData = QRADataExportService.generateExportData(
  businessId,
  businessName,
  year,
  activities,
  qraDataMap
);

// Download in different formats
QRADataExportService.downloadExport(exportData, 'csv');
QRADataExportService.downloadExport(exportData, 'sql');
QRADataExportService.downloadExport(exportData, 'json');
```

## Export Formats

### CSV Format (Supabase Ready)
The CSV format creates a flattened structure with one data point per cell:

```csv
Table,ID,Field,Value,DataType
research_activities,activity_1,name,"Software Development",string
research_activities,activity_1,practice_percent,25.5,number
research_activities,activity_1,active,true,boolean
steps,step_1,activity_id,activity_1,string
steps,step_1,step_name,"Research Phase",string
steps,step_1,time_percent,40.0,number
subcomponents,sub_1,activity_id,activity_1,string
subcomponents,sub_1,subcomponent_name,"Algorithm Development",string
subcomponents,sub_1,frequency_percent,75.0,number
```

### SQL Format
Ready-to-run INSERT statements for direct database import:

```sql
INSERT INTO research_activities (id, name, practice_percent, non_rd_time, active, selected_roles, category, area, focus, qra_completed, total_applied_percent, subcomponent_count, step_count, business_id, year, created_at) VALUES ('activity_1', 'Software Development', 25.5, 10.0, true, 'role1|role2', 'Technology', 'Software', 'AI', true, 18.5, 5, 3, 'business_123', 2025, '2025-01-15T10:30:00.000Z');
```

### JSON Format
Complete structured data for API integration:

```json
{
  "businessId": "business_123",
  "businessName": "Tech Corp",
  "year": 2025,
  "exportTimestamp": "2025-01-15T10:30:00.000Z",
  "researchActivities": [...],
  "steps": [...],
  "subcomponents": [...],
  "summary": {
    "totalActivities": 5,
    "totalSteps": 15,
    "totalSubcomponents": 45,
    "totalPracticePercent": 100.0,
    "totalAppliedPercent": 75.5
  }
}
```

## Supabase Migration

### Database Schema

```sql
-- Research Activities Table
CREATE TABLE research_activities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  practice_percent DECIMAL(5,2) NOT NULL,
  non_rd_time DECIMAL(5,2) NOT NULL,
  active BOOLEAN NOT NULL,
  selected_roles TEXT,
  category TEXT,
  area TEXT,
  focus TEXT,
  qra_completed BOOLEAN NOT NULL,
  total_applied_percent DECIMAL(5,2) NOT NULL,
  subcomponent_count INTEGER NOT NULL,
  step_count INTEGER NOT NULL,
  business_id TEXT NOT NULL,
  year INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Steps Table
CREATE TABLE steps (
  id TEXT PRIMARY KEY,
  activity_id TEXT NOT NULL REFERENCES research_activities(id),
  activity_name TEXT NOT NULL,
  step_name TEXT NOT NULL,
  time_percent DECIMAL(5,2) NOT NULL,
  is_locked BOOLEAN NOT NULL,
  subcomponent_count INTEGER NOT NULL,
  total_applied_percent DECIMAL(5,2) NOT NULL,
  business_id TEXT NOT NULL,
  year INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Subcomponents Table
CREATE TABLE subcomponents (
  id TEXT PRIMARY KEY,
  activity_id TEXT NOT NULL REFERENCES research_activities(id),
  activity_name TEXT NOT NULL,
  step_id TEXT NOT NULL REFERENCES steps(id),
  step_name TEXT NOT NULL,
  subcomponent_name TEXT NOT NULL,
  phase TEXT NOT NULL,
  frequency_percent DECIMAL(5,2) NOT NULL,
  year_percent DECIMAL(5,2) NOT NULL,
  start_year INTEGER NOT NULL,
  selected_roles TEXT,
  applied_percent DECIMAL(5,2) NOT NULL,
  is_non_rd BOOLEAN NOT NULL,
  category TEXT,
  area TEXT,
  focus TEXT,
  business_id TEXT NOT NULL,
  year INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL
);
```

### Import Process

1. **Generate Export**: Use the QRA Export Panel to generate data
2. **Download CSV**: Choose CSV format for Supabase import
3. **Import to Supabase**: Use Supabase's CSV import feature
4. **Verify Data**: Check that all relationships are preserved

## Integration Points

### QRA Builder Integration
The export system is integrated into the QRA Builder's Identify Activities tab:

- **Location**: `src/pages/QRABuilderTabs/IdentifyActivitiesTab.tsx`
- **Component**: `QRAExportPanel` is rendered after the activities list
- **Trigger**: Manual generation or automatic on QRA completion

### Reports Section Preservation
The existing Reports section with API fetching and AI components is preserved:

- **No Changes**: All existing functionality remains intact
- **Separation**: Export system is independent of Reports functionality
- **Future Integration**: Export data can be used by Reports section

## Configuration

### Environment Variables
No additional environment variables required. The system uses existing localStorage and business data.

### Dependencies
- Material-UI components for UI
- Existing QRA data structure
- localStorage for data persistence

## Monitoring and Analytics

### Export Statistics
The system provides comprehensive statistics:

- Total activities and completion status
- Steps and subcomponents counts
- Practice vs. applied percentages
- R&D vs. Non-R&D subcomponents
- Export timestamps and data lineage

### Completion Tracking
- Real-time monitoring of QRA completion
- Automatic export triggers
- Progress indicators and notifications

## Future Enhancements

### Planned Features
1. **Real-time Sync**: Direct Supabase integration
2. **Batch Processing**: Multiple business/year exports
3. **Data Validation**: Enhanced error checking
4. **Template System**: Reusable export configurations
5. **API Integration**: RESTful export endpoints

### Migration Path
1. **Phase 1**: Current localStorage-based system ✅
2. **Phase 2**: Supabase integration with real-time sync
3. **Phase 3**: Advanced analytics and reporting
4. **Phase 4**: Multi-tenant support

## Troubleshooting

### Common Issues

1. **No Export Data**: Ensure QRA is configured for at least one activity
2. **Missing Activities**: Check that activities are properly saved
3. **Download Issues**: Verify browser permissions for file downloads
4. **Data Inconsistencies**: Regenerate export after QRA changes

### Debug Information
- Console logs show export generation process
- Export data includes validation statistics
- Error messages provide specific failure reasons

## Support

For issues or questions about the QRA Export system:

1. Check browser console for error messages
2. Verify QRA configuration is complete
3. Ensure all required data is present
4. Test with different export formats

The system is designed to be robust and provide clear feedback for any issues encountered during the export process. 