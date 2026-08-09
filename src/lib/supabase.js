import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = 'https://xobypmlszcvwgmubdnce.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvYnlwbWxzemN2d2dtdWJkbmNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyNTU4NzUsImV4cCI6MjEwMTgzMTg3NX0.Q9OWPMy-K--rUaucY5AE3Lqb0dqMRysvxqTUsbfTcys'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
