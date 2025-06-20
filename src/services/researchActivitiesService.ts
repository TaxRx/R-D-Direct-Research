import { createClient } from '@supabase/supabase-js';
import Papa from 'papaparse';
import { parseResearchApiCsv } from '../utils/parseResearchApi';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Fetch all research activities, using Supabase if available, otherwise fallback to local CSV
export async function getAllActivities(): Promise<Record<string, any>[]> {
  if (supabase) {
    const { data, error } = await supabase.from('research_activities').select('*');
    if (error) throw error;
    return data || [];
  } else {
    // fallback to local CSV in public directory
    const response = await fetch('/Research API.csv');
    const csvText = await response.text();
    return parseResearchApiCsv(csvText);
  }
} 