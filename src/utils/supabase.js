import { createClient } from '@supabase/supabase-js';

// Substitua por sua URL e chave pública do Supabase
const supabaseUrl = 'https://hrfbbqldfsluevicrssx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyZmJicWxkZnNsdWV2aWNyc3N4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NTE0NzYsImV4cCI6MjA2OTMyNzQ3Nn0.ecuMk7FbSzgTvMx66_TksV6MkEhNrRn86g0G1MnuIrk'; // ⚠️ Cole aqui sua chave pública (anon)

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
