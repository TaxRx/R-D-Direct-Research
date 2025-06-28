const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'your-supabase-url';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'your-service-key';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Function to parse CSV data
function parseCSV(csvContent) {
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '') continue;
        
        // Simple CSV parsing (handles quoted fields)
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let j = 0; j < lines[i].length; j++) {
            const char = lines[i][j];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim()); // Add the last value
        
        if (values.length === headers.length) {
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });
            data.push(row);
        }
    }
    
    return data;
}

// Function to import a single row
async function importRow(row) {
    try {
        const { data, error } = await supabase.rpc('import_research_api_row', {
            p_category: row.Category || '',
            p_area: row.Area || '',
            p_focus: row.Focus || '',
            p_research_activity: row['Research Activity'] || '',
            p_subcomponent: row.Subcomponent || '',
            p_phase: row.Phase || '',
            p_step: row.Step || '',
            p_hint: row.Hint || '',
            p_general_description: row['General Description'] || '',
            p_goal: row.Goal || '',
            p_hypothesis: row.Hypothesis || '',
            p_alternatives: row.Alternatives || '',
            p_uncertainties: row.Uncertainties || '',
            p_developmental_process: row['Developmental Process'] || '',
            p_primary_goal: row['Primary Goal'] || '',
            p_expected_outcome_type: row['Expected Outcome Type'] || '',
            p_cpt_codes: row['CPT Codes'] || '',
            p_cdt_codes: row['CDT Codes'] || '',
            p_alternative_paths: row['Alternative Paths'] || '',
            p_is_limited_access: false // Set to true for IP-restricted items
        });
        
        if (error) {
            console.error('Error importing row:', error);
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Exception importing row:', error);
        return false;
    }
}

// Main import function
async function importResearchAPIData(csvFilePath) {
    try {
        console.log('Reading CSV file...');
        const csvContent = fs.readFileSync(csvFilePath, 'utf8');
        
        console.log('Parsing CSV data...');
        const data = parseCSV(csvContent);
        
        console.log(`Found ${data.length} rows to import`);
        
        let successCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            
            // Skip empty rows
            if (!row.Category && !row['Research Activity']) {
                continue;
            }
            
            console.log(`Importing row ${i + 1}/${data.length}: ${row.Category} > ${row['Research Activity']}`);
            
            const success = await importRow(row);
            
            if (success) {
                successCount++;
            } else {
                errorCount++;
            }
            
            // Add a small delay to avoid overwhelming the database
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.log(`\nImport completed!`);
        console.log(`Successfully imported: ${successCount} rows`);
        console.log(`Errors: ${errorCount} rows`);
        
    } catch (error) {
        console.error('Error during import:', error);
    }
}

// Function to verify the import
async function verifyImport() {
    try {
        console.log('\nVerifying import...');
        
        // Check counts
        const { data: categories, error: catError } = await supabase
            .from('research_api_categories')
            .select('id', { count: 'exact' });
        
        const { data: areas, error: areaError } = await supabase
            .from('research_api_areas')
            .select('id', { count: 'exact' });
        
        const { data: activities, error: actError } = await supabase
            .from('research_api_activities')
            .select('id', { count: 'exact' });
        
        const { data: subcomponents, error: subError } = await supabase
            .from('research_api_subcomponents')
            .select('id', { count: 'exact' });
        
        if (catError || areaError || actError || subError) {
            console.error('Error verifying import:', { catError, areaError, actError, subError });
            return;
        }
        
        console.log('Import verification results:');
        console.log(`Categories: ${categories.length}`);
        console.log(`Areas: ${areas.length}`);
        console.log(`Activities: ${activities.length}`);
        console.log(`Subcomponents: ${subcomponents.length}`);
        
        // Show sample data
        console.log('\nSample categories:');
        const { data: sampleCategories } = await supabase
            .from('research_api_categories')
            .select('name')
            .limit(5);
        
        sampleCategories?.forEach(cat => console.log(`- ${cat.name}`));
        
    } catch (error) {
        console.error('Error during verification:', error);
    }
}

// Function to set limited access for specific items
async function setLimitedAccess(activityName, isLimited = true) {
    try {
        const { data, error } = await supabase
            .from('research_api_activities')
            .update({ is_limited_access: isLimited })
            .eq('name', activityName);
        
        if (error) {
            console.error('Error setting limited access:', error);
        } else {
            console.log(`Set limited access for activity: ${activityName}`);
        }
    } catch (error) {
        console.error('Exception setting limited access:', error);
    }
}

// Main execution
async function main() {
    const csvFilePath = process.argv[2];
    
    if (!csvFilePath) {
        console.log('Usage: node import_research_api_data.js <path-to-csv-file>');
        console.log('Example: node import_research_api_data.js ./Research\ API.csv');
        return;
    }
    
    if (!fs.existsSync(csvFilePath)) {
        console.error(`CSV file not found: ${csvFilePath}`);
        return;
    }
    
    console.log('Starting Research API data import...');
    console.log(`CSV file: ${csvFilePath}`);
    
    await importResearchAPIData(csvFilePath);
    await verifyImport();
    
    console.log('\nImport process completed!');
}

// Run the script
if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    importResearchAPIData,
    verifyImport,
    setLimitedAccess
}; 