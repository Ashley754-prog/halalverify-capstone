import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    // This specific error message will tell us if Vite failed to load the .env file
    throw new Error('Missing Supabase env variables. Ensure .env is in the frontend root and you restarted the server.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);