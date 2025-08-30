-- Test script to check sessions data
-- Run this in your Supabase SQL editor to verify data exists

-- Check if sessions table exists and has data
SELECT 'Sessions' as table_name, COUNT(*) as count FROM public.sessions;

-- Check sessions for a specific mentor (replace with actual mentor_id)
SELECT 
  id,
  title,
  status,
  mentor_id,
  mentee_id,
  scheduled_start,
  final_price
FROM public.sessions 
LIMIT 10;

-- Check if there are any confirmed sessions
SELECT 
  COUNT(*) as confirmed_sessions_count
FROM public.sessions 
WHERE status = 'confirmed';

-- Check if there are any requested sessions
SELECT 
  COUNT(*) as requested_sessions_count
FROM public.sessions 
WHERE status = 'requested';

-- Check mentor table
SELECT 'Mentors' as table_name, COUNT(*) as count FROM public.mentors;

-- Check users table
SELECT 'Users' as table_name, COUNT(*) as count FROM public.users; 