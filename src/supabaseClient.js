import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mysdpbxsydyhlcmogcfe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15c2RwYnhzeWR5aGxjbW9nY2ZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MTgyNTksImV4cCI6MjA3NDk5NDI1OX0.rm0h1_cjsdF7B_XtFchSIDb1R1yoX2FFLM5lHevumnM';

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Database configuration for NASA NEO table structure
 */
export const DB_CONFIG = {
    tables: {
        nasa_neo_data: 'nasa_neo_data',
        predictions: 'asteroid_predictions',
        alerts: 'system_alerts'
    },
    columns: {
        // Real-time NEO data columns (based on your CSV)
        neo_id: 'neo_id',
        neo_reference_id: 'neo_reference_id',
        name: 'name',
        nasa_jpl_url: 'nasa_jpl_url',
        absolute_magnitude_h: 'absolute_magnitude_h',
        diameter_min_km: 'diameter_min_km',
        diameter_max_km: 'diameter_max_km',
        velocity_kms: 'velocity_kms',
        miss_distance_km: 'miss_distance_km',
        approach_date: 'approach_date',
        approach_date_full: 'approach_date_full',
        orbiting_body: 'orbiting_body',
        is_hazardous: 'is_hazardous',
        is_sentry: 'is_sentry',
        created_at: 'created_at'
    }
};

console.log('🗄️ Supabase client initialized');
console.log('📡 Connected to:', supabaseUrl);