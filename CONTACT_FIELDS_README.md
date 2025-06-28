# Contact Fields Implementation

This document describes the implementation of new contact fields for the business information section.

## New Fields Added

The following contact information fields have been added to the business info tab:

### Mailing Address
- **Street Address** (`mailingStreetAddress`)
- **City** (`mailingCity`) 
- **State** (`mailingState`) - This is separate from the domiciled state and is not used for tax calculations
- **ZIP Code** (`mailingZip`)

### Contact Information
- **Website** (`website`)
- **Phone Number** (`phoneNumber`)

## Database Changes

### Migration File: `add_business_contact_fields.sql`

Run this migration in your Supabase SQL Editor to add the new columns:

```sql
-- Add new columns to businesses table
ALTER TABLE businesses 
ADD COLUMN mailing_street_address TEXT,
ADD COLUMN mailing_city TEXT,
ADD COLUMN mailing_state TEXT,
ADD COLUMN mailing_zip TEXT,
ADD COLUMN website TEXT,
ADD COLUMN phone_number TEXT;
```

### Schema Changes

The `businesses` table now includes:
- `mailing_street_address` - TEXT
- `mailing_city` - TEXT  
- `mailing_state` - TEXT (separate from entity_state)
- `mailing_zip` - TEXT
- `website` - TEXT
- `phone_number` - TEXT

## Code Changes

### 1. TypeScript Types (`src/types/Business.ts`)

The `Business` interface has been updated to include:

```typescript
// Contact information
mailingStreetAddress: string;
mailingCity: string;
mailingState: string; // State in mailing address (not used for tax calculations)
mailingZip: string;
website: string;
phoneNumber: string;
```

### 2. Supabase Service (`src/services/supabaseBusinessService.ts`)

All methods have been updated to handle the new fields:
- `getBusinesses()`
- `getBusiness()`
- `createBusiness()`
- `updateBusiness()`

### 3. UI Component (`src/pages/BusinessInfo.tsx`)

The `renderBasicInfo()` function has been enhanced with:

- **Contact Information Section** with a clear heading
- **Address fields** with proper validation and placeholders
- **State dropdown** with all 50 US states for mailing address
- **Website and phone fields** with appropriate placeholders
- **Tooltip** on the domiciled state field to clarify it's used for tax purposes

## Key Features

### 1. Clear Distinction Between States
- **Domiciled State** (`entityState`): Used for tax calculations and legal purposes
- **Mailing State** (`mailingState`): Used only for contact/mailing purposes

### 2. Data Persistence
- All contact fields are saved to Supabase immediately when changed
- Data persists across app restarts and browser sessions
- Applied to all years unless specifically overwritten

### 3. User Experience
- Clear section separation with "Contact Information" heading
- Appropriate placeholders for all fields
- Full state dropdown for mailing address
- Tooltips to clarify field purposes

## Verification

### Running the Verification Script

After applying the migration, run the verification script:

```bash
node verify_contact_fields.js
```

This script will:
1. Check if the new columns exist in the database
2. Display current contact information for all businesses
3. Test updating a business with contact information
4. Verify data retrieval and persistence

### Manual Testing

1. **Database Level**: Check Supabase dashboard to see new columns
2. **App Level**: 
   - Navigate to Business Info tab
   - Fill in contact information
   - Save and refresh the page
   - Verify data persists
3. **Cross-Year Testing**: Verify data applies to all years

## Migration Steps

1. **Run the SQL migration** in Supabase SQL Editor
2. **Deploy the updated code** to your environment
3. **Run the verification script** to confirm everything works
4. **Test in the UI** to ensure proper functionality

## Notes

- The mailing state is completely separate from the domiciled state
- Contact information applies to all years by default
- All fields are optional and can be left empty
- Data is automatically saved to Supabase when fields are changed
- The UI includes proper validation and user feedback 