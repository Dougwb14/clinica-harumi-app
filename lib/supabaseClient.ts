import { createClient } from '@supabase/supabase-js';

// Credenciais fixas conforme solicitado para garantir conexão imediata
const supabaseUrl = 'https://uxqkdubjxyyufryizwbv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4cWtkdWJqeHl5dWZyeWl6d2J2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5OTExODQsImV4cCI6MjA3OTU2NzE4NH0.j76f7coIUvDQ9_mQjTUF1gsfqwqTWwWUEF3QQI1OHEw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);