import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://oczaidmczhvdoqlktmfp.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jemFpZG1jemh2ZG9xbGt0bWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3NDYyMzgsImV4cCI6MjA4MTMyMjIzOH0.ec3B2GTGQJeMPUuedVOIms4HlHKkZG26qIXLTudVH4s';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

