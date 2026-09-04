-- ============================================================
-- InboxFlow — Fix Supabase Row Level Security (RLS)
-- Run this in: Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- Disable RLS on all InboxFlow tables so anon API key has full read/write access
alter table if exists tasks disable row level security;
alter table if exists deadlines disable row level security;
alter table if exists followups disable row level security;
alter table if exists email_analysis disable row level security;
alter table if exists analytics disable row level security;

-- Grant permissions
grant all on tasks to anon, authenticated, service_role;
grant all on deadlines to anon, authenticated, service_role;
grant all on followups to anon, authenticated, service_role;
grant all on email_analysis to anon, authenticated, service_role;
grant all on analytics to anon, authenticated, service_role;

select 'Row Level Security disabled & permissions granted successfully! ✅' as status;