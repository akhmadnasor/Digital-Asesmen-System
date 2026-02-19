import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hynbsniiuzdgnmoqzezc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5bmJzbmlpdXpkZ25tb3F6ZXpjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODYxNTg5MSwiZXhwIjoyMDg0MTkxODkxfQ.Naxoagq6c2rDJiofEeWqLLCUPIHy6yifXCpxO0oxUaE';

export const supabase = createClient(supabaseUrl, supabaseKey);