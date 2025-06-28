# QRA Data Sync & Supabase Integration

This document describes the new QRA (Qualified Research Activities) data sync functionality that captures and stores base QRA data consistently across the application.

## Overview

The QRA Data Sync system provides a simplified way to capture and store the core QRA data points needed for consistent reporting and analysis. It focuses on the essential data structure:

- **Year**
- **Research Activity Title**
- **Research Activity Practice Percent**
- **Step**
- **Subcomponent Title**
- **Subcomponent Year %**
- **Subcomponent Frequency %**
- **Subcomponent Time %**

## Components

### 1. QRADataSyncPanel Component

Located at: `src/components/qra/QRADataSyncPanel.tsx`

A React component that provides a user interface for:
- Capturing QRA data from localStorage
- Syncing data to Supabase
- Exporting data as CSV
- Displaying data summaries and samples

### 2. QRA Data Service

Located at: `src/services/qraDataService.ts`

A service that handles:
- Data capture from localStorage
- Data normalization for Supabase
- Database operations (insert/update)
- CSV export functionality

## Usage

### In the QRA Builder Activities Tab

The QRADataSyncPanel is automatically integrated into the QRA Builder Activities tab. Users can:

1. **Capture QRA Data**: Click "Capture QRA Data" to extract data from localStorage
2. **Sync to Supabase**: Click "Sync to Supabase" to save data to the database
3. **Export CSV**: Click "Export CSV" to download data as a CSV file

### Data Flow

1. **Capture**: Extracts QRA data from localStorage using the key pattern `qraData_{businessId}_{year}`
2. **Normalize**: Converts the complex nested structure into a flat, normalized format
3. **Store**: Saves to Supabase tables (research_activities, steps, subcomponents)
4. **Export**: Generates CSV files with the standardized format

## Database Schema

The system uses the following Supabase tables:

### research_activities
- `id` (UUID, Primary Key)
- `business_id` (UUID, Foreign Key)
- `year` (Integer)
- `title` (Text)
- `practice_percent` (Decimal)

### steps
- `id` (UUID, Primary Key)
- `research_activity_id` (UUID, Foreign Key)
- `title` (Text)
- `order_index` (Integer)

### subcomponents
- `id` (UUID, Primary Key)
- `step_id` (UUID, Foreign Key)
- `title` (Text)
- `year_percent` (Decimal)
- `frequency_percent` (Decimal)
- `time_percent` (Decimal)

## API Functions

### captureBaseQRAData(businessId: string, year: number)
Extracts and normalizes QRA data from localStorage.

### syncQRADataToSupabase(businessId: string, year: number)
Captures data and saves it to Supabase.

### saveBaseQRADataToSupabase(qraData: QRADataExport)
Saves normalized data to Supabase tables.

### getBaseQRADataFromSupabase(businessId: string, year: number)
Retrieves QRA data from Supabase.

### exportBaseQRADataAsCSV(activities: BaseQRAData[])
Exports data as CSV format.

## Data Structure

### BaseQRAData Interface
```typescript
interface BaseQRAData {
  year: number;
  researchActivityTitle: string;
  researchActivityPracticePercent: number;
  step: string;
  subcomponentTitle: string;
  subcomponentYearPercent: number;
  subcomponentFrequencyPercent: number;
  subcomponentTimePercent: number;
}
```

### QRADataExport Interface
```typescript
interface QRADataExport {
  businessId: string;
  year: number;
  activities: BaseQRAData[];
}
```

## Benefits

1. **Consistency**: Standardized data format across all components
2. **Simplicity**: Focused on core data points without complexity
3. **Persistence**: Data stored in Supabase for long-term access
4. **Export**: Easy CSV export for external analysis
5. **Integration**: Seamlessly integrated into existing QRA workflow

## Future Enhancements

1. **Automatic Sync**: Real-time sync when QRA data changes
2. **Data Validation**: Enhanced validation and error handling
3. **Bulk Operations**: Support for multiple years/businesses
4. **Advanced Analytics**: Built-in reporting and analysis tools
5. **API Integration**: REST API endpoints for external access

## Troubleshooting

### Common Issues

1. **No Data Captured**: Ensure QRA data exists in localStorage for the business/year
2. **Sync Failures**: Check Supabase connection and table permissions
3. **Missing Fields**: Verify all required data points are present in localStorage

### Debug Information

The system provides detailed console logging for debugging:
- Data capture results
- Supabase operation status
- Error messages and stack traces

## Integration with Existing Systems

The QRA Data Sync system is designed to work alongside existing functionality:
- QRA Export Panel (for comprehensive data export)
- Research Design reports
- Expense calculations
- Compliance reporting

It provides a simplified, focused approach to data management while preserving all existing features. 