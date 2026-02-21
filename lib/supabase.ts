import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://pdttginblbwyurjuklfj.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkdHRnaW5ibGJ3eXVyanVrbGZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MzAwODQsImV4cCI6MjA4NzEwNjA4NH0.wftH3Xje5ODB47Ll2VId9309BuloQL8AgwaVJDIfZyg";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);